import Dialog from './Dialog.jsx';

/** Confirmation for destructive or irreversible actions. */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      hideClose
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} data-autofocus>{cancelLabel}</button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="t-secondary">{message}</p>}
    </Dialog>
  );
}
