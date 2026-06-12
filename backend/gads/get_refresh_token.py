"""One-time script to generate the OAuth2 refresh token for Google Ads API."""
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/adwords"]
CLIENT_SECRET_FILE = "./secrets/gads_oauth_client.json"  # downloaded from GCP Console

flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
credentials = flow.run_local_server(port=0)
print("REFRESH TOKEN:", credentials.refresh_token)
print("Add this to your .env as GADS_REFRESH_TOKEN=...")
