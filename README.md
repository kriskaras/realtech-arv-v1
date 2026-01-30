# PropertyIQ — Transparent ARV + Confidence (Hackathon Build)

PropertyIQ is a focused hackathon prototype for **Deal Mind**: a UK property deal-sourcing platform.  
The goal is simple: ship an **auditable, deterministic ARV engine** with **confidence ranges** and **interactive comp curation** — so valuations aren’t just numbers, they’re *defensible decisions*.

This repo is intentionally scoped for a 48-hour build: correctness first, polish second.

---

## Reality check (current state)

Right now this hackathon repo is **early**:
- ✅ Real demo datasets are in the repo
- ✅ Basic app scaffolding exists
- ❌ Valuation logic is not implemented yet
- ❌ Frontend is minimal and currently rough

---

## What we will ship in 48 hours

### Inputs (from dataset)
A subject property:
- `lat`, `lon`
- `property_type`
- `floor_area_sqm` *(preferred; missing sqm reduces confidence)*
- `beds` *(optional)*

### Outputs
- **Baseline ARV** + confidence range
- **Confidence label** (HIGH/MEDIUM/LOW) + numeric score (0–1)
- **Top 10 comps** with transparent score breakdowns
- **Interactive curation**: Keep/Reject comps → instant recompute
- **Baseline vs Curated** comparison (anti-cherry-pick)
- Optional: **Explanation panel** (LLM explains only; never selects comps, never changes math)

### Non-goals (for hackathon)
- ❌ PostGIS spatial queries (haversine is enough at demo scale)
- ❌ ML models (deterministic + auditable beats black-box in a hackathon)
- ❌ Live scraping (static dataset only)
- ❌ Auth/payments/full address search polish

---

## 2-Minute Setup

### Run it
```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Expected outcome (today)
- App runs locally
- Demo data seeds successfully
- UI loads (even if rough)

### Expected outcome (by demo time)
- Selecting a demo property shows baseline ARV + range + confidence
- Rejecting comps updates curated ARV + confidence instantly
- Each comp card shows why it ranked (distance / recency / size)

---

## Why this is worth building (and not a toy)

Most valuation tools give a number and hide the logic. PropertyIQ is the opposite:
- **Deterministic comp selection** (auditable scoring)
- **Confidence modeling** that gets worse when data quality is worse (as it should)
- **User curation with consequences** (baseline pinned + confidence penalty prevents silent cherry-picking)

If it can’t explain itself, it doesn’t ship.

---

## Demo data (real UK transactions + EPC-linked info)

Located in `data/demo/`:
- `densest_5k.csv` — 5k sample properties (M33 hotspot)
- `densest_complete_only.csv` — 2,196 rows with EPC floor area present

Key columns:
- `uprn_lat`, `uprn_lon`
- `sold_price`, `sold_date`
- `property_type`
- `epc_match_method`
- `epc_floor_area_m2_from_epc`

This is real data. It’s messy. That’s the point.

---

## Engine plan (audit-first)

### 1) Candidate retrieval (filter)
- distance ≤ 2,000m
- sold within last 18 months
- same property type

### 2) Similarity scoring (0–1)
Weighted components:
- distance (50%)
- recency (30%)
- size similarity (20%)
- missing sqm → neutral size score + confidence penalty

### 3) ARV calculation (robust)
- compute **£/sqm** for each comp
- use **weighted median** (outlier-resistant)
- ARV = weighted_median(£/sqm) × subject_sqm

### 4) Confidence modeling (honest heuristics)
Confidence drops when:
- comps < 5
- high variance in £/sqm (CV too high)
- comps are old/far
- subject sqm missing (big penalty)

Range widens as confidence drops (e.g. 5% → 15%).

### 5) Interactive curation (with consequences)
Reject comps → recompute ARV + confidence  
Baseline stays pinned. Curated is tracked. The UI shows deltas clearly.

---

## Technical bar (so this doesn’t become spaghetti)

Minimum standards for the hackathon build:
- Deterministic engine: same inputs → same outputs
- Engine is pure functions (easy to test)
- Unit tests for:
  - haversine distance
  - scoring
  - weighted median
  - confidence + range widening behavior
- Performance target:
  - ARV compute < 50ms for 5k rows on a normal laptop

---

## Architecture (simple on purpose)

UI (Next.js)  
→ API route (`/api/value`)  
→ Engine (pure functions)  
→ DB (Postgres seeded from CSV)

---

## Tech stack

Backend:
- Node.js 18+
- Postgres (Supabase or local)
- Prisma

Frontend:
- Next.js + TypeScript
- Tailwind CSS

Optional:
- OpenAI API for explanation text (non-authoritative)

---

## Project structure

```txt
realtech-arv-v1/
├── data/demo/
│   ├── densest_5k.csv
│   ├── densest_complete_only.csv
│   └── README.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── lib/
│   │   ├── comp-selection.ts
│   │   ├── scoring.ts
│   │   ├── arv-calculator.ts
│   │   ├── confidence.ts
│   │   └── types.ts
│   └── app/
│       ├── api/
│       └── (ui routes)
├── .env.example
└── package.json
```

---

## Hackathon build tasks

### Task A — Comp selection + scoring (deterministic + tested)
Done when:
- comp filter + scoring works end-to-end
- tie-break rules are explicit
- tests exist for scoring + edge cases

### Task B — ARV calculation (weighted median) + outlier handling
Done when:
- £/sqm computed safely (sqm missing handled)
- weighted median implemented + tested
- obvious outliers don’t blow up the estimate

### Task C — Confidence + range widening (honest uncertainty)
Done when:
- confidence drops correctly with fewer/noisy/old/far comps
- range widens as confidence drops
- tests prove behavior

### Task D — Curation UI (baseline pinned + curated tracked)
Done when:
- keep/reject updates instantly
- baseline remains pinned
- curated shows delta + confidence impact clearly

Optional Task E — Explanation panel (non-authoritative)
Done when:
- LLM explains drivers/risks + what to verify
- LLM never selects comps or changes numbers
- safe fallback when no key / rate limited

optional Map integration (subject + comps visualised)
Done when:
- A map renders on the demo page
- Pins show:
  - **Subject property** (distinct marker)
  - **Top comps** (ranked markers; tooltip shows score + price)
- Clicking a comp pin highlights the comp card (and vice versa)
- Map auto-fits bounds to include subject + all shown comps
- No paid keys required for the hackathon (use OpenStreetMap tiles via MapLibre/Leaflet)
Suggested libraries (choose one):
- **MapLibre GL JS** (modern vector maps)  
- **React-Leaflet** (simple + reliable)

Files likely touched:
- `src/app/(ui)/...` (demo page)
- `src/lib/types.ts` (marker data shape)
- `src/app/api/value/...` (ensure API returns coords + rank metadata)


---

## After the hackathon

If this prototype ships well, the next step is integrating the engine into Deal Mind’s broader product (ingestion, strategy analysis, deal pipeline).  
