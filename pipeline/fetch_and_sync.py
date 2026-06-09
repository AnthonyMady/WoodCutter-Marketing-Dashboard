"""
Fetches Google Ads + Meta Ads data from Supermetrics and writes to Google Sheets.
Runs via GitHub Actions cron. Uses a service account for Sheets access.
"""

import os
import json
import datetime
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

SUPERMETRICS_API_KEY = os.environ["SUPERMETRICS_API_KEY"]
SUPERMETRICS_USER    = os.environ["SUPERMETRICS_USER"]   # your login email
SPREADSHEET_ID       = os.environ["SPREADSHEET_ID"]
SERVICE_ACCOUNT_JSON = os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"]  # full JSON string

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

DATE_RANGE_START = (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
DATE_RANGE_END   = datetime.date.today().strftime("%Y-%m-%d")

# ---------------------------------------------------------------------------
# Supermetrics datasource IDs
# ---------------------------------------------------------------------------
DATASOURCES = {
    "google_ads": "GA",   # Supermetrics data source id for Google Ads
    "meta_ads":   "FB",   # Supermetrics data source id for Meta (Facebook) Ads
}

GOOGLE_ADS_FIELDS = [
    "Date", "CampaignName", "Impressions", "Clicks", "Cost",
    "Conversions", "ConversionValue", "CTR", "CPC", "ROAS",
]

META_ADS_FIELDS = [
    "date_start", "campaign_name", "impressions", "clicks", "spend",
    "actions", "purchase_roas", "ctr", "cpc",
]


def get_sheets_service():
    info = json.loads(SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds)


def fetch_supermetrics(ds_id: str, fields: list[str], date_start: str, date_end: str) -> list[list]:
    """
    Calls the Supermetrics JSON API and returns rows (list of lists).
    Docs: https://supermetrics.com/docs/product/api/
    """
    url = "https://api.supermetrics.com/enterprise/v2/query/data/json"
    payload = {
        "json": json.dumps({
            "ds_id":        ds_id,
            "ds_accounts":  [],         # empty = all linked accounts
            "date_range_type": "custom",
            "start_date":   date_start,
            "end_date":     date_end,
            "fields":       fields,
            "max_rows":     100000,
        })
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    resp = requests.post(
        url,
        data=payload,
        auth=(SUPERMETRICS_USER, SUPERMETRICS_API_KEY),
        headers=headers,
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("meta", {}).get("status") != "success":
        raise RuntimeError(f"Supermetrics error: {data}")
    return data.get("data", [])


def clear_and_write(service, sheet_name: str, header: list[str], rows: list[list]):
    """Clears the sheet then writes header + rows."""
    sheets = service.spreadsheets()

    # Clear
    sheets.values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=sheet_name,
    ).execute()

    values = [header] + rows
    sheets.values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"{sheet_name}!A1",
        valueInputOption="USER_ENTERED",
        body={"values": values},
    ).execute()
    print(f"  {sheet_name}: wrote {len(rows)} rows")


def main():
    print(f"Fetching data {DATE_RANGE_START} → {DATE_RANGE_END}")
    service = get_sheets_service()

    # --- Google Ads ---
    print("Fetching Google Ads…")
    google_rows = fetch_supermetrics(
        DATASOURCES["google_ads"], GOOGLE_ADS_FIELDS,
        DATE_RANGE_START, DATE_RANGE_END,
    )
    clear_and_write(service, "google_ads", GOOGLE_ADS_FIELDS, google_rows)

    # --- Meta Ads ---
    print("Fetching Meta Ads…")
    meta_rows = fetch_supermetrics(
        DATASOURCES["meta_ads"], META_ADS_FIELDS,
        DATE_RANGE_START, DATE_RANGE_END,
    )
    clear_and_write(service, "meta_ads", META_ADS_FIELDS, meta_rows)

    # --- Write a metadata sheet so the dashboard knows when data was last refreshed ---
    clear_and_write(
        service, "meta",
        ["last_updated", "date_start", "date_end"],
        [[datetime.datetime.utcnow().isoformat() + "Z", DATE_RANGE_START, DATE_RANGE_END]],
    )

    print("Done.")


if __name__ == "__main__":
    main()
