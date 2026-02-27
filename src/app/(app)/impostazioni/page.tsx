import { auth } from "@/lib/auth";
import { Users, User, Building2, Activity, BookMarked } from "lucide-react";
import Link from "next/link";

export default async function ImpostazioniPage() {
    const session = await auth();
    const user = session?.user as any;

    const cards = [
        {
            title: "Organizzazione",
            desc: "Gestisci i dati della tua organizzazione, piano e configurazioni",
            icon: Building2,
            href: "/impostazioni/organizzazione",
            color: "text-blue-400 bg-blue-500/10",
        },
        {
            title: "Gestione Utenti",
            desc: "Aggiungi, modifica o disabilita gli utenti del tuo team",
            icon: Users,
            href: "/impostazioni/utenti",
            color: "text-purple-400 bg-purple-500/10",
            admin: true,
        },
        {
            title: "Profilo",
            desc: "Modifica il tuo profilo personale e le credenziali",
            icon: User,
            href: "/impostazioni/profilo",
            color: "text-green-400 bg-green-500/10",
        },
        {
            title: "Audit Log",
            desc: "Visualizza il registro delle attività dell'organizzazione",
            icon: Activity,
            href: "/impostazioni/audit-log",
            color: "text-red-400 bg-red-500/10",
            admin: true,
        },
        {
            title: "Normative",
            desc: "Registro normativo di riferimento: direttive UE, norme ISO/EN, codici HS. Verifica automatica EUR-Lex.",
            icon: BookMarked,
            href: "/impostazioni/normative",
            color: "text-amber-400 bg-amber-500/10",
            admin: true,
        },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Impostazioni</h1>
                <p className="text-slate-400 text-sm mt-0.5">Gestisci il tuo account e l&apos;organizzazione</p>
            </div>

            <div className="grid gap-4">
                {cards
                    .filter((c) => !c.admin || user?.ruolo === "admin")
                    .map((card) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="glass-card p-5 flex items-start gap-4 hover:bg-slate-700/30 transition group"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition">{card.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{card.desc}</p>
                            </div>
                        </Link>
                    ))}
            </div>
        </div>
    );
}
