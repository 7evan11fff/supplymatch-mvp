# SupplyMatch — Feature Overview

## What It Is

SupplyMatch is a B2B supplier matching platform built for local small businesses. A business describes what they do and what they buy, and the AI finds the best suppliers for them. Every connection goes through a human intermediary (admin) who reviews the AI recommendation, coordinates the introduction, and manages the relationship.

---

## Platform Roles

| Role | Who | Access |
|------|-----|--------|
| **Business** | Local small business owners | Dashboard, profile, items, AI recommendations, booking requests |
| **Admin** | You (the intermediary) | Admin panel, booking queue, supplier database, discovery tools |

Roles are enforced at the middleware level — businesses cannot access `/admin` and admins are redirected away from `/dashboard`.

---

## Feature Breakdown

### 1. Landing Page (`/`)

Public marketing page that communicates the value proposition:

- Hero section with headline and primary CTA ("Get Started Free")
- Three-step "How It Works" walkthrough (Tell Us About You → AI Finds Your Match → We Handle the Rest)
- Three benefit cards (AI-Powered Matching, Human-Managed, Growing Database)
- Industry list showing supported business types (restaurants, retail, salons, construction, healthcare, cleaning, auto repair, professional services)
- Bottom CTA to create an account

### 2. Authentication (`/auth/login`, `/auth/signup`)

- Email/password sign-up creates a `BUSINESS` role account by default
- Passwords hashed with bcrypt (12 rounds)
- JWT-based sessions via NextAuth.js
- After signup, users are directed to complete their business profile
- Admin accounts are created via the database seed (not through public signup)
- Default admin credentials: `admin@supplymatch.com` / `admin123`

### 3. Business Profile (`/dashboard/profile`)

Multi-field form where businesses describe themselves:

- **Business Name** — company name
- **Industry** — dropdown with 12 options (Restaurant/Food Service, Retail, Construction, Healthcare, Manufacturing, Professional Services, Beauty/Salon, Auto Repair, Cleaning Services, Technology, Agriculture, Other)
- **Location** — city/state text field
- **Business Description** — free-text explanation of what the business does
- **Operating Details** (optional):
  - Number of employees
  - Years in business
  - Monthly supply budget

Saving the profile marks `profileComplete: true` and redirects to the items page.

### 4. Purchased Items Management (`/dashboard/items`)

Businesses add the items they regularly buy. Each item has:

- **Item Name** — e.g. "Coffee Beans", "Cleaning Solution"
- **Category** — dropdown with 11 options (Office Supplies, Food & Beverage, Packaging, Raw Materials, Cleaning Supplies, Equipment, Technology, Furniture, Safety/PPE, Marketing/Print, Other)
- **Description** — additional details about the item
- **Estimated Quantity** — e.g. "50 lbs/month"
- **Purchase Frequency** — e.g. "Weekly", "Monthly"
- **Specifications** — quality standards, brand preferences, certifications needed

Items are displayed as cards with inline delete. The more detail a business provides, the better the AI matching performs.

### 5. AI Analysis & Supplier Matching (`/dashboard/recommendations`)

This is the core feature. When a business clicks "Find Suppliers":

**Step 1 — Business Needs Analysis**
- OpenAI GPT-4o receives the full business profile and all items as structured JSON
- Returns a comprehensive analysis: summary paragraph, required supply categories, key requirements, ideal supplier characteristics, and suggested search terms

**Step 2 — Supplier Scoring**
- Every supplier in the database (up to 50) is scored against the business
- Each gets a 0–100 match score with reasoning, strengths, and potential gaps
- Only suppliers scoring 40+ are retained as candidates

**Step 3 — Gap Detection & Auto-Discovery**
- If the best match score is below 50, the AI determines there's a gap
- For up to 3 supply categories, the system automatically:
  - Generates search queries
  - Queries the Brave Search API for potential suppliers
  - Uses OpenAI to extract structured supplier data from search results
  - Saves new suppliers to the database as `AI_DISCOVERED` (unverified)
  - Re-scores the new suppliers against the business

**Step 4 — Recommendation Display**
- Top 5 matches shown ranked by score
- Each recommendation card shows:
  - Supplier name, industry, location, website link
  - Verified badge (if admin-verified)
  - "Top Match" badge on the #1 result
  - Match score (color-coded: green 80+, yellow 60+, orange below)
  - Supplier description
  - AI reasoning with strengths and gaps
  - "Book Supplier" button

The AI business summary is also displayed at the top so the business can verify the AI understood their needs correctly.

### 6. Booking Flow

When a business clicks "Book Supplier":

1. A dialog appears with an optional message field for specific requirements
2. Submitting creates a `BookingRequest` with status `PENDING_REVIEW`
3. The match status changes to `BOOKED` (preventing duplicate bookings)
4. The business sees a "Booking Requested" badge on that supplier card
5. Booking status is visible on the main dashboard

### 7. Business Dashboard (`/dashboard`)

Overview page showing:

- Welcome message with business name
- Three stat cards: Items Tracked, Supplier Matches, Active Bookings
- Recent booking requests with supplier names, dates, and color-coded status badges
- Prompt to complete profile or add items if onboarding is incomplete

### 8. Admin Dashboard (`/admin`)

The admin's command center:

- Four stat cards: Pending Bookings, Total Suppliers, Businesses, Registered Users
- Recent booking requests showing business name → supplier name, status, and date

### 9. Admin Booking Queue (`/admin/bookings`)

Full booking management with tabbed filtering:

- **Pending** — new requests awaiting review (count shown in tab)
- **Approved** — reviewed and accepted
- **Connected** — business and supplier have been introduced
- **Completed** — deal finalized
- **All** — everything

Each booking card shows:
- Business name → Supplier name
- Contact email, industry, match score
- Business message (if provided)
- Quick-action buttons based on current status (Approve, Cancel, Mark Connected, Mark Completed)
- Link to detail view

### 10. Admin Booking Detail (`/admin/bookings/[id]`)

Deep-dive view for a single booking request:

- **Business card** — name, contact email/name, location, description
- **Supplier card** — name, industry, location, website, contact info, description
- **AI Match Analysis** — match score, business needs summary, full match reasoning
- **Business Message** — what the business wrote when booking
- **Admin Notes** — private text area (not visible to the business) for internal tracking
- **Actions** — status transition buttons matching the booking lifecycle

### 11. Admin Supplier Management (`/admin/suppliers`)

Full CRUD interface for the supplier database:

- **Search** — real-time text search across name, industry, description
- **Add Supplier** — dialog form with name, industry, location, website, contact info, description, categories (comma-separated), verified checkbox
- **Edit Supplier** — same form pre-filled with existing data
- **Delete Supplier** — with confirmation
- **Verify/Unverify Toggle** — one-click verification status
- **Source Badge** — shows whether supplier is `MANUAL`, `SCRAPED`, or `AI_DISCOVERED`
- **Category Tags** — displayed as badges on each supplier card

### 12. Supplier Discovery (`/admin/suppliers` → "Discover Suppliers")

Admin-triggered bulk supplier search:

- Uses OpenAI's built-in web search across 12 default categories:
  Office Supplies, Food & Beverage, Packaging, Raw Materials, Cleaning Supplies, Equipment, Safety PPE, Restaurant Supplies, Beauty Salon Supplies, Healthcare Medical Supplies, Construction Materials, Technology IT
- For each category, OpenAI searches the web and extracts structured supplier records
- Deduplicates against existing suppliers by name and website
- New suppliers saved as `AI_DISCOVERED`, `verified: false`
- Returns count of new suppliers found

---

## Seed Data

The database ships with:

- **1 Admin user**: `admin@supplymatch.com` / `admin123`
- **10 Pre-verified suppliers**: US Foods, Sysco, Uline, Grainger, Staples Business Advantage, HD Supply, Fastenal, Restaurant Depot, Sally Beauty, Henry Schein — covering food service, industrial, office, construction, beauty, and healthcare supply categories

---

## Booking Lifecycle

```
Business clicks "Book Supplier"
        │
        ▼
  PENDING_REVIEW ──── Admin reviews AI recommendation
        │               + business details + supplier info
        ▼
    APPROVED ────────── Admin accepts the match
        │
        ▼
    CONNECTED ───────── Admin has introduced both parties
        │
        ▼
    COMPLETED ───────── Deal is finalized
```

At any point, admin can also move a booking to `CANCELLED`.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (via Supabase or local) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js v4 (credentials, JWT sessions) |
| AI | OpenAI GPT-4o (analysis, scoring, extraction) |
| Web Search | OpenAI built-in web search (supplier discovery) |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) |
| Icons | Lucide React |
| Toasts | Sonner |
| Deployment | Vercel-ready |

---

## Getting Started

```bash
# Install
npm install

# Configure
cp .env.example .env
# Fill in DATABASE_URL and OPENAI_API_KEY

# Database
npm run db:push
npm run db:generate
npm run db:seed

# Run
npm run dev
# → http://localhost:3000
```
