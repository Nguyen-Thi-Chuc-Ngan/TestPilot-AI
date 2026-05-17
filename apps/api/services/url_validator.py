import ipaddress
import re
from urllib.parse import urlparse
from fastapi import HTTPException

BLOCKED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254",  # AWS/GCP metadata
    "metadata.google.internal",
    "metadata.google.com",
}

BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

ALLOWED_SCHEMES = {"http", "https"}


def validate_scan_url(url: str) -> str:
    """Validate URL for scanning — blocks SSRF targets."""
    if len(url) > 2048:
        raise ValueError("URL is too long. Please use a shorter URL (max 2048 characters).")

    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError("Invalid URL format. Make sure it starts with https:// or http://")

    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError("Only https:// and http:// URLs are supported. Please enter a valid web address.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL is missing a hostname. Example: https://example.com")

    if hostname.lower() in BLOCKED_HOSTS:
        raise ValueError(
            f"'{hostname}' cannot be scanned. Only public websites are allowed — "
            "localhost and internal addresses are blocked for security."
        )

    # Check if hostname resolves to a private IP
    try:
        ip = ipaddress.ip_address(hostname)
        for blocked_range in BLOCKED_IP_RANGES:
            if ip in blocked_range:
                raise ValueError(
                    f"Private IP addresses ({ip}) cannot be scanned. "
                    "Please use a publicly accessible URL."
                )
    except ValueError as e:
        if "cannot be scanned" in str(e):
            raise
        # Not an IP address — that's fine, it's a hostname
    except Exception:
        pass

    return url
