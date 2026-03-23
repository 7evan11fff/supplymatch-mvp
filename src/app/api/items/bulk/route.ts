import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { openai } from "@/lib/openai";

export const maxDuration = 60;

async function getBusinessId() {
  const session = await requireBusiness();
  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  });
  if (!business) throw new Error("Business not found");
  return business.id;
}

export async function POST(request: Request) {
  try {
    const businessId = await getBusinessId();
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Please provide item descriptions" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a procurement data parser. The user will provide a free-text list of items their business purchases. Parse each item into structured data.

Return JSON:
{
  "items": [
    {
      "name": "short item name",
      "category": "one of: Office Supplies, Food & Beverage, Packaging, Raw Materials, Cleaning Supplies, Equipment, Technology, Furniture, Safety / PPE, Marketing / Print, Other",
      "description": "brief description if details were provided, or null",
      "estimatedQuantity": "quantity if mentioned, or null",
      "purchaseFrequency": "frequency if mentioned (e.g. Weekly, Monthly, Quarterly), or null",
      "specifications": "any specs, brand preferences, or quality notes mentioned, or null"
    }
  ]
}

Rules:
- Split combined items into separate entries (e.g. "paper towels and trash bags" becomes two items)
- Infer the category from context
- Keep names concise but specific
- Preserve any quantity, frequency, or specification details the user mentioned`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(
      response.choices[0].message.content || '{"items":[]}'
    );

    const created = [];
    for (const item of parsed.items || []) {
      const record = await prisma.businessItem.create({
        data: {
          businessId,
          name: item.name,
          category: item.category || "Other",
          description: item.description || null,
          estimatedQuantity: item.estimatedQuantity || null,
          purchaseFrequency: item.purchaseFrequency || null,
          specifications: item.specifications || null,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      count: created.length,
      items: created,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to import items" },
      { status: 500 }
    );
  }
}
