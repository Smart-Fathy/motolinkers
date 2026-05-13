-- =====================================================================
-- 010_home_design_refresh.sql
--
-- Reseeds the home page's CMS sections to match the design handoff
-- from claude.ai/design (moto/project/Home.html). The previous
-- 005_cms_full_content migration used `on conflict do nothing`, so
-- the original copy stayed put when defaults later changed. This
-- migration OVERWRITES the home sections' data jsonb with the new
-- design's copy.
--
-- Idempotent: re-running produces the same end state. Other pages
-- (about, how-it-works, etc.) are untouched.
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- =====================================================================

-- ─── hero_block ─────────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "meta": {
    "col1_top": "Cairo · Alexandria",
    "col1_bot": "Est. 2020 · Operator since",
    "col2_top": "N 30.0444 · E 31.2357",
    "col2_bot": "Sun–Thu 11:00–23:00 · Sat 15:00–23:00 · Fri closed"
  },
  "kicker": "Egypt''s EV import consultancy — 2026",
  "title_lines": ["Transparency", "is the new", "<em>luxury.</em>"],
  "aria_label": "Transparency is the new luxury.",
  "lede_html": "Egypt''s quietly radical EV import consultancy. We don''t sell cars — we hand you the <em>factory price</em>, the real landed cost, and a verified path from a Chinese or Emirati port to your driveway.",
  "ctas": [
    {"label": "Explore the fleet", "href": "/vehicles", "variant": "primary"},
    {"label": "Compute your cost", "href": "/calculator", "variant": "ghost"}
  ],
  "ticker": [
    {"value": "17%", "label": "EV tax rate"},
    {"value": "27%", "label": "REEV tax rate"},
    {"value": "58%", "label": "PHEV tax rate"},
    {"value": "28–45", "value_suffix": "d", "label": "Transit window"}
  ],
  "scroll_label": "Scroll"
}'::jsonb
 where page_slug = 'home' and type = 'hero_block';

-- ─── marquee (brand logos) ──────────────────────────────────────────
update public.page_sections
   set data = '{
  "items": [
    {"text": "Toyota", "logo_url": "/logos/toyota.png"},
    {"text": "Nissan", "logo_url": "/logos/nissan.png"},
    {"text": "Mazda",  "logo_url": "/logos/mazda.png"},
    {"text": "iCar",   "logo_url": "/logos/icar.png"},
    {"text": "Deepal", "logo_url": "/logos/deepal.png"},
    {"text": "Avatr",  "logo_url": "/logos/avatr.png"},
    {"text": "BYD",    "logo_url": "/logos/byd.png"},
    {"text": "BMW",    "logo_url": "/logos/bmw.png"}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'marquee';

-- ─── manifesto ──────────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "kicker": "Who we are",
  "title_html": "A logistics firm, not a <em>dealership.</em>",
  "body_paragraphs_html": [
    "MotoLinkers is an Egypt-based automotive supply-chain consultancy with over <strong>five years</strong> of experience connecting manufacturers, importers, and logistics partners. We specialise in moving vehicles and parts through trusted supplier networks, freight solutions, customs expertise, and data-driven logistics strategy.",
    "We are <strong>not a car trading company</strong>. We are a professional logistics partner focused on building efficient, transparent, and performance-driven automotive supply chains — between the Pearl River Delta, Jebel Ali, and Alexandria."
  ],
  "pillars": [
    {"number": "01 — Truth",  "title": "Factory-direct pricing",  "body": "The FOB number on our page is the number the manufacturer invoices. No hidden margins, no rebranded markups."},
    {"number": "02 — Proof",  "title": "Verified network",       "body": "Every manufacturer in our pipeline has passed a five-stage quality and documentation audit before we ship a single unit."},
    {"number": "03 — Path",   "title": "End-to-end ownership",   "body": "ACI, Nafeza, customs, 3PL, last-mile. We move the car from the factory floor to your plate in one unbroken chain."}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'manifesto';

-- ─── stats_grid ─────────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "items": [
    {"target": 5,   "suffix": "+", "label": "Years in Operation"},
    {"target": 220, "suffix": "",  "label": "Vehicles Landed"},
    {"target": 17,  "suffix": "",  "label": "Verified Manufacturers"},
    {"target": 100, "suffix": "%", "label": "Clearance Success Rate"}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'stats_grid';

-- ─── process ────────────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "kicker": "How it works",
  "title_html": "From selection to <em>steering wheel.</em>",
  "steps": [
    {"number": "01", "title": "Selection", "body": "Choose a verified model, brand, and trim from our daily-indexed global database. We validate VIN, factory batch, and export permit before you commit."},
    {"number": "02", "title": "Freight",   "body": "We book roll-on/roll-off or container on the next sailing from Nansha or Jebel Ali. Insurance, consolidation, and shipping-line coordination handled in-house."},
    {"number": "03", "title": "Customs",   "body": "ACI, Nafeza, Ministry of Trade, Ministry of Communications, Cargo-X. We file every document, pay every duty, and walk the car through Egyptian clearance."},
    {"number": "04", "title": "Delivery",  "body": "From Alexandria port to your address or dealership. Plate registration, cellular pairing, first service — all included."}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'process';

-- ─── routes (Cape of Good Hope, Leaflet) ────────────────────────────
update public.page_sections
   set data = '{
  "kicker": "Trade Lanes",
  "title_html": "Two ports. <em>One destination.</em>",
  "routes": [
    {
      "flag_from": "cn",
      "flag_to":   "eg",
      "from": "Nansha",
      "to":   "Alexandria",
      "lane_label": "Lane 01",
      "freight_prefix": "$",
      "freight_value":  "5,800",
      "transit_value":  "60",
      "transit_suffix": "d",
      "carriers_value": "12",
      "carriers_suffix": "+",
      "map_id": "map-lane-01",
      "map": {
        "bounds": [[-40, -25], [38, 118]],
        "route": [
          [22.75, 113.6], [18.0, 112.0], [10.5, 108.0], [4.0, 104.0],
          [1.27, 103.85], [3.5, 98.0], [0.0, 90.0], [-6.0, 80.0],
          [-15.0, 65.0], [-25.0, 50.0], [-34.0, 30.0], [-34.36, 18.47],
          [-25.0, 12.0], [-10.0, 9.0], [0.0, 5.0], [10.0, -16.0],
          [25.0, -16.0], [33.0, -8.0], [35.95, -5.6], [37.0, 10.0],
          [33.5, 25.0], [31.2, 29.92]
        ],
        "ports": [
          {"latlng": [22.75, 113.6], "name": "NANSHA · CN",     "color": "#DE2910", "dir": "bottom", "offset": [0, 8]},
          {"latlng": [31.2, 29.92],  "name": "ALEXANDRIA · EG", "color": "#C9A84C", "dir": "top",    "offset": [0, -6]}
        ],
        "via": [
          {"latlng": [-34.36, 18.47], "name": "Cape of Good Hope", "dir": "bottom", "offset": [0, 8]},
          {"latlng": [35.95, -5.6],   "name": "Gibraltar",         "dir": "left",   "offset": [-6, 0]},
          {"latlng": [1.27, 103.85],  "name": "Malacca",           "dir": "bottom", "offset": [0, 6]}
        ],
        "distance": {"latlng": [-20, 70], "text": "≈ 22,000 KM · 60 D"}
      }
    },
    {
      "flag_from": "ae",
      "flag_to":   "eg",
      "from": "Jebel Ali",
      "to":   "Alexandria",
      "lane_label": "Lane 02",
      "freight_prefix": "$",
      "freight_value":  "4,800",
      "transit_value":  "55",
      "transit_suffix": "d",
      "carriers_value": "7",
      "carriers_suffix": "+",
      "map_id": "map-lane-02",
      "map": {
        "bounds": [[-40, -25], [38, 75]],
        "route": [
          [25.01, 55.06], [25.5, 56.5], [26.5, 56.9], [22.0, 60.0],
          [15.0, 64.0], [5.0, 68.0], [-8.0, 65.0], [-20.0, 55.0],
          [-30.0, 38.0], [-34.36, 18.47], [-25.0, 12.0], [-10.0, 9.0],
          [0.0, 5.0], [10.0, -16.0], [25.0, -16.0], [33.0, -8.0],
          [35.95, -5.6], [37.0, 10.0], [33.5, 25.0], [31.2, 29.92]
        ],
        "ports": [
          {"latlng": [25.01, 55.06], "name": "JEBEL ALI · AE",   "color": "#00732F", "dir": "top", "offset": [0, -6]},
          {"latlng": [31.2, 29.92],  "name": "ALEXANDRIA · EG",  "color": "#C9A84C", "dir": "top", "offset": [0, -6]}
        ],
        "via": [
          {"latlng": [26.5, 56.9],    "name": "Hormuz",            "dir": "right",  "offset": [6, 0]},
          {"latlng": [-34.36, 18.47], "name": "Cape of Good Hope", "dir": "bottom", "offset": [0, 8]},
          {"latlng": [35.95, -5.6],   "name": "Gibraltar",         "dir": "left",   "offset": [-6, 0]}
        ],
        "distance": {"latlng": [-18, 40], "text": "≈ 18,500 KM · 55 D"}
      }
    }
  ]
}'::jsonb
 where page_slug = 'home' and type = 'routes';

-- ─── testimonials ───────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "kicker": "Voices",
  "title_html": "Finance people, <em>logistics</em> people, <em>operators.</em>",
  "items": [
    {"initials": "YD", "name": "Yasser Dawood", "role": "Branch Manager · E-Bank",         "quote": "What impressed me most was the clarity. I knew exactly what I was paying for and why."},
    {"initials": "WZ", "name": "Wael Zaky",     "role": "Finance Manager · E-Bank",        "quote": "As someone working in finance, transparency is critical for me. The entire process was structured and documented, from factory pricing to freight and delivery. There were no hidden costs."},
    {"initials": "MS", "name": "Maha Shafiq",   "role": "Operations Manager · OSOCO",      "quote": "The car arrived exactly as promised and at a better value than what I was seeing locally. Overall, it felt trustworthy."}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'testimonials';

-- ─── cta_block ──────────────────────────────────────────────────────
update public.page_sections
   set data = '{
  "title_html": "Move your <em>automotive vision</em> forward.",
  "body_html":  "Whether you''re a business optimising supply chain or an individual importing your next vehicle — our consultants are on the other side of a short form.",
  "arabic_accent": "كل خطوة موثّقة.",
  "ctas": [
    {"label": "Start your import plan", "href": "/contact",   "variant": "primary"},
    {"label": "Run the calculator",     "href": "/calculator", "variant": "ghost"}
  ]
}'::jsonb
 where page_slug = 'home' and type = 'cta_block';

-- ─── calculator_widget header ───────────────────────────────────────
update public.page_sections
   set data = '{
  "kicker":    "Landed-cost calculator",
  "title_html": "Every pound, <em>accounted for.</em>",
  "subtitle":   "Four inputs. Full breakdown. The same math our consultants run on a Monday morning — taxes, freight, insurance, clearance, and exchange margin all exposed."
}'::jsonb
 where page_slug = 'home' and type = 'calculator_widget';

-- ─── fleet_grid (kept on featured to match the design) ──────────────
update public.page_sections
   set data = '{
  "kicker": "The Fleet · 2026",
  "title_html": "Select from a <em>curated</em> global shelf.",
  "subtitle": "Every unit below is live inventory — indexed daily against factory price sheets in Guangzhou, Shenzhen, and Dubai. Prices in EGP include our full landed-cost calculation.",
  "mode": "featured"
}'::jsonb
 where page_slug = 'home' and type = 'fleet_grid';
