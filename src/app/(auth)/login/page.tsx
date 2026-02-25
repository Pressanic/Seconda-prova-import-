"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

const schema = z.object({
    email: z.string().email("Email non valida"),
    password: z.string().min(6, "Password minimo 6 caratteri"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setError(null);
        const res = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });
        if (res?.error) {
            setError("Credenziali non valide. Riprova.");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md px-4 animate-fade-in">
                {/* Logo mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">ImportCompliance</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestione compliance macchinari industriali</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Accedi al tuo account</h2>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-5 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                            {errors.email && (
                                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    {...register("password")}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/60 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    autoComplete="current-password"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Accesso in corso...</>
                            ) : (
                                "Accedi"
                            )}
                        </button>
                    </form>

                    {/* Demo hint */}
                    <div className="mt-6 pt-5 border-t border-slate-700">
                        <p className="text-slate-500 text-xs text-center">Credenziali demo</p>
                        <div className="mt-2 space-y-1 text-xs text-slate-400 text-center">
                            <p><span className="text-slate-500">Admin:</span> admin@demo.it / Admin123!</p>
                            <p><span className="text-slate-500">Operatore:</span> operatore@demo.it / Oper123!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
