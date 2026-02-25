"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/useToast";

const STATI = [
    { value: "bozza", label: "Bozza", color: "text-slate-400 bg-slate-700" },
    { value: "in_lavorazione", label: "In Lavorazione", color: "text-blue-400 bg-blue-500/20" },
    { value: "in_revisione", label: "In Revisione", color: "text-yellow-400 bg-yellow-500/20" },
    { value: "approvata", label: "Approvata", color: "text-green-400 bg-green-500/20" },
    { value: "bloccata", label: "Bloccata", color: "text-red-400 bg-red-500/20" },
] as const;

interface Props {
    praticaId: string;
    nome_pratica: string;
    fornitore_cinese: string | null;
    data_prevista_arrivo: string | null;
    data_sdoganamento: string | null;
    note: string | null;
    stato: string;
}

export default function PraticaActionsClient({
    praticaId, nome_pratica, fornitore_cinese, data_prevista_arrivo, data_sdoganamento, note, stato,
}: Props) {
    const router = useRouter();

    // Stato dropdown
    const [statoOpen, setStatoOpen] = useState(false);
    const [currentStato, setCurrentStato] = useState(stato);
    const [loadingStato, setLoadingStato] = useState(false);

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        nome_pratica,
        fornitore_cinese: fornitore_cinese ?? "",
        data_prevista_arrivo: data_prevista_arrivo ?? "",
        data_sdoganamento: data_sdoganamento ?? "",
        note: note ?? "",
    });
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    const statoInfo = STATI.find(s => s.value === currentStato) ?? STATI[0];

    async function changeStato(newStato: string) {
        if (newStato === currentStato) { setStatoOpen(false); return; }
        setLoadingStato(true);
        setStatoOpen(false);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stato: newStato }),
            });
            if (!res.ok) throw new Error("Errore cambio stato");
            setCurrentStato(newStato);
            toast("Stato aggiornato", "success");
            router.refresh();
        } catch {
            toast("Errore nel cambio stato", "error");
        } finally {
            setLoadingStato(false);
        }
    }

    async function saveEdit(e: React.FormEvent) {
        e.preventDefault();
        setLoadingEdit(true);
        setEditError("");
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome_pratica: editForm.nome_pratica,
                    fornitore_cinese: editForm.fornitore_cinese || null,
                    data_prevista_arrivo: editForm.data_prevista_arrivo || null,
                    data_sdoganamento: editForm.data_sdoganamento || null,
                    note: editForm.note || null,
                }),
            });
            if (!res.ok) throw new Error("Errore salvataggio");
            toast("Pratica aggiornata", "success");
            setEditOpen(false);
            router.refresh();
        } catch {
            setEditError("Errore durante il salvataggio. Riprova.");
        } finally {
            setLoadingEdit(false);
        }
    }

    async function deletePratica() {
        setLoadingDelete(true);
        try {
            const res = await fetch(`/api/v1/pratiche/${praticaId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Errore eliminazione");
            toast("Pratica eliminata", "info");
            router.push("/pratiche");
        } catch {
            toast("Errore durante l'eliminazione", "error");
            setLoadingDelete(false);
            setDeleteOpen(false);
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Stato dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setStatoOpen(v => !v)}
                        disabled={loadingStato}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-transparent transition ${statoInfo.color}`}
                    >
                        {loadingStato ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : statoInfo.label}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                    {statoOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 min-w-[160px] py-1 overflow-hidden">
                            {STATI.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => changeStato(s.value)}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium transition hover:bg-slate-700 ${s.value === currentStato ? "opacity-50 cursor-default" : ""} ${s.color.split(" ")[0]}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit button */}
                <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition"
                >
                    <Pencil className="w-3.5 h-3.5" /> Modifica
                </button>

                {/* Delete button */}
                <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Edit Modal */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h2 className="text-base font-bold text-white">Modifica Pratica</h2>
                            <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-white transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={saveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Nome Pratica *</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.nome_pratica}
                                    onChange={e => setEditForm(f => ({ ...f, nome_pratica: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Fornitore Cinese</label>
                                <input
                                    type="text"
                                    value={editForm.fornitore_cinese}
                                    onChange={e => setEditForm(f => ({ ...f, fornitore_cinese: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Data Arrivo Prevista</label>
                                    <input
                                        type="date"
                                        value={editForm.data_prevista_arrivo}
                                        onChange={e => setEditForm(f => ({ ...f, data_prevista_arrivo: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Data Sdoganamento</label>
                                    <input
                                        type="date"
                                        value={editForm.data_sdoganamento}
                                        onChange={e => setEditForm(f => ({ ...f, data_sdoganamento: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Note</label>
                                <textarea
                                    rows={3}
                                    value={editForm.note}
                                    onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                            {editError && <p className="text-xs text-red-400">{editError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded-lg transition"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingEdit}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm py-2 rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    {loadingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
                    <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Elimina Pratica</h2>
                                <p className="text-xs text-slate-400">Questa azione è irreversibile</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-6">
                            Stai per eliminare <span className="font-semibold text-white">{nome_pratica}</span>. Tutti i dati collegati (macchinario, documenti, risk score) verranno eliminati.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteOpen(false)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded-lg transition"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={deletePratica}
                                disabled={loadingDelete}
                                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm py-2 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {loadingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
