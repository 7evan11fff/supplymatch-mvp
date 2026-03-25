import { prisma } from "./db";
import type { BusinessItem, Supplier } from "@/generated/prisma";
import { analyzeBusinessNeeds, batchScoreSuppliers } from "./openai";
import { discoverSuppliers } from "./scraper";

const MATCH_THRESHOLD = 40;
const GAP_THRESHOLD = 50;
const BATCH_SIZE = 25;

async function scoreSupplierBatch(
  summary: string,
  items: Array<{ name: string; category: string; specifications: string | null }>,
  suppliers: Array<{
    id: string;
    name: string;
    industry: string | null;
    description: string | null;
    categories: unknown;
    location: string | null;
  }>
) {
  const allScored: Array<{
    supplierId: string;
    score: number;
    reasoning: string;
    strengths: string[];
    gaps: string[];
  }> = [];

  for (let i = 0; i < suppliers.length; i += BATCH_SIZE) {
    const batch = suppliers.slice(i, i + BATCH_SIZE);
    const scores = await batchScoreSuppliers(summary, items, batch);

    for (const s of scores) {
      const supplier = batch[s.index];
      if (supplier && s.score >= MATCH_THRESHOLD) {
        allScored.push({
          supplierId: supplier.id,
          score: s.score,
          reasoning: s.reasoning,
          strengths: s.strengths || [],
          gaps: s.gaps || [],
        });
      }
    }
  }

  return allScored;
}

export async function runFullAnalysis(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { items: true },
  });

  if (!business) throw new Error("Business not found");

  const analysis = await analyzeBusinessNeeds({
    name: business.name,
    industry: business.industry,
    location: business.location,
    description: business.description,
    operatingDetails: business.operatingDetails as Record<string, string> | null,
    items: business.items.map((item: BusinessItem) => ({
      name: item.name,
      category: item.category,
      description: item.description,
      estimatedQuantity: item.estimatedQuantity,
      purchaseFrequency: item.purchaseFrequency,
      specifications: item.specifications,
    })),
  });

  const suppliers = await prisma.supplier.findMany({ take: 50 });
  const itemsForScoring = business.items.map((i: BusinessItem) => ({
    name: i.name,
    category: i.category,
    specifications: i.specifications,
  }));

  let scoredMatches = await scoreSupplierBatch(
    analysis.summary,
    itemsForScoring,
    suppliers.map((s: Supplier) => ({
      id: s.id,
      name: s.name,
      industry: s.industry,
      description: s.description,
      categories: s.categories,
      location: s.location,
    }))
  );

  const bestScore = scoredMatches.length > 0
    ? Math.max(...scoredMatches.map((m) => m.score))
    : 0;

  if (bestScore < GAP_THRESHOLD && analysis.searchQueries?.length > 0) {
    const categories = analysis.categories || [];
    for (const category of categories.slice(0, 3)) {
      await discoverSuppliers(category, business.location);
    }

    const newSuppliers = await prisma.supplier.findMany({
      where: {
        source: "AI_DISCOVERED",
        id: { notIn: suppliers.map((s: Supplier) => s.id) },
      },
      take: 20,
    });

    if (newSuppliers.length > 0) {
      const newScores = await scoreSupplierBatch(
        analysis.summary,
        itemsForScoring,
        newSuppliers.map((s: Supplier) => ({
          id: s.id,
          name: s.name,
          industry: s.industry,
          description: s.description,
          categories: s.categories,
          location: s.location,
        }))
      );
      scoredMatches = [...scoredMatches, ...newScores];
    }
  }

  await prisma.supplierMatch.deleteMany({
    where: { businessId, status: "RECOMMENDED" },
  });

  const topMatches = scoredMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const match of topMatches) {
    await prisma.supplierMatch.create({
      data: {
        businessId,
        supplierId: match.supplierId,
        matchScore: match.score,
        aiReasoning: `${match.reasoning}\n\nStrengths: ${match.strengths.join(", ")}\n\nPotential gaps: ${match.gaps.join(", ")}`,
        aiSummary: analysis.summary,
        status: "RECOMMENDED",
      },
    });
  }

  return {
    analysis,
    matchCount: topMatches.length,
    topScore: topMatches[0]?.score || 0,
  };
}
