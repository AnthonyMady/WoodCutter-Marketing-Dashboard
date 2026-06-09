import { useState, useCallback } from "react";
import { fetchSheet, rowsToObjects } from "../lib/google.js";

export function useSheets() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRaw, metaRaw] = await Promise.all([
        fetchSheet("google_ads"),
        fetchSheet("meta"),
      ]);

      // Filter out any rows where Date looks like a header
      const rows = rowsToObjects(gRaw.headers, gRaw.rows)
        .filter((r) => r.Date && r.Date !== "Date");

      setData({
        googleAds: rows,
        meta: rowsToObjects(metaRaw.headers, metaRaw.rows)[0] ?? {},
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
}
