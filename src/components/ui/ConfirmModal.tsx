"use client";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Bekor qilish",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 px-4 pb-safe">
      <div className="w-full max-w-[640px] bg-white rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
        <h3 className="font-bold text-lg">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-border font-semibold text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-xl font-semibold text-sm text-white ${
              destructive ? "bg-destructive" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
