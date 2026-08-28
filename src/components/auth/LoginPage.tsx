import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
    signInWithEmail,
    signInWithFacebook,
    signInWithGoogle,
    translateAuthError
} from "../../services/authService";
import SupabaseNotConfiguredNotice from "./SupabaseNotConfiguredNotice";
import Button from "../ui/Button";

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await signInWithEmail(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError(translateAuthError(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleOAuth(provider: "google" | "facebook") {
        setError(null);
        try {
            if (provider === "google") {
                await signInWithGoogle();
            } else {
                await signInWithFacebook();
            }
        } catch (err) {
            setError(translateAuthError(err));
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-logo">XYRON</h1>
                <p className="auth-subtitle">Inicia sesión para continuar tu progreso</p>

                {!isSupabaseConfigured && <SupabaseNotConfiguredNotice />}

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="login-email" className="sr-only">
                        Email
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email"
                        required
                        autoComplete="email"
                    />

                    <label htmlFor="login-password" className="sr-only">
                        Contraseña
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Contraseña"
                        required
                        autoComplete="current-password"
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <Button type="submit" variant="primary" className="auth-submit" loading={submitting}>
                        Iniciar sesión
                    </Button>
                </form>

                <div className="auth-divider">o continúa con</div>

                <div className="auth-oauth">
                    <Button type="button" variant="secondary" onClick={() => handleOAuth("google")}>
                        Google
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => handleOAuth("facebook")}>
                        Facebook
                    </Button>
                </div>

                <p className="auth-links">
                    <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </p>
                <p className="auth-links">
                    ¿No tenés cuenta? <Link to="/signup">Crear cuenta</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
