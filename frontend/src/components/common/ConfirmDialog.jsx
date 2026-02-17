import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmAriaLabel = 'Confirm',
  cancelAriaLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-[rgb(var(--text-muted))]">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose} aria-label={cancelAriaLabel} title={cancelAriaLabel}>
          {cancelText}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          aria-label={confirmAriaLabel}
          title={confirmAriaLabel}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
