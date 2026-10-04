import { useAppDispatch } from '@/app/hooks';
import { errorMessage } from '@/api/baseApi';
import { showToast } from '@/features/ui/uiSlice';

// Run an RTK Query mutation and show a success/error toast. Resolves to the data on success,
// or `undefined` on failure (the error toast is already shown).
export function useNotify() {
  const dispatch = useAppDispatch();

  return async function run<T>(
    promise: Promise<{ data: T } | { error: unknown }>,
    success: string,
  ): Promise<{ ok: true; data: T } | { ok: false; error: unknown }> {
    const res = await promise;
    if ('error' in res) {
      dispatch(showToast(errorMessage(res.error), 'error'));
      return { ok: false, error: res.error };
    }
    dispatch(showToast(success));
    return { ok: true, data: res.data };
  };
}
