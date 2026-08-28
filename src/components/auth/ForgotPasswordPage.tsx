import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail, translateAuthError } from "../../services/authService";
import Button from "../ui/Button";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await sendPasswordResetEmail(email);
            setSent(true);
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
                <p className="auth-subtitle">Recuperar contraseña</p>

                {sent ? (
                    <p className="auth-info">
                        Si el email existe, te enviamos un link para restablecer tu contraseña.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <label htmlFor="forgot-email" className="sr-only">
                            Email
                        </label>
                        <input
                            id="forgot-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email"
                            required
                            autoComplete="email"
                        />

                        {error && (
                            <p className="auth-error" role="alert">
                                {error}
                            </p>
                        )}

                        <Button type="submit" variant="primary" className="auth-submit" loading={submitting}>
                            Enviar link de recuperación
                        </Button>
                    </form>
                )}

                <p className="auth-links">
                    <Link to="/login">Volver a iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
