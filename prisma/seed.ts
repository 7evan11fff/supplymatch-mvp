import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedSuppliers = [
  {
    name: "US Foods",
    industry: "Food & Beverage Distribution",
    location: "Nationwide US",
    website: "https://www.usfoods.com",
    description:
      "One of the largest foodservice distributors in the US, serving restaurants, healthcare, hospitality, and more.",
    categories: ["Food & Beverage", "Restaurant Supplies", "Kitchen Equipment"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Sysco",
    industry: "Food & Beverage Distribution",
    location: "Nationwide US",
    website: "https://www.sysco.com",
    description:
      "Global leader in foodservice distribution, offering products from fresh produce to kitchen equipment.",
    categories: ["Food & Beverage", "Restaurant Supplies", "Cleaning Supplies"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Uline",
    industry: "Packaging & Shipping Supplies",
    location: "Nationwide US",
    website: "https://www.uline.com",
    description:
      "Leading distributor of shipping, industrial, and packaging materials across North America.",
    categories: ["Packaging", "Shipping Supplies", "Safety / PPE", "Cleaning Supplies"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Grainger",
    industry: "Industrial Supplies",
    location: "Nationwide US",
    website: "https://www.grainger.com",
    description:
      "Major distributor of maintenance, repair, and operations supplies for commercial and industrial use.",
    categories: ["Equipment", "Safety / PPE", "Cleaning Supplies", "Tools"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Staples Business Advantage",
    industry: "Office Supplies",
    location: "Nationwide US",
    website: "https://www.staples.com",
    description:
      "B2B office supply solutions including technology, furniture, and breakroom supplies.",
    categories: ["Office Supplies", "Technology", "Furniture"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "HD Supply",
    industry: "Facilities Maintenance",
    location: "Nationwide US",
    website: "https://www.hdsupply.com",
    description:
      "Industrial distribution company providing facilities maintenance, construction, and waterworks products.",
    categories: ["Construction", "Cleaning Supplies", "Equipment"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Fastenal",
    industry: "Industrial & Construction",
    location: "Nationwide US",
    website: "https://www.fastenal.com",
    description:
      "Distributor of industrial and construction supplies, including fasteners, tools, and safety products.",
    categories: ["Construction", "Safety / PPE", "Tools", "Raw Materials"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Restaurant Depot",
    industry: "Restaurant Supplies",
    location: "Nationwide US",
    website: "https://www.restaurantdepot.com",
    description:
      "Wholesale cash-and-carry foodservice supplier for restaurants and other food establishments.",
    categories: ["Food & Beverage", "Restaurant Supplies", "Kitchen Equipment"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Sally Beauty",
    industry: "Beauty & Salon Supplies",
    location: "Nationwide US",
    website: "https://www.sallybeauty.com",
    description:
      "Largest distributor of professional beauty supplies, serving salons and beauty professionals.",
    categories: ["Beauty Supplies", "Salon Equipment"],
    source: "MANUAL" as const,
    verified: true,
  },
  {
    name: "Henry Schein",
    industry: "Healthcare Supplies",
    location: "Nationwide US",
    website: "https://www.henryschein.com",
    description:
      "Provider of healthcare products and services to dental, medical, and veterinary professionals.",
    categories: ["Healthcare", "Medical Supplies", "Equipment"],
    source: "MANUAL" as const,
    verified: true,
  },
];

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@supplymatch.com" },
    update: {},
    create: {
      email: "admin@supplymatch.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin user created: admin@supplymatch.com / admin123");

  for (const supplier of seedSuppliers) {
    await prisma.supplier.create({ data: supplier });
  }
  console.log(`Seeded ${seedSuppliers.length} suppliers`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
