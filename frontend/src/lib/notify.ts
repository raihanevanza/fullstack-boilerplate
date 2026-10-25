import { useToast } from '@rupa-ui/react';
import { errorMessage } from '@/api/baseApi';

// Run an RTK Query mutation and show a success/error toast. Resolves to the data on success,
// or the error on failure (the error toast is already shown).
export function useNotify() {
  const toast = useToast();

  return async function run<T>(
    promise: Promise<{ data: T } | { error: unknown }>,
    success: string,
  ): Promise<{ ok: true; data: T } | { ok: false; error: unknown }> {
    const res = await promise;
    if ('error' in res) {
      toast.show({ tone: 'danger', title: errorMessage(res.error) });
      return { ok: false, error: res.error };
    }
    toast.show({ tone: 'success', title: success });
    return { ok: true, data: res.data };
  };
}
