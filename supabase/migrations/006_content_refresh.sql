-- =====================================================================
-- 006_content_refresh.sql
--
-- Replaces seeded MotoLinkers copy with the actual content from the
-- WordPress export. Affected pages: home (marquee + hero meta only),
-- about, how-it-works, contact, faq, privacy, terms.
--
-- IMPORTANT: this migration deletes and re-seeds entire pages where
-- the structure changed (about, how-it-works, privacy, terms, faq).
-- If you've made admin edits to those pages since 005, copy them out
-- before running this.
--
-- Apply via Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- Idempotent — safe to re-run; conflicts skip on home (the only page
-- using INSERT … ON CONFLICT) and the DELETE-then-INSERT blocks
-- always rebuild from scratch.
-- =====================================================================

-- ─── home: refresh marquee brands + hero meta only ──────────────────
update public.page_sections
set data = jsonb_set(
  data,
  '{items}',
  '[
    {"text": "Avatr"},
    {"text": "Deepal", "italic": true},
    {"text": "Zeekr"},
    {"text": "Mazda", "italic": true},
    {"text": "GAC"},
    {"text": "Changan", "italic": true},
    {"text": "ROX"}
  ]'::jsonb
)
where page_slug = 'home' and type = 'marquee';

-- Update hero working-hours line. Keep the rest of the hero meta as-is
-- (lat/long, "Cairo · Alexandria", "Est. 2020 · Operator since").
update public.page_sections
set data = jsonb_set(
  data,
  '{meta,col2_bot}',
  '"Sun–Thu 11:00–23:00 · Sat 15:00–23:00 · Fri closed"'::jsonb
)
where page_slug = 'home' and type = 'hero_block';

-- ─── contact: header copy from the WordPress export ─────────────────
update public.page_sections
set data = '{
  "kicker": "Contact",
  "title_html": "Get in <em>touch.</em>"
}'::jsonb
where page_slug = 'contact' and type = 'page_header';

-- ─── about: full rewrite ────────────────────────────────────────────
delete from public.page_sections where page_slug = 'about';
insert into public.page_sections (page_slug, position, type, data) values
('about', 0, 'page_header', '{
  "kicker": "About MotoLinkers",
  "title_html": "Connecting global mobility networks with smart, transparent, <em>data-driven</em> supply chains."
}'::jsonb),
('about', 1, 'paragraph', '{
  "text": "MotoLinkers is a specialised automotive supply chain and logistics consultancy based in Egypt, dedicated to transforming how vehicles and mobility products move across borders. We connect global manufacturers, importers, and consumers through smart, transparent, data-driven logistics solutions.\n\nWith expertise spanning supplier sourcing, freight coordination, and customs compliance, our team ensures every movement — from factory to final delivery — is optimised for cost, efficiency, and reliability. Whether supporting businesses with full-scale supply chain design or helping individuals import their next vehicle, MotoLinkers delivers precision, performance, and trust at every stage.",
  "align": "left"
}'::jsonb),
('about', 2, 'manifesto', '{
  "kicker": "Our Story",
  "title_html": "Importing a car is a <em>life decision</em>, not a transaction.",
  "body_paragraphs_html": [
    "While most see car importing as a transaction, we see it as a significant life decision that deserves absolute clarity. MotoLinkers was founded on the belief that premium buyers in Egypt should never have to guess what they are paying for.",
    "With over <strong>five years</strong> of experience navigating the complexities of global automotive supply chains, we have evolved from logistics experts into trusted advisors. Our role is to filter the noise of the global market, vet only the highest-quality manufacturers like Deepal, Zeekr, and ROX, and deliver them to you with a fully transparent financial breakdown."
  ],
  "pillars": [
    {"number": "Mission", "title": "Empower the Egyptian buyer", "body": "Empower Egyptian buyers by providing a transparent, stress-free gateway to the global EV market through expert consultancy and uncompromised supply chain integrity."},
    {"number": "Vision", "title": "The reference for premium electric mobility", "body": "Become the definitive reference for premium electric mobility in Egypt, where trust is the standard and every driver understands the true value of their investment."},
    {"number": "Standard", "title": "Move the industry, not just the cars", "body": "We don''t just move vehicles; we move the industry toward a standard of honesty. Premium buyers should never have to guess what they are paying for."}
  ]
}'::jsonb),
('about', 3, 'manifesto', '{
  "kicker": "Core Services",
  "title_html": "Five disciplines, <em>one supply chain.</em>",
  "body_paragraphs_html": [],
  "pillars": [
    {"number": "01", "title": "Supply chain consulting", "body": "We design and optimise end-to-end automotive logistics processes, helping businesses reduce costs, improve efficiency, and ensure full compliance across every supply chain stage."},
    {"number": "02", "title": "Import & customs advisory", "body": "We guide clients through every step of vehicle importation — from ACI and Nafeza registration to customs documentation — ensuring smooth, compliant, hassle-free clearance."},
    {"number": "03", "title": "Freight coordination", "body": "We manage global vehicle transportation by sea, air, and land through our trusted 3PL network, ensuring secure, timely, and cost-efficient delivery from origin to destination."},
    {"number": "04", "title": "Supplier sourcing", "body": "We connect you with verified global manufacturers and distributors, ensuring reliable sourcing of vehicles, parts, and mobility products that meet your specifications and quality standards."},
    {"number": "05", "title": "Training & capacity building", "body": "We empower logistics and procurement teams with practical training programmes focused on automotive supply chain efficiency, compliance, and digital transformation."}
  ]
}'::jsonb),
('about', 4, 'legal_clause', '{
  "heading": "Compliance & affiliations",
  "body_html": "MotoLinkers operates within recognised global and Egyptian frameworks for freight, customs, and trade.",
  "list_items": ["FIATA", "CILT", "ACI", "Misr Technology Services"]
}'::jsonb),
('about', 5, 'paragraph', '{
  "text": "Premium brands in our pipeline today: Avatr, Changan, Mazda, Zeekr, ROX, GAC, Deepal — with more coming as our verification programme expands.",
  "align": "left"
}'::jsonb),
('about', 6, 'page_header', '{
  "kicker": "Frequently Asked",
  "title_html": "EV ownership in Egypt, <em>answered.</em>"
}'::jsonb),
('about', 7, 'qa', '{
  "question": "What is the average real driving range of an electric car in Egypt?",
  "answer_html": "Most EV models available for import today offer a real-world range between <strong>500–700 km</strong> per charge, depending on the model and driving style. Daily urban driving in Egypt — commuting, school runs, errands — rarely exceeds 50–60 km per day, so most drivers only need to charge once or twice per week, not daily."
}'::jsonb),
('about', 8, 'qa', '{
  "question": "I''m worried about not finding charging stations, especially on longer trips.",
  "answer_html": "Public charging infrastructure on major highways is expanding steadily, and fast chargers are becoming more accessible. However, over <strong>85–90%</strong> of driving in Egypt happens inside the city. For clients who travel frequently, REEVs (Range-Extended Electric Vehicles) offer the ideal balance — a fully electric driving experience while a small gasoline generator supports the battery when needed, eliminating range concerns."
}'::jsonb),
('about', 9, 'qa', '{
  "question": "What happens if the battery needs replacement?",
  "answer_html": "Battery systems are engineered for long-term durability. Most manufacturers provide warranties of up to <strong>8 years or 160,000 km</strong> on the battery — coverage that protects what is often perceived as the biggest concern. Traditional combustion engines can require major repairs over time without similar long-term guarantees."
}'::jsonb),
('about', 10, 'qa', '{
  "question": "Is driving electric actually more cost-effective?",
  "answer_html": "Yes, and the savings extend beyond fuel. Compared to conventional vehicles, EVs eliminate many routine maintenance items: no engine oil changes, no filters or spark plugs, no traditional gearbox maintenance, far fewer moving parts overall. Charging costs are significantly lower than refuelling with petrol, resulting in substantially reduced running and maintenance expenses over time."
}'::jsonb),
('about', 11, 'qa', '{
  "question": "Will resale value be affected since the market is still new?",
  "answer_html": "Every major automotive shift follows the same adoption pattern. Automatic transmissions faced early scepticism in Egypt, then became mainstream. Demand for electric vehicles is steadily growing, supported by global production trends and increasing local awareness. As availability expands, EVs are transitioning from <em>new technology</em> to the next standard of mobility."
}'::jsonb),
('about', 12, 'qa', '{
  "question": "Is charging at home practical?",
  "answer_html": "Home charging is the most convenient solution and works seamlessly if you have a private garage or parking space, residence in a compound, or access to a power source at home or work. Most owners simply plug in overnight, much like charging a phone, and start each day with a full battery."
}'::jsonb),
('about', 13, 'qa', '{
  "question": "How is a REEV different from a full electric vehicle?",
  "answer_html": "A REEV drives exactly like an electric car — smooth, quiet, powered by electric motors at all times. The difference is that the gasoline engine does not drive the wheels. It acts only as a generator to recharge the battery when needed, providing an electric driving experience every day, freedom from charging dependency on long trips, and greater flexibility for Egyptian driving conditions."
}'::jsonb),
('about', 14, 'qa', '{
  "question": "Is importing an EV complicated?",
  "answer_html": "Importing a vehicle involves sourcing, inspection, shipping, customs clearance, and delivery coordination. With MotoLinkers handling it professionally, the process is structured, transparent, and typically completed within approximately <strong>60 days</strong>, ensuring clients receive the correct vehicle specification at a competitive global price."
}'::jsonb);

-- ─── how-it-works: full rewrite ─────────────────────────────────────
delete from public.page_sections where page_slug = 'how-it-works';
insert into public.page_sections (page_slug, position, type, data) values
('how-it-works', 0, 'page_header', '{
  "kicker": "How it works",
  "title_html": "Vehicle importing and automotive logistics, <em>made simple.</em>"
}'::jsonb),
('how-it-works', 1, 'paragraph', '{
  "text": "Whether you''re an individual importing your next car or a business optimising your automotive supply chain, our step-by-step process gives you clarity, transparency, and full control from start to finish.",
  "align": "left"
}'::jsonb),
('how-it-works', 2, 'page_header', '{
  "kicker": "For individuals",
  "title_html": "Import your car to Egypt in a simple, transparent, <em>step-by-step</em> process."
}'::jsonb),
('how-it-works', 3, 'process', '{
  "kicker": "The four steps",
  "title_html": "From the showroom to <em>your driveway.</em>",
  "steps": [
    {"number": "01", "title": "Car selection", "body": "Choose your preferred vehicle model, brand, and specifications from our verified global database."},
    {"number": "02", "title": "Logistics & shipping", "body": "We guide you through every step of vehicle importation — ACI and Nafeza registration, customs documentation — ensuring smooth, compliant, hassle-free clearance."},
    {"number": "03", "title": "Customs", "body": "We handle ACI registration, Nafeza uploads, and all customs procedures for smooth clearance."},
    {"number": "04", "title": "Last-mile delivery", "body": "Your vehicle is transported from the port directly to your chosen destination or dealer."}
  ]
}'::jsonb),
('how-it-works', 4, 'legal_clause', '{
  "heading": "Required documents — Egyptian residents",
  "body_html": "What you''ll need to provide before we begin sourcing and shipping.",
  "list_items": [
    "National ID or passport",
    "Commercial invoice / order confirmation",
    "Certificate of origin (if applicable)",
    "Shipping or booking details (if available)",
    "Order code / configuration summary",
    "Any documents required by the exporting dealer"
  ]
}'::jsonb),
('how-it-works', 5, 'legal_clause', '{
  "heading": "Required documents — expats",
  "body_html": "",
  "list_items": [
    "Passport",
    "Valid residency permit",
    "Power of attorney for procedures"
  ]
}'::jsonb),
('how-it-works', 6, 'manifesto', '{
  "kicker": "Regulatory guide",
  "title_html": "Twelve checkpoints, <em>one shipment.</em>",
  "body_paragraphs_html": [
    "Importing a vehicle into Egypt touches a dozen regulatory bodies, platforms, and supply-chain partners. We coordinate every one of them on your behalf — these are the surfaces involved."
  ],
  "pillars": [
    {"number": "01", "title": "Manufacturer of the car", "body": "Manufacturer-related requirements: conformity certificates, technical specifications, recalls, and compliance with Egyptian vehicle standards."},
    {"number": "02", "title": "Authorities at the export country", "body": "Documentation and approvals from authorities in the country of export — deregistration certificates, export permits, origin verification."},
    {"number": "03", "title": "Shipping line", "body": "Shipping carriers, vessel schedules, booking procedures, and shipping documents such as the Bill of Lading for vehicle transport."},
    {"number": "04", "title": "Ports around Egypt", "body": "Major Egyptian ports handling vehicle imports — port procedures, handling rules, inspection processes, and clearance timelines."},
    {"number": "05", "title": "Ministry of Communications & IT", "body": "Electronic systems, digital submissions, and online platforms used for regulatory approvals, tracking, and official communications."},
    {"number": "06", "title": "Customs documentation", "body": "All required customs paperwork for vehicle import and export — invoices, certificates, clearance forms — to ensure smooth processing without delays or penalties."},
    {"number": "07", "title": "Ministry of Interior", "body": "Vehicle security, ownership verification, chassis and engine number checks, and compliance with national safety and registration regulations."},
    {"number": "08", "title": "Ministry of Trade & Industry", "body": "Approvals related to vehicle import standards, commercial registration, and compliance with Egyptian trade laws."},
    {"number": "09", "title": "Land tracking", "body": "Inland tracking in Egypt — NAFEZA registration, ACID issuance, and compliance updates throughout the journey."},
    {"number": "10", "title": "Nafeza (ACID)", "body": "Registering shipments through the NAFEZA system: ACID number issuance, advance cargo information, and compliance with Egypt''s single window platform."},
    {"number": "11", "title": "Cargo X", "body": "Blockchain-based document transfer for secure, fast, compliant submission of shipping documents required by Egyptian customs."},
    {"number": "12", "title": "Inland transport", "body": "Loading, unloading, and delivery — the vehicle is handled safely from origin to final destination."}
  ]
}'::jsonb),
('how-it-works', 7, 'cta_block', '{
  "title_html": "Ready to move your <em>automotive vision</em> forward?",
  "body_html": "Our experts are here to guide you every step of the way.",
  "ctas": [
    {"label": "Start your import plan", "href": "/contact", "variant": "primary"},
    {"label": "Browse the fleet", "href": "/vehicles", "variant": "ghost"}
  ]
}'::jsonb),
('how-it-works', 8, 'page_header', '{
  "kicker": "For businesses",
  "title_html": "A structured workflow for <em>optimising</em> your automotive supply chain."
}'::jsonb),
('how-it-works', 9, 'process', '{
  "kicker": "Engagement model",
  "title_html": "Four phases, <em>one outcome.</em>",
  "steps": [
    {"number": "01", "title": "Engagement & analysis", "body": "We assess your current logistics processes, challenges, and operational goals."},
    {"number": "02", "title": "Process design", "body": "Our team develops a tailored supply chain framework optimised for cost, efficiency, and compliance."},
    {"number": "03", "title": "Logistics execution", "body": "We coordinate freight, customs, and inland transport through our trusted 3PL network."},
    {"number": "04", "title": "Optimisation", "body": "We identify bottlenecks and implement continuous improvements to enhance workflow efficiency."}
  ]
}'::jsonb),
('how-it-works', 10, 'legal_clause', '{
  "heading": "Required documents & compliance overview",
  "body_html": "What we prepare on your behalf so the shipment clears Egyptian customs without surprises.",
  "list_items": [
    "<strong>ACI setup & documentation</strong> — we prepare and manage all Advance Cargo Information requirements.",
    "<strong>Commercial invoice review</strong> — accuracy and compliance verified before shipment.",
    "<strong>Packing list verification</strong> — details matched with shipping and customs standards.",
    "<strong>HS code classification</strong> — correct code assignment for duties, taxes, and import compliance.",
    "<strong>Customs dossiers</strong> — preparation of every document required for import clearance."
  ]
}'::jsonb),
('how-it-works', 11, 'process', '{
  "kicker": "Consulting engagement flow",
  "title_html": "How we work <em>together.</em>",
  "steps": [
    {"number": "01", "title": "Discovery", "body": "We conduct a detailed session to understand your operational goals, import volume, and logistics challenges."},
    {"number": "02", "title": "Proposal", "body": "You receive a tailored consulting plan outlining scope, objectives, deliverables, and expected outcomes."},
    {"number": "03", "title": "Execution", "body": "We implement the recommended workflows, coordinate with your team, and manage processes with full transparency."},
    {"number": "04", "title": "Performance review", "body": "Regular review meetings evaluate results, track KPIs, and refine the strategy to maintain peak efficiency."}
  ]
}'::jsonb),
('how-it-works', 12, 'stats_grid', '{
  "items": [
    {"target": 98, "suffix": "%", "label": "Landed-cost accuracy"},
    {"target": 24, "suffix": "h", "label": "RFQ response time"},
    {"target": 99, "suffix": "%", "label": "Delivery accuracy"},
    {"target": 48, "suffix": "/50", "label": "Client satisfaction"}
  ]
}'::jsonb),
('how-it-works', 13, 'manifesto', '{
  "kicker": "Why MotoLinkers",
  "title_html": "Specialists, not <em>traders.</em>",
  "body_paragraphs_html": [],
  "pillars": [
    {"number": "01", "title": "Transparent pricing", "body": "Clients access factory-level pricing directly from trusted suppliers in China and the UAE, avoiding the layered markups typically found in the local market."},
    {"number": "02", "title": "Specialised EV & REEV expertise — not general trading", "body": "Unlike conventional importers, our focus is exclusively on electric mobility: correct model selection, verified specifications, long-term suitability for Egyptian usage conditions."},
    {"number": "03", "title": "Risk-controlled payment structure", "body": "Payments are structured in phases aligned with procurement milestones, providing clarity, documentation, and confidence throughout the transaction."},
    {"number": "04", "title": "A fully managed import experience (A–Z)", "body": "From vehicle sourcing and inspection to shipping, customs clearance, VAT handling, and final delivery — every step handled professionally under one structured process."}
  ]
}'::jsonb),
('how-it-works', 14, 'cta_block', '{
  "title_html": "Ready to optimise your <em>automotive supply chain?</em>",
  "body_html": "Speak with a supply chain consultant to review your workflow, identify bottlenecks, and build a high-performance logistics strategy.",
  "ctas": [
    {"label": "Book a strategy call", "href": "/contact", "variant": "primary"}
  ]
}'::jsonb);

-- ─── faq: keep the existing 6 questions as-is (last edit was 005) ────
-- The new About page now carries the EV-specific Q&As; /faq remains
-- the operational FAQ (timelines, taxes, payment routes, etc.). No
-- change here.

-- ─── privacy: full rewrite for MotoLinkers / Egypt ──────────────────
delete from public.page_sections where page_slug = 'privacy';
insert into public.page_sections (page_slug, position, type, data) values
('privacy', 0, 'page_header', '{
  "kicker": "Legal",
  "title_html": "Privacy <em>Policy.</em>"
}'::jsonb),
('privacy', 1, 'paragraph', '{
  "text": "Last updated: May 2026.",
  "align": "left"
}'::jsonb),
('privacy', 2, 'legal_clause', '{
  "heading": "Who we are",
  "body_html": "MotoLinkers is an automotive supply chain and logistics consultancy based in Cairo, Egypt. Our website address is <a href=\"https://motolinkers.com\">https://motolinkers.com</a>. We are not a vehicle dealership — we connect importers, manufacturers, and consumers through advisory, freight coordination, and customs services."
}'::jsonb),
('privacy', 3, 'legal_clause', '{
  "heading": "What we collect",
  "body_html": "We only collect what we need to respond to your enquiry and operate the import or consulting service you''ve requested.",
  "list_items": [
    "Contact-form submissions: your name, email, phone, the vehicle or service you''re interested in, and your message.",
    "Identity and shipping documents you share with us as part of an active import (ID, residency permit, power of attorney, customs forms, etc.).",
    "Standard server logs (IP address, user agent, page viewed) recorded by our hosting provider on every request."
  ]
}'::jsonb),
('privacy', 4, 'legal_clause', '{
  "heading": "How we use your information",
  "body_html": "",
  "list_items": [
    "To contact you about your enquiry and prepare a tailored quote.",
    "To execute the import or consulting service you have engaged us for, including communications with shipping lines, customs, and Egyptian authorities.",
    "To improve the site and our services using aggregated, anonymised analytics — never tied to your name or contact details."
  ]
}'::jsonb),
('privacy', 5, 'legal_clause', '{
  "heading": "Who can see your information",
  "body_html": "Only MotoLinkers staff and the systems we use to operate the business — Supabase for our database, Cloudflare for hosting and security. For active shipments, certain documents are shared with the shipping line, the Egyptian customs authority, NAFEZA, and CargoX as required by law. We do not sell or rent contact information to anyone."
}'::jsonb),
('privacy', 6, 'legal_clause', '{
  "heading": "How long we keep it",
  "body_html": "Lead and contact-form data is retained for 24 months after last contact, then deleted. Shipment and import records are retained for the period required by Egyptian customs and tax law (currently 5 years). Server logs are retained for 30 days."
}'::jsonb),
('privacy', 7, 'legal_clause', '{
  "heading": "Cookies",
  "body_html": "We use only essential cookies needed to operate the site (authentication on the admin panel; CSRF protection on the contact form). We do not use third-party advertising or tracking cookies. If you engage our chat widget, that provider may set its own cookies."
}'::jsonb),
('privacy', 8, 'legal_clause', '{
  "heading": "Payments and currency",
  "body_html": "All quotes and invoices are issued in Egyptian Pounds (EGP), with USD reference amounts where the underlying transaction is denominated in foreign currency. Payment is by bank transfer or supported financing partner; we do not store card details on our systems."
}'::jsonb),
('privacy', 9, 'legal_clause', '{
  "heading": "Your rights under Egyptian law",
  "body_html": "Under the Egyptian Personal Data Protection Law (Law 151 of 2020), you may request a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it. Email us at <a href=\"mailto:info@motolinkers.com\">info@motolinkers.com</a> and we will respond within 30 days."
}'::jsonb),
('privacy', 10, 'legal_clause', '{
  "heading": "Contact",
  "body_html": "Questions about this policy: <a href=\"mailto:info@motolinkers.com\">info@motolinkers.com</a> · +20 100 000 78104 · Office (ACO2), Floor 4, Building 100, Al-Mirghani Street, Heliopolis, Cairo."
}'::jsonb);

-- ─── terms: full rewrite for MotoLinkers / Egypt ────────────────────
delete from public.page_sections where page_slug = 'terms';
insert into public.page_sections (page_slug, position, type, data) values
('terms', 0, 'page_header', '{
  "kicker": "Legal",
  "title_html": "Terms of <em>Service.</em>"
}'::jsonb),
('terms', 1, 'paragraph', '{
  "text": "Last updated: May 2026.",
  "align": "left"
}'::jsonb),
('terms', 2, 'legal_clause', '{
  "heading": "1. Introduction",
  "body_html": "Welcome to MotoLinkers, an automotive supply chain and logistics consultancy registered in Cairo, Egypt. By using <a href=\"https://motolinkers.com\">motolinkers.com</a>, you agree to these terms. If you do not agree, please do not use the site or engage our services."
}'::jsonb),
('terms', 3, 'legal_clause', '{
  "heading": "2. Definitions",
  "body_html": "",
  "list_items": [
    "<strong>Website</strong> means motolinkers.com.",
    "<strong>Company</strong>, <em>we</em>, <em>us</em> means MotoLinkers.",
    "<strong>User</strong>, <em>you</em> means any person who visits the website or engages our services.",
    "<strong>Services</strong> means vehicle importing, supply chain consulting, freight coordination, customs advisory, and related activities offered by MotoLinkers."
  ]
}'::jsonb),
('terms', 4, 'legal_clause', '{
  "heading": "3. Use of the website",
  "body_html": "You agree to use the site for lawful purposes only and to comply with all applicable Egyptian laws and regulations. You will not use the site for fraud, unauthorised access, spam, phishing, or any activity that interferes with our service or other users. We reserve the right to suspend or terminate access at our discretion."
}'::jsonb),
('terms', 5, 'legal_clause', '{
  "heading": "4. Information accuracy",
  "body_html": "Vehicle prices, tax rates, and timelines shown on this site are estimates based on factory price sheets and current Egyptian tariff structures. The final landed cost is confirmed in writing before any commitment. Exchange rates fluctuate; EGP figures are indicative only and may change between quotation and payment."
}'::jsonb),
('terms', 6, 'legal_clause', '{
  "heading": "5. We do not sell vehicles directly through this site",
  "body_html": "MotoLinkers is a logistics and import consultancy, not a dealership. We do not sell vehicles directly through this website. All transactions are contracted separately, in writing, after a consultation. The fleet listings on this site are reference inventory used to compute landed-cost estimates and help you scope an import."
}'::jsonb),
('terms', 7, 'legal_clause', '{
  "heading": "6. Engagement, payment, and currency",
  "body_html": "When you engage our services, we issue a written agreement covering scope, fees, deposits, milestones, and timelines. Quotes and invoices are denominated in Egyptian Pounds (EGP) with USD reference where applicable. Payment is by bank transfer or via supported financing partners; financing is subject to the partner institution''s approval. Deposits are non-refundable once the corresponding milestone (sourcing, booking, customs filing) has been initiated."
}'::jsonb),
('terms', 8, 'legal_clause', '{
  "heading": "7. Warranty and liability",
  "body_html": "Manufacturer or dealership warranties may apply to imported vehicles and are governed by the manufacturer''s terms. MotoLinkers is not responsible for post-delivery mechanical failures unless explicitly covered by a warranty we have arranged on your behalf. We are not liable for losses caused by force majeure events (port closures, regulatory changes, currency restrictions, shipping disruptions) outside our reasonable control. Decisions made solely on the basis of figures shown on this website are at your own risk — always confirm pricing and timelines with a consultant before transferring funds."
}'::jsonb),
('terms', 9, 'legal_clause', '{
  "heading": "8. Intellectual property",
  "body_html": "Site design, copy, photography, and the MotoLinkers brand are the property of MotoLinkers. Vehicle imagery and manufacturer marks belong to their respective owners and are reproduced under fair-use principles for the purpose of identifying inventory and providing accurate consumer information."
}'::jsonb),
('terms', 10, 'legal_clause', '{
  "heading": "9. Privacy and data protection",
  "body_html": "Your use of the site and our services is also governed by our <a href=\"/privacy\">Privacy Policy</a>, which describes what we collect, how we use it, and your rights under the Egyptian Personal Data Protection Law (Law 151 of 2020)."
}'::jsonb),
('terms', 11, 'legal_clause', '{
  "heading": "10. Governing law and jurisdiction",
  "body_html": "These terms are governed by the laws of the Arab Republic of Egypt. Any dispute arising in connection with these terms or our services is subject to the exclusive jurisdiction of the competent courts of Cairo."
}'::jsonb),
('terms', 12, 'legal_clause', '{
  "heading": "11. Contact",
  "body_html": "Questions about these terms: <a href=\"mailto:info@motolinkers.com\">info@motolinkers.com</a> · +20 100 000 78104 · Office (ACO2), Floor 4, Building 100, Al-Mirghani Street, Heliopolis, Cairo."
}'::jsonb);

notify pgrst, 'reload schema';
