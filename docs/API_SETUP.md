# Google API Credentials Setup

## Google Merchant Center API

1. Go to https://console.cloud.google.com → New Project (or select existing)
2. Enable "Content API for Shopping" in APIs & Services
3. Create a Service Account → download JSON key → save to `backend/secrets/gmc_service_account.json`
4. In Google Merchant Center → Settings → Account Access → Add User
   → paste the service account email → role: Standard
5. Set `GMC_MERCHANT_ID` in `backend/.env` to your 9-digit Merchant Center ID

## Google Ads API

1. Apply for a Developer Token at https://ads.google.com/home/tools/manager-accounts/
   (Standard access needed for production; Test access works immediately)
2. Create OAuth2 Client ID (Desktop app) in Google Cloud Console
3. Run the OAuth refresh token flow once:
   ```bash
   cd backend
   source .venv/bin/activate
   pip install google-auth-oauthlib
   python gads/get_refresh_token.py
   ```
4. Set in `backend/.env`:
   - `GADS_DEVELOPER_TOKEN`
   - `GADS_CLIENT_ID`, `GADS_CLIENT_SECRET`
   - `GADS_REFRESH_TOKEN` (from step 3)
   - `GADS_CUSTOMER_ID` (10-digit, no dashes)
