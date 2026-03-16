export const QUAL_FRAMEWORK = {
  dimensions: {
    firmographics: { weight: 0.10, label: "Firmographics", desc: "Bank size, assets, tier, employees, financial health" },
    technographics: { weight: 0.15, label: "Technographics", desc: "Tech stack maturity, legacy burden, cloud adoption, API readiness" },
    decision_process: { weight: 0.10, label: "Decision Process", desc: "Clarity of buying process, budget cycle, governance speed" },
    landing_zones: { weight: 0.20, label: "Landing Zone Fit", desc: "How well Backbase products map to bank's actual needs" },
    pain_push: { weight: 0.20, label: "Pain & Push to Act", desc: "Urgency of pain points, regulatory pressure, competitive threat, transformation trigger" },
    power_map: { weight: 0.15, label: "Power Map", desc: "Do we know and have access to decision makers?" },
    partner_access: { weight: 0.10, label: "Partner Access", desc: "Does the bank work with partners we have relationships with?" }
  },
  // power_map_activated: boolean — if YES, +1.5 bonus; if NO, -1 penalty
  // partner_known: boolean — if YES, +0.5 bonus
};


export const QUAL_DATA = {
  "Nordea_Sweden": {
    firmographics: { score: 10, note: "€570B assets, 30K staff, Tier 1 D-SIB, pan-Nordic" },
    technographics: { score: 6, note: "Massive legacy; One Platform transformation underway; strong in-house eng team (~6K)" },
    decision_process: { score: 5, note: "Very long cycles; group-level decisions from Helsinki; consensus culture" },
    landing_zones: { score: 9, note: "Retail, Wealth, Business, Corporate RM — full Backbase stack applicable" },
    pain_push: { score: 7, note: "Neobank pressure, legacy modernization imperative, digital adoption gaps across 4 markets" },
    power_map: { score: 7, activated: true, note: "Malthe Falck (CPO), John Van Uden (CTO) identified; LinkedIn profiles confirmed" },
    partner_access: { score: 5, known_partners: ["Accenture", "Infosys", "TCS"], backbase_access: true, note: "Works with major SIs; Backbase has Accenture partnership" }
  },
  "SEB_Sweden": {
    firmographics: { score: 9, note: "€340B assets, 19K staff, Tier 1 D-SIB, strong corporate/wealth" },
    technographics: { score: 6, note: "Mix legacy/modern; ~3K tech staff; cloud migration underway; new COO function for tech acceleration" },
    decision_process: { score: 7, note: "New COO function streamlines tech decisions; new retail/wealth heads making platform choices NOW" },
    landing_zones: { score: 9, note: "Wealth platform (new division), Business Banking, Corporate RM, Baltic — excellent fit" },
    pain_push: { score: 8, note: "THREE new leaders in role making decisions; 2025-2027 business plan; competitive pressure from Klarna/neobanks" },
    power_map: { score: 8, activated: true, note: "Henrik Magnusson (Acting Head Group Tech), Monica Cederberg (CPO), Sven Eggefalk (Head Retail) — all identified with LinkedIn" },
    partner_access: { score: 6, known_partners: ["Cognizant", "Deloitte", "KPMG"], backbase_access: true, note: "Works with Cognizant; Backbase has partnership" }
  },
  "DNB_Norway": {
    firmographics: { score: 9, note: "$340B assets, 9.5K staff, 30% Norway market share, Tier 1" },
    technographics: { score: 7, note: "Heavy digital investment; AI-driven insights; Vipps integration; in-house capability strong" },
    decision_process: { score: 6, note: "Large organization; structured procurement; technology under Elin Sandnes EVP" },
    landing_zones: { score: 8, note: "Retail digital, Wealth, SME banking, Corporate — strong fit across all lines" },
    pain_push: { score: 7, note: "SpareBank 1 competition, neobank threat, energy transition creating new product needs" },
    power_map: { score: 7, activated: true, note: "Elin Sandnes (EVP Technology), CIO, CDO identified; need deeper mapping" },
    partner_access: { score: 6, known_partners: ["Accenture", "TCS", "Capgemini"], backbase_access: true, note: "Major SI partnerships; Backbase has Accenture/Capgemini access" }
  },
  "Handelsbanken_Sweden": {
    firmographics: { score: 9, note: "€350B assets, 12K staff, unique decentralized model, UK operations" },
    technographics: { score: 4, note: "Conservative tech approach; aging systems; UK on separate stack; decentralization complicates platform decisions" },
    decision_process: { score: 4, note: "Extremely decentralized — branch managers influence decisions; consensus needed; slow" },
    landing_zones: { score: 7, note: "Retail digital, UK platform, Wealth advisory tools — good fit but decentralized model limits scope" },
    pain_push: { score: 7, note: "UK restructuring; digital gap vs competitors widening; customer demographics shifting to digital-first" },
    power_map: { score: 6, activated: true, note: "CPO, Head IT Development identified; BUT branch manager influence makes power map unusual" },
    partner_access: { score: 4, known_partners: ["TietoEVRY", "local vendors"], backbase_access: false, note: "Uses Nordic-specific vendors; limited Backbase partner overlap" }
  },
  "Swedbank_Sweden": {
    firmographics: { score: 8, note: "€250B assets, 15K staff, largest retail customer base in Sweden + Baltics" },
    technographics: { score: 5, note: "Post-AML scandal tech rebuild; CIO Lotta Lovén driving modernization; Baltic systems separate" },
    decision_process: { score: 6, note: "Centralized IT under CIO; post-scandal governance is more structured; Baltic adds complexity" },
    landing_zones: { score: 8, note: "Retail banking, Baltic multi-market deployment, SME banking, Digital channels — excellent" },
    pain_push: { score: 8, note: "Post-AML reputation rebuild drives modernization urgency; Baltic competition; losing customers to neobanks" },
    power_map: { score: 7, activated: true, note: "CIO Lotta Lovén, Head Digital Banking, Head Group Channels identified" },
    partner_access: { score: 5, known_partners: ["TietoEVRY", "Cognizant"], backbase_access: true, note: "Cognizant relationship exists; TietoEVRY is primary" }
  },
  "Danske Bank_Denmark": {
    firmographics: { score: 10, note: "€520B assets, 20K staff, Denmark's largest, pan-Nordic, D-SIB" },
    technographics: { score: 6, note: "3.5K tech staff; major modernization investment; first Head of AI (Dr Fiona Browne); compliance tech upgraded" },
    decision_process: { score: 6, note: "Post-scandal governance restructured; CEO Egeriis driving pivot from remediation to growth" },
    landing_zones: { score: 9, note: "Personal banking, Business banking, Wealth, pan-Nordic deployment — full stack fit" },
    pain_push: { score: 9, note: "Post-AML pivot to growth; lost market share to Nykredit/Jyske; MUST modernize to win back customers" },
    power_map: { score: 7, activated: true, note: "CEO Egeriis, CIO, Dr Fiona Browne (Head of AI), CDO, COO all identified" },
    partner_access: { score: 6, known_partners: ["Accenture", "IBM", "Infosys"], backbase_access: true, note: "Major SI relationships; Backbase has Accenture/IBM partnerships" }
  },
  "OP Financial Group_Finland": {
    firmographics: { score: 9, note: "€170B assets, 12K staff, 4.4M customers (78% of Finland), 120+ cooperative banks" },
    technographics: { score: 5, note: "Shared platform across 120+ banks; aging; modernization critical but complex due to cooperative structure" },
    decision_process: { score: 5, note: "Cooperative governance = slow consensus; central institution makes shared tech decisions; 120 stakeholders" },
    landing_zones: { score: 10, note: "Multi-entity cooperative deployment is THE Backbase sweet spot; bancassurance; retail; wealth" },
    pain_push: { score: 7, note: "Competition from Nordea Finland; need modern platform to serve 120+ bank entities consistently" },
    power_map: { score: 6, activated: true, note: "CIO/Head Group IT, CDO, Head Digital Products identified; cooperative structure means more stakeholders" },
    partner_access: { score: 5, known_partners: ["Accenture", "TietoEVRY", "CGI"], backbase_access: true, note: "Accenture partnership; CGI local presence" }
  },
  "TF Bank_Sweden": {
    firmographics: { score: 5, note: "SEK 25B assets, 300 staff, niche digital credit across 14 EU markets" },
    technographics: { score: 7, note: "Proprietary IT platform; Azure cloud-first; Worldline processing; lean dev team SE/PL/CZ/MK" },
    decision_process: { score: 9, note: "Small company; CPIO Stefan Görling owns BOTH product AND tech; single decision maker" },
    landing_zones: { score: 7, note: "Broker-to-direct CX shift; card expansion from 200K to 1-2M needs engagement; rebranding to Avarda Bank" },
    pain_push: { score: 8, note: "Avarda rebrand = new digital front-end across 14 countries; broker-to-direct shift = building CX from scratch" },
    power_map: { score: 9, activated: true, note: "Stefan Görling (CPIO) — PRIMARY TARGET — confirmed LinkedIn; Claudia Wiese (COO); Vilma Sool (CCO)" },
    partner_access: { score: 5, known_partners: ["Worldline", "Mastercard"], backbase_access: false, note: "Worldline processing partner; limited Backbase partner overlap" }
  },
  "Länsförsäkringar_Sweden": {
    firmographics: { score: 7, note: "€40B assets, ~6K staff (bank: 1.5K), 23 regional companies, bancassurer" },
    technographics: { score: 5, note: "Shared banking platform for 23 regional cos; aging; insurance tech separate from banking" },
    decision_process: { score: 4, note: "Federated governance — 23 regional companies must agree; slow consensus" },
    landing_zones: { score: 7, note: "Multi-entity deployment for 23 cos; bancassurance journey integration; retail banking" },
    pain_push: { score: 6, note: "Insurance-banking integration is strategic priority but not crisis-level urgency" },
    power_map: { score: 5, activated: false, note: "CEO Anders Borgcrantz identified; deeper mapping needed across 23 regional companies" },
    partner_access: { score: 4, known_partners: ["Local Nordic vendors"], backbase_access: false, note: "Limited partner overlap" }
  },
  "SBAB_Sweden": {
    firmographics: { score: 6, note: "€45B assets, ~700 staff, state-owned mortgage specialist" },
    technographics: { score: 7, note: "Digital-first; modern systems for narrow product range; API-enabled" },
    decision_process: { score: 6, note: "Small org; faster decisions; government ownership adds procurement layer" },
    landing_zones: { score: 4, note: "Mortgage origination + savings only — narrow product scope limits platform value" },
    pain_push: { score: 4, note: "No crisis; steady digital investment; narrow scope means limited urgency for engagement platform" },
    power_map: { score: 3, activated: false, note: "CEO identified; limited decision maker mapping" },
    partner_access: { score: 3, known_partners: ["Unknown"], backbase_access: false, note: "Partner landscape not mapped" }
  },
  "Skandiabanken_Sweden": {
    firmographics: { score: 5, note: "€18B assets, part of Skandia Group (~3.5K), savings/pension focus" },
    technographics: { score: 5, note: "Banking secondary to insurance/pension tech; moderate modernization" },
    decision_process: { score: 5, note: "Group-level decisions; banking not primary investment priority" },
    landing_zones: { score: 5, note: "Pension + banking integration; savings journeys; limited retail scope" },
    pain_push: { score: 4, note: "Banking is secondary business; no transformation trigger" },
    power_map: { score: 3, activated: false, note: "Group-level decision makers; bank-specific contacts not mapped" },
    partner_access: { score: 3, known_partners: ["Unknown"], backbase_access: false, note: "Not mapped" }
  },
  "Klarna Bank_Sweden": {
    firmographics: { score: 6, note: "€13B assets, ~5K staff, Europe's top fintech" },
    technographics: { score: 10, note: "Builds everything in-house; 5K+ engineers; AI-first; proprietary platform" },
    decision_process: { score: 1, note: "WILL NEVER BUY — builds everything in-house" },
    landing_zones: { score: 1, note: "Not applicable — Klarna IS an engagement platform" },
    pain_push: { score: 1, note: "No pain that Backbase solves — competitive intel only" },
    power_map: { score: 2, activated: false, note: "Sebastian Siemiatkowski (CEO) known but not a prospect" },
    partner_access: { score: 1, known_partners: ["N/A"], backbase_access: false, note: "Not a prospect" }
  },
  "SpareBank 1 SR-Bank_Norway": {
    firmographics: { score: 7, note: "€28B assets, ~2.2K staff, largest SpareBank 1 Alliance member" },
    technographics: { score: 5, note: "Shared Alliance platform via SpareBank 1 Utvikling; needs modernization" },
    decision_process: { score: 6, note: "Alliance consensus model; SR-Bank influential as largest member; Utvikling makes shared tech calls" },
    landing_zones: { score: 8, note: "Multi-entity Alliance deployment (14 banks); retail; wealth (oil-economy clients); SME" },
    pain_push: { score: 7, note: "Alliance platform review cycle; competing with DNB on digital; oil transition needs" },
    power_map: { score: 6, activated: true, note: "CEO Inge Reinertsen, CTO identified; SpareBank 1 Utvikling key" },
    partner_access: { score: 5, known_partners: ["Evry/TietoEVRY", "Sopra Steria"], backbase_access: false, note: "Nordic-focused vendors; limited Backbase overlap" }
  },
  "SpareBank 1 SMN_Norway": {
    firmographics: { score: 6, note: "€19B assets, ~1.7K staff, second-largest Alliance member" },
    technographics: { score: 6, note: "Most tech-forward Alliance member; shares platform but pushes innovation" },
    decision_process: { score: 6, note: "Alliance governance; SMN often pilots new tech for Alliance" },
    landing_zones: { score: 7, note: "Alliance multi-entity; retail; SME; digital lending" },
    pain_push: { score: 6, note: "Digital competition; Alliance modernization pressure" },
    power_map: { score: 5, activated: false, note: "CEO identified; deeper mapping needed" },
    partner_access: { score: 5, known_partners: ["SpareBank 1 Utvikling", "TietoEVRY"], backbase_access: false, note: "Alliance tech entity is key partner" }
  },
  "Nordea Norway_Norway": {
    firmographics: { score: 8, note: "€70B assets, ~3.5K staff, third-largest in Norway" },
    technographics: { score: 6, note: "Group platform; follows Helsinki decisions" },
    decision_process: { score: 3, note: "NO local decision authority — all group-level from Helsinki" },
    landing_zones: { score: 7, note: "Corporate, wealth, retail — but decided at group level" },
    pain_push: { score: 5, note: "Follows group; losing local market share" },
    power_map: { score: 4, activated: false, note: "Local head known; must engage Helsinki" },
    partner_access: { score: 5, known_partners: ["Group partners"], backbase_access: true, note: "Via Nordea Group" }
  },
  "SpareBank 1 Østlandet_Norway": {
    firmographics: { score: 6, note: "€17B assets, ~1.5K staff, post-merger regional bank" },
    technographics: { score: 4, note: "Multiple legacy systems from merged banks; consolidation underway" },
    decision_process: { score: 5, note: "Post-merger; Alliance governance; settling into new structure" },
    landing_zones: { score: 6, note: "Alliance deployment; post-merger platform consolidation" },
    pain_push: { score: 6, note: "Post-merger integration urgency; must unify systems" },
    power_map: { score: 4, activated: false, note: "CEO Richard Heiberg identified; limited deeper mapping" },
    partner_access: { score: 5, known_partners: ["Alliance shared"], backbase_access: false, note: "Alliance tech" }
  },
  "Handelsbanken Norway_Norway": {
    firmographics: { score: 6, note: "€18B assets, ~800 staff, branch of Swedish group" },
    technographics: { score: 4, note: "Group platform; conservative approach" },
    decision_process: { score: 3, note: "NO local authority — Stockholm decides" },
    landing_zones: { score: 5, note: "Group-level; Norwegian needs subordinate to group" },
    pain_push: { score: 5, note: "Norwegian digital bar high (DNB/Vipps) but group moves slowly" },
    power_map: { score: 3, activated: false, note: "Local country head; group decisions" },
    partner_access: { score: 4, known_partners: ["Group partners"], backbase_access: false, note: "Via group" }
  },
  "Sbanken_Norway": {
    firmographics: { score: 4, note: "€9B assets, ~350 staff, DNB subsidiary since 2021" },
    technographics: { score: 7, note: "Born-digital; strong tech DNA; but now under DNB" },
    decision_process: { score: 2, note: "DNB subsidiary — ALL decisions through DNB; no independence" },
    landing_zones: { score: 3, note: "Pursue through DNB only; Sbanken brand may be absorbed" },
    pain_push: { score: 2, note: "No independent pain — DNB drives strategy" },
    power_map: { score: 2, activated: false, note: "DNB leadership makes decisions" },
    partner_access: { score: 3, known_partners: ["DNB partners"], backbase_access: true, note: "Through DNB" }
  },
  "Storebrand Bank_Norway": {
    firmographics: { score: 5, note: "€5B bank assets, ~1.8K group staff, bancassurer" },
    technographics: { score: 5, note: "Pension tech more advanced than banking; moderate banking platform" },
    decision_process: { score: 6, note: "Group CEO drives strategy; bank is one division; cleaner governance" },
    landing_zones: { score: 6, note: "Pension + banking integration; ESG product journeys; savings" },
    pain_push: { score: 6, note: "Growing banking arm; ESG differentiation pressure; pension-banking integration need" },
    power_map: { score: 5, activated: false, note: "Group CEO known; bank-specific contacts limited" },
    partner_access: { score: 4, known_partners: ["Norwegian vendors"], backbase_access: false, note: "Limited overlap" }
  },
  "Nykredit_Denmark": {
    firmographics: { score: 9, note: "€240B assets, ~5K staff, Denmark's largest mortgage lender, Tier 1" },
    technographics: { score: 5, note: "Mortgage-era systems; NOT built for retail engagement; heavy investment announced" },
    decision_process: { score: 7, note: "CEO David Hellemann driving expansion; retail head needs tools NOW; structured but motivated" },
    landing_zones: { score: 9, note: "Mortgage-to-relationship-bank transformation = PERFECT Backbase story; retail, SME, onboarding" },
    pain_push: { score: 9, note: "Must build retail banking capability from scratch on top of mortgage platform; Danske weakness window closing" },
    power_map: { score: 6, activated: false, note: "CEO identified; Head of Retail Banking key; CTO/CDO need mapping" },
    partner_access: { score: 5, known_partners: ["KMD/NEC", "local Danish vendors"], backbase_access: false, note: "Danish vendor landscape; needs mapping" }
  },
  "Jyske Bank_Denmark": {
    firmographics: { score: 8, note: "€94B assets, ~4.2K staff, third-largest Danish bank" },
    technographics: { score: 5, note: "Two systems post-Handelsbanken-Denmark acquisition; integration underway" },
    decision_process: { score: 7, note: "CEO Lars Stensgaard Mørch driving integration; contrarian culture = open to unconventional" },
    landing_zones: { score: 8, note: "Post-acquisition platform consolidation; unified engagement layer; retail + private banking" },
    pain_push: { score: 8, note: "URGENT — post-acquisition integration; two customer bases; two tech stacks; must unify" },
    power_map: { score: 5, activated: false, note: "CEO identified; Head of IT key; deeper mapping needed" },
    partner_access: { score: 4, known_partners: ["BEC (Bankernes EDB Central)"], backbase_access: false, note: "BEC is shared Danish bank IT provider; complex" }
  },
  "Nordea Denmark_Denmark": {
    firmographics: { score: 8, note: "€107B assets, ~3K staff, part of Nordea Group" },
    technographics: { score: 6, note: "Group platform" },
    decision_process: { score: 3, note: "NO local authority — Helsinki decides" },
    landing_zones: { score: 6, note: "Group-level decisions" },
    pain_push: { score: 5, note: "Losing Danish share to Nykredit/Jyske" },
    power_map: { score: 4, activated: false, note: "Local head; group decisions" },
    partner_access: { score: 5, known_partners: ["Group partners"], backbase_access: true, note: "Via group" }
  },
  "Sydbank_Denmark": {
    firmographics: { score: 6, note: "€34B assets, ~2.2K staff, fourth-largest Danish bank" },
    technographics: { score: 5, note: "Moderate; modernizing; cross-border DK-Germany adds complexity" },
    decision_process: { score: 6, note: "Long-tenured CEO; steady; structured procurement" },
    landing_zones: { score: 6, note: "Private banking digital; cross-border DK-Germany; retail modernization" },
    pain_push: { score: 5, note: "Steady modernization; no crisis trigger; private banking growth" },
    power_map: { score: 4, activated: false, note: "CEO Karen Frøsig identified; limited deeper mapping" },
    partner_access: { score: 4, known_partners: ["BEC", "local vendors"], backbase_access: false, note: "BEC shared infrastructure" }
  },
  "Spar Nord_Denmark": {
    firmographics: { score: 5, note: "€24B assets, ~1.7K staff, fifth-largest, community focus" },
    technographics: { score: 4, note: "Community bank tech; needs modernization; smaller budget" },
    decision_process: { score: 6, note: "Smaller org; faster decisions; community governance" },
    landing_zones: { score: 5, note: "Community banking personalization; SME; limited scope" },
    pain_push: { score: 5, note: "Scale pressure; must compete digitally with national banks" },
    power_map: { score: 4, activated: false, note: "CEO Lasse Nyby identified; Head of Digital key" },
    partner_access: { score: 4, known_partners: ["BEC", "local"], backbase_access: false, note: "Danish shared infra" }
  },
  "Lunar_Denmark": {
    firmographics: { score: 3, note: "€2B assets, ~500 staff, venture-backed neobank" },
    technographics: { score: 10, note: "Builds everything in-house; mobile-only; proprietary stack" },
    decision_process: { score: 1, note: "WILL NEVER BUY — builds everything in-house" },
    landing_zones: { score: 1, note: "Not applicable — competitive intel only" },
    pain_push: { score: 1, note: "No Backbase-solvable pain" },
    power_map: { score: 2, activated: false, note: "CEO known; not a prospect" },
    partner_access: { score: 1, known_partners: ["N/A"], backbase_access: false, note: "Not a prospect" }
  },
  "Nordea Finland_Finland": {
    firmographics: { score: 10, note: "€570B group assets, 30K group staff, GROUP HQ IN HELSINKI" },
    technographics: { score: 6, note: "Group-level; massive legacy transformation; strong in-house capability" },
    decision_process: { score: 6, note: "THIS IS WHERE GROUP DECISIONS ARE MADE — Helsinki C-suite" },
    landing_zones: { score: 9, note: "Full group-wide deployment; retail, wealth, business, corporate across 4 markets" },
    pain_push: { score: 7, note: "One Platform transformation pressure; neobank competition across all markets" },
    power_map: { score: 8, activated: true, note: "Frank Vang-Jensen (CEO), Malthe Falck (CPO), John Van Uden (CTO) — all Helsinki-based, all identified" },
    partner_access: { score: 6, known_partners: ["Accenture", "TCS", "Infosys", "Cognizant"], backbase_access: true, note: "Major SI partnerships; Backbase has access" }
  },
  "Danske Bank Finland_Finland": {
    firmographics: { score: 5, note: "€30B assets, ~1K staff, smallest Danske market" },
    technographics: { score: 5, note: "Group platform from Copenhagen" },
    decision_process: { score: 3, note: "NO local authority — Copenhagen decides" },
    landing_zones: { score: 4, note: "Group-level; small Finnish presence" },
    pain_push: { score: 3, note: "Smallest market, lowest priority for group" },
    power_map: { score: 3, activated: false, note: "Local head; group decisions" },
    partner_access: { score: 4, known_partners: ["Group partners"], backbase_access: true, note: "Via group" }
  },
  "Municipality Finance (MuniFin)_Finland": {
    firmographics: { score: 5, note: "€40B assets, ~180 staff, AAA-rated municipal lender" },
    technographics: { score: 3, note: "Municipal bond systems; no retail tech" },
    decision_process: { score: 2, note: "Municipal governance; no retail banking decisions" },
    landing_zones: { score: 1, note: "ZERO retail/SME banking — pure wholesale/municipal" },
    pain_push: { score: 1, note: "No engagement platform need" },
    power_map: { score: 2, activated: false, note: "CEO known; not relevant" },
    partner_access: { score: 2, known_partners: ["Municipal vendors"], backbase_access: false, note: "Not relevant" }
  },
  "Savings Bank Group (Säästöpankki)_Finland": {
    firmographics: { score: 5, note: "€13B assets, ~1.5K staff, 16 cooperative savings banks" },
    technographics: { score: 4, note: "Aging shared platform; needs modernization across all 16 banks" },
    decision_process: { score: 5, note: "Savings Bank Centre makes shared tech decisions; cooperative governance" },
    landing_zones: { score: 8, note: "Multi-entity cooperative = identical to OP architecture need; retail; digital banking" },
    pain_push: { score: 7, note: "Competing with OP on digital; shared platform aging; must modernize to retain customers" },
    power_map: { score: 4, activated: false, note: "Central institution CEO and CTO key; not yet mapped" },
    partner_access: { score: 4, known_partners: ["TietoEVRY", "local"], backbase_access: false, note: "Nordic vendors" }
  },
  "S-Bank_Finland": {
    firmographics: { score: 6, note: "€10B assets, 3M+ customers, S Group cooperative" },
    technographics: { score: 5, note: "Basic banking platform; built for simple products; retail data integration potential" },
    decision_process: { score: 5, note: "S Group drives digital strategy; banking is one division; group-level decisions" },
    landing_zones: { score: 6, note: "Retail engagement; loyalty-banking integration; lending expansion" },
    pain_push: { score: 5, note: "Growing product range; loyalty integration need; but banking not primary S Group business" },
    power_map: { score: 3, activated: false, note: "S-Bank CEO identified; S Group Digital key; not mapped" },
    partner_access: { score: 3, known_partners: ["S Group vendors"], backbase_access: false, note: "Retail-focused vendor ecosystem" }
  },
  "POP Bank Group_Finland": {
    firmographics: { score: 3, note: "€5B assets, ~700 staff, 19 tiny local cooperative banks" },
    technographics: { score: 3, note: "Small-scale shared platform; limited tech investment capacity" },
    decision_process: { score: 5, note: "Central institution decides; small scale = potentially faster" },
    landing_zones: { score: 6, note: "Multi-entity cooperative; basic digital banking; same architecture need as OP but micro-scale" },
    pain_push: { score: 5, note: "Must digitalize or lose rural customers; limited budgets constrain action" },
    power_map: { score: 3, activated: false, note: "Central CEO identified; not mapped" },
    partner_access: { score: 3, known_partners: ["Local vendors"], backbase_access: false, note: "Not mapped" }
  },
  "Aktia Bank_Finland": {
    firmographics: { score: 5, note: "€11B assets, ~900 staff, wealth focus, Swedish-Finnish heritage" },
    technographics: { score: 5, note: "Legacy systems; digital transformation program underway" },
    decision_process: { score: 6, note: "Smaller org; CEO driving transformation; structured but not slow" },
    landing_zones: { score: 7, note: "Wealth management platform; private banking advisory; bilingual digital experience" },
    pain_push: { score: 6, note: "Legacy constraining growth; competition from OP/Nordea on wealth clients" },
    power_map: { score: 5, activated: false, note: "CEO Juha Hammarén identified; CTO key" },
    partner_access: { score: 4, known_partners: ["Finnish vendors"], backbase_access: false, note: "Local ecosystem" }
  },
  "Landsbankinn_Iceland": {
    firmographics: { score: 5, note: "€13B assets, ~1.1K staff, 38% Iceland market, government-owned" },
    technographics: { score: 5, note: "Post-crisis rebuild; modernization mindset; island-scale systems" },
    decision_process: { score: 7, note: "Smaller org; CEO-driven; government ownership adds procurement layer but manageable" },
    landing_zones: { score: 7, note: "Full retail digital; SME tourism sector; payments; compact bounded scope" },
    pain_push: { score: 7, note: "Digital modernization program active; government reducing stake = commercialization pressure" },
    power_map: { score: 6, activated: true, note: "CEO Lilja Björk Einarsdóttir identified with LinkedIn" },
    partner_access: { score: 3, known_partners: ["Local Icelandic vendors"], backbase_access: false, note: "Small market; limited partner presence" }
  },
  "Íslandsbanki_Iceland": {
    firmographics: { score: 5, note: "€10B assets, ~800 staff, 30% Iceland, IPO'd 2021" },
    technographics: { score: 5, note: "Post-crisis systems; investing in digital; moderate maturity" },
    decision_process: { score: 7, note: "Post-IPO; shareholder pressure drives faster decisions; smaller org" },
    landing_zones: { score: 7, note: "Retail digital; SME; post-IPO growth needs modern engagement" },
    pain_push: { score: 7, note: "IPO pressure for growth and efficiency; competing with Landsbankinn on digital" },
    power_map: { score: 5, activated: false, note: "CEO identified; deeper mapping needed" },
    partner_access: { score: 3, known_partners: ["Local vendors"], backbase_access: false, note: "Small Icelandic market" }
  },
  "Arion Bank_Iceland": {
    firmographics: { score: 4, note: "€8.5B assets, ~700 staff, smallest of three Icelandic banks" },
    technographics: { score: 6, note: "Most digitally ambitious; fintech partnerships; open to innovation" },
    decision_process: { score: 8, note: "Small, agile; digital-forward CEO; fastest decision cycle in Iceland" },
    landing_zones: { score: 6, note: "Retail digital; innovation pilot; quick deployment potential" },
    pain_push: { score: 6, note: "Scale disadvantage drives need for technology differentiation" },
    power_map: { score: 5, activated: false, note: "CEO Benedikt Gíslason identified; Head of Digital Innovation key" },
    partner_access: { score: 3, known_partners: ["Fintech partners"], backbase_access: false, note: "Innovation-focused vendors" }
  }
};
