const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("csv-parse/sync");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function toFloat(x) {
  const s = (x ?? "").toString().trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function toInt(x) {
  const s = (x ?? "").toString().trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function pick(row, names) {
  for (const n of names) {
    if (row[n] != null && row[n].toString().trim() !== "") return row[n];
  }
  return "";
}

async function main() {
  const csvPath = path.resolve(__dirname, "../../data/demo/densest_complete_only.csv");
  if (!fs.existsSync(csvPath)) throw new Error(`CSV not found: ${csvPath}`);

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });

  await prisma.sale.deleteMany();
  await prisma.property.deleteMany();

  const sales = [];
  for (const r of rows) {
    const lat = toFloat(pick(r, ["uprn_lat", "lat_rooftop", "lat_postcode"]));
    const lon = toFloat(pick(r, ["uprn_lon", "lon_rooftop", "lon_postcode"]));
    const price = toInt(pick(r, ["price", "sold_price_gbp", "soldPriceGbp"]));
    const dateStr = pick(r, ["transfer_date", "sold_date", "soldDate", "date"]);
    const propertyType = (pick(r, ["property_type", "propertyType"]).toString().trim() || "Unknown");
    const beds = toInt(pick(r, ["beds", "bedrooms"]));
    const floor = toFloat(pick(r, ["epc_floor_area_m2_from_epc", "floorAreaSqm", "floor_area_sqm"]));

    if (lat == null || lon == null || price == null || !dateStr) continue;

    const soldDate = new Date(dateStr);
    if (Number.isNaN(soldDate.getTime())) continue;

    sales.push({ lat, lon, soldPriceGbp: price, soldDate, propertyType, beds, floorAreaSqm: floor });
  }

  const B = 1000;
  for (let i = 0; i < sales.length; i += B) {
    await prisma.sale.createMany({ data: sales.slice(i, i + B) });
  }

  console.log(`Seeded Sale rows: ${sales.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
