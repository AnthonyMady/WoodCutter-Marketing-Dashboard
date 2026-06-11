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
      const [gRaw, metaRaw, metaAdsRaw] = await Promise.all([
        fetchSheet("google_ads"),
        fetchSheet("meta"),
        fetchSheet("meta_ads"),
      ]);

      const dateRe = /^\d{4}-\d{2}-\d{2}$/;

      const googleAds = rowsToObjects(gRaw.headers, gRaw.rows)
        .filter((r) => r.Date && dateRe.test(r.Date));

      const metaAds = rowsToObjects(metaAdsRaw.headers, metaAdsRaw.rows)
        .filter((r) => r.date_start && dateRe.test(r.date_start));

      setData({
        googleAds,
        metaAds,
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
