export const CLIENT_ID      = (import.meta.env.VITE_GOOGLE_CLIENT_ID  ?? "").trim();
export const SPREADSHEET_ID = (import.meta.env.VITE_SPREADSHEET_ID ?? "").trim().replace(/\/+$/, "");

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

let _tokenClient = null;
let _accessToken = null;

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

export function requestAccessToken() {
  if (!_tokenClient) throw new Error("Token client not initialised");
  _tokenClient.requestAccessToken({ prompt: "consent" });
}

export function signOut() {
  if (_accessToken) {
    window.google.accounts.oauth2.revoke(_accessToken);
    _accessToken = null;
  }
}

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

export function rowsToObjects(headers, rows) {
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]))
  );
}
