export const CLIENT_ID      = (import.meta.env.VITE_GOOGLE_CLIENT_ID  ?? "").trim();
export const SPREADSHEET_ID = (import.meta.env.VITE_SPREADSHEET_ID ?? "").trim().replace(/\/+$/, "");

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

let _tokenClient = null;
let _accessToken = null;

let _email = null;

/** Decode the email from a Google ID token JWT (no extra scope needed). */
function decodeEmail(credential) {
  try {
    const payload = JSON.parse(atob(credential.split(".")[1]));
    return payload.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function initTokenClient(onTokenReceived) {
  // Use the credential (ID token) flow to get the email silently — no sensitive scope needed
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (credResp) => {
      _email = decodeEmail(credResp.credential);
    },
    auto_select: true,
  });
  window.google.accounts.id.prompt();

  // Separate token client for Sheets API access
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
  // Empty prompt = only asks if not already authorized (no re-consent every time)
  _tokenClient.requestAccessToken({ prompt: "" });
}

export function getUserEmail() {
  return _email;
}

export function signOut() {
  if (_accessToken) {
    window.google.accounts.oauth2.revoke(_accessToken);
    _accessToken = null;
  }
}

export async function getUserEmail() {
  if (!_accessToken) return null;
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${_accessToken}` },
  });
  if (!resp.ok) return null;
  const { email } = await resp.json();
  return email?.toLowerCase() ?? null;
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
