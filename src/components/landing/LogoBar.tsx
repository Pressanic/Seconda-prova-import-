import { Factory, Globe, Settings2, Package, Building2 } from "lucide-react";

const COMPANIES = [
    { name: "Ferretti", suffix: "Machinery", Icon: Factory },
    { name: "TechnoImport", suffix: "Italia", Icon: Globe },
    { name: "Barbieri", suffix: "Macchine", Icon: Settings2 },
    { name: "AlphaImport", suffix: "Group", Icon: Package },
    { name: "Conti", suffix: "& Partners", Icon: Building2 },
];

export default function LogoBar() {
    return (
        <section className="px-4 pb-10">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl backdrop-blur-sm shadow-lg shadow-black/20 px-8 py-5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center mb-5 font-medium">
                        Trusted by machinery importers across Europe
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                        {COMPANIES.map(({ name, suffix, Icon }) => (
                            <div
                                key={name}
                                className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity cursor-default select-none group"
                            >
                                <div className="w-6 h-6 rounded-md bg-slate-700/60 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-bold text-slate-300 tracking-tight">{name}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{suffix}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
