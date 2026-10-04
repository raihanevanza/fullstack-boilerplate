import {AlertCircle, Inbox} from 'lucide-react-native';
import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {errorMessage} from '@/core/api/errorMessage';
import {useT} from '@/core/i18n/useT';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from './AppText';
import {Button} from './Button';

interface Props {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

// Consistent loading / error / empty state for every screen
export function ListState({loading, error, empty, emptyText, onRetry}: Props) {
  const {colors} = useTheme();
  const {t} = useT();

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.accent} />
        <AppText color="ink3">{t('common.loading')}</AppText>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.box} accessibilityRole="alert">
        <AlertCircle size={28} color={colors.danger} />
        <AppText color="ink2" style={styles.center}>
          {errorMessage(error, t)}
        </AppText>
        {onRetry ? (
          <Button
            label={t('common.retry')}
            variant="secondary"
            onPress={onRetry}
          />
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.box}>
        <Inbox size={28} color={colors.ink3} />
        <AppText color="ink3" style={styles.center}>
          {emptyText ?? t('common.empty')}
        </AppText>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  box: {alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32},
  center: {textAlign: 'center'},
});
