function SupabaseNotConfiguredNotice() {
    return (
        <div className="auth-notice">
            <p>
                <strong>Supabase no está configurado.</strong>
            </p>
            <p>
                Creá <code>.env.local</code> con <code>VITE_SUPABASE_URL</code> y{" "}
                <code>VITE_SUPABASE_ANON_KEY</code> (mirá <code>.env.example</code> y{" "}
                <code>supabase/SETUP.md</code>) y reiniciá el servidor.
            </p>
        </div>
    );
}

export default SupabaseNotConfiguredNotice;
