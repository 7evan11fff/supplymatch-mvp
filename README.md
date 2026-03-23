# SupplyMatch — B2B Supplier Matching MVP

AI-powered supplier matching platform for local small businesses. Businesses describe their needs, AI finds and scores the best suppliers, and an intermediary manages every connection.

## Tech Stack

- **Next.js 16** (App Router) — full-stack React framework
- **PostgreSQL** via Supabase (or any Postgres instance)
- **Prisma 7** — type-safe database ORM
- **NextAuth.js** — email/password authentication with role-based access
- **OpenAI GPT-4o** — business analysis, supplier scoring, gap detection
- **OpenAI Web Search** — automated supplier discovery (no separate API key needed)
- **Tailwind CSS + shadcn/ui** — modern component library
- **Vercel** — deployment target

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted, e.g. Supabase)
- OpenAI API key (powers AI analysis, matching, AND web search for supplier discovery)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret string for session encryption
- `NEXTAUTH_URL` — your app URL (http://localhost:3000 for local dev)
- `OPENAI_API_KEY` — your OpenAI API key (handles all AI features + web search)

### 3. Set up the database

```bash
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed admin user + sample suppliers
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Admin Account

After seeding:
- **Email:** admin@supplymatch.com
- **Password:** admin123

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    auth/login, signup          # Authentication
    dashboard/                  # Business user pages
      page.tsx                  # Overview with stats
      profile/                  # Business profile form
      items/                    # Purchased items management
      recommendations/          # AI supplier recommendations
    admin/                      # Admin panel
      page.tsx                  # Dashboard with metrics
      bookings/                 # Booking request management
      suppliers/                # Supplier database CRUD
    api/                        # API routes
      auth/                     # NextAuth + signup
      business/                 # Business CRUD
      items/                    # Item CRUD
      suppliers/                # Supplier CRUD + scraping
      ai/                       # Analysis + matching
      bookings/                 # Booking lifecycle
  components/
    ui/                         # shadcn/ui components
    business/                   # Business dashboard nav
    admin/                      # Admin dashboard nav
  lib/
    db.ts                       # Prisma client singleton
    auth.ts                     # NextAuth configuration
    session.ts                  # Session helpers
    openai.ts                   # OpenAI client + prompts
    scraper.ts                  # Brave Search + supplier extraction
    matching.ts                 # Full analysis + matching pipeline
```

## User Flows

1. **Business signs up** → fills profile → adds purchased items
2. **Clicks "Find Suppliers"** → AI analyzes needs → scores suppliers → discovers new ones if gaps exist
3. **Reviews recommendations** → clicks "Book Supplier" on best match
4. **Admin receives request** → reviews AI reasoning → approves → connects business with supplier
5. **Business tracks status** on their dashboard

## Deployment

Optimized for Vercel:

```bash
npm run build
```

Set environment variables in Vercel dashboard before deploying.
