import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

interface LocationSeed {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  notes?: string;
}

interface LeadSeed {
  businessName: string;
  website: string | null;
  industry: string;
  isFranchise: boolean;
  locationCount: number;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  generalPhone: string | null;
  generalEmail: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  ceoPhone: string | null;
  additionalContacts: string | null;
  notes: string | null;
  status: "PROSPECT" | "CONTACTED" | "NEGOTIATING" | "CONVERTED" | "LOST";
  priority: "HIGH" | "MEDIUM" | "LOW";
  locations: LocationSeed[];
}

const AUSTIN_LEADS: LeadSeed[] = [
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
    additionalContacts: null,
    notes: "Founded 2010 by Sean Henry. Paul Henry (Sean's brother) manages Austin operations. Also has Dallas presence.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Frost Downtown", address: "401 Congress Ave, Ste 100C", city: "Austin", state: "TX", zip: "78701", phone: "(512) 394-6051", notes: "Mon-Fri 6:30am-7pm, Sat-Sun 7am-5pm" },
      { name: "North Lamar", address: "4200 N Lamar Blvd, Ste 120", city: "Austin", state: "TX", zip: "78756", phone: "(512) 531-9417", notes: "Daily 6:30am-7pm" },
      { name: "Rock Rose", address: "11501 Rock Rose, Ste 118", city: "Austin", state: "TX", zip: "78758", phone: "(512) 243-7963", notes: "Daily 7am-9pm" },
      { name: "East MLK", address: "2823 E MLK Jr Blvd, Ste 101", city: "Austin", state: "TX", zip: "78702", phone: "(512) 243-8902", notes: "Mon-Fri 7am-9pm, Sat-Sun 7am-7pm" },
      { name: "Laurel", address: "2001 Ed Bluestein Blvd", city: "Austin", state: "TX", zip: "78721", phone: "(512) 220-2723", notes: "Daily 7am-6pm" },
    ],
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
    additionalContacts: "Scott Jones — Director of Coffee & Wholesale. Carley McCarra — Digital Marketing Manager.",
    notes: "Founder Chris O'Brien is also head roaster. Known for mascot Butters, a pygmy goat. All locations open daily 8am-3pm.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Cuernavaca", address: "704 Cuernavaca Dr N", city: "Austin", state: "TX", zip: "78733", phone: "(512) 792-9929", notes: "Daily 8am-3pm. Original location." },
      { name: "Guadalupe", address: "3423 Guadalupe St", city: "Austin", state: "TX", zip: "78705", phone: "(512) 792-9929", notes: "Daily 8am-3pm. Near UT campus." },
      { name: "Manor", address: "2610 Manor Rd", city: "Austin", state: "TX", zip: "78722", phone: "(512) 792-9929", notes: "Daily 8am-3pm. East Austin location." },
    ],
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
    additionalContacts: "Co-founder: Alison Vaclav. Also operates as Medici Roasting.",
    notes: "Founded 2006 by Michael & Alison Vaclav. Focus on direct trade, single-origin coffees.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Austonian (Downtown)", address: "200 Congress Ave #B", city: "Austin", state: "TX", zip: "78701", phone: "(512) 524-5049" },
      { name: "South Lamar", address: "1100 South Lamar Blvd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 445-7212" },
      { name: "West Lynn", address: "1101 West Lynn", city: "Austin", state: "TX", zip: "78703", phone: "(512) 524-5049" },
      { name: "Guadalupe", address: "2222B Guadalupe St", city: "Austin", state: "TX", zip: "78705", phone: "(512) 474-5730" },
      { name: "8th & Congress", address: "804 Congress Ave, Ste 101", city: "Austin", state: "TX", zip: "78701", phone: "(512) 762-6403" },
    ],
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
    additionalContacts: "Charlie Paulette — media/business contact. 14 total TX locations across San Antonio, Austin, Dallas.",
    notes: "Founded 2009, family-owned. Newest Mueller location opened Feb 2026.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Triangle", address: "4615 N. Lamar Blvd, Ste 303A", city: "Austin", state: "TX", zip: "78756", phone: "(737) 212-0429" },
      { name: "South Lamar", address: "1105 S. Lamar Blvd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 906-0010" },
      { name: "Seaholm", address: "222 West Ave, Ste 120", city: "Austin", state: "TX", zip: "78701", phone: "(512) 906-0266" },
      { name: "Mueller", address: "1900 Aldrich St", city: "Austin", state: "TX", zip: "78723", phone: null, notes: "Opened February 2026. Newest Austin location." },
    ],
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
    additionalContacts: "Operated under Bunkhouse Group (Liz Lambert — Founder & Chief Creative Officer). Catering: Catering@JosCoffeeTX.com.",
    notes: "Founded 1999. Part of Bunkhouse Group hospitality company. Chuck Wylie is GM since 2015.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "South Congress", address: "1300 South Congress Ave", city: "Austin", state: "TX", zip: "78704", notes: "Flagship location. Home of the 'I love you so much' mural." },
      { name: "West Campus", address: "701 W 24th St", city: "Austin", state: "TX", zip: "78705" },
      { name: "Downtown", address: "242 West 2nd St", city: "Austin", state: "TX", zip: "78701" },
      { name: "Symphony Square", address: "1102 Sabine St", city: "Austin", state: "TX", zip: "78701" },
      { name: "6th & Lavaca", address: "221 W 6th St", city: "Austin", state: "TX", zip: "78701" },
      { name: "Red River", address: "1000 East 41st St", city: "Austin", state: "TX", zip: "78751" },
      { name: "South Austin (Menchaca)", address: "South Austin area", city: "Austin", state: "TX" },
      { name: "Houston Heights", address: "1023 Studewood St", city: "Houston", state: "TX", zip: "77008", notes: "Only non-Austin location." },
      { name: "Children's Hospital", address: "Dell Children's Medical Center", city: "Austin", state: "TX" },
      { name: "Airport (AUS)", address: "Austin-Bergstrom International Airport", city: "Austin", state: "TX", zip: "78719" },
    ],
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
    additionalContacts: "Jessica Provost — Owner/Proprietor, oversees San Antonio (jessica@royalbluegrocery.com). Catering: catering@royalbluegrocery.com.",
    notes: "3 owner-proprietors: Craig Staley (CEO), George Scariano, Jessica Provost.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "3rd Street", address: "241 West 3rd St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 499-3993" },
      { name: "Rainey Street", address: "51 Rainey St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 480-0061" },
      { name: "4th & Nueces", address: "360 Nueces St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 476-5700" },
      { name: "Eastside", address: "1629 E. 6th St", city: "Austin", state: "TX", zip: "78702", phone: "(512) 524-0740" },
      { name: "3rd & Brazos", address: "301 Brazos St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 386-1617" },
      { name: "The Quincy", address: "91 Red River St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 220-0475" },
      { name: "San Antonio", address: "122 E Houston St, Ste 101", city: "San Antonio", state: "TX", zip: "78205", managerName: "Jessica Provost", managerEmail: "jessica@royalbluegrocery.com", notes: "Overseen by owner-proprietor Jessica Provost." },
    ],
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
    additionalContacts: null,
    notes: "CLOSED April 2025 — owner Bill Thom retired after 18 years. Locations acquired by Austin's Select Market / Burnet Market. May still be useful for referrals or contacting new ownership.",
    status: "PROSPECT",
    priority: "LOW",
    locations: [
      { name: "Barton Springs", address: "1418 Barton Springs Rd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 479-9800", notes: "Now operated as Austin's Select Market (since April 2025)." },
      { name: "Riverside", address: "160 E. Riverside Dr", city: "Austin", state: "TX", zip: "78704", phone: "(512) 448-3333", notes: "Now operated as Austin's Select Market (since April 2025)." },
      { name: "Burnet Road", address: "5901 Burnet Rd", city: "Austin", state: "TX", zip: "78756", phone: "(512) 992-0808", notes: "Now operated as Burnet Market (since April 2025)." },
    ],
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
    additionalContacts: "Roy Perez — District Manager, 30+ years retail experience.",
    notes: "Company HQ appears to be in Kyle, TX area. Serves the Austin metro Hispanic grocery market.",
    status: "PROSPECT",
    priority: "MEDIUM",
    locations: [
      { name: "Airport", address: "1144 Airport Blvd", city: "Austin", state: "TX", zip: "78702", phone: "(512) 383-5400" },
      { name: "Ben White", address: "611 W Ben White Blvd", city: "Austin", state: "TX", zip: "78704" },
      { name: "Cameron", address: "6305 Cameron Rd", city: "Austin", state: "TX", zip: "78723" },
    ],
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
    additionalContacts: "Erin Thompson — CEO & Co-Founder. Kara Jordan — Co-Founder. Grant Gerthoffer — COO. Parent company: Bowls, Inc.",
    notes: "Founded 2011 by Erin Thompson & Kara Jordan (started as food truck). Known as 'Austin's Best Acai'. Also sell packaged smoothie bowls in grocery stores.",
    status: "PROSPECT",
    priority: "MEDIUM",
    locations: [
      { name: "Eastside", address: "1625 E 6th St", city: "Austin", state: "TX", zip: "78702", phone: "(512) 524-0243" },
      { name: "Westlake", address: "3736 Bee Cave Rd #8", city: "Austin", state: "TX", zip: "78746", phone: "(512) 584-8800" },
      { name: "North Lamar", address: "4200 N Lamar Blvd", city: "Austin", state: "TX", zip: "78756", phone: "(512) 551-3449" },
    ],
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

    let count = 0;
    for (const { locations, ...leadData } of AUSTIN_LEADS) {
      await prisma.lead.create({
        data: {
          ...leadData,
          locations: {
            create: locations.map((loc) => ({
              name: loc.name,
              address: loc.address ?? null,
              city: loc.city ?? "Austin",
              state: loc.state ?? "TX",
              zip: loc.zip ?? null,
              phone: loc.phone ?? null,
              managerName: loc.managerName ?? null,
              managerEmail: loc.managerEmail ?? null,
              managerPhone: loc.managerPhone ?? null,
              notes: loc.notes ?? null,
            })),
          },
        },
      });
      count++;
    }

    return NextResponse.json({
      message: `Seeded ${count} Austin-area B2B leads with individual location data.`,
      count,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Failed to seed leads" },
      { status: 500 }
    );
  }
}
