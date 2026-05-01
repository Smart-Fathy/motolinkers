-- =====================================================================
-- 005_cms_full_content.sql
--
-- Migrates every hardcoded string and structured datum into
-- page_sections, so the entire site becomes admin-editable. Seeded
-- copy mirrors the previous JSX defaults verbatim — applying this
-- migration changes nothing visible on the public site, but every
-- piece of content is now sourced from the DB.
--
-- Idempotent. Re-running it never overwrites admin edits because each
-- insert is `on conflict (page_slug, position) do nothing`.
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- =====================================================================

-- ─── extend the type check constraint ───────────────────────────────
alter table public.page_sections drop constraint if exists page_sections_type_check;
alter table public.page_sections add constraint page_sections_type_check
  check (type in (
    'paragraph','image','heading','rich_text','gallery','list','cta',
    'spacer','divider','embed',
    'page_header','hero_block','marquee','manifesto','fleet_grid',
    'calculator_widget','routes','process','testimonials','stats_grid',
    'cta_block','qa','legal_clause'
  ));

-- ─── home (10 sections) ─────────────────────────────────────────────
insert into public.page_sections (page_slug, position, type, data) values
('home', 0, 'hero_block', '{
  "meta": {
    "col1_top": "Cairo · Alexandria",
    "col1_bot": "Est. 2020 · Operator since",
    "col2_top": "N 30.0444 · E 31.2357",
    "col2_bot": "Working hours · Sun–Thu · 11:00–23:00"
  },
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
}'::jsonb),
('home', 1, 'marquee', '{
  "items": [
    {"text": "BYD"},
    {"text": "Denza", "italic": true},
    {"text": "Avatr"},
    {"text": "Zeekr"},
    {"text": "Deepal", "italic": true},
    {"text": "Changan"},
    {"text": "GAC"},
    {"text": "Leapmotor", "italic": true},
    {"text": "Nio"},
    {"text": "Xpeng", "italic": true}
  ]
}'::jsonb),
('home', 2, 'manifesto', '{
  "kicker": "Who we are",
  "title_html": "A logistics firm, not a <em>dealership.</em>",
  "body_paragraphs_html": [
    "MotoLinkers is an Egypt-based automotive supply-chain consultancy with over <strong>five years</strong> of experience connecting manufacturers, importers, and logistics partners. We specialise in moving vehicles and parts through trusted supplier networks, freight solutions, customs expertise, and data-driven logistics strategy.",
    "We are <strong>not a car trading company</strong>. We are a professional logistics partner focused on building efficient, transparent, and performance-driven automotive supply chains — between the Pearl River Delta, Jebel Ali, and Alexandria."
  ],
  "pillars": [
    {"number": "01 — Truth", "title": "Factory-direct pricing", "body": "The FOB number on our page is the number the manufacturer invoices. No hidden margins, no rebranded markups."},
    {"number": "02 — Proof", "title": "Verified network", "body": "Every manufacturer in our pipeline has passed a five-stage quality and documentation audit before we ship a single unit."},
    {"number": "03 — Path", "title": "End-to-end ownership", "body": "ACI, Nafeza, customs, 3PL, last-mile. We move the car from the factory floor to your plate in one unbroken chain."}
  ]
}'::jsonb),
('home', 3, 'fleet_grid', '{
  "kicker": "The Fleet · 2026",
  "title_html": "Select from a <em>curated</em> global shelf.",
  "subtitle": "Every unit below is live inventory — indexed daily against factory price sheets in Guangzhou, Shenzhen, and Dubai. Prices in EGP include our full landed-cost calculation.",
  "mode": "featured"
}'::jsonb),
('home', 4, 'calculator_widget', '{
  "kicker": "Landed-cost calculator",
  "title_html": "Every pound, <em>accounted for.</em>",
  "subtitle": "Four inputs. Full breakdown. The same math our consultants run on a Monday morning — taxes, freight, insurance, clearance, and exchange margin all exposed."
}'::jsonb),
('home', 5, 'routes', '{
  "kicker": "Trade Lanes",
  "title_html": "Two ports. <em>One destination.</em>",
  "routes": [
    {
      "flag_from": "cn", "flag_to": "eg",
      "from": "Nansha", "to": "Alexandria",
      "lane_label": "Lane 01",
      "freight_prefix": "$", "freight_value": "4,025",
      "transit_value": "45", "transit_suffix": "d",
      "carriers_value": "12", "carriers_suffix": "+",
      "svg_top_left": "GZHOU · CN", "svg_top_right": "ALX · EG",
      "svg_bottom": "≈ 12,800 KM · SUEZ CANAL",
      "gradient_id": "gradCN", "gradient_from": "#DE2910", "gradient_to": "#C9A84C",
      "svg_path": "M30 110 Q 180 10, 300 80 T 570 60",
      "svg_dot_from": {"cx": 30, "cy": 110}, "svg_dot_to": {"cx": 570, "cy": 60},
      "svg_top_left_pos": {"x": 30, "y": 140},
      "svg_top_right_pos": {"x": 570, "y": 40},
      "svg_bottom_pos": {"x": 300, "y": 150}
    },
    {
      "flag_from": "ae", "flag_to": "eg",
      "from": "Jebel Ali", "to": "Alexandria",
      "lane_label": "Lane 02",
      "freight_prefix": "$", "freight_value": "2,900",
      "transit_value": "28", "transit_suffix": "d",
      "carriers_value": "7", "carriers_suffix": "+",
      "svg_top_left": "DXB · AE", "svg_top_right": "ALX · EG",
      "svg_bottom": "≈ 5,200 KM · RED SEA",
      "gradient_id": "gradAE", "gradient_from": "#00732F", "gradient_to": "#C9A84C",
      "svg_path": "M30 80 Q 250 30, 570 80",
      "svg_dot_from": {"cx": 30, "cy": 80}, "svg_dot_to": {"cx": 570, "cy": 80},
      "svg_top_left_pos": {"x": 30, "y": 110},
      "svg_top_right_pos": {"x": 570, "y": 110},
      "svg_bottom_pos": {"x": 300, "y": 30}
    }
  ]
}'::jsonb),
('home', 6, 'process', '{
  "kicker": "How it works",
  "title_html": "From selection to <em>steering wheel.</em>",
  "steps": [
    {"number": "01", "title": "Selection", "body": "Choose a verified model, brand, and trim from our daily-indexed global database. We validate VIN, factory batch, and export permit before you commit."},
    {"number": "02", "title": "Freight", "body": "We book roll-on/roll-off or container on the next sailing from Nansha or Jebel Ali. Insurance, consolidation, and shipping-line coordination handled in-house."},
    {"number": "03", "title": "Customs", "body": "ACI, Nafeza, Ministry of Trade, Ministry of Communications, Cargo-X. We file every document, pay every duty, and walk the car through Egyptian clearance."},
    {"number": "04", "title": "Delivery", "body": "From Alexandria port to your address or dealership. Plate registration, cellular pairing, first service — all included."}
  ]
}'::jsonb),
('home', 7, 'testimonials', '{
  "kicker": "Voices",
  "title_html": "Finance people, <em>logistics</em> people, <em>operators.</em>",
  "items": [
    {"initials": "YD", "name": "Yasser Dawood", "role": "Branch Manager · E-Bank", "quote": "What impressed me most was the clarity. I knew exactly what I was paying for and why."},
    {"initials": "WZ", "name": "Wael Zaky", "role": "Finance Manager · E-Bank", "quote": "As someone working in finance, transparency is critical for me. The entire process was structured and documented, from factory pricing to freight and delivery. There were no hidden costs."},
    {"initials": "MS", "name": "Maha Shafiq", "role": "Operations Manager · OSOCO", "quote": "The car arrived exactly as promised and at a better value than what I was seeing locally. Overall, it felt trustworthy."},
    {"initials": "SM", "name": "Seif Maged", "role": "Logistics Manager · ArcelorMittal", "quote": "How satisfied I felt once I started driving the car. The whole experience — from choosing the car to receiving it — was simple, professional, and exactly what I was hoping for."},
    {"initials": "TR", "name": "Tamer Refaat", "role": "Head of Central Ops · E-Bank", "quote": "The team handled everything end-to-end — supplier verification, quality checks, shipping, delivery coordination. Stress-free."}
  ]
}'::jsonb),
('home', 8, 'stats_grid', '{
  "items": [
    {"target": 5, "suffix": "+", "label": "Years in Operation"},
    {"target": 220, "suffix": "", "label": "Vehicles Landed"},
    {"target": 17, "suffix": "", "label": "Verified Manufacturers"},
    {"target": 100, "suffix": "%", "label": "Clearance Success Rate"}
  ]
}'::jsonb),
('home', 9, 'cta_block', '{
  "title_html": "Move your <em>automotive vision</em> forward.",
  "body_html": "Whether you''re a business optimising supply chain or an individual importing your next vehicle — our consultants are on the other side of a short form.",
  "arabic_accent": "كل خطوة موثّقة.",
  "ctas": [
    {"label": "Start your import plan", "href": "/contact", "variant": "primary"},
    {"label": "Run the calculator", "href": "/calculator", "variant": "ghost"}
  ]
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── about (3 sections) ─────────────────────────────────────────────
insert into public.page_sections (page_slug, position, type, data) values
('about', 0, 'manifesto', '{
  "kicker": "Who we are",
  "title_html": "A logistics firm, not a <em>dealership.</em>",
  "body_paragraphs_html": [
    "MotoLinkers is an Egypt-based automotive supply-chain consultancy with over <strong>five years</strong> of experience connecting manufacturers, importers, and logistics partners. We specialise in moving vehicles and parts through trusted supplier networks, freight solutions, customs expertise, and data-driven logistics strategy.",
    "We are <strong>not a car trading company</strong>. We are a professional logistics partner focused on building efficient, transparent, and performance-driven automotive supply chains — between the Pearl River Delta, Jebel Ali, and Alexandria."
  ],
  "pillars": [
    {"number": "01 — Truth", "title": "Factory-direct pricing", "body": "The FOB number on our page is the number the manufacturer invoices. No hidden margins, no rebranded markups."},
    {"number": "02 — Proof", "title": "Verified network", "body": "Every manufacturer in our pipeline has passed a five-stage quality and documentation audit before we ship a single unit."},
    {"number": "03 — Path", "title": "End-to-end ownership", "body": "ACI, Nafeza, customs, 3PL, last-mile. We move the car from the factory floor to your plate in one unbroken chain."}
  ]
}'::jsonb),
('about', 1, 'stats_grid', '{
  "items": [
    {"target": 5, "suffix": "+", "label": "Years in Operation"},
    {"target": 220, "suffix": "", "label": "Vehicles Landed"},
    {"target": 17, "suffix": "", "label": "Verified Manufacturers"},
    {"target": 100, "suffix": "%", "label": "Clearance Success Rate"}
  ]
}'::jsonb),
('about', 2, 'testimonials', '{
  "kicker": "Voices",
  "title_html": "Finance people, <em>logistics</em> people, <em>operators.</em>",
  "items": [
    {"initials": "YD", "name": "Yasser Dawood", "role": "Branch Manager · E-Bank", "quote": "What impressed me most was the clarity. I knew exactly what I was paying for and why."},
    {"initials": "WZ", "name": "Wael Zaky", "role": "Finance Manager · E-Bank", "quote": "As someone working in finance, transparency is critical for me. The entire process was structured and documented, from factory pricing to freight and delivery. There were no hidden costs."},
    {"initials": "MS", "name": "Maha Shafiq", "role": "Operations Manager · OSOCO", "quote": "The car arrived exactly as promised and at a better value than what I was seeing locally. Overall, it felt trustworthy."},
    {"initials": "SM", "name": "Seif Maged", "role": "Logistics Manager · ArcelorMittal", "quote": "How satisfied I felt once I started driving the car. The whole experience — from choosing the car to receiving it — was simple, professional, and exactly what I was hoping for."},
    {"initials": "TR", "name": "Tamer Refaat", "role": "Head of Central Ops · E-Bank", "quote": "The team handled everything end-to-end — supplier verification, quality checks, shipping, delivery coordination. Stress-free."}
  ]
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── how-it-works (2 sections) ──────────────────────────────────────
insert into public.page_sections (page_slug, position, type, data) values
('how-it-works', 0, 'process', '{
  "kicker": "How it works",
  "title_html": "From selection to <em>steering wheel.</em>",
  "steps": [
    {"number": "01", "title": "Selection", "body": "Choose a verified model, brand, and trim from our daily-indexed global database. We validate VIN, factory batch, and export permit before you commit."},
    {"number": "02", "title": "Freight", "body": "We book roll-on/roll-off or container on the next sailing from Nansha or Jebel Ali. Insurance, consolidation, and shipping-line coordination handled in-house."},
    {"number": "03", "title": "Customs", "body": "ACI, Nafeza, Ministry of Trade, Ministry of Communications, Cargo-X. We file every document, pay every duty, and walk the car through Egyptian clearance."},
    {"number": "04", "title": "Delivery", "body": "From Alexandria port to your address or dealership. Plate registration, cellular pairing, first service — all included."}
  ]
}'::jsonb),
('how-it-works', 1, 'routes', '{
  "kicker": "Trade Lanes",
  "title_html": "Two ports. <em>One destination.</em>",
  "routes": [
    {
      "flag_from": "cn", "flag_to": "eg",
      "from": "Nansha", "to": "Alexandria",
      "lane_label": "Lane 01",
      "freight_prefix": "$", "freight_value": "4,025",
      "transit_value": "45", "transit_suffix": "d",
      "carriers_value": "12", "carriers_suffix": "+",
      "svg_top_left": "GZHOU · CN", "svg_top_right": "ALX · EG",
      "svg_bottom": "≈ 12,800 KM · SUEZ CANAL",
      "gradient_id": "gradCN", "gradient_from": "#DE2910", "gradient_to": "#C9A84C",
      "svg_path": "M30 110 Q 180 10, 300 80 T 570 60",
      "svg_dot_from": {"cx": 30, "cy": 110}, "svg_dot_to": {"cx": 570, "cy": 60},
      "svg_top_left_pos": {"x": 30, "y": 140},
      "svg_top_right_pos": {"x": 570, "y": 40},
      "svg_bottom_pos": {"x": 300, "y": 150}
    },
    {
      "flag_from": "ae", "flag_to": "eg",
      "from": "Jebel Ali", "to": "Alexandria",
      "lane_label": "Lane 02",
      "freight_prefix": "$", "freight_value": "2,900",
      "transit_value": "28", "transit_suffix": "d",
      "carriers_value": "7", "carriers_suffix": "+",
      "svg_top_left": "DXB · AE", "svg_top_right": "ALX · EG",
      "svg_bottom": "≈ 5,200 KM · RED SEA",
      "gradient_id": "gradAE", "gradient_from": "#00732F", "gradient_to": "#C9A84C",
      "svg_path": "M30 80 Q 250 30, 570 80",
      "svg_dot_from": {"cx": 30, "cy": 80}, "svg_dot_to": {"cx": 570, "cy": 80},
      "svg_top_left_pos": {"x": 30, "y": 110},
      "svg_top_right_pos": {"x": 570, "y": 110},
      "svg_bottom_pos": {"x": 300, "y": 30}
    }
  ]
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── vehicles / news / contact (page headers) ───────────────────────
insert into public.page_sections (page_slug, position, type, data) values
('vehicles', 0, 'page_header', '{
  "kicker": "The Fleet · 2026",
  "title_html": "A curated <em>shelf.</em>"
}'::jsonb),
('news', 0, 'page_header', '{
  "kicker": "News & Insights",
  "title_html": "From the <em>field.</em>"
}'::jsonb),
('contact', 0, 'page_header', '{
  "kicker": "Contact",
  "title_html": "Talk to a <em>consultant.</em>"
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── calculator (1 section: header above the widget) ────────────────
insert into public.page_sections (page_slug, position, type, data) values
('calculator', 0, 'calculator_widget', '{
  "kicker": "Landed-cost calculator",
  "title_html": "Every pound, <em>accounted for.</em>",
  "subtitle": "Four inputs. Full breakdown. The same math our consultants run on a Monday morning — taxes, freight, insurance, clearance, and exchange margin all exposed."
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── faq (1 page_header + 6 qa) ─────────────────────────────────────
insert into public.page_sections (page_slug, position, type, data) values
('faq', 0, 'page_header', '{
  "kicker": "Frequently Asked",
  "title_html": "The questions, <em>answered.</em>"
}'::jsonb),
('faq', 1, 'qa', '{
  "question": "How long does an import take?",
  "answer_html": "From China: roughly <strong>45 days</strong> port-to-port (Nansha → Alexandria), plus 5–10 days for customs and registration. From the UAE: about <strong>28 days</strong> (Jebel Ali → Alexandria), plus the same clearance window."
}'::jsonb),
('faq', 2, 'qa', '{
  "question": "What taxes apply?",
  "answer_html": "Egyptian customs duty depends on drivetrain: <strong>17%</strong> for pure EVs, <strong>27%</strong> for range-extended EVs, and <strong>58%</strong> for plug-in hybrids. <strong>14% VAT</strong> applies on top of CIF + duty for all categories."
}'::jsonb),
('faq', 3, 'qa', '{
  "question": "Do I pay you in EGP or USD?",
  "answer_html": "Both are supported. Bank-to-bank transfers in EGP are typically 1.5% cheaper on the FX spread; direct USD wires are about 3% but settle within 24 hours."
}'::jsonb),
('faq', 4, 'qa', '{
  "question": "What''s included in the MotoLinkers fee?",
  "answer_html": "Our 4% consulting fee covers: model verification, supplier audit, freight coordination, insurance, ACI/Nafeza filing, customs clearance, last-mile delivery, plate registration, and first-service handover."
}'::jsonb),
('faq', 5, 'qa', '{
  "question": "Can I see the car before paying?",
  "answer_html": "Yes. We arrange video walkthroughs of pre-shipment inspections, and for UAE units, in-person visits to Jebel Ali on request."
}'::jsonb),
('faq', 6, 'qa', '{
  "question": "What happens if customs clearance fails?",
  "answer_html": "We retain a 1% risk reserve against documentation issues. In the rare case of a clearance failure caused by us, we cover the remediation in full."
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── terms (1 page_header + 1 'last updated' paragraph + 6 clauses) ──
insert into public.page_sections (page_slug, position, type, data) values
('terms', 0, 'page_header', '{
  "kicker": "Legal",
  "title_html": "Terms of <em>Service.</em>"
}'::jsonb),
('terms', 1, 'paragraph', '{
  "text": "Last updated: April 2026.",
  "align": "left"
}'::jsonb),
('terms', 2, 'legal_clause', '{
  "heading": "1. About this site",
  "body_html": "motolinkers.com is operated by MotoLinkers, an automotive supply-chain consultancy registered in Cairo, Egypt. By using the site you agree to these terms."
}'::jsonb),
('terms', 3, 'legal_clause', '{
  "heading": "2. Information accuracy",
  "body_html": "Vehicle prices and tax rates shown are estimates based on factory price sheets and current Egyptian tariff structures. Final landed cost is confirmed in writing before any commitment. Exchange rates fluctuate; EGP figures are indicative only."
}'::jsonb),
('terms', 4, 'legal_clause', '{
  "heading": "3. No vehicle sales on this site",
  "body_html": "MotoLinkers is a logistics consultancy, not a dealership. We do not sell vehicles directly through this website. All transactions are contracted separately, in writing, after a consultation."
}'::jsonb),
('terms', 5, 'legal_clause', '{
  "heading": "4. Intellectual property",
  "body_html": "Site design, copy, and the MotoLinkers brand are the property of MotoLinkers. Vehicle imagery and manufacturer marks belong to their respective owners."
}'::jsonb),
('terms', 6, 'legal_clause', '{
  "heading": "5. Liability",
  "body_html": "We do not accept liability for decisions made solely on the basis of figures shown on this website. Always confirm pricing and timelines with a consultant before transferring funds."
}'::jsonb),
('terms', 7, 'legal_clause', '{
  "heading": "6. Contact",
  "body_html": "Questions about these terms: <a href=\"mailto:info@motolinkers.com\">info@motolinkers.com</a>"
}'::jsonb)
on conflict (page_slug, position) do nothing;

-- ─── privacy (1 page_header + 1 'last updated' + 6 clauses) ──────────
insert into public.page_sections (page_slug, position, type, data) values
('privacy', 0, 'page_header', '{
  "kicker": "Legal",
  "title_html": "Privacy <em>Policy.</em>"
}'::jsonb),
('privacy', 1, 'paragraph', '{
  "text": "Last updated: April 2026.",
  "align": "left"
}'::jsonb),
('privacy', 2, 'legal_clause', '{
  "heading": "What we collect",
  "body_html": "When you submit a contact form, we collect your name, email or phone number, the vehicle you''re interested in, and any message you write. We also receive standard server logs (IP, user agent, page viewed) on every request."
}'::jsonb),
('privacy', 3, 'legal_clause', '{
  "heading": "How we use it",
  "body_html": "",
  "list_items": [
    "To contact you about your inquiry.",
    "To prepare a quote and shipping plan.",
    "To improve the site (aggregated analytics — never tied to your name or email)."
  ]
}'::jsonb),
('privacy', 4, 'legal_clause', '{
  "heading": "Who can see it",
  "body_html": "Only MotoLinkers staff and the systems we use to operate the business (Supabase for our database, Cloudflare for hosting). We do not sell or rent contact information."
}'::jsonb),
('privacy', 5, 'legal_clause', '{
  "heading": "How long we keep it",
  "body_html": "Lead data is retained for 24 months after last contact, then deleted. Server logs are retained for 30 days."
}'::jsonb),
('privacy', 6, 'legal_clause', '{
  "heading": "Cookies",
  "body_html": "We use only essential cookies needed to operate the site (no third-party ad cookies). The Respond.io chat widget sets its own cookies if you engage with it."
}'::jsonb),
('privacy', 7, 'legal_clause', '{
  "heading": "Your rights",
  "body_html": "Email us at <a href=\"mailto:info@motolinkers.com\">info@motolinkers.com</a> to request a copy of your data, correct it, or have it deleted."
}'::jsonb)
on conflict (page_slug, position) do nothing;

notify pgrst, 'reload schema';
