import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeBusinessNeeds(business: {
  name: string;
  industry: string;
  location: string;
  description: string;
  operatingDetails: Record<string, string> | null;
  items: Array<{
    name: string;
    category: string;
    description: string | null;
    estimatedQuantity: string | null;
    purchaseFrequency: string | null;
    specifications: string | null;
  }>;
}) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a B2B procurement analyst. Analyze the business profile and their purchasing needs. 
Produce a concise summary that covers:
1. Business overview and key needs
2. Supply categories they require
3. Volume and frequency patterns
4. Any special requirements or preferences
5. Recommended supplier characteristics

Return JSON with this structure:
{
  "summary": "2-3 paragraph overview",
  "categories": ["list of supply categories needed"],
  "keyRequirements": ["list of key requirements"],
  "supplierCriteria": ["what to look for in suppliers"],
  "searchQueries": ["suggested search terms to find relevant suppliers"]
}`,
      },
      {
        role: "user",
        content: JSON.stringify(business, null, 2),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function batchScoreSuppliers(
  businessSummary: string,
  businessItems: Array<{ name: string; category: string; specifications: string | null }>,
  suppliers: Array<{
    id: string;
    name: string;
    industry: string | null;
    description: string | null;
    categories: unknown;
    location: string | null;
  }>
) {
  const supplierList = suppliers.map((s, i) => ({
    index: i,
    id: s.id,
    name: s.name,
    industry: s.industry,
    description: s.description,
    categories: s.categories,
    location: s.location,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a B2B procurement matchmaker. You will receive a business summary, the items they need, and a list of potential suppliers. Score EACH supplier on how well they match this business's needs.

Return JSON:
{
  "scores": [
    {
      "index": <supplier index from the list>,
      "score": <0-100 integer>,
      "reasoning": "2-3 sentences explaining the score",
      "strengths": ["supplier strengths for this business"],
      "gaps": ["potential gaps or concerns"]
    }
  ]
}

Score ALL suppliers in the list. Be selective — only give high scores (70+) to genuinely strong matches.`,
      },
      {
        role: "user",
        content: `Business Summary: ${businessSummary}

Items needed: ${JSON.stringify(businessItems)}

Suppliers to score:
${JSON.stringify(supplierList, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const result = JSON.parse(response.choices[0].message.content || '{"scores":[]}');
  return (result.scores || []) as Array<{
    index: number;
    score: number;
    reasoning: string;
    strengths: string[];
    gaps: string[];
  }>;
}

export async function checkSupplierAvailability(
  supplier: {
    name: string;
    industry: string | null;
    description: string | null;
    categories: unknown;
    website: string | null;
    location: string | null;
  },
  items: Array<{ name: string; category: string; description: string | null }>
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a B2B procurement expert. Given a supplier's profile and a list of items a business wants to buy, determine which items this supplier likely sells/carries and which they do not.

Consider the supplier's industry, description, and categories to make your assessment. Be realistic — if a supplier specializes in food & beverage, they probably don't sell office furniture.

Return JSON:
{
  "results": [
    {
      "name": "item name exactly as provided",
      "available": true or false,
      "confidence": "high" | "medium" | "low",
      "reason": "Brief explanation of why available or not"
    }
  ]
}

Return a result for EVERY item in the list.`,
      },
      {
        role: "user",
        content: `Supplier Profile:
${JSON.stringify(supplier, null, 2)}

Items to check:
${JSON.stringify(items, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const result = JSON.parse(response.choices[0].message.content || '{"results":[]}');
  return (result.results || []) as Array<{
    name: string;
    available: boolean;
    confidence: string;
    reason: string;
  }>;
}

export async function priceQuoteItems(
  supplier: {
    name: string;
    website: string | null;
    industry: string | null;
    description: string | null;
    location: string | null;
  },
  items: Array<{ name: string; description: string | null; quantity: number; unit: string | null }>
) {
  const itemNames = items.map((i) => i.name).join(", ");
  const searchQuery = supplier.website
    ? `${supplier.name} ${supplier.website} wholesale pricing for ${itemNames}`
    : `${supplier.name} B2B wholesale pricing for ${itemNames}`;

  let webContext = "";
  try {
    const searchResponse = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: searchQuery,
    });
    webContext = searchResponse.output_text || "";
  } catch {
    webContext = "";
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a B2B pricing analyst. You will receive a supplier profile, a list of items with quantities, and optionally web search results about the supplier's pricing.

Your job: estimate a realistic wholesale/B2B unit price for each item from this specific supplier.

Rules:
- If web search results contain actual pricing data, use those prices
- If no real pricing is found, estimate based on typical B2B/wholesale market rates for the item type and quantity
- Prices should be in USD
- Be realistic — consider bulk/wholesale discounts for larger quantities
- Every item MUST get a price estimate

Return JSON:
{
  "prices": [
    {
      "name": "item name exactly as provided",
      "unitPrice": <number in USD>,
      "confidence": "high" | "medium" | "low",
      "source": "web" | "estimate",
      "reasoning": "Brief note on how you arrived at this price"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Supplier: ${supplier.name}
Industry: ${supplier.industry || "Unknown"}
Description: ${supplier.description || "No description"}
Location: ${supplier.location || "Unknown"}
Website: ${supplier.website || "None"}

Items to price:
${JSON.stringify(items, null, 2)}

${webContext ? `Web search results about this supplier's pricing:\n${webContext}` : "No web pricing data found — please estimate based on market rates."}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const result = JSON.parse(response.choices[0].message.content || '{"prices":[]}');
  return (result.prices || []) as Array<{
    name: string;
    unitPrice: number;
    confidence: string;
    source: string;
    reasoning: string;
  }>;
}
