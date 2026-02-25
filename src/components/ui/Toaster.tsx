"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import type { ToastType } from "@/hooks/useToast";

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

let nextId = 0;

export default function Toaster() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const { message, type } = (e as CustomEvent).detail;
            const id = ++nextId;
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };
        window.addEventListener("app:toast", handler);
        return () => window.removeEventListener("app:toast", handler);
    }, []);

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const styles: Record<ToastType, { bg: string; icon: React.ElementType; text: string }> = {
        success: { bg: "border-green-500/30 bg-green-500/10", icon: CheckCircle, text: "text-green-300" },
        error:   { bg: "border-red-500/30 bg-red-500/10",     icon: XCircle,     text: "text-red-300" },
        info:    { bg: "border-blue-500/30 bg-blue-500/10",   icon: Info,        text: "text-blue-300" },
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => {
                const { bg, icon: Icon, text } = styles[t.type];
                return (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg} shadow-xl backdrop-blur-sm min-w-[240px] max-w-[360px] pointer-events-auto animate-fade-in`}
                    >
                        <Icon className={`w-4 h-4 shrink-0 ${text}`} />
                        <p className={`text-sm flex-1 ${text}`}>{t.message}</p>
                        <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 transition shrink-0">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
