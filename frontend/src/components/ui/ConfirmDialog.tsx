import { ConfirmDialog as RupaConfirmDialog, Field, Textarea } from '@rupa-ui/react';
import { useState } from 'react';
import { useT } from '@/i18n/useT';

interface Props {
  title: string;
  description?: string;
  confirmLabel: string;
  // Red confirm button for destructive actions
  danger?: boolean;
  // true = shows a required "reason" textarea and passes its value to onConfirm
  requireReason?: boolean;
  onClose: () => void;
  // Resolve to close; throw an Error to keep the dialog open and show its message
  onConfirm: (reason: string) => Promise<void> | void;
}

// Rupa ConfirmDialog with translated labels. Mounted while open. The buttons lock while
// onConfirm runs, so the action cannot be sent twice.
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  requireReason,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useT();
  const [reason, setReason] = useState('');

  return (
    <RupaConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={description}
      tone={danger ? 'danger' : 'primary'}
      confirmLabel={confirmLabel}
      cancelLabel={t('common.cancel')}
      errorTitle={t('common.failed')}
      errorMessage={t('common.error')}
      confirmDisabled={requireReason && reason.trim() === ''}
      onConfirm={() => onConfirm(reason.trim())}
    >
      {requireReason && (
        <Field label={t('common.reason')} required requiredLabel={t('common.required')}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      )}
    </RupaConfirmDialog>
  );
}
