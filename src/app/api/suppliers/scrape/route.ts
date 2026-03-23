import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { runBaselineScrape } from "@/lib/scraper";

export const maxDuration = 300;

const defaultCategories = [
  "Office Supplies",
  "Food & Beverage",
  "Packaging",
  "Raw Materials",
  "Cleaning Supplies",
  "Equipment",
  "Safety PPE",
  "Restaurant Supplies",
  "Beauty Salon Supplies",
  "Healthcare Medical Supplies",
  "Construction Materials",
  "Technology IT",
];

export async function POST(request: Request) {
  try {
    await requireAdmin();

    let categories = defaultCategories;
    try {
      const body = await request.json();
      if (body.categories?.length) categories = body.categories;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // use defaults
    }

    const results = await runBaselineScrape(categories);
    const totalAdded = Object.values(results).reduce((a, b) => a + b, 0);

    return NextResponse.json({ results, totalAdded });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scraping failed" },
      { status: 500 }
    );
  }
}
