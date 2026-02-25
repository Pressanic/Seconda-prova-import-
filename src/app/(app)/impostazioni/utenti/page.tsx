"use client";

import { useEffect, useState } from "react";
import {
    Mail, Clock, CheckCircle, XCircle,
    UserPlus, Loader2, ChevronDown, Trash2
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Utente = {
    id: string;
    nome: string;
    cognome: string;
    email: string;
    ruolo: string;
    attivo: boolean | null;
    last_login: string | null;
    created_at: string | null;
};

const RUOLI = ["admin", "operatore", "consulente"];
const RUOLO_LABELS: Record<string, string> = {
    admin: "Amministratore",
    operatore: "Operatore",
    consulente: "Consulente",
};

const inputClass = "w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

export default function UtentiPage() {
    const [lista, setLista] = useState<Utente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [form, setForm] = useState({
        nome: "", cognome: "", email: "",
        ruolo: "operatore", password: "",
    });

    const fetchUtenti = async () => {
        const res = await fetch("/api/v1/utenti");
        if (res.ok) {
            const json = await res.json();
            setLista(json.data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUtenti(); }, []);

    const handleInvite = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        const res = await fetch("/api/v1/utenti", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) {
            setInviteError(json.error ?? "Errore creazione utente");
        } else {
            setShowInvite(false);
            setForm({ nome: "", cognome: "", email: "", ruolo: "operatore", password: "" });
            fetchUtenti();
        }
        setInviteLoading(false);
    };

    const patchUtente = async (id: string, updates: Partial<{ ruolo: string; attivo: boolean }>) => {
        setActionLoading(id);
        await fetch(`/api/v1/utenti/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        await fetchUtenti();
        setActionLoading(null);
    };

    const deleteUtente = async (id: string, nome: string) => {
        if (!confirm(`Eliminare definitivamente ${nome}?`)) return;
        setActionLoading(id);
        await fetch(`/api/v1/utenti/${id}`, { method: "DELETE" });
        await fetchUtenti();
        setActionLoading(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestione Utenti</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {loading ? "..." : `${lista.length} utenti nell'organizzazione`}
                    </p>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <UserPlus className="w-4 h-4" /> Aggiungi Utente
                </button>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            {["Nome", "Email", "Ruolo", "Stato", "Ultimo Login", "Azioni"].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {lista.map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-blue-700/50 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                            {u.nome.charAt(0)}
                                        </div>
                                        <p className="text-sm font-medium text-white">{u.nome} {u.cognome}</p>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                        <Mail className="w-3.5 h-3.5" />{u.email}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="relative inline-block">
                                        <select
                                            value={u.ruolo}
                                            onChange={e => patchUtente(u.id, { ruolo: e.target.value })}
                                            disabled={actionLoading === u.id}
                                            className="appearance-none text-xs bg-blue-500/10 text-blue-400 pl-2 pr-6 py-1 rounded border border-blue-500/30 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {RUOLI.map(r => (
                                                <option key={r} value={r} className="bg-slate-800">{RUOLO_LABELS[r]}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none" />
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <button
                                        onClick={() => patchUtente(u.id, { attivo: !u.attivo })}
                                        disabled={actionLoading === u.id}
                                        className="flex items-center gap-1 text-xs transition disabled:opacity-50"
                                    >
                                        {actionLoading === u.id
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                            : u.attivo
                                                ? <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Attivo</span></>
                                                : <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400">Disattivato</span></>
                                        }
                                    </button>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(u.last_login)}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <button
                                        onClick={() => deleteUtente(u.id, `${u.nome} ${u.cognome}`)}
                                        disabled={actionLoading === u.id}
                                        className="text-slate-600 hover:text-red-400 transition disabled:opacity-50"
                                        title="Elimina utente"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && lista.length === 0 && (
                    <div className="px-5 py-8 text-center text-slate-500 text-sm">Nessun utente trovato</div>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-400" /> Aggiungi Utente
                        </h3>
                        {inviteError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
                                {inviteError}
                            </div>
                        )}
                        <form onSubmit={handleInvite} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Nome *</label>
                                    <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Mario" required className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Cognome *</label>
                                    <input value={form.cognome} onChange={e => setForm({ ...form, cognome: e.target.value })} placeholder="Rossi" required className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Email *</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mario@azienda.it" required className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Ruolo *</label>
                                    <select value={form.ruolo} onChange={e => setForm({ ...form, ruolo: e.target.value })} className={inputClass}>
                                        {RUOLI.map(r => <option key={r} value={r}>{RUOLO_LABELS[r]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Password Iniziale *</label>
                                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="min 8 caratteri" minLength={8} required className={inputClass} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowInvite(false); setInviteError(null); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition">
                                    Annulla
                                </button>
                                <button type="submit" disabled={inviteLoading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition flex items-center justify-center gap-2">
                                    {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crea Utente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
