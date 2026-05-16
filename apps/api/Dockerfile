FROM python:3.11-slim

# Install Chromium and its dependencies for Playwright
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Tell Playwright where the system Chromium is
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright with system dependencies (no browser download)
RUN playwright install-deps chromium

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
