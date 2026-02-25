import { auth } from "@/lib/auth";
import { User, Mail, Shield } from "lucide-react";

export default async function ProfiloPage() {
    const session = await auth();
    const user = session?.user as any;

    const roleLabels: Record<string, string> = {
        admin: "Amministratore",
        operatore: "Operatore",
        consulente: "Consulente",
    };

    return (
        <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
            <h1 className="text-2xl font-bold text-white">Profilo</h1>

            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center text-xl font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-white">{user?.name}</p>
                        <p className="text-sm text-slate-400">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                    <div>
                        <p className="text-xs text-slate-500 mb-0.5">Ruolo</p>
                        <p className="text-sm text-white flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                            {roleLabels[user?.ruolo] ?? user?.ruolo}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-0.5">Email</p>
                        <p className="text-sm text-white flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
