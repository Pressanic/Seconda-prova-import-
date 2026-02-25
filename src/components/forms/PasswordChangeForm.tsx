"use client";
import { useState } from "react";
import { Lock, Loader2, Check } from "lucide-react";

export default function PasswordChangeForm() {
    const [form, setForm] = useState({ password_attuale: "", password_nuova: "", conferma: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (form.password_nuova !== form.conferma) {
            setError("Le password non coincidono.");
            return;
        }
        if (form.password_nuova.length < 8) {
            setError("La nuova password deve essere di almeno 8 caratteri.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/v1/profilo", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password_attuale: form.password_attuale,
                    password_nuova: form.password_nuova,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Errore durante il cambio password.");
            } else {
                setSuccess(true);
                setForm({ password_attuale: "", password_nuova: "", conferma: "" });
            }
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" /> Cambia Password
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Password Attuale</label>
                    <input
                        type="password"
                        required
                        value={form.password_attuale}
                        onChange={e => setForm(f => ({ ...f, password_attuale: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Nuova Password</label>
                    <input
                        type="password"
                        required
                        value={form.password_nuova}
                        onChange={e => setForm(f => ({ ...f, password_nuova: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder="Min. 8 caratteri"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Conferma Nuova Password</label>
                    <input
                        type="password"
                        required
                        value={form.conferma}
                        onChange={e => setForm(f => ({ ...f, conferma: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder="Ripeti la nuova password"
                    />
                </div>

                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                {success && (
                    <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" /> Password aggiornata con successo.
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Aggiorna Password
                </button>
            </form>
        </div>
    );
}
