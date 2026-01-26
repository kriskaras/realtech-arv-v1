# realtech-arv-v1
Transparent ARV estimator: deterministic comp ranking + ARV confidence range + AI explanations + human-in-the-loop comp curation.

A **trustworthy ARV estimator** that:
1) **Selects comps transparently (deterministic code)**
2) Computes **ARV + confidence range (deterministic code)**
3) Uses AI only to **explain the “why”** behind comp choice and value drivers
4) Lets users **curate comps (Keep/Reject)** and instantly see how it changes ARV + confidence

## Why this exists
ARV estimates are hard to trust because comp selection is often opaque and biased.  
This prototype ranks comparable sales with explicit scoring, outputs ARV with a confidence range, and generates a plain-English explanation so real users can understand the result — **and optionally override comps** while the system transparently adjusts confidence.

## Challenge Tracks Fit
- **Track 2: Predicting Property Prices with Confidence** (ARV + range + confidence penalties)
- **Track 3: Visualising & Explaining Predictions** (transparent comp selection + interactive curation + explanation)

---

## What it does (V1 Scope)

### Input
A subject property (selected from dataset) with minimum fields:
- `lat`, `lon`
- `property_type`
- `floor_area_sqm` (preferred; if missing we downgrade confidence)
- optionally `beds`

### Output
- **Baseline ARV (GBP)** + **range (low/high)** + **confidence**
- **Top candidates (10)** surfaced as comp cards
- User can **Keep/Reject** comps (buttons + keyboard shortcuts)
- **Curated ARV** recalculates instantly based on kept comps
- **Confidence updates** (and worsens if user rejects too many / increases variance)
- **Explanation**: chosen/excluded reasoning + risk flags + what moves value

### Non-goals (we are not building)
- Full product (auth, dashboards, CRM, payments)
- A complex ML model tuned to perfection
- Full address search / geocoding pipeline (unless dataset already supports it)
- Fancy swipe animations (optional only if we’re ahead)

---

## How it works (High-level)

### 1) Candidate retrieval (code)
Pull 20-30 candidate sales using:
- radius (start ~0.5km)
- recency window (24 months; widen if needed)
- type match (widen if too few)

### 2) Deterministic scoring (code)
Each candidate comp gets a similarity score (0–1) based on:
- distance penalty
- time decay
- size similarity (sqm preferred)
- beds similarity (secondary)
- type match bonus
- outlier penalty (ppsqm sanity checks)

From candidates we produce:
- **Top 10 candidates** (for user curation UI)
- **Top 5–8 selected comps** (default baseline estimate)

### 3) ARV calculation (code)
- Compute comp `price_per_sqm`
- Use **weighted median** (weights = similarity score)
- ARV = weighted_median_ppsqm × subject_floor_area_sqm

Two estimates are supported:
- **Baseline estimate** (system-selected comps)
- **Curated estimate** (user-kept comps)

### 4) Confidence + range (code)
Heuristic V1 (fast + defensible):
Range widens when:
- comp count is low
- ppsqm variance is high
- comps are far away
- comps are old

**Human-in-the-loop penalty (important):**
If the user rejects comps and the remaining set becomes sparse/noisy, we **downgrade confidence** and widen the range.  
We also show **Baseline vs Curated** side-by-side to prevent cherry-picking.

Outputs:
- `range_low_gbp`, `range_high_gbp`, and `confidence: low|medium|high`

### 5) Explanation (AI narration only)
LLM reads:
- subject + selected/kept comps + top excluded comps + scoring factors
LLM outputs:
- chosen_because
- excluded_because
- risk_flags
- what_moves_value

**Important:** AI does *not* select comps.

---

## UI (Judge-friendly)
Single page:
1) Subject selector
2) **Baseline ARV + range + confidence**
3) **Comp Curation Cards (top 10)**  
   - Each card shows: distance, date, sqm, £/sqm, similarity score, score breakdown
   - Actions: **Keep / Reject**
   - Shortcuts: `→` Keep, `←` Reject, `R` reset
4) **Curated ARV + range + confidence** (updates instantly)
5) Explanation panel (chosen/excluded + risk flags)

Optional (only if ahead):
- Swipe animation (cosmetic only)

---

## Tech Stack
- **Next.js + TypeScript**
- **Supabase (Postgres)**
- **Prisma ORM**
- Optional: LLM explanation (OpenAI/other) — non-blocking, falls back to deterministic text

---

## API Contract

### `GET /api/estimate?subject_id=<id>`
Returns baseline + curation candidates:
```json
{
  "subject": {"id":"...","lat":0,"lon":0,"property_type":"...","beds":3,"floor_area_sqm":90},
  "baseline": {
    "estimate": {"arv_gbp": 325000, "range_low_gbp": 305000, "range_high_gbp": 345000, "confidence": "high"},
    "selected_comp_ids": ["c1","c2","c3","c4","c5","c6"]
  },
  "candidates": [
    {
      "id":"c1",
      "sold_price_gbp": 330000,
      "sold_date":"2024-11-02",
      "distance_m": 420,
      "floor_area_sqm": 92,
      "price_per_sqm": 3587,
      "similarity_score": 0.83,
      "score_breakdown": {"distance": 0.22, "time": 0.18, "size": 0.30, "type": 0.13, "outlier": 0.00}
    }
  ],
  "explanations": {
    "chosen_because": ["..."],
    "excluded_because": ["..."],
    "risk_flags": ["..."],
    "what_moves_value": ["..."]
  },
  "debug": {"candidate_count": 61, "selected_count": 6}
}
