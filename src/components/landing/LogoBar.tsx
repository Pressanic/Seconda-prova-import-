const COMPANIES = [
    "Ferretti Machinery",
    "TechnoImport Italia",
    "Barbieri Macchine",
    "AlphaImport Group",
    "Conti & Partners",
];

export default function LogoBar() {
    return (
        <section className="px-4 pb-10">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl backdrop-blur-sm shadow-lg shadow-black/20 px-8 py-5">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center mb-4 font-medium">
                        Trusted by machinery importers across Europe
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
                        {COMPANIES.map(name => (
                            <span
                                key={name}
                                className="text-sm font-semibold text-slate-500 opacity-60 hover:opacity-90 transition-opacity cursor-default select-none"
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
