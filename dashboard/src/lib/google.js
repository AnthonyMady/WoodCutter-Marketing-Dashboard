export const CLIENT_ID      = (import.meta.env.VITE_GOOGLE_CLIENT_ID  ?? "").trim();
export const SPREADSHEET_ID = (import.meta.env.VITE_SPREADSHEET_ID ?? "").trim().replace(/\/+$/, "");

const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly openid email";

let _tokenClient = null;
let _accessToken = null;
let _email       = null;

export function initTokenClient(onTokenReceived) {
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error) throw new Error(resp.error);
      _accessToken = resp.access_token;
      // Fetch email directly from userinfo — always reliable
      try {
        const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${_accessToken}` },
        });
        const { email } = await r.json();
        _email = email?.toLowerCase() ?? null;
      } catch {
        _email = null;
      }
      onTokenReceived(_accessToken);
    },
  });

  // One Tap for silent re-auth on return visits
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (credResp) => {
      if (credResp.select_by === "auto" || credResp.select_by === "user_1tap") {
        _tokenClient.requestAccessToken({ prompt: "" });
      }
    },
    auto_select: true,
  });
  window.google.accounts.id.prompt();
}

export function requestAccessToken() {
  if (!_tokenClient) throw new Error("Token client not initialised");
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
  _email = null;
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
