#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Force Playwright to install binaries into the project folder instead of the global cache,
# so they are successfully carried over from the Render build container to the runtime container.
export PLAYWRIGHT_BROWSERS_PATH=0

# Download Playwright Chromium browser binary
playwright install chromium

# Playwright install-deps is removed because Render native environment pre-installs OS dependencies
# and does not allow root/su access.
