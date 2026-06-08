#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download Playwright Chromium browser binary
playwright install chromium

# Install operating system dependencies required by Chromium (fonts, libraries, etc.)
playwright install-deps
