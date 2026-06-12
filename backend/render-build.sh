#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Playwright will use the default global cache, which Render automatically preserves.

# Download all necessary Playwright binaries (including chromium_headless_shell)
playwright install

# Playwright install-deps is removed because Render native environment pre-installs OS dependencies
# and does not allow root/su access.
