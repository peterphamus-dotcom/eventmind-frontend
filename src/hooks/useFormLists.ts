import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Location, Tag } from '../types';

/**
 * Loads the locations + tags needed by the report/ticket forms,
 * with retries and a refetch when the page regains focus.
 *
 * The focus refetch matters on mobile: opening the camera app can
 * cause the browser to evict and reload the page, and if the reload's
 * fetch fails (cold API, weak venue signal) the location dropdown
 * would otherwise stay empty forever.
 */
export function useFormLists() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (attempt = 0): Promise<void> => {
    try {
      const [locRes, tagRes] = await Promise.all([
        api.listLocations(),
        api.listTags(),
      ]);
      setLocations(locRes.data.data?.items || []);
      setTags(tagRes.data.data?.items || []);
      setLoadError(false);
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        return load(attempt + 1);
      }
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refetchIfEmpty = () => {
      setLocations((prev) => {
        if (prev.length === 0) load();
        return prev;
      });
    };
    window.addEventListener('pageshow', refetchIfEmpty);
    window.addEventListener('focus', refetchIfEmpty);
    return () => {
      window.removeEventListener('pageshow', refetchIfEmpty);
      window.removeEventListener('focus', refetchIfEmpty);
    };
  }, [load]);

  return { locations, tags, loadError, reload: () => load() };
}
