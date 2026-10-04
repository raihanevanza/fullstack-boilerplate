import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useT } from '@/i18n/useT';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  // Red confirm button for destructive actions
  danger?: boolean;
  // true = shows a required "reason" textarea and passes its value to onConfirm
  requireReason?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  requireReason,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const invalid = requireReason && reason.trim() === '';

  const close = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            disabled={invalid}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="mb-3 text-sm text-ink-2">{description}</p>}
      {requireReason && (
        <Field label={t('common.reason')} required>
          <Textarea
            rows={3}
            maxLength={500}
            value={reason}
            autoFocus
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      )}
    </Modal>
  );
}
