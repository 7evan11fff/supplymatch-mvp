import { openai } from "./openai";
import { prisma } from "./db";

export async function discoverSuppliers(
  category: string,
  location?: string
): Promise<number> {
  const locationStr = location || "USA";

  // Step 1: Use OpenAI web search to find suppliers (no JSON mode allowed here)
  const searchResponse = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: `Find B2B ${category} suppliers and distributors that serve small businesses in ${locationStr}. List real companies with their names, websites, what they supply, and where they're located. Focus on wholesale/bulk suppliers, not retail stores.`,
  });

  const searchText = searchResponse.output_text;
  if (!searchText) return 0;

  // Step 2: Extract structured data from the search results (JSON mode, no web search)
  const extractResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Extract B2B supplier information from the text below. Return a JSON object with this structure:
{
  "suppliers": [
    {
      "name": "company name",
      "website": "their website URL if mentioned",
      "description": "brief description of what they supply",
      "industry": "their industry or sector",
      "categories": ["supply categories they cover"],
      "location": "their headquarters or service area"
    }
  ]
}
Only include companies that are clearly B2B suppliers. Skip any that seem like review sites, blogs, or directories.`,
      },
      {
        role: "user",
        content: `Target category: ${category}\n\nSearch results:\n${searchText}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  let data: {
    suppliers?: Array<{
      name: string;
      website?: string;
      description?: string;
      industry?: string;
      categories?: string[];
      location?: string;
    }>;
  };

  try {
    data = JSON.parse(extractResponse.choices[0].message.content || '{"suppliers":[]}');
  } catch {
    console.error("Failed to parse supplier extraction response");
    return 0;
  }

  let totalAdded = 0;

  for (const supplier of data.suppliers || []) {
    if (!supplier.name) continue;

    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          { name: { equals: supplier.name, mode: "insensitive" } },
          ...(supplier.website
            ? [{ website: { equals: supplier.website, mode: "insensitive" as const } }]
            : []),
        ],
      },
    });

    if (!existing) {
      await prisma.supplier.create({
        data: {
          name: supplier.name,
          website: supplier.website || null,
          description: supplier.description || null,
          industry: supplier.industry || null,
          categories: supplier.categories || [category],
          location: supplier.location || null,
          source: "AI_DISCOVERED",
          verified: false,
        },
      });
      totalAdded++;
    }
  }

  return totalAdded;
}

export async function runBaselineScrape(
  categories: string[],
  location?: string
) {
  const results: Record<string, number> = {};

  for (const category of categories) {
    const count = await discoverSuppliers(category, location);
    results[category] = count;
  }

  return results;
}
