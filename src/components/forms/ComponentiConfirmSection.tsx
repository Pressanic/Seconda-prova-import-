"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { toast } from "@/hooks/useToast";

interface Componente {
    id: string;
    descrizione: string;
}

interface DocConferma {
    id: string;
    tipo_documento: "fattura_commerciale" | "packing_list";
    label: string;
    componenti_trovati: Array<{ componente_id: string; trovato: boolean; confermato_manualmente: boolean }>;
}

interface Props {
    praticaId: string;
    componenti: Componente[];
    documenti: DocConferma[];
}

type ConfirmMap = Record<string, Record<string, boolean>>; // docId -> compId -> trovato

export default function ComponentiConfirmSection({ praticaId, componenti, documenti }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    // Inizializza lo stato dalle conferme esistenti
    const buildInitial = (): ConfirmMap => {
        const map: ConfirmMap = {};
        for (const doc of documenti) {
            map[doc.id] = {};
            for (const comp of componenti) {
                const entry = doc.componenti_trovati.find(c => c.componente_id === comp.id);
                map[doc.id][comp.id] = entry?.trovato ?? false;
            }
        }
        return map;
    };

    const [confirmMap, setConfirmMap] = useState<ConfirmMap>(buildInitial);
    const [dirty, setDirty] = useState(false);

    const toggle = (docId: string, compId: string) => {
        setConfirmMap(prev => ({
            ...prev,
            [docId]: { ...prev[docId], [compId]: !prev[docId][compId] },
        }));
        setDirty(true);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                for (const doc of documenti) {
                    const componenti_trovati = componenti.map(comp => ({
                        componente_id: comp.id,
                        trovato: confirmMap[doc.id][comp.id] ?? false,
                        confermato_manualmente: true,
                    }));
                    const res = await fetch(`/api/v1/pratiche/${praticaId}/documenti-doganali/${doc.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ componenti_trovati }),
                    });
                    if (!res.ok) throw new Error(`Errore aggiornamento ${doc.label}`);
                }
                toast("Conferma componenti salvata", "success");
                setDirty(false);
                router.refresh();
            } catch (err: any) {
                toast(err.message ?? "Errore salvataggio", "error");
            }
        });
    };

    if (documenti.length === 0) return null;

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Componenti nei Documenti</h3>
                <p className="text-xs text-slate-500 ml-2">Conferma manuale presenza in fattura e packing list</p>
            </div>

            <div className="p-5 space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium">Componente</th>
                                {documenti.map(doc => (
                                    <th key={doc.id} className="text-center py-2 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        {doc.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {componenti.map(comp => (
                                <tr key={comp.id}>
                                    <td className="py-2.5 pr-4 text-slate-300 text-xs">{comp.descrizione}</td>
                                    {documenti.map(doc => (
                                        <td key={doc.id} className="py-2.5 px-4 text-center">
                                            <button
                                                onClick={() => toggle(doc.id, comp.id)}
                                                disabled={pending}
                                                className={`w-5 h-5 rounded border transition ${
                                                    confirmMap[doc.id][comp.id]
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "border-slate-600 hover:border-slate-400"
                                                }`}
                                                title={confirmMap[doc.id][comp.id] ? "Trovato — clicca per rimuovere" : "Non trovato — clicca per confermare"}
                                            >
                                                {confirmMap[doc.id][comp.id] && (
                                                    <svg className="w-3 h-3 text-white mx-auto" fill="none" viewBox="0 0 12 12">
                                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-500">
                        Spunta i componenti presenti nei rispettivi documenti. Usato dal cross-check per rilevare omissioni.
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={!dirty || pending}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition"
                    >
                        {pending ? "Salvataggio…" : "Salva conferma"}
                    </button>
                </div>
            </div>
        </div>
    );
}
