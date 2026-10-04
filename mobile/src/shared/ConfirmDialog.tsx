import React from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {useT} from '@/core/i18n/useT';
import {useTheme} from '@/core/theme/useTheme';
import {AppText} from './AppText';
import {Button} from './Button';

interface Props {
  visible: boolean;
  title: string;
  // Highlighted summary line (e.g. "PRD-0001 · Wireless Mouse")
  highlight?: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'success' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

// Replaces the native Alert to match the web Modal: rounded-2xl card, 16 bold title,
// Cancel (secondary) + action on the right, faint violet backdrop.
export function ConfirmDialog({
  visible,
  title,
  highlight,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const {colors} = useTheme();
  const {t} = useT();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('common.cancel')}
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {backgroundColor: colors.surface, borderColor: colors.line},
          ]}
        >
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
          {highlight ? (
            <View
              style={[
                styles.highlight,
                {backgroundColor: colors.surface2, borderColor: colors.line},
              ]}
            >
              <AppText weight="semibold" numeric>
                {highlight}
              </AppText>
            </View>
          ) : null}
          <AppText color="ink2">{description}</AppText>
          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={onCancel}
              style={styles.flex}
            />
            <Button
              label={confirmLabel}
              variant={confirmVariant}
              onPress={onConfirm}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(18, 14, 36, 0.45)',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    boxShadow: '0px 12px 40px -8px rgba(46, 31, 107, 0.25)',
  },
  title: {fontSize: 16, lineHeight: 22},
  highlight: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {flexDirection: 'row', gap: 10, marginTop: 8},
});
