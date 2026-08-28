import { useState } from "react";
import type { FormEvent } from "react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import Button from "../components/ui/Button";

function SettingsPage() {
    const { profile, editProfile } = useDashboardContext();
    const [name, setName] = useState(profile.name);
    const [username, setUsername] = useState(profile.username);
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(false);
        setSubmitting(true);

        try {
            await editProfile({
                name: name.trim(),
                username: username.trim(),
                avatar_url: avatarUrl.trim()
            });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-stack">
            <h1>Ajustes</h1>

            <form onSubmit={handleSubmit} className="card settings-form animate-in">
                <label htmlFor="settings-name">Nombre</label>
                <input id="settings-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />

                <label htmlFor="settings-username">Nombre de usuario</label>
                <input
                    id="settings-username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />

                <label htmlFor="settings-avatar">URL de avatar (opcional)</label>
                <input
                    id="settings-avatar"
                    type="url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://..."
                />

                {error && (
                    <p className="auth-error" role="alert">
                        {error}
                    </p>
                )}
                {success && <p className="auth-info">Perfil actualizado.</p>}

                <Button type="submit" variant="primary" loading={submitting}>
                    Guardar cambios
                </Button>
            </form>
        </div>
    );
}

export default SettingsPage;
