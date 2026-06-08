#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download Playwright Chromium browser binary
playwright install chromium

# Playwright install-deps is removed because Render native environment pre-installs OS dependencies
# and does not allow root/su access.
