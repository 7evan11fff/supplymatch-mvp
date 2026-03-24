import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const AUSTIN_LEADS = [
  {
    businessName: "Houndstooth Coffee",
    website: "https://houndstoothcoffee.com",
    industry: "Specialty Coffee",
    isFranchise: false,
    locationCount: 5,
    address: "401 Congress Ave, Ste 100C",
    city: "Austin",
    state: "TX",
    zip: "78701",
    generalPhone: "(512) 394-6051",
    generalEmail: null,
    managerName: "Paul Henry",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Sean Henry",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Locations: Frost Downtown (512) 394-6051, North Lamar (512) 531-9417, Rock Rose (512) 243-7963, East MLK (512) 243-8902, Laurel (512) 220-2723",
    notes:
      "Founded 2010 by Sean Henry. 5 Austin locations. Paul Henry (Sean's brother) manages Austin operations. Also has Dallas presence.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Civil Goat Coffee",
    website: "https://www.civilgoat.com",
    industry: "Specialty Coffee Roaster",
    isFranchise: false,
    locationCount: 3,
    address: "704 Cuernavaca Dr N",
    city: "Austin",
    state: "TX",
    zip: "78733",
    generalPhone: "(512) 792-9929",
    generalEmail: "info@civilgoats.com",
    managerName: "Scott Jones",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Chris O'Brien",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Scott Jones — Director of Coffee & Wholesale. Carley McCarra — Digital Marketing Manager. Locations: Cuernavaca, Guadalupe (3423 Guadalupe St), Manor (2610 Manor Rd).",
    notes:
      "Founder Chris O'Brien is also head roaster. Known for mascot Butters, a pygmy goat. All 3 locations open daily 8am–3pm.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Caffé Medici",
    website: "https://caffemedici.com",
    industry: "Specialty Coffee",
    isFranchise: false,
    locationCount: 5,
    address: "200 Congress Ave #B",
    city: "Austin",
    state: "TX",
    zip: "78701",
    generalPhone: "(512) 524-5049",
    generalEmail: null,
    managerName: null,
    managerEmail: null,
    managerPhone: null,
    ceoName: "Michael Vaclav",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Co-founder: Alison Vaclav. Also operates as Medici Roasting. Locations: Austonian (512) 524-5049, South Lamar (512) 445-7212, West Lynn (512) 524-5049, Guadalupe (512) 474-5730, 8th & Congress (512) 762-6403.",
    notes:
      "Founded 2006 by Michael & Alison Vaclav. Focus on direct trade, single-origin coffees. 5 Austin locations.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Merit Coffee",
    website: "https://www.meritcoffee.com",
    industry: "Specialty Coffee Roaster",
    isFranchise: false,
    locationCount: 4,
    address: "4615 N. Lamar Blvd, Ste 303A",
    city: "Austin",
    state: "TX",
    zip: "78756",
    generalPhone: "(737) 212-0429",
    generalEmail: "charlie@meritcoffee.com",
    managerName: "Charlie Paulette",
    managerEmail: "charlie@meritcoffee.com",
    managerPhone: null,
    ceoName: "Bill Ellis",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Charlie Paulette — media/business contact. 14 total TX locations (San Antonio, Austin, Dallas). Austin: Triangle (737) 212-0429, South Lamar (512) 906-0010, Seaholm (512) 906-0266, Mueller (opened Feb 2026).",
    notes:
      "Founded 2009, family-owned. 4 Austin locations, 14 total across TX. Newest Mueller location opened Feb 2026.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Jo's Coffee",
    website: "https://www.joscoffee.com",
    industry: "Coffee / Hospitality",
    isFranchise: false,
    locationCount: 10,
    address: "1711 South Congress Avenue",
    city: "Austin",
    state: "TX",
    zip: "78704",
    generalPhone: null,
    generalEmail: "Info@JosCoffee.com",
    managerName: "Chuck Wylie",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Liz Lambert",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Operated under Bunkhouse Group (Liz Lambert — Founder & Chief Creative Officer). Catering: Catering@JosCoffeeTX.com. Locations: S. Congress, West Campus, Downtown, Symphony Square, 6th & Lavaca, Red River, S. Austin Menchaca, Houston Heights, Children's Hospital, Airport.",
    notes:
      "Founded 1999. Part of Bunkhouse Group hospitality company. 10 locations, mostly Austin with one in Houston. Chuck Wylie is GM since 2015.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Royal Blue Grocery",
    website: "https://www.royalbluegrocery.com",
    industry: "Specialty Grocery / Convenience",
    isFranchise: false,
    locationCount: 7,
    address: "241 West 3rd St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    generalPhone: "(512) 499-3993",
    generalEmail: "info@royalbluegrocery.com",
    managerName: "George Scariano",
    managerEmail: "george@royalbluegrocery.com",
    managerPhone: null,
    ceoName: "Craig Staley",
    ceoEmail: "craig@royalbluegrocery.com",
    ceoPhone: "(512) 217-6710",
    additionalContacts:
      "Jessica Provost — Owner/Proprietor, oversees San Antonio (jessica@royalbluegrocery.com). Catering: catering@royalbluegrocery.com. Austin locations: 3rd St, Rainey St, 4th & Nueces, Eastside, 3rd & Brazos, The Quincy. Also 1 San Antonio location.",
    notes:
      "6 Austin locations + 1 San Antonio. 3 owner-proprietors: Craig Staley (CEO), George Scariano, Jessica Provost.",
    status: "PROSPECT" as const,
    priority: "HIGH" as const,
  },
  {
    businessName: "Thom's Market",
    website: "https://www.thomsmarket.com",
    industry: "Neighborhood Grocery",
    isFranchise: false,
    locationCount: 3,
    address: "1418 Barton Springs Rd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    generalPhone: "(512) 479-9800",
    generalEmail: "hello@thomsmarket.com",
    managerName: null,
    managerEmail: null,
    managerPhone: null,
    ceoName: "Bill Thom",
    ceoEmail: "bill@thomsmarket.com",
    ceoPhone: "(512) 619-6362",
    additionalContacts:
      "Former locations: Barton Springs (512) 479-9800, Riverside (512) 448-3333, Burnet Rd (512) 992-0808. Locations acquired by Austin's Select Market in April 2025.",
    notes:
      "CLOSED April 2025 — owner Bill Thom retired after 18 years. 3 locations acquired by Austin's Select Market / Burnet Market. May still be a contact for referrals or re-engagement under new ownership.",
    status: "PROSPECT" as const,
    priority: "LOW" as const,
  },
  {
    businessName: "Poco Loco Supermercado",
    website: "https://www.pocolocosupermercado.com",
    industry: "Grocery / Supermercado",
    isFranchise: false,
    locationCount: 3,
    address: "1144 Airport Blvd",
    city: "Austin",
    state: "TX",
    zip: "78702",
    generalPhone: "(512) 383-5400",
    generalEmail: "Admin@pocolocosupermercado.com",
    managerName: "Roy Perez",
    managerEmail: null,
    managerPhone: null,
    ceoName: null,
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Roy Perez — District Manager, 30+ years retail experience. Locations: Airport (1144 Airport Blvd), Ben White (611 W Ben White Blvd), Cameron (6305 Cameron Rd). Contact form on website for each location.",
    notes:
      "3 Austin locations. Roy Perez is district manager. Company HQ appears to be in Kyle, TX area. Serves the Austin metro Hispanic grocery market.",
    status: "PROSPECT" as const,
    priority: "MEDIUM" as const,
  },
  {
    businessName: "Blenders and Bowls",
    website: "https://www.blendersandbowls.com",
    industry: "Health Food / Smoothie Bowls",
    isFranchise: false,
    locationCount: 3,
    address: "1625 E 6th St",
    city: "Austin",
    state: "TX",
    zip: "78702",
    generalPhone: "(512) 524-0243",
    generalEmail: null,
    managerName: "Grant Gerthoffer",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Erin Thompson",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts:
      "Erin Thompson — CEO & Co-Founder. Kara Jordan — Co-Founder. Grant Gerthoffer — COO. Parent company: Bowls, Inc. Locations: Eastside (512) 524-0243, Westlake (512) 584-8800, North Lamar (512) 551-3449.",
    notes:
      "Founded 2011 by Erin Thompson & Kara Jordan (started as food truck). 3 Austin locations. Known as 'Austin's Best Acai'. Also sell packaged smoothie bowls in grocery stores via Bowls, Inc.",
    status: "PROSPECT" as const,
    priority: "MEDIUM" as const,
  },
];

export async function POST() {
  try {
    await requireAdmin();

    const existing = await prisma.lead.count();
    if (existing > 0) {
      return NextResponse.json(
        { message: `${existing} leads already exist. Delete them first to re-seed.` },
        { status: 409 }
      );
    }

    const leads = await prisma.lead.createMany({ data: AUSTIN_LEADS });

    return NextResponse.json({
      message: `Seeded ${leads.count} Austin-area B2B leads.`,
      count: leads.count,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Failed to seed leads" },
      { status: 500 }
    );
  }
}
