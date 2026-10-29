# SolarGuide ET (የኢትዮጵያ የሶላር ማስያ)

**Live Demo:** [https://solarguide-et.vercel.app](https://solarguide-et.vercel.app)

SolarGuide ET is a mobile-first, bilingual (**Amharic / አማርኛ** and **English**) solar sizing, battery storage, and cost estimator built for households, small shops, and health clinics across Ethiopia.

---

## The Problem

Across Ethiopia, frequent grid power outages and rising diesel/petrol generator fuel costs push families, retail shops, and rural health clinics toward solar energy. However, prospective buyers face three major hurdles:

1. **Sizing Uncertainty:** Most people do not know how many kilowatts (kW) of solar panels or kilowatt-hours (kWh) of battery storage their daily appliances require.
2. **Opaque Pricing & Payback:** Equipment quotes vary widely in Ethiopian Birr (ETB), making it hard to compare solar costs against Ethiopian Electric Utility (EEU) grid tariffs or backup generator fuel expenses.
3. **Language & Bandwidth Barriers:** Existing solar calculators are rarely available in Amharic, rely on technical jargon, or are too heavy for low-bandwidth mobile connections.

---

## The Solution

**SolarGuide ET** provides a fast, transparent, low-bandwidth web application that:

- **Starts with Ethiopian Load Profiles:** Choose one-tap presets for **Home (መኖሪያ ቤት)**, **Small Shop (ትንሽ ሱቅ)**, **Clinic (ጤና ኬላ / ክሊኒክ)**, or build a custom list from 10 common appliances (including LED bulbs, shop freezers, water pumps, sewing machines, and clinic vaccine fridges).
- **Uses Local Peak Sun Hours:** Supports 8 major Ethiopian cities (**Addis Ababa, Gondar, Bahir Dar, Hawassa, Mekelle, Dire Dawa, Jimma, Adama**) with an offline-first fallback table and optional NASA POWER API integration.
- **Computes Transparent Sizing & ETB Financials:** Calculates daily kWh demand, recommended solar panel kW (with 20% system loss allowance), battery bank kWh (1-day autonomy at 80% Depth of Discharge), installed ETB cost range, monthly savings vs. grid and vs. generator, and payback period in months.
- **Makes Every Assumption Editable:** Clearly labels all equipment prices and technical factors in [`/lib/config.ts`](./lib/config.ts) as assumptions and lets users adjust them interactively on the results page.
- **Connects Buyers to Installers:** Includes a validated quote request flow backed by Supabase with Row Level Security (RLS) and a server-rendered, password-protected `/admin` dashboard.
- **Defaults to Amharic (አማርኛ):** Renders crisp Ethiopic typography with `Noto Sans Ethiopic` and instant switching between **አማርኛ** and **English**.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS v4 + Shadcn/UI (`@base-ui/react`, `lucide-react`)
- **Typography:** `Noto Sans Ethiopic` via `next/font/google`
- **Database & Security:** Supabase (`@supabase/supabase-js`) with PostgreSQL Row Level Security (RLS)
- **Testing:** Node.js native test runner (`node --experimental-strip-types --test`)

---

## How to Run It

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/netsi-YD/solarguide-et.git
cd solarguide-et
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
ADMIN_PASSWORD=your_admin_password_here
```

### 3. Set Up the Supabase Database

Open the **SQL Editor** in your Supabase project and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create the `quote_requests` and `installers` tables along with their Row Level Security policies.

### 4. Run Unit Tests & Start Development Server

```bash
# Run calculator, sun-hours, validation, and translation unit tests
npm test

# Start the local development server on http://localhost:3000
npm run dev
```

---

## Next Steps

1. **Installer Dashboard:** Build a dedicated portal where verified solar installers in each Ethiopian city can sign in, view matched quote requests in their region, and send itemized proposals.
2. **AI Explanation in Amharic:** Integrate an AI assistant that explains the recommended solar sizing, inverter selection, and battery care tips in plain conversational Amharic (by text and voice).
3. **Financing Partners:** Partner with Ethiopian microfinance institutions (MFIs) and commercial banks to display monthly solar loan/PAYGO installment options alongside upfront ETB costs.
