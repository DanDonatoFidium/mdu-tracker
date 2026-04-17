# MDU Fiber Access Tracker

A live web app for tracking MDU fiber access agreement progress across your AE team.

---

## 🚀 Deploy to Netlify in 5 Steps

### Step 1 — Set Up Supabase (free database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name (e.g. `mdu-tracker`), set a password, pick a region closest to your team
3. Once the project is ready, go to the **SQL Editor** (left sidebar)
4. Paste and run the following SQL to create your table and load all 899 properties:

```sql
CREATE TABLE mdu_properties (
  id TEXT PRIMARY KEY,
  address TEXT,
  ae TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  total_units INTEGER,
  active_units INTEGER,
  penetration TEXT,
  building_type TEXT,
  product TEXT,
  avg_mrc TEXT,
  vanity_name TEXT DEFAULT '',
  owner_name TEXT DEFAULT '',
  owner_phone TEXT DEFAULT '',
  owner_email TEXT DEFAULT '',
  pm_name TEXT DEFAULT '',
  pm_phone TEXT DEFAULT '',
  pm_email TEXT DEFAULT '',
  status TEXT DEFAULT 'Not Started',
  last_contact_date DATE,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read/write (open link, no auth)
ALTER TABLE mdu_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON mdu_properties FOR SELECT USING (true);
CREATE POLICY "Public write" ON mdu_properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON mdu_properties FOR UPDATE USING (true);
```

5. After creating the table, go to **Settings → API** in your Supabase project
6. Copy your **Project URL** and **anon/public key** — you'll need these in Step 3

### Step 2 — Seed the Database

In the Supabase SQL Editor, run the seed script located in `supabase_seed.sql` (in this folder). This loads all 899 MDU properties.

Alternatively, you can skip this step — the app will automatically fall back to local data if the database is empty, and seed it on first save.

### Step 3 — Deploy to Netlify

**Option A: Drag & Drop (easiest)**
1. Run `npm install && npm run build` in this folder
2. Go to [netlify.com](https://netlify.com), log in, click **Add new site → Deploy manually**
3. Drag the `build/` folder into the Netlify drop zone
4. Go to **Site settings → Environment variables** and add:
   - `REACT_APP_SUPABASE_URL` = your Supabase Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
5. Trigger a redeploy: **Deploys → Trigger deploy**

**Option B: GitHub (auto-deploys on every push)**
1. Push this folder to a GitHub repo
2. In Netlify: **Add new site → Import from Git**, connect your repo
3. Build command: `npm run build` | Publish directory: `build`
4. Add the same two environment variables above
5. Deploy!

### Step 4 — Share the Link

Once deployed, Netlify gives you a URL like `https://sparkly-unicorn-123.netlify.app`. Share it with your team — no login required.

---

## 🔧 How the App Works

- **Dashboard tab** — Live KPIs, leaderboard (auto-ranked by % signed), pipeline funnel, AE breakdown table
- **All Properties tab** — Full searchable/filterable table of all 899 MDUs. Anyone can view; only the assigned AE can edit
- **My Properties tab** — Appears when an AE selects themselves in the header. Shows only their properties with personal KPIs
- **Status updates** — Click a status pill in the table to cycle through stages, or open the Edit modal for full detail
- **Edits save instantly** to Supabase so the whole team sees updates in real time (refresh to see others' changes)

## ⚠️ Local Mode

If Supabase isn't connected (e.g., env vars missing), the app runs in **Local Mode** — all 899 properties load from the built-in data file, but changes won't persist between sessions. A yellow banner appears in the header when in local mode.

---

## 📁 File Structure

```
mdu-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← Main app (all components)
│   ├── App.css         ← All styles
│   ├── index.js        ← Entry point
│   ├── supabaseClient.js
│   └── mduData.json    ← Seed data (899 properties)
├── netlify.toml        ← Netlify build config
├── package.json
└── .env.example        ← Copy to .env and fill in your keys
```
