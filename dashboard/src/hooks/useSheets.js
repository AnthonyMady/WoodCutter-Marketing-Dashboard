import { useState, useCallback } from "react";
import { fetchSheet, rowsToObjects } from "../lib/google.js";

export function useSheets() {
  const [data, setData]       = useState(null);   // { googleAds, metaAds, meta }
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRaw, mRaw, metaRaw] = await Promise.all([
        fetchSheet("google_ads"),
        fetchSheet("meta_ads"),
        fetchSheet("meta"),
      ]);
      setData({
        googleAds: rowsToObjects(gRaw.headers, gRaw.rows),
        metaAds:   rowsToObjects(mRaw.headers, mRaw.rows),
        meta:      rowsToObjects(metaRaw.headers, metaRaw.rows)[0] ?? {},
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
}
