import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subjectId = url.searchParams.get("subject_id") ?? "demo";

  return NextResponse.json({
    subject: {
      id: subjectId,
      lat: 51.5074,
      lon: -0.1278,
      property_type: "semi_detached",
      beds: 3,
      floor_area_sqm: 90,
    },
    estimate: {
      arv_gbp: 325000,
      range_low_gbp: 305000,
      range_high_gbp: 345000,
      confidence: "high",
    },
    comps: [
      {
        id: "sale_1",
        sold_price_gbp: 330000,
        sold_date: "2024-11-02",
        distance_m: 420,
        floor_area_sqm: 92,
        price_per_sqm: 3587,
        similarity_score: 0.83,
        adjustments: { size_adj: -0.02, time_adj: 0.01 },
      },
      {
        id: "sale_2",
        sold_price_gbp: 318000,
        sold_date: "2024-08-18",
        distance_m: 610,
        floor_area_sqm: 88,
        price_per_sqm: 3614,
        similarity_score: 0.78,
        adjustments: { size_adj: 0.01, time_adj: 0.0 },
      },
    ],
    explanations: {
      chosen_because: [
        "Closest recent sales with similar size and same property type.",
        "No extreme outliers on price per sqm.",
      ],
      excluded_because: ["Older than 24 months.", "Different property type or size mismatch."],
      risk_flags: ["Floor area missing reduces confidence (not in this demo)."],
      what_moves_value: ["Renovation condition", "street premium", "extension potential"],
    },
    debug: { candidate_count: 61, selected_count: 2 },
  });
}
