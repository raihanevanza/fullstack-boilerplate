import { useSearchParams } from 'react-router-dom';
import type { ListParams } from '@/api/types';
import { useDebounced } from '@/lib/useDebounced';

// List state lives in the URL (?page=&search=&active_only=…) so it can be linked and refreshed
export function useListParams<K extends string = never>(keys: K[] = [], limit = 20) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const debouncedSearch = useDebounced(search);
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const filters = {} as Record<K, string>;
  for (const key of keys) filters[key] = searchParams.get(key) ?? '';

  const set = (key: K | 'page' | 'search', value: string | number | boolean) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === '' || value === false) next.delete(key);
        else next.set(key, String(value));
        // Any filter change goes back to page 1
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const params: ListParams = { page, limit, search: debouncedSearch.trim(), ...filters };

  return { params, page, search, filters, set };
}
