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
    managerName: "Salomón Bautista",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Sean Henry",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts: "Paul Henry — Co-owner, manages Austin operations. Salomón Bautista — General Manager. Devin Victoria Perez — Shop Manager & Austin City Coordinator (7 yrs tenure).",
    notes: "Founded 2010 by Sean Henry. Also has Dallas presence. Paul Henry (Sean's brother) co-owns and manages Austin side.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Frost Downtown", address: "401 Congress Ave, Ste 100C", city: "Austin", state: "TX", zip: "78701", phone: "(512) 394-6051", managerName: "Devin Victoria Perez", notes: "Mon-Fri 6:30am-7pm, Sat-Sun 7am-5pm. Devin is Shop Manager & Austin City Coordinator." },
      { name: "North Lamar (HQ)", address: "4200 N Lamar Blvd, Ste 120", city: "Austin", state: "TX", zip: "78756", phone: "(512) 531-9417", managerName: "Salomón Bautista", notes: "Daily 6:30am-7pm. Corporate office co-located here. Salomón is General Manager." },
      { name: "Rock Rose", address: "11501 Rock Rose, Ste 118", city: "Austin", state: "TX", zip: "78758", phone: "(512) 243-7963", notes: "Daily 7am-9pm. Domain NORTHSIDE area." },
      { name: "East MLK", address: "2823 E MLK Jr Blvd, Ste 101", city: "Austin", state: "TX", zip: "78702", phone: "(512) 243-8902", notes: "Mon-Fri 7am-9pm, Sat-Sun 7am-7pm. Coffee + cocktails." },
      { name: "Laurel", address: "2001 Ed Bluestein Blvd", city: "Austin", state: "TX", zip: "78721", phone: "(512) 220-2723", notes: "Daily 7am-6pm." },
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
    additionalContacts: "Scott Jones — Director of Coffee & Wholesale (key B2B contact). Carley McCarra — Digital Marketing Manager. Kendrick Russell — Photo & Barista.",
    notes: "Founded 2014 by Chris O'Brien (also head roaster). Known for mascot Butters, a pygmy goat. All locations daily 8am-3pm. Small team ~10 people — Scott Jones is the best wholesale/B2B contact.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Cuernavaca (Original)", address: "704 Cuernavaca Dr N", city: "Austin", state: "TX", zip: "78733", phone: "(512) 792-9929", managerName: "Scott Jones", notes: "Daily 8am-3pm. Original location, West Austin. Scott Jones oversees wholesale from here." },
      { name: "Guadalupe (Guad Shop)", address: "3423 Guadalupe St", city: "Austin", state: "TX", zip: "78705", phone: "(512) 792-9929", notes: "Daily 8am-3pm. Near UT campus, high foot traffic." },
      { name: "Manor (East Austin)", address: "2610 Manor Rd", city: "Austin", state: "TX", zip: "78722", phone: "(512) 792-9929", notes: "Daily 8am-3pm. East Austin location." },
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
    managerName: "Danesha Toro",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Michael Vaclav",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts: "Danesha Toro — General Manager. Janelle Whitehead — Assistant Manager (since 2016). Katherine Hallett — Office Manager. Co-founder: Alison Vaclav. Also operates as Medici Roasting. ~20 employees total.",
    notes: "Founded 2006 by Michael & Alison Vaclav. Focus on direct trade, single-origin coffees. Individual store managers report to Retail Operations Manager / COO.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Austonian (Downtown)", address: "200 Congress Ave #B", city: "Austin", state: "TX", zip: "78701", phone: "(512) 524-5049", managerName: "Janelle Whitehead", notes: "Janelle Whitehead — Assistant Manager (since Oct 2016). One of downtown's busiest specialty coffee shops." },
      { name: "South Lamar", address: "1100 South Lamar Blvd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 445-7212" },
      { name: "West Lynn", address: "1101 West Lynn", city: "Austin", state: "TX", zip: "78703", phone: "(512) 524-5049", notes: "Original location, opened 2006." },
      { name: "Guadalupe", address: "2222B Guadalupe St", city: "Austin", state: "TX", zip: "78705", phone: "(512) 474-5730", notes: "Near UT campus." },
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
    additionalContacts: "Katie Well — VP Retail Cafés. Charlie Paulette — VP Sales & Marketing (charlie@meritcoffee.com). Kyu Lee — Director of Cafe Operations & New Store Openings. John Euscher — Austin Area Trainer. 14 total TX locations.",
    notes: "Founded 2009, family-owned. Each Austin café has a named café manager. Katie Well and Kyu Lee are key corporate contacts for store-level decisions.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "Triangle", address: "4615 N. Lamar Blvd, Ste 303A", city: "Austin", state: "TX", zip: "78756", phone: "(737) 212-0429", managerName: "Zack Ritchie", notes: "Café Manager: Zack Ritchie." },
      { name: "South Lamar", address: "1105 S. Lamar Blvd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 906-0010", managerName: "Mason Parker", notes: "Café Manager: Mason Parker." },
      { name: "Seaholm", address: "222 West Ave, Ste 120", city: "Austin", state: "TX", zip: "78701", phone: "(512) 906-0266", managerName: "Sean Fleck", notes: "Café Manager: Sean Fleck. Operating since 2017." },
      { name: "Mueller", address: "1900 Aldrich St", city: "Austin", state: "TX", zip: "78723", notes: "Opened February 2026. Newest Austin location. Manager TBD." },
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
    generalPhone: "(512) 852-2300",
    generalEmail: "Info@JosCoffee.com",
    managerName: "Chuck Wylie",
    managerEmail: null,
    managerPhone: null,
    ceoName: "Liz Lambert",
    ceoEmail: null,
    ceoPhone: null,
    additionalContacts: "Chuck Wylie — General Manager (since 2015). JP Gutierrez — Operations contact (jp.gutierrez@bunkhousegroup.com, (512) 852-2300). Catering: Catering@JosCoffeeTX.com. Press: Bunkhouse@m18pr.com. Marketing & Comms Director: (512) 852-2331.",
    notes: "Founded 1999. Part of Bunkhouse Group (Liz Lambert — Founder & CCO). Each location has a dedicated email for direct contact. JP Gutierrez is the key operations contact.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "South Congress (Flagship)", address: "1300 South Congress Ave", city: "Austin", state: "TX", zip: "78704", managerEmail: "SouthCongress@JosCoffee.com", notes: "Flagship location. Home of the 'I love you so much' mural." },
      { name: "West Campus", address: "701 W 24th St", city: "Austin", state: "TX", zip: "78705", managerEmail: "WestCampus@JosCoffeeTX.com", notes: "Near UT campus." },
      { name: "Downtown", address: "242 West 2nd St", city: "Austin", state: "TX", zip: "78701", managerEmail: "Downtown@JosCoffeeTX.com" },
      { name: "Symphony Square", address: "1102 Sabine St", city: "Austin", state: "TX", zip: "78701", managerEmail: "Symphony@JosCoffeeTX.com" },
      { name: "6th & Lavaca", address: "221 W 6th St", city: "Austin", state: "TX", zip: "78701" },
      { name: "Red River", address: "1000 East 41st St", city: "Austin", state: "TX", zip: "78751", managerEmail: "RedRiver@JosCoffeeTX.com" },
      { name: "South Austin (Menchaca)", address: "South Austin area", city: "Austin", state: "TX", managerEmail: "SouthAustin@JosCoffeeTX.com" },
      { name: "Houston Heights", address: "1023 Studewood St", city: "Houston", state: "TX", zip: "77008", managerEmail: "HoustonHeights@JosCoffeeTX.com", notes: "Only non-Austin location." },
      { name: "Children's Hospital", address: "Dell Children's Medical Center", city: "Austin", state: "TX" },
      { name: "Airport (AUS)", address: "Austin-Bergstrom International Airport", city: "Austin", state: "TX", zip: "78719", managerEmail: "Airport@JosCoffee.com" },
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
    additionalContacts: "3 owner-proprietors manage all locations: Craig Staley (CEO, craig@royalbluegrocery.com), George Scariano (george@royalbluegrocery.com), Jessica Provost (jessica@royalbluegrocery.com, oversees SA). Catering: catering@royalbluegrocery.com. Jobs: austinjobs@royalbluegrocery.com.",
    notes: "Owner-managed at every location — no separate store managers. Craig & George oversee Austin, Jessica oversees San Antonio. Best approach: contact Craig (CEO) or George directly.",
    status: "PROSPECT",
    priority: "HIGH",
    locations: [
      { name: "3rd Street", address: "241 West 3rd St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 499-3993", managerName: "Craig Staley / George Scariano", managerEmail: "craig@royalbluegrocery.com" },
      { name: "Rainey Street", address: "51 Rainey St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 480-0061", managerName: "Craig Staley / George Scariano", managerEmail: "george@royalbluegrocery.com" },
      { name: "4th & Nueces", address: "360 Nueces St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 476-5700", managerName: "Craig Staley / George Scariano", managerEmail: "craig@royalbluegrocery.com" },
      { name: "Eastside", address: "1629 E. 6th St", city: "Austin", state: "TX", zip: "78702", phone: "(512) 524-0740", managerName: "Craig Staley / George Scariano", managerEmail: "george@royalbluegrocery.com" },
      { name: "3rd & Brazos", address: "301 Brazos St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 386-1617", managerName: "Craig Staley / George Scariano", managerEmail: "craig@royalbluegrocery.com" },
      { name: "The Quincy", address: "91 Red River St", city: "Austin", state: "TX", zip: "78701", phone: "(512) 220-0475", managerName: "Craig Staley / George Scariano", managerEmail: "george@royalbluegrocery.com" },
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
    notes: "CLOSED April 2025 — owner Bill Thom retired after 18 years. All 3 locations acquired by new ownership. Contact Bill Thom for referrals to new operators.",
    status: "PROSPECT",
    priority: "LOW",
    locations: [
      { name: "Barton Springs", address: "1418 Barton Springs Rd", city: "Austin", state: "TX", zip: "78704", phone: "(512) 479-9800", notes: "Now Austin's Select Market (since April 2025). New ownership — contact for updated manager info." },
      { name: "Riverside", address: "160 E. Riverside Dr", city: "Austin", state: "TX", zip: "78704", phone: "(512) 448-3333", notes: "Now Austin's Select Market (since April 2025). New ownership — contact for updated manager info." },
      { name: "Burnet Road", address: "5901 Burnet Rd", city: "Austin", state: "TX", zip: "78756", phone: "(512) 992-0808", notes: "Now Burnet Market (since April 2025). New ownership — contact for updated manager info." },
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
    additionalContacts: "Roy Perez — District Manager (oversees all 3 locations), 30+ years retail experience. Contact form on website allows selecting specific store. Departments at each location: bakery, taqueria, produce, grocery, butcher.",
    notes: "HQ in Kyle, TX area. Roy Perez is the key contact as District Manager for all locations. No publicly listed individual store managers — reach Roy or use website contact form per-location.",
    status: "PROSPECT",
    priority: "MEDIUM",
    locations: [
      { name: "Airport", address: "1144 Airport Blvd", city: "Austin", state: "TX", zip: "78702", phone: "(512) 383-5400", managerName: "Roy Perez (District Mgr)", notes: "Contact via website form or main phone. Roy Perez oversees all locations." },
      { name: "Ben White", address: "611 W Ben White Blvd", city: "Austin", state: "TX", zip: "78704", managerName: "Roy Perez (District Mgr)", notes: "Contact via website form. Roy Perez oversees all locations." },
      { name: "Cameron", address: "6305 Cameron Rd", city: "Austin", state: "TX", zip: "78723", managerName: "Roy Perez (District Mgr)", notes: "Contact via website form. Roy Perez oversees all locations." },
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
    additionalContacts: "Erin Thompson — CEO & Co-Founder ('Chief Bowl Officer'). Kara Jordan — Co-Founder. Grant Gerthoffer — COO (since Jan 2021). Parent company: Bowls, Inc. HQ in West Lake Hills. ~17 employees total.",
    notes: "Founded 2011 by Erin Thompson & Kara Jordan (started as food truck). Known as 'Austin's Best Acai'. Also sell packaged smoothie bowls in grocery stores. Small company — Grant Gerthoffer (COO) is the best operational contact.",
    status: "PROSPECT",
    priority: "MEDIUM",
    locations: [
      { name: "Eastside", address: "1625 E 6th St", city: "Austin", state: "TX", zip: "78702", phone: "(512) 524-0243", managerName: "Grant Gerthoffer (COO)", notes: "Grant Gerthoffer oversees all locations as COO." },
      { name: "Westlake", address: "3736 Bee Cave Rd #8", city: "Austin", state: "TX", zip: "78746", phone: "(512) 584-8800", managerName: "Grant Gerthoffer (COO)", notes: "Near corporate HQ in West Lake Hills." },
      { name: "North Lamar", address: "4200 N Lamar Blvd", city: "Austin", state: "TX", zip: "78756", phone: "(512) 551-3449", managerName: "Grant Gerthoffer (COO)" },
    ],
  },
];

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const existing = await prisma.lead.count();
    if (existing > 0 && !force) {
      return NextResponse.json(
        { message: `${existing} leads already exist. Use "Re-seed" to replace them with updated data.` },
        { status: 409 }
      );
    }

    if (existing > 0) {
      await prisma.leadLocation.deleteMany({});
      await prisma.lead.deleteMany({});
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

    const totalLocations = AUSTIN_LEADS.reduce((sum, l) => sum + l.locations.length, 0);
    return NextResponse.json({
      message: `Seeded ${count} leads with ${totalLocations} individual locations.`,
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
