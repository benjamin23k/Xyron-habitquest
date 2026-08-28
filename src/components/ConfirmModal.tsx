import { useState } from "react";
import Modal from "./Modal";
import Button from "./ui/Button";

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
}

function ConfirmModal({ title, description, confirmLabel, onConfirm, onClose }: ConfirmModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleConfirm() {
        setError(null);
        setSubmitting(true);

        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
            setSubmitting(false);
        }
    }

    return (
        <Modal title={title} onClose={onClose}>
            <p className="confirm-modal-description">{description}</p>

            {error && (
                <p className="auth-error" role="alert">
                    {error}
                </p>
            )}

            <div className="confirm-modal-actions">
                <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                    Cancelar
                </Button>
                <Button type="button" variant="danger" onClick={handleConfirm} loading={submitting}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}

export default ConfirmModal;
