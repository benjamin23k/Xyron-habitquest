import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUpWithEmail, translateAuthError } from "../../services/authService";
import Button from "../ui/Button";

function SignupPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setInfo(null);
        setSubmitting(true);

        try {
            const data = await signUpWithEmail(email, password, name);

            if (data.session) {
                navigate("/dashboard");
            } else {
                setInfo("Cuenta creada. Revisa tu email para confirmar antes de iniciar sesión.");
            }
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
                <p className="auth-subtitle">Crea tu cuenta y empieza tu progreso</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="signup-name" className="sr-only">
                        Nombre
                    </label>
                    <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Nombre"
                        required
                        autoComplete="name"
                    />

                    <label htmlFor="signup-email" className="sr-only">
                        Email
                    </label>
                    <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email"
                        required
                        autoComplete="email"
                    />

                    <label htmlFor="signup-password" className="sr-only">
                        Contraseña
                    </label>
                    <input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    {info && <p className="auth-info">{info}</p>}

                    <Button type="submit" variant="primary" className="auth-submit" loading={submitting}>
                        Crear cuenta
                    </Button>
                </form>

                <p className="auth-links">
                    ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default SignupPage;
