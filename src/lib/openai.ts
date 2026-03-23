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

export async function scoreSupplierMatch(
  businessSummary: string,
  businessItems: Array<{ name: string; category: string; specifications: string | null }>,
  supplier: {
    name: string;
    industry: string | null;
    description: string | null;
    categories: unknown;
    location: string | null;
  }
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a B2B procurement matchmaker. Score how well a supplier matches a business's needs.

Return JSON:
{
  "score": <0-100 integer>,
  "reasoning": "2-3 sentences explaining the score",
  "strengths": ["supplier strengths for this business"],
  "gaps": ["potential gaps or concerns"]
}`,
      },
      {
        role: "user",
        content: `Business Summary: ${businessSummary}

Items needed: ${JSON.stringify(businessItems)}

Supplier: ${JSON.stringify(supplier)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

