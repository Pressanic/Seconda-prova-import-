export const FUNZIONE_PRINCIPALE_OPTIONS = [
    "Lavorazione metalli — fresatura, tornitura, alesatura",
    "Lavorazione metalli — pressatura, stampaggio, imbutitura",
    "Taglio e deformazione lamiera",
    "Saldatura e unione",
    "Lavorazione legno — taglio, levigatura, foratura",
    "Assemblaggio e montaggio",
    "Imballaggio e confezionamento",
    "Trasporto e movimentazione interna",
    "Stampa, incisione e marcatura",
    "Trattamento superfici — verniciatura, sabbiatura",
    "Lavorazione plastica e gomma",
    "Processo chimico o farmaceutico",
    "Controllo qualità e misura",
    "Altro — specificare in descrizione tecnica",
] as const;

export function guessFunzione(descrizione: string): string | null {
    const d = descrizione.toLowerCase();
    if (/press[ao]|stampag|imbutit/.test(d)) return "Lavorazione metalli — pressatura, stampaggio, imbutitura";
    if (/fres[ao]|tornitur|alesatur/.test(d)) return "Lavorazione metalli — fresatura, tornitura, alesatura";
    if (/taglio|deformaz|punzonat|piegan|lamier/.test(d)) return "Taglio e deformazione lamiera";
    if (/saldatur|saldatr/.test(d)) return "Saldatura e unione";
    if (/legno|falegnam|mobilif/.test(d)) return "Lavorazione legno — taglio, levigatura, foratura";
    if (/assembl|montagg/.test(d)) return "Assemblaggio e montaggio";
    if (/imballag|confezion|packaging/.test(d)) return "Imballaggio e confezionamento";
    if (/trasport|moviment|convogliat|nastro/.test(d)) return "Trasporto e movimentazione interna";
    if (/stamp[ao]|incision|marcatur|laser/.test(d)) return "Stampa, incisione e marcatura";
    if (/verniciatur|sabbiatur|trattament superfic/.test(d)) return "Trattamento superfici — verniciatura, sabbiatura";
    if (/plastic|gomm|elastom|iniezione/.test(d)) return "Lavorazione plastica e gomma";
    if (/chimic|farmaceut|reattore/.test(d)) return "Processo chimico o farmaceutico";
    if (/misur|controllo qualit|collaudo|test|ispezione/.test(d)) return "Controllo qualità e misura";
    return null;
}
