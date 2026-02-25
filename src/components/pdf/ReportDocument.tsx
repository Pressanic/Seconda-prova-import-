import {
    Document, Page, Text, View, StyleSheet, Font
} from "@react-pdf/renderer";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 9,
        color: "#1e293b",
        padding: 36,
        backgroundColor: "#ffffff",
    },
    // Header
    header: {
        borderBottom: "2pt solid #1d4ed8",
        paddingBottom: 10,
        marginBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    headerLeft: {},
    appName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
    headerSubtitle: { fontSize: 8, color: "#64748b", marginTop: 2 },
    headerRight: { textAlign: "right" },
    headerDate: { fontSize: 8, color: "#64748b" },
    codice: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e293b", marginTop: 2 },

    // Section
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#1d4ed8",
        borderBottom: "1pt solid #bfdbfe",
        paddingBottom: 4,
        marginBottom: 8,
        marginTop: 16,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Grid
    row: { flexDirection: "row", gap: 12, marginBottom: 6 },
    col: { flex: 1 },
    label: { fontSize: 7, color: "#64748b", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3 },
    value: { fontSize: 9, color: "#1e293b" },

    // Table
    table: { marginBottom: 8 },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#eff6ff",
        padding: "4pt 6pt",
        borderBottom: "1pt solid #bfdbfe",
    },
    tableRow: {
        flexDirection: "row",
        padding: "4pt 6pt",
        borderBottom: "0.5pt solid #f1f5f9",
    },
    tableRowAlt: {
        flexDirection: "row",
        padding: "4pt 6pt",
        borderBottom: "0.5pt solid #f1f5f9",
        backgroundColor: "#f8fafc",
    },
    thText: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#1d4ed8", textTransform: "uppercase" },
    tdText: { fontSize: 8, color: "#1e293b" },
    tdTextSmall: { fontSize: 7, color: "#64748b" },

    // Score box
    scoreBox: {
        borderRadius: 4,
        padding: "8pt 12pt",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    scoreGreen: { backgroundColor: "#dcfce7", border: "1pt solid #86efac" },
    scoreYellow: { backgroundColor: "#fef9c3", border: "1pt solid #fde047" },
    scoreOrange: { backgroundColor: "#ffedd5", border: "1pt solid #fdba74" },
    scoreRed: { backgroundColor: "#fee2e2", border: "1pt solid #fca5a5" },
    scoreNumber: { fontFamily: "Helvetica-Bold", fontSize: 18 },
    scoreGreenText: { color: "#15803d" },
    scoreYellowText: { color: "#854d0e" },
    scoreOrangeText: { color: "#9a3412" },
    scoreRedText: { color: "#991b1b" },

    // Badge
    badgeGreen: { backgroundColor: "#dcfce7", color: "#15803d", padding: "1pt 4pt", borderRadius: 3, fontSize: 7 },
    badgeYellow: { backgroundColor: "#fef9c3", color: "#854d0e", padding: "1pt 4pt", borderRadius: 3, fontSize: 7 },
    badgeRed: { backgroundColor: "#fee2e2", color: "#991b1b", padding: "1pt 4pt", borderRadius: 3, fontSize: 7 },
    badgeGray: { backgroundColor: "#f1f5f9", color: "#64748b", padding: "1pt 4pt", borderRadius: 3, fontSize: 7 },

    // Footer
    footer: {
        position: "absolute",
        bottom: 24,
        left: 36,
        right: 36,
        borderTop: "0.5pt solid #e2e8f0",
        paddingTop: 6,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerText: { fontSize: 7, color: "#94a3b8" },

    // Recommendation
    recItem: {
        flexDirection: "row",
        gap: 6,
        marginBottom: 4,
        paddingLeft: 4,
    },
    recNumber: { fontFamily: "Helvetica-Bold", color: "#1d4ed8", fontSize: 9, minWidth: 14 },
    recText: { fontSize: 8, color: "#374151", flex: 1 },

    // Penalty
    penaltyRow: { flexDirection: "row", padding: "3pt 6pt", borderBottom: "0.5pt solid #f1f5f9", gap: 6 },
    penaltyCode: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#64748b", minWidth: 70 },
    penaltyDesc: { flex: 1, fontSize: 8, color: "#1e293b" },
    penaltyValue: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#dc2626", minWidth: 30, textAlign: "right" },
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportData {
    pratica: {
        codice_pratica: string;
        nome_pratica: string;
        fornitore_cinese: string | null;
        stato: string;
        data_prevista_arrivo: string | null;
    };
    macchinario?: {
        nome_macchina: string;
        modello: string;
        anno_produzione: number | null;
        stato_macchina: string;
        codice_taric_selezionato: string | null;
    } | null;
    documenti_ce: Array<{
        tipo_documento: string;
        nome_file: string;
        stato_validazione: string | null;
    }>;
    organismo?: {
        numero_organismo: string;
        nome_organismo: string | null;
        stato_verifica: string | null;
    } | null;
    documenti_doganali: Array<{
        tipo_documento: string;
        nome_file: string;
        stato_validazione: string | null;
    }>;
    riskScore?: {
        score_globale: number;
        score_compliance_ce: number;
        score_doganale: number;
        livello_rischio: string;
        dettaglio_penalita: any[];
        raccomandazioni: any[];
    } | null;
    generatedAt: string;
    orgName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getScoreStyle(score: number) {
    if (score >= 80) return { box: styles.scoreGreen, text: styles.scoreGreenText };
    if (score >= 60) return { box: styles.scoreYellow, text: styles.scoreYellowText };
    if (score >= 40) return { box: styles.scoreOrange, text: styles.scoreOrangeText };
    return { box: styles.scoreRed, text: styles.scoreRedText };
}

function getValidBadge(stato: string | null) {
    if (stato === "valido") return styles.badgeGreen;
    if (stato === "non_valido") return styles.badgeRed;
    if (stato === "attenzione") return styles.badgeYellow;
    return styles.badgeGray;
}

const DOC_TYPE_LABELS: Record<string, string> = {
    dichiarazione_ce: "Dichiarazione CE",
    manuale_uso: "Manuale d'uso",
    fascicolo_tecnico: "Fascicolo Tecnico",
    analisi_rischi: "Analisi Rischi",
    schemi_elettrici: "Schemi Elettrici",
    certificazione_componente: "Cert. Componente",
    bill_of_lading: "Bill of Lading",
    fattura_commerciale: "Fattura Commerciale",
    packing_list: "Packing List",
    certificato_origine: "Cert. Origine",
    dichiarazione_valore: "Dich. Valore",
};

// ─── Main PDF Document Component ─────────────────────────────────────────────
export function ReportDocument({ data }: { data: ReportData }) {
    const globalScore = data.riskScore ? getScoreStyle(data.riskScore.score_globale) : null;
    const ceScore = data.riskScore ? getScoreStyle(data.riskScore.score_compliance_ce) : null;
    const dgScore = data.riskScore ? getScoreStyle(data.riskScore.score_doganale) : null;

    return (
        <Document
            title={`Report Compliance — ${data.pratica.codice_pratica}`}
            author="ImportCompliance"
            subject="Report di conformità import macchinari"
        >
            {/* ── Page 1: Overview + Scores ── */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.appName}>ImportCompliance</Text>
                        <Text style={styles.headerSubtitle}>Report di Conformità Import Macchinari</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.headerDate}>Generato il {data.generatedAt}</Text>
                        <Text style={styles.codice}>{data.pratica.codice_pratica}</Text>
                        <Text style={styles.headerDate}>{data.orgName}</Text>
                    </View>
                </View>

                {/* 1. Dati Pratica */}
                <Text style={styles.sectionTitle}>1. Dati Pratica</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Nome pratica</Text>
                        <Text style={styles.value}>{data.pratica.nome_pratica}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Fornitore cinese</Text>
                        <Text style={styles.value}>{data.pratica.fornitore_cinese ?? "—"}</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Stato pratica</Text>
                        <Text style={styles.value}>{data.pratica.stato.replace(/_/g, " ").toUpperCase()}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Data prevista arrivo</Text>
                        <Text style={styles.value}>{data.pratica.data_prevista_arrivo ?? "—"}</Text>
                    </View>
                </View>

                {/* 2. Macchinario */}
                {data.macchinario && (
                    <>
                        <Text style={styles.sectionTitle}>2. Macchinario</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Nome macchina</Text>
                                <Text style={styles.value}>{data.macchinario.nome_macchina}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Modello</Text>
                                <Text style={styles.value}>{data.macchinario.modello}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Anno produzione</Text>
                                <Text style={styles.value}>{data.macchinario.anno_produzione ?? "—"}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Stato macchina</Text>
                                <Text style={styles.value}>{data.macchinario.stato_macchina.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Codice TARIC selezionato</Text>
                                <Text style={styles.value}>{data.macchinario.codice_taric_selezionato ?? "Non classificato"}</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* 3. Risk Score Overview */}
                {data.riskScore && globalScore && ceScore && dgScore && (
                    <>
                        <Text style={styles.sectionTitle}>3. Risk Score Complessivo</Text>
                        <View style={[styles.scoreBox, globalScore.box]}>
                            <View>
                                <Text style={[{ fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 }, globalScore.text]}>
                                    SCORE GLOBALE — {data.riskScore.livello_rischio.toUpperCase()}
                                </Text>
                                <Text style={{ fontSize: 7, color: "#64748b" }}>Formula: (CE × 0.55) + (Doganale × 0.45)</Text>
                            </View>
                            <Text style={[styles.scoreNumber, globalScore.text]}>{data.riskScore.score_globale}/100</Text>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.col, styles.scoreBox, ceScore.box, { marginBottom: 0 }]}>
                                <View>
                                    <Text style={[{ fontSize: 7, fontFamily: "Helvetica-Bold" }, ceScore.text]}>CE Compliance (×0.55)</Text>
                                </View>
                                <Text style={[{ fontSize: 14, fontFamily: "Helvetica-Bold" }, ceScore.text]}>
                                    {data.riskScore.score_compliance_ce}
                                </Text>
                            </View>
                            <View style={[styles.col, styles.scoreBox, dgScore.box, { marginBottom: 0 }]}>
                                <View>
                                    <Text style={[{ fontSize: 7, fontFamily: "Helvetica-Bold" }, dgScore.text]}>Doganale (×0.45)</Text>
                                </View>
                                <Text style={[{ fontSize: 14, fontFamily: "Helvetica-Bold" }, dgScore.text]}>
                                    {data.riskScore.score_doganale}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>ImportCompliance — Report riservato — uso interno</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
                </View>
            </Page>

            {/* ── Page 2: Documents + Penalties + Recommendations ── */}
            <Page size="A4" style={styles.page}>
                {/* Header repeat */}
                <View style={[styles.header, { marginBottom: 12 }]}>
                    <Text style={[styles.appName, { fontSize: 11 }]}>ImportCompliance</Text>
                    <Text style={styles.headerDate}>{data.pratica.codice_pratica} — {data.pratica.nome_pratica}</Text>
                </View>

                {/* 4. Documenti CE */}
                <Text style={styles.sectionTitle}>4. Documenti CE di Conformità</Text>
                {data.documenti_ce.length === 0 ? (
                    <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 8 }}>Nessun documento CE registrato</Text>
                ) : (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.thText, { flex: 2 }]}>Tipo Documento</Text>
                            <Text style={[styles.thText, { flex: 2 }]}>Nome File</Text>
                            <Text style={[styles.thText, { flex: 1 }]}>Stato</Text>
                        </View>
                        {data.documenti_ce.map((doc, i) => (
                            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                <Text style={[styles.tdText, { flex: 2 }]}>
                                    {DOC_TYPE_LABELS[doc.tipo_documento] ?? doc.tipo_documento}
                                </Text>
                                <Text style={[styles.tdTextSmall, { flex: 2 }]} numberOfLines={1}>{doc.nome_file}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={getValidBadge(doc.stato_validazione)}>
                                        {doc.stato_validazione ?? "—"}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Organismo Notificato */}
                {data.organismo && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>4a. Organismo Notificato</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Numero</Text>
                                <Text style={styles.value}>#{data.organismo.numero_organismo}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Nome</Text>
                                <Text style={styles.value}>{data.organismo.nome_organismo ?? "—"}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Stato verifica NANDO</Text>
                                <Text style={[styles.value, {
                                    color: data.organismo.stato_verifica === "valido" ? "#15803d" :
                                        data.organismo.stato_verifica === "non_trovato" ? "#dc2626" : "#d97706"
                                }]}>
                                    {data.organismo.stato_verifica ?? "—"}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {/* 5. Documenti Doganali */}
                <Text style={styles.sectionTitle}>5. Documenti Doganali</Text>
                {data.documenti_doganali.length === 0 ? (
                    <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 8 }}>Nessun documento doganale registrato</Text>
                ) : (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.thText, { flex: 2 }]}>Tipo Documento</Text>
                            <Text style={[styles.thText, { flex: 2 }]}>Nome File</Text>
                            <Text style={[styles.thText, { flex: 1 }]}>Stato</Text>
                        </View>
                        {data.documenti_doganali.map((doc, i) => (
                            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                <Text style={[styles.tdText, { flex: 2 }]}>
                                    {DOC_TYPE_LABELS[doc.tipo_documento] ?? doc.tipo_documento}
                                </Text>
                                <Text style={[styles.tdTextSmall, { flex: 2 }]} numberOfLines={1}>{doc.nome_file}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={getValidBadge(doc.stato_validazione)}>
                                        {doc.stato_validazione ?? "—"}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 6. Penalità */}
                {data.riskScore && data.riskScore.dettaglio_penalita.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>6. Penalità Rilevate</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.thText, { minWidth: 70 }]}>Codice</Text>
                                <Text style={[styles.thText, { flex: 1 }]}>Descrizione</Text>
                                <Text style={[styles.thText, { minWidth: 50 }]}>Severità</Text>
                                <Text style={[styles.thText, { minWidth: 40, textAlign: "right" }]}>Punti</Text>
                            </View>
                            {data.riskScore.dettaglio_penalita.map((p: any, i: number) => (
                                <View key={i} style={styles.penaltyRow}>
                                    <Text style={styles.penaltyCode}>{p.codice}</Text>
                                    <Text style={styles.penaltyDesc}>{p.descrizione}</Text>
                                    <Text style={[styles.tdTextSmall, { minWidth: 50 }]}>{p.severity}</Text>
                                    <Text style={styles.penaltyValue}>{p.penalita}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* 7. Raccomandazioni */}
                {data.riskScore && data.riskScore.raccomandazioni.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>7. Raccomandazioni</Text>
                        {data.riskScore.raccomandazioni.map((r: string, i: number) => (
                            <View key={i} style={styles.recItem}>
                                <Text style={styles.recNumber}>{i + 1}.</Text>
                                <Text style={styles.recText}>{r}</Text>
                            </View>
                        ))}
                    </>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>ImportCompliance — Report riservato — uso interno</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}
