#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Store the browser binaries inside the project folder so they are carried to the runtime container
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/project/.playwright-browsers

# Download all necessary Playwright binaries (including chromium_headless_shell)
playwright install chromium

# Playwright install-deps is removed because Render native environment pre-installs OS dependencies
# and does not allow root/su access.
