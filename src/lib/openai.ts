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
