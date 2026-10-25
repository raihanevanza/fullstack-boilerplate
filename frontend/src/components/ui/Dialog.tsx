import { Dialog as RupaDialog, type DialogProps } from '@rupa-ui/react';
import { useT } from '@/i18n/useT';

interface Props extends Omit<DialogProps, 'open' | 'onOpenChange' | 'closeLabel'> {
  // Dialogs here are mounted while open, so closing is a single callback
  onClose: () => void;
}

// Rupa Dialog (focus trap, Esc, focus return) with the translated close label
export default function Dialog({ onClose, ...props }: Props) {
  const { t } = useT();
  return (
    <RupaDialog
      open
      onOpenChange={(open) => !open && onClose()}
      closeLabel={t('common.close')}
      {...props}
    />
  );
}
