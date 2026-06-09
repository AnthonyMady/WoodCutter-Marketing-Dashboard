/**
 * Thin wrappers around Google Identity Services (OAuth 2.0 implicit flow)
 * and the Sheets REST API.
 *
 * Required env vars (set in .env.local for dev, Vite build env for prod):
 *   VITE_GOOGLE_CLIENT_ID   – OAuth 2.0 client ID (web application type)
 *   VITE_SPREADSHEET_ID     – the Sheet that the pipeline writes to
 */

export const CLIENT_ID      = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

let _tokenClient = null;
let _accessToken = null;

/** Initialise the Google token client (call once on mount). */
export function initTokenClient(onTokenReceived) {
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) throw new Error(resp.error);
      _accessToken = resp.access_token;
      onTokenReceived(resp.access_token);
    },
  });
}

/** Opens the Google sign-in popup and requests an access token. */
export function requestAccessToken() {
  if (!_tokenClient) throw new Error("Token client not initialised");
  _tokenClient.requestAccessToken({ prompt: "consent" });
}

/** Revokes the current token and clears local state. */
export function signOut() {
  if (_accessToken) {
    window.google.accounts.oauth2.revoke(_accessToken);
    _accessToken = null;
  }
}

/** Fetch all values from one sheet tab. Returns { headers, rows }. */
export async function fetchSheet(sheetName) {
  if (!_accessToken) throw new Error("Not authenticated");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${_accessToken}` },
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error?.message ?? resp.statusText);
  }
  const json = await resp.json();
  const [headers, ...rows] = json.values ?? [];
  return { headers: headers ?? [], rows: rows ?? [] };
}

/** Convert raw Sheets rows into an array of objects keyed by header. */
export function rowsToObjects(headers, rows) {
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]))
  );
}
