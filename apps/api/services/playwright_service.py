import asyncio
import base64
from dataclasses import dataclass
from typing import Optional
from playwright.async_api import async_playwright, Browser
from config import settings
import structlog

logger = structlog.get_logger()

_browser: Optional[Browser] = None
_semaphore = asyncio.Semaphore(settings.max_concurrent_scans)


@dataclass
class ScanResult:
    screenshot_full: bytes
    screenshot_viewport: bytes
    dom_context: dict
    a11y_violations: list
    url: str
    page_title: str
    error: Optional[str] = None


async def get_browser() -> Browser:
    global _browser
    if _browser is None or not _browser.is_connected():
        p = await async_playwright().start()
        _browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
            ],
        )
    return _browser


async def scan_url(url: str) -> ScanResult:
    """Navigate to URL, capture screenshots and DOM context."""
    async with _semaphore:
        return await _do_scan(url)


async def _do_scan(url: str) -> ScanResult:
    browser = await get_browser()
    context = await browser.new_context(
        viewport={"width": 1440, "height": 900},
        user_agent="TestPilot-AI/1.0 (QA Scanner; +https://testpilot.ai)",
    )
    page = await context.new_page()

    # Capture console errors
    console_errors: list[str] = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    try:
        await page.goto(url, wait_until="networkidle", timeout=settings.playwright_timeout_ms)
    except Exception as e:
        # Retry with domcontentloaded if networkidle times out
        logger.warning("networkidle timeout, retrying", url=url, error=str(e))
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        except Exception as e2:
            await context.close()
            return ScanResult(
                screenshot_full=b"",
                screenshot_viewport=b"",
                dom_context={},
                a11y_violations=[],
                url=url,
                page_title="",
                error=str(e2),
            )

    # Short wait for animations/lazy loads
    await page.wait_for_timeout(1500)

    # Screenshots
    screenshot_full = await page.screenshot(full_page=True, type="jpeg", quality=80)
    screenshot_viewport = await page.screenshot(type="jpeg", quality=85)

    # DOM context extraction
    dom_context = await page.evaluate("""() => ({
        title: document.title,
        h1: [...document.querySelectorAll('h1')].map(e => e.innerText.trim()).slice(0, 3),
        h2: [...document.querySelectorAll('h2')].map(e => e.innerText.trim()).slice(0, 5),
        nav_links: [...document.querySelectorAll('nav a')].map(e => e.innerText.trim()).slice(0, 10),
        form_count: document.querySelectorAll('form').length,
        button_count: document.querySelectorAll('button, input[type=submit]').length,
        image_count: document.querySelectorAll('img').length,
        broken_images: [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).length,
        link_count: document.querySelectorAll('a[href]').length,
        has_aria_labels: document.querySelectorAll('[aria-label]').length > 0,
        color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    })""")

    # Basic accessibility check via axe-core
    a11y_violations: list = []
    try:
        await page.add_script_tag(
            url="https://cdn.jsdelivr.net/npm/axe-core@4.10.0/axe.min.js"
        )
        await page.wait_for_timeout(500)
        axe_result = await page.evaluate("axe.run()")
        a11y_violations = axe_result.get("violations", [])[:10]  # cap at 10
    except Exception as e:
        logger.warning("axe-core failed", error=str(e))

    dom_context["console_errors"] = console_errors[:5]

    await context.close()

    return ScanResult(
        screenshot_full=screenshot_full,
        screenshot_viewport=screenshot_viewport,
        dom_context=dom_context,
        a11y_violations=a11y_violations,
        url=url,
        page_title=dom_context.get("title", ""),
    )


def screenshot_to_base64(screenshot: bytes) -> str:
    return base64.b64encode(screenshot).decode("utf-8")
