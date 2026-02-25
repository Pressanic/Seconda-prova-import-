export interface HSRule {
    patterns: string[];
    hs_code: string;
    taric_code: string;
    descrizione: string;
    confidence: number;
    dazio_pct: number;
    iva_pct: number;
    misure_restrittive: Array<{ tipo: string; descrizione: string }>;
}

export interface HSResult {
    hs_code: string;
    taric_code: string;
    descrizione: string;
    confidence: number;
    dazio_pct: number;
    iva_pct: number;
    misure_restrittive: Array<{ tipo: string; descrizione: string }>;
}

const RULES: HSRule[] = [
    {
        patterns: ["pressa", "iniezione", "plastica", "materie plastiche"],
        hs_code: "847780",
        taric_code: "8477800000",
        descrizione: "Macchine per lavorazione gomma/plastica — presse a iniezione",
        confidence: 95,
        dazio_pct: 2.2,
        iva_pct: 22,
        misure_restrittive: [
            { tipo: "sorveglianza", descrizione: "Sorveglianza UE importazioni CN per cod. 8477" }
        ],
    },
    {
        patterns: ["pressa", "idraulica", "metallo", "stampaggio", "lamiera"],
        hs_code: "846291",
        taric_code: "8462910000",
        descrizione: "Presse idrauliche per metalli",
        confidence: 90,
        dazio_pct: 2.5,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["tornio", "cnc", "metallo", "lavorazione"],
        hs_code: "845811",
        taric_code: "8458110000",
        descrizione: "Torni per lavorazione di metalli — controllo numerico",
        confidence: 88,
        dazio_pct: 2.7,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["fresatrice", "fresa", "cnc", "metallo"],
        hs_code: "845711",
        taric_code: "8457110000",
        descrizione: "Centri di lavorazione per metalli — CNC",
        confidence: 87,
        dazio_pct: 2.7,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["centrifuga", "separatore", "separazione"],
        hs_code: "842121",
        taric_code: "8421210000",
        descrizione: "Centrifughe per separazione",
        confidence: 85,
        dazio_pct: 1.7,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["sega", "legno", "sughero", "panello"],
        hs_code: "846510",
        taric_code: "8465100000",
        descrizione: "Macchine per lavorazione legno/sughero",
        confidence: 85,
        dazio_pct: 1.0,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["robot", "braccio", "manipolatore", "automazione"],
        hs_code: "847950",
        taric_code: "8479500000",
        descrizione: "Robot industriali",
        confidence: 88,
        dazio_pct: 2.2,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["soffiatrice", "soffiaggio", "bottiglie", "pet"],
        hs_code: "847780",
        taric_code: "8477800090",
        descrizione: "Macchine per soffiaggio (PET, HDPE)",
        confidence: 85,
        dazio_pct: 2.2,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["compressore", "aria", "pneumatico"],
        hs_code: "841430",
        taric_code: "8414300000",
        descrizione: "Compressori per frigoriferi/condizionatori",
        confidence: 75,
        dazio_pct: 2.7,
        iva_pct: 22,
        misure_restrittive: [],
    },
    {
        patterns: ["pompa", "idraulica", "fluido"],
        hs_code: "841330",
        taric_code: "8413300000",
        descrizione: "Pompe per carburanti / lubrificanti — idrauliche",
        confidence: 72,
        dazio_pct: 1.7,
        iva_pct: 22,
        misure_restrittive: [],
    },
];

export function classifyHS(input: {
    descrizione: string;
    funzione?: string;
    tipologia?: string;
}): HSResult[] {
    const text = [input.descrizione, input.funzione, input.tipologia]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const scored = RULES.map((rule) => {
        const matches = rule.patterns.filter(p => text.includes(p.toLowerCase())).length;
        const score = matches > 0 ? Math.round((matches / rule.patterns.length) * rule.confidence) : 0;
        return { ...rule, confidence: score };
    }).filter(r => r.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

    return scored.map(r => ({
        hs_code: r.hs_code,
        taric_code: r.taric_code,
        descrizione: r.descrizione,
        confidence: r.confidence,
        dazio_pct: r.dazio_pct,
        iva_pct: r.iva_pct,
        misure_restrittive: r.misure_restrittive,
    }));
}
