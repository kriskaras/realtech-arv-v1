'use client';

import { useEffect, useState } from 'react';

type EstimateResponse = {
  subject: {
    id: string;
    lat: number;
    lon: number;
    property_type: string;
    beds?: number;
    floor_area_sqm?: number;
  };
  estimate: {
    arv_gbp: number;
    range_low_gbp: number;
    range_high_gbp: number;
    confidence: 'low' | 'medium' | 'high' | string;
  };
  comps: Array<{
    id: string;
    sold_price_gbp: number;
    sold_date: string;
    distance_m: number;
    floor_area_sqm?: number;
    price_per_sqm?: number;
    similarity_score: number;
    adjustments?: Record<string, number>;
  }>;
  explanations: {
    chosen_because: string[];
    excluded_because: string[];
    risk_flags: string[];
    what_moves_value: string[];
  };
  debug?: {
    candidate_count?: number;
    selected_count?: number;
  };
};

function fmtGBP(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const [subjectId, setSubjectId] = useState('demo');
  const [data, setData] = useState<EstimateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(id: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/estimate?subject_id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = (await res.json()) as EstimateResponse;
      setData(json);
    } catch (e: any) {
      setErr(e?.message ?? 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Transparent ARV Estimator</h1>
          <p className="text-zinc-300">
            Deterministic comp ranking + ARV confidence range + AI explanation (narration only).
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Subject ID</label>
              <input
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500 sm:w-72"
                placeholder="demo"
              />
            </div>
            <button
              onClick={() => load(subjectId)}
              className="rounded-xl bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Estimate'}
            </button>
          </div>

          {err && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
              {err}
            </div>
          )}

          {data && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">ARV</h2>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                    confidence: <span className="font-medium text-zinc-50">{data.estimate.confidence}</span>
                  </span>
                </div>
                <div className="mt-3 text-4xl font-semibold">{fmtGBP(data.estimate.arv_gbp)}</div>
                <div className="mt-1 text-sm text-zinc-300">
                  Range: {fmtGBP(data.estimate.range_low_gbp)} – {fmtGBP(data.estimate.range_high_gbp)}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                    <div className="text-zinc-400">Type</div>
                    <div className="font-medium">{data.subject.property_type}</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                    <div className="text-zinc-400">Beds / Area</div>
                    <div className="font-medium">
                      {data.subject.beds ?? '—'} beds · {data.subject.floor_area_sqm ?? '—'} sqm
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm sm:col-span-2">
                    <div className="text-zinc-400">Coords</div>
                    <div className="font-medium">
                      {data.subject.lat}, {data.subject.lon}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="text-lg font-semibold">Explanation</h2>
                <div className="mt-3 space-y-4 text-sm">
                  <Section title="Chosen because" items={data.explanations.chosen_because} />
                  <Section title="Excluded because" items={data.explanations.excluded_because} />
                  <Section title="Risk flags" items={data.explanations.risk_flags} />
                  <Section title="What moves value" items={data.explanations.what_moves_value} />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:col-span-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Top Comps</h2>
                  <div className="text-xs text-zinc-400">
                    {data.debug?.selected_count ?? data.comps.length} selected / {data.debug?.candidate_count ?? '—'} candidates
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-zinc-400">
                      <tr className="border-b border-zinc-800">
                        <th className="py-2 pr-3">Comp</th>
                        <th className="py-2 pr-3">Sold</th>
                        <th className="py-2 pr-3">Distance</th>
                        <th className="py-2 pr-3">Area</th>
                        <th className="py-2 pr-3">£/sqm</th>
                        <th className="py-2 pr-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.comps.map((c) => (
                        <tr key={c.id} className="border-b border-zinc-900">
                          <td className="py-2 pr-3 font-medium">{c.id}</td>
                          <td className="py-2 pr-3">
                            {fmtGBP(c.sold_price_gbp)} <span className="text-zinc-500">·</span>{' '}
                            <span className="text-zinc-300">{c.sold_date}</span>
                          </td>
                          <td className="py-2 pr-3">{c.distance_m} m</td>
                          <td className="py-2 pr-3">{c.floor_area_sqm ?? '—'}</td>
                          <td className="py-2 pr-3">{c.price_per_sqm ?? '—'}</td>
                          <td className="py-2 pr-3">
                            <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs">
                              {c.similarity_score.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-xs text-zinc-500">
                  Note: V1 uses deterministic selection; AI is narration only.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-zinc-500">
          Hackathon build. If something looks “too clean”, it’s because we removed the fluff and shipped the core.
        </div>
      </div>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-zinc-300">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-200">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
