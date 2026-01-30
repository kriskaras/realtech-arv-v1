import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const rows = await prisma.sale.findMany({
    take: 200,
    orderBy: { soldDate: "desc" },
    select: {
      lat: true,
      lon: true,
      soldPriceGbp: true,
      soldDate: true,
      propertyType: true,
      beds: true,
      floorAreaSqm: true,
    },
  });

  return Response.json({ count: rows.length, rows });
}

