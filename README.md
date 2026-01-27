# realtech-arv-v1

Transparent ARV estimator: deterministic comp ranking + ARV range + confidence score + optional AI explanations + comp curation (Keep/Reject).

The point of this repo is simple: **show an ARV estimate you can audit**.
- comp selection is deterministic (no black box)
- ARV + range + confidence are deterministic and explainable
- user can override comps and the system shows what that does to confidence/range
- AI (if enabled) only writes the explanation; it never chooses comps or changes the math

---

## What it does (V1)
Input: a subject property from the dataset with:
- `lat`, `lon`
- `property_type`
- `floor_area_sqm` (preferred; missing sqm lowers confidence)
- optional `beds`

Output:
- baseline ARV + range + confidence (label + numeric score)
- top 10 comps as cards (with similarity score breakdown)
- Keep/Reject comps → curated ARV recalculates instantly
- baseline vs curated shown side-by-side
- explanation panel (LLM if configured, otherwise a deterministic fallback)

Non-goals:
- auth/payments/CRM
- “perfect ML model”
- full address search unless the dataset already supports it

---

## Demo datasets (already in the repo)
See `data/demo/README.md` for details.

Files:
- `data/demo/densest_5k.csv` — 5k sample from an M33 hotspot
- `data/demo/densest_complete_only.csv` — subset with EPC floor area present (2196 rows)

Key columns:
- `uprn_lat`, `uprn_lon`
- `epc_match_method`
- `epc_floor_area_m2_from_epc`

---

## Quickstart
Prereqs:
- Node.js 18+
- Postgres (Supabase or local)

Setup:
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
