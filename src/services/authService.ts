import { supabase } from "../lib/supabaseClient";

function requireClient() {
    if (!supabase) {
        throw new Error("Supabase no está configurado. Revisa tus variables de entorno.");
    }
    return supabase;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
    const client = requireClient();

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            // timezone_offset_minutes viaja desde acá hasta handle_new_user()
            // en Supabase, para que "hoy" en el reinicio diario de misiones se
            // evalúe en la zona horaria real del usuario y no en UTC.
            data: { name, timezone_offset_minutes: new Date().getTimezoneOffset() }
        }
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function signInWithEmail(email: string, password: string) {
    const client = requireClient();

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
        throw error;
    }

    return data;
}

export async function signOut() {
    const client = requireClient();
    const { error } = await client.auth.signOut();

    if (error) {
        throw error;
    }
}

export async function sendPasswordResetEmail(email: string) {
    const client = requireClient();

    const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
        throw error;
    }
}

export async function updatePassword(newPassword: string) {
    const client = requireClient();

    const { error } = await client.auth.updateUser({ password: newPassword });

    if (error) {
        throw error;
    }
}

export async function signInWithGoogle() {
    const client = requireClient();

    const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
    });

    if (error) {
        throw error;
    }
}

export async function signInWithFacebook() {
    const client = requireClient();

    const { error } = await client.auth.signInWithOAuth({
        provider: "facebook",
        options: { redirectTo: window.location.origin }
    });

    if (error) {
        throw error;
    }
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    "User already registered": "Ya existe una cuenta con ese email.",
    "Email not confirmed": "Confirma tu email antes de iniciar sesión.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres."
};

export function translateAuthError(error: unknown): string {
    if (error instanceof Error) {
        return AUTH_ERROR_MESSAGES[error.message] ?? error.message;
    }
    return "Ocurrió un error inesperado. Intenta de nuevo.";
}
