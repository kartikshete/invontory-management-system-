export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-700 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-white">{title || 'Confirm Action'}</h3>
        <p className="text-sm text-slate-400 mt-2">{message || 'Are you sure you want to proceed?'}</p>
        <div className="flex items-center gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="btn-danger flex-1">Confirm</button>
        </div>
      </div>
    </div>
  );
}
