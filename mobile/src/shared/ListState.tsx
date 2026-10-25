import {StateView} from '@rupa-ui/react-native';
import React from 'react';
import {errorMessage} from '@/core/api/errorMessage';
import {useT} from '@/core/i18n/useT';

interface Props {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

// Rupa StateView for a screen's loading / error / empty state, with translated texts
export function ListState({loading, error, empty, emptyText, onRetry}: Props) {
  const {t} = useT();

  if (loading) {
    return (
      <StateView
        state="loading"
        title={t('common.loading')}
        description={null}
      />
    );
  }
  if (error) {
    return (
      <StateView
        state="error"
        title={t('common.failed')}
        description={errorMessage(error, t)}
        onRetry={onRetry}
        retryLabel={t('common.retry')}
      />
    );
  }
  if (empty) {
    return (
      <StateView
        state="empty"
        title={emptyText ?? t('common.empty')}
        description={null}
      />
    );
  }
  return null;
}
