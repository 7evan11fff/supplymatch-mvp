import { prisma } from "./db";
import { analyzeBusinessNeeds, scoreSupplierMatch } from "./openai";
import { discoverSuppliers } from "./scraper";

const MATCH_THRESHOLD = 40;
const GAP_THRESHOLD = 50;

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
    items: business.items.map((item) => ({
      name: item.name,
      category: item.category,
      description: item.description,
      estimatedQuantity: item.estimatedQuantity,
      purchaseFrequency: item.purchaseFrequency,
      specifications: item.specifications,
    })),
  });

  const suppliers = await prisma.supplier.findMany({ take: 50 });

  const scoredMatches: Array<{
    supplierId: string;
    score: number;
    reasoning: string;
    strengths: string[];
    gaps: string[];
  }> = [];

  for (const supplier of suppliers) {
    const result = await scoreSupplierMatch(
      analysis.summary,
      business.items.map((i) => ({
        name: i.name,
        category: i.category,
        specifications: i.specifications,
      })),
      {
        name: supplier.name,
        industry: supplier.industry,
        description: supplier.description,
        categories: supplier.categories,
        location: supplier.location,
      }
    );

    if (result.score >= MATCH_THRESHOLD) {
      scoredMatches.push({
        supplierId: supplier.id,
        score: result.score,
        reasoning: result.reasoning,
        strengths: result.strengths || [],
        gaps: result.gaps || [],
      });
    }
  }

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
        id: { notIn: suppliers.map((s) => s.id) },
      },
      take: 20,
    });

    for (const supplier of newSuppliers) {
      const result = await scoreSupplierMatch(
        analysis.summary,
        business.items.map((i) => ({
          name: i.name,
          category: i.category,
          specifications: i.specifications,
        })),
        {
          name: supplier.name,
          industry: supplier.industry,
          description: supplier.description,
          categories: supplier.categories,
          location: supplier.location,
        }
      );

      if (result.score >= MATCH_THRESHOLD) {
        scoredMatches.push({
          supplierId: supplier.id,
          score: result.score,
          reasoning: result.reasoning,
          strengths: result.strengths || [],
          gaps: result.gaps || [],
        });
      }
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
