# Landing Page — Piano di Implementazione
> ImportCompliance — SaaS per la compliance CE e doganale di macchinari industriali

---

## Architettura

### Route
- `src/app/page.tsx` — attualmente redirect immediato a `/login` o `/dashboard`
- **Nuovo comportamento**: mostra la landing page; solo se già autenticato → redirect `/dashboard`
- La landing è un **Server Component** statico (nessuna chiamata DB)

### File da creare
```
src/app/page.tsx                          ← rewrite (landing + redirect se loggato)
src/app/(marketing)/layout.tsx            ← layout vuoto (niente sidebar/topbar)
src/components/landing/Navbar.tsx         ← header sticky
src/components/landing/HeroSection.tsx    ← prima fold
src/components/landing/ReviewsSection.tsx ← testimonianze
src/components/landing/FeaturesSection.tsx ← deep dive funzionalità
src/components/landing/PricingSection.tsx  ← piani e prezzi
src/components/landing/Footer.tsx         ← footer semplice
```

---

## Stile & Design System

Identico all'app interna:
- **Background**: `#0f172a` (slate-900)
- **Card**: `glass-card` (backdrop-blur, bordo slate-700)
- **Accent**: `blue-600` / `blue-500`
- **Testo**: white / slate-300 / slate-400 / slate-500
- **Font**: Inter (già caricato nel root layout)
- **Gradients**: blob di luce `bg-blue-600/10` con `blur-[120px]`
- **Animazioni**: `animate-fade-in` esistente + scroll-reveal con Intersection Observer

---

## Sezione 1 — Navbar (sticky, glass)

```
┌──────────────────────────────────────────────────────┐
│  [🛡 ImportCompliance]   Funzionalità  Prezzi  FAQ   │
│                                    [Accedi] [Prova Gratis →]│
└──────────────────────────────────────────────────────┘
```

**Comportamento**:
- Sticky `top-0`, `z-50`
- Background: `bg-slate-900/80 backdrop-blur-md border-b border-slate-800`
- Su mobile: hamburger menu con drawer
- Link interni: anchor scroll smooth verso le sezioni (`#features`, `#reviews`, `#pricing`)
- CTA "Accedi" → `/login`
- CTA "Prova Gratis" → `/login` (per ora, futura registrazione)

---

## Sezione 2 — Hero

**Layout**: centrato, full-height, blob gradients di sfondo

```
        ┌────────────────────────────────────┐
        │   Badge: "Conforme Reg. UE 2023"   │
        │                                    │
        │  Importi macchinari dalla Cina.    │
        │  Rimani in regola — senza stress.  │
        │                                    │
        │  ● Compliance CE automatizzata     │
        │  ● Classificazione HS TARIC        │
        │  ● Risk score in tempo reale       │
        │  ● Report PDF audit-ready          │
        │                                    │
        │  [→ Inizia Gratis]  [Guarda Demo]  │
        │                                    │
        │  ──── Già usato da ────            │
        │  Rossi Metalli · TechImport · ...  │
        └────────────────────────────────────┘
```

**Copy headline**: `"Importi macchinari dalla Cina. Noi gestiamo la compliance."`
**Subheadline**: `"L'unica piattaforma italiana che combina verifica CE, classificazione doganale TARIC e risk score in un unico workflow."`

**Social proof bar**: loghi/nomi aziende simulate (5-6 nomi), tono grigio

---

## Sezione 3 — Features (Deep Dive)

ID: `#features`

**Struttura**: titolo sezione + 4 feature block alternati (testo sx / mockup sx)

### Feature 1 — Compliance CE Intelligente
> Verifica automatica dei 6 documenti CE obbligatori secondo il Reg. UE 2023/1230. Controllo normativa, firme, mandatario UE e organismo notificato NANDO.

- Icona: `Shield`
- Mock: checklist CE con badge verde/rosso
- Tag: `Reg. UE 2023/1230` · `ISO 12100` · `NANDO`

### Feature 2 — Classificazione HS & TARIC
> Sistema rule-based di suggerimento codice HS a 6 cifre + TARIC a 10 cifre, con dazi applicabili e misure restrittive per l'import dalla Cina.

- Icona: `BarChart2`
- Mock: widget classificazione con percentuale match
- Tag: `Nomenclatura Combinata` · `Dazi UE` · `Misure Restrittive`

### Feature 3 — Risk Score Engine
> Algoritmo proprietario `(CE×0.55 + Doganale×0.45)` che calcola il rischio globale della pratica in tempo reale, con penalità codificate e raccomandazioni operative.

- Icona: `AlertTriangle`
- Mock: gauge del rischio con livelli basso/medio/alto/critico
- Tag: `Rischio Calcolato` · `Penalità Automatiche` · `Raccomandazioni`

### Feature 4 — Report PDF Audit-Ready
> Genera in un click un report PDF strutturato con tutti i dati della pratica, pronti per revisione legale, auditing interno o presentazione al cliente.

- Icona: `FileText`
- Mock: anteprima prima pagina del PDF con header e score
- Tag: `PDF A4` · `Audit Trail` · `React PDF`

---

## Sezione 4 — Recensioni

ID: `#reviews`

**Struttura**: griglia 3 colonne (desktop) / 1 colonna (mobile)

### Review 1
> "Finalmente uno strumento che capisce il workflow doganale italiano. Abbiamo ridotto i tempi di verifica CE del 70%."
— **Marco Ferretti**, Resp. Import · *Ferretti Machinery S.r.l.* · ⭐⭐⭐⭐⭐

### Review 2
> "Il risk score ci ha salvato da un blocco doganale. Avevamo il codice HS sbagliato sulla fattura commerciale."
— **Giulia Romano**, Compliance Officer · *TechnoImport Italia* · ⭐⭐⭐⭐⭐

### Review 3
> "Perfetto per una PMI come noi. Prima pagavamo un consulente esterno per ogni pratica. Ora gestiamo tutto internamente."
— **Luca Barbieri**, Titolare · *Barbieri Macchine Utensili* · ⭐⭐⭐⭐⭐

### Review 4
> "L'integrazione con NANDO per la verifica degli organismi notificati è un dettaglio che fa la differenza. Molto professionale."
— **Sara Conti**, Legale · *Conti & Partners Studio* · ⭐⭐⭐⭐⭐

### Review 5
> "Usiamo il report PDF per ogni import. I nostri clienti sono sempre impressionati dalla qualità della documentazione."
— **Roberto Mancini**, Dir. Operations · *AlphaImport Group* · ⭐⭐⭐⭐⭐

### Review 6
> "Setup in 10 minuti, prima pratica creata in 15. Interfaccia chiara, nessuna formazione necessaria per il team."
— **Chiara Vitale**, Office Manager · *Vitale Automation* · ⭐⭐⭐⭐⭐

---

## Sezione 5 — Pricing

ID: `#pricing`

**Struttura**: 3 colonne, piano centrale evidenziato (Professional)

### Piano Free
- **€0** / mese
- 2 pratiche attive
- 1 utente
- Classificazione HS base
- Report PDF (watermark)
- Supporto community
- **CTA**: "Inizia Gratis"

### Piano Professional ⭐ (evidenziato, bordo blue)
- **€79** / mese (o €790/anno — risparmia 2 mesi)
- Pratiche illimitate
- Fino a 5 utenti
- Classificazione HS avanzata + TARIC
- Risk Score Engine completo
- Report PDF senza watermark
- Verifica NANDO
- Audit Log
- Supporto email prioritario
- **CTA**: "Inizia Prova 14 Giorni →"

### Piano Enterprise
- **Prezzo su richiesta**
- Tutto il Professional +
- Utenti illimitati
- SSO / SAML
- API access
- SLA 99.9%
- Onboarding dedicato
- Fatturazione personalizzata
- **CTA**: "Contattaci"

**Note sotto pricing**: "Nessuna carta di credito richiesta · Cancella in qualsiasi momento · Dati ospitati in EU"

---

## Sezione 6 — Footer

```
┌─────────────────────────────────────────────────────┐
│  🛡 ImportCompliance                                  │
│  La compliance CE e doganale per l'import dalla Cina │
│                                                       │
│  Prodotto  Funzionalità · Prezzi · Changelog          │
│  Legale    Privacy · Termini · Cookie                 │
│  Contatti  info@importcompliance.it                  │
│                                                       │
│  © 2026 ImportCompliance. Tutti i diritti riservati. │
└─────────────────────────────────────────────────────┘
```

---

## Considerazioni Tecniche

### Scroll behavior
- `<html>` con `scroll-behavior: smooth` per anchor links
- Ogni sezione con `id` corrispondente per ancoraggio

### Responsive
- Mobile-first
- Navbar: hamburger a < `md`
- Hero: testo centrato su mobile, grid su desktop
- Features: stack verticale su mobile
- Reviews: 1 col → 2 col → 3 col
- Pricing: 1 col → 3 col

### Performance
- Tutto Server Component (tranne Navbar per hamburger state)
- Nessuna chiamata API
- Immagini: nessuna (solo SVG/icone lucide)

### page.tsx modificato
```tsx
// src/app/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ReviewsSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
```

---

## Ordine di Implementazione

1. `Navbar.tsx` — client component (stato mobile menu)
2. `HeroSection.tsx` — server component statico
3. `FeaturesSection.tsx` — server component statico
4. `ReviewsSection.tsx` — server component statico
5. `PricingSection.tsx` — server component statico
6. `Footer.tsx` — server component statico
7. Aggiornare `src/app/page.tsx`
8. Test responsive e scroll

---

*Piano creato il 2026-02-25*
