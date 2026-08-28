import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { translateAuthError, updatePassword } from "../../services/authService";
import Button from "../ui/Button";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await updatePassword(password);
            navigate("/dashboard");
        } catch (err) {
            setError(translateAuthError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-logo">XYRON</h1>
                <p className="auth-subtitle">Elegí tu nueva contraseña</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="reset-password" className="sr-only">
                        Nueva contraseña
                    </label>
                    <input
                        id="reset-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Nueva contraseña (mínimo 6 caracteres)"
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <Button type="submit" variant="primary" className="auth-submit" loading={submitting}>
                        Guardar nueva contraseña
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
