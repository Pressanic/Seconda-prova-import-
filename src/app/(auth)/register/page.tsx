"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Shield, Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
    nome: z.string().min(2, "Minimo 2 caratteri"),
    cognome: z.string().min(2, "Minimo 2 caratteri"),
    email: z.string().email("Email non valida"),
    password: z.string().min(8, "Password minimo 8 caratteri"),
    conferma_password: z.string().min(8, "Conferma la password"),
}).refine((data) => data.password === data.conferma_password, {
    message: "Le password non coincidono",
    path: ["conferma_password"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setError(null);
        try {
            const res = await fetch("/api/v1/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: data.nome,
                    cognome: data.cognome,
                    email: data.email,
                    password: data.password,
                }),
            });
            if (res.status === 409) {
                setError("Questa email è già registrata. Prova ad accedere.");
                return;
            }
            if (!res.ok) {
                setError("Errore durante la registrazione. Riprova.");
                return;
            }
            router.push("/login?registered=1");
        } catch {
            setError("Errore di rete. Riprova più tardi.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-indigo-950/15" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.2)_100%)]" />
            </div>

            {/* Back to landing */}
            <Link
                href="/"
                className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Home
            </Link>

            <div className="relative w-full max-w-md px-4 animate-fade-in">
                {/* Logo mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">ImportCompliance</h1>
                    <p className="text-slate-400 text-sm mt-1">Crea il tuo account</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Registrati</h2>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome + Cognome */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        {...register("nome")}
                                        type="text"
                                        placeholder="Mario"
                                        className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        autoComplete="given-name"
                                    />
                                </div>
                                {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Cognome</label>
                                <input
                                    {...register("cognome")}
                                    type="text"
                                    placeholder="Rossi"
                                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoComplete="family-name"
                                />
                                {errors.cognome && <p className="text-red-400 text-xs mt-1">{errors.cognome.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="mario@esempio.it"
                                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    {...register("password")}
                                    type="password"
                                    placeholder="Minimo 8 caratteri"
                                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Conferma password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Conferma password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    {...register("conferma_password")}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.conferma_password && <p className="text-red-400 text-xs mt-1">{errors.conferma_password.message}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Registrazione in corso...</>
                            ) : (
                                <><CheckCircle className="w-4 h-4" /> Crea account</>
                            )}
                        </button>
                    </form>

                    {/* Link to login */}
                    <div className="mt-6 pt-5 border-t border-slate-700 text-center">
                        <p className="text-slate-400 text-sm">
                            Hai già un account?{" "}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition font-medium">
                                Accedi
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
