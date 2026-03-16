export const COMP_DATA = {
  "Nordea_Sweden": {
    core_banking: "In-house / multi-vendor legacy",
    digital_platform: "In-house (One Platform program)",
    key_vendors: ["Temenos (partial)","Microsoft Azure","Salesforce CRM","In-house engineering (~6K)"],
    vendor_risk: "Strong in-house capability may resist buying engagement layer. One Platform program is building internally.",
    competitive_threats: ["Klarna (retail BNPL expanding to banking)","Lunar (Nordic neobank)","SEB (corporate/wealth competition)","Local savings banks (community trust)"],
    backbase_competitors_at_bank: ["Temenos Infinity (evaluated)","In-house build"],
    market_position: "Largest Nordic bank but perceived as slow-moving. Losing retail customers to neobanks. Strong in corporate/institutional."
  },
  "SEB_Sweden": {
    core_banking: "Legacy + modernizing",
    digital_platform: "In-house with vendor components",
    key_vendors: ["Cognizant (SI partner)","Deloitte (consulting)","Microsoft Azure","Bloomberg (trading)"],
    vendor_risk: "Wallenberg culture values quality; strong in-house engineering may prefer building. New COO function created to ACCELERATE tech adoption — signal they know they're too slow.",
    competitive_threats: ["Nordea (corporate overlap)","EQT/private equity (wealth competition)","Klarna (retail)","Carnegie (investment banking)"],
    backbase_competitors_at_bank: ["In-house preference","Temenos (awareness)"],
    market_position: "Premium corporate and wealth bank. #1 call center. Strong brand but digital engagement lags behind the human channel quality."
  },
  "DNB_Norway": {
    core_banking: "Combination legacy + new components",
    digital_platform: "Strong in-house digital team",
    key_vendors: ["Accenture (SI)","TCS","Capgemini","Microsoft Azure","Vipps MobilePay (partial ownership)"],
    vendor_risk: "DNB's strong digital team and high app ratings may reduce urgency to buy external engagement platform. They've invested heavily in building in-house.",
    competitive_threats: ["SpareBank 1 Alliance (collective competition)","Nordea Norway","Sbanken (own subsidiary competing for digital-native customers)","Bulder Bank (automated mortgage neobank)"],
    backbase_competitors_at_bank: ["In-house build","Potential Temenos evaluation"],
    market_position: "Dominant 30% market share. Best digital experience in Norway. Challenge is maintaining lead while integrating Sbanken and serving SME/corporate digitally."
  },
  "Handelsbanken_Sweden": {
    core_banking: "Legacy systems — among oldest in Swedish banking",
    digital_platform: "Minimal — branch-centric model",
    key_vendors: ["TietoEVRY","In-house (limited)","Local Nordic vendors"],
    vendor_risk: "LOW vendor competition — because Handelsbanken has barely invested in digital platforms. The field is wide open.",
    competitive_threats: ["All other Swedish banks (digital gap widening)","Neobanks capturing younger demographics","ICA Banken (retail competitor)"],
    backbase_competitors_at_bank: ["Very few — greenfield opportunity"],
    market_position: "Strong brand built on personal service. But digital gap is becoming unsustainable as branch foot traffic declines and younger customers default to digital."
  },
  "Swedbank_Sweden": {
    core_banking: "Legacy + post-AML modernization",
    digital_platform: "Rebuilding after AML-era underinvestment",
    key_vendors: ["TietoEVRY (primary)","Cognizant","Microsoft"],
    vendor_risk: "Post-AML technology investment creates opportunity. TietoEVRY is entrenched but the bank is looking to modernize beyond legacy vendors.",
    competitive_threats: ["Nordea (main retail competitor)","Klarna/neobanks","Handelsbanken (trust advantage)","SEB (corporate overlap)"],
    backbase_competitors_at_bank: ["TietoEVRY ecosystem","Temenos (awareness)"],
    market_position: "Largest retail customer base in Sweden but damaged brand. Rebuilding requires demonstrably better digital experience to retain and win back customers."
  },
  "Danske Bank_Denmark": {
    core_banking: "Multi-vendor legacy across 4 Nordic markets",
    digital_platform: "In-house with major modernization investment",
    key_vendors: ["Accenture","IBM","Infosys","Microsoft Azure"],
    vendor_risk: "Large tech organization (3.5K) may prefer in-house. But post-AML remediation consumed capacity — they need to ACCELERATE on CX to compete with Nykredit/Jyske.",
    competitive_threats: ["Nykredit (gained market share during scandal)","Jyske Bank (aggressive post-acquisition)","Nordea Denmark","Lunar (neobank)"],
    backbase_competitors_at_bank: ["In-house build","Temenos (evaluated historically)"],
    market_position: "Still Denmark's largest but wounded. Must pivot from remediation to growth. Digital CX is the primary weapon to win back lost customers."
  },
  "OP Financial Group_Finland": {
    core_banking: "Shared cooperative platform — aging",
    digital_platform: "Centralized digital for 120+ banks",
    key_vendors: ["Accenture","TietoEVRY","CGI","In-house central IT"],
    vendor_risk: "Cooperative governance slows vendor decisions. But the NEED for a multi-entity engagement platform is undeniable — 120+ banks on one system.",
    competitive_threats: ["Nordea Finland (main competitor)","S-Bank (loyalty-driven)","Savings Bank Group","Finnish neobanks"],
    backbase_competitors_at_bank: ["In-house central platform","TietoEVRY components","Temenos (awareness)"],
    market_position: "78% of Finland are OP customers. Dominant position but must modernize to maintain. The cooperative model creates unique multi-entity tech needs."
  },
  "TF Bank_Sweden": {
    core_banking: "Proprietary (in-house built)",
    digital_platform: "Proprietary back-end; NO customer-facing platform",
    key_vendors: ["Microsoft Azure (cloud)","Worldline (payment processing)","Mastercard (card issuing)"],
    vendor_risk: "LOW competition for engagement layer — there IS no existing engagement platform. Stefan Görling (CPIO) makes the call. Greenfield opportunity.",
    competitive_threats: ["Other pan-European digital lenders","Local banks in each of 14 markets","Credit intermediaries/brokers"],
    backbase_competitors_at_bank: ["None — greenfield","Potential to build in-house but 300 staff for 14 countries limits capacity"],
    market_position: "Growing niche player. The Avarda rebrand is a reset moment. Must build direct customer relationships to scale beyond broker dependency."
  },
  "Nykredit_Denmark": {
    core_banking: "Mortgage-focused legacy systems",
    digital_platform: "Mortgage-era platform being expanded for retail",
    key_vendors: ["KMD/NEC","In-house mortgage tech","Local Danish vendors"],
    vendor_risk: "LOW Backbase competition — Nykredit is building retail banking capability from scratch. No existing engagement platform to displace.",
    competitive_threats: ["Danske Bank (recovering, still largest)","Jyske Bank (aggressive)","Nordea Denmark","Lunar (neobank)"],
    backbase_competitors_at_bank: ["In-house build (risk)","BEC (shared Danish bank IT)"],
    market_position: "Second-largest Danish bank, largest mortgage lender. Actively expanding into full-service retail — needs engagement platform they've never had."
  },
  "Jyske Bank_Denmark": {
    core_banking: "Legacy + acquired Handelsbanken Denmark systems",
    digital_platform: "Two systems post-acquisition — needs unification",
    key_vendors: ["BEC (Bankernes EDB Central — shared Danish IT)","JN Data","In-house"],
    vendor_risk: "Post-acquisition system chaos creates URGENCY for a unified engagement layer. BEC is entrenched but may not solve the integration challenge.",
    competitive_threats: ["Danske Bank","Nykredit","Nordea Denmark","Sydbank (regional overlap)"],
    backbase_competitors_at_bank: ["BEC/JN Data ecosystem","In-house (limited capacity)"],
    market_position: "Third-largest Danish bank post-acquisition. Must rapidly integrate two customer bases. Contrarian culture may welcome innovative platform approach."
  }
  ,
  "Länsförsäkringar_Sweden": {
    core_banking:"Shared banking platform for 23 regional companies",
    digital_platform:"Central banking digital + 23 regional insurance platforms",
    key_vendors:["TietoEVRY","In-house central IT","Local Nordic vendors"],
    vendor_risk:"Limited Backbase competition — no existing engagement platform vendor. The federated structure creates a gap that generic platforms can't fill. Multi-entity architecture is the key requirement.",
    competitive_threats:["Skandia (bancassurance competitor)","ICA Banken (retail competitor)","Nordea/SEB (scale advantage)"],
    backbase_competitors_at_bank:["In-house central platform","TietoEVRY components"],
    market_position:"Third-largest bancassurer in Sweden. Strong brand trust through regional insurance relationships. Banking arm is growing but secondary to insurance core."
  },
  "SBAB_Sweden": {
    core_banking:"Purpose-built mortgage systems",
    digital_platform:"Modern mortgage-focused digital platform",
    key_vendors:["In-house built","Microsoft Azure"],
    vendor_risk:"SBAB has a lean, modern tech stack for its narrow scope. May not see need for an engagement platform given limited product range. Low vendor competition but also low urgency.",
    competitive_threats:["Major banks' mortgage operations","Hypoteket (digital mortgage competitor)","Avanza (savings competitor)"],
    backbase_competitors_at_bank:["In-house (current approach)","Limited scope reduces vendor interest"],
    market_position:"Sweden's specialist mortgage lender. Competes on rates and digital speed. Limited product breadth keeps it niche."
  },
  "Skandiabanken_Sweden": {
    core_banking:"Part of Skandia Group technology stack",
    digital_platform:"Skandia Group digital (pension-centric)",
    key_vendors:["Skandia Group IT","Swedish vendors"],
    vendor_risk:"Banking technology decisions made at Skandia Group level. Banking is secondary priority to pension/insurance platforms. Low vendor competition for banking specifically.",
    competitive_threats:["Avanza (savings/investment)","Nordea (full-service)","Länsförsäkringar (bancassurance)"],
    backbase_competitors_at_bank:["Skandia Group internal platform","Pension platform vendors"],
    market_position:"Part of Skandia insurance/pension group. Banking is a supporting business line, not the core. Competes for savings and pension-linked banking."
  },
  "Klarna Bank_Sweden": {
    core_banking:"Fully proprietary — built in-house",
    digital_platform:"Proprietary — 5,000+ engineers",
    key_vendors:["All in-house","AWS cloud infrastructure"],
    vendor_risk:"ZERO opportunity — Klarna builds everything. 5,000+ engineers. Their platform IS the product. Track only for competitive intelligence.",
    competitive_threats:["PayPal","Afterpay/Block","Apple Pay Later","Traditional banks entering BNPL"],
    backbase_competitors_at_bank:["N/A — builds everything in-house"],
    market_position:"Europe's most valuable fintech. Expanding from BNPL into full banking. Sets the digital experience benchmark that all Nordic banks are measured against."
  },
  "SpareBank 1 SR-Bank_Norway": {
    core_banking:"Alliance shared core via SpareBank 1 Utvikling",
    digital_platform:"SpareBank 1 shared mobile/web platform",
    key_vendors:["SpareBank 1 Utvikling (shared tech entity)","Evry/TietoEVRY","Sopra Steria"],
    vendor_risk:"SpareBank 1 Utvikling controls shared technology. Any platform decision involves Alliance consensus. However, the multi-entity engagement gap is clear — no current vendor fills it well.",
    competitive_threats:["DNB (30% market share, superior digital)","Nordea Norway","Bulder Bank (automated mortgage)","Fintechs"],
    backbase_competitors_at_bank:["SpareBank 1 Utvikling in-house","TietoEVRY legacy components","Potential Temenos evaluation"],
    market_position:"Norway's largest savings bank. Dominant in oil-rich Rogaland. Part of SpareBank 1 Alliance — collectively the second-largest banking presence in Norway."
  },
  "SpareBank 1 SMN_Norway": {
    core_banking:"Alliance shared core",
    digital_platform:"SpareBank 1 shared platform",
    key_vendors:["SpareBank 1 Utvikling","TietoEVRY"],
    vendor_risk:"Same Alliance dynamics as SR-Bank. SMN pushes for more innovation but is constrained by Alliance consensus.",
    competitive_threats:["DNB","Nordea Norway","Local savings banks"],
    backbase_competitors_at_bank:["Alliance shared platform","TietoEVRY"],
    market_position:"Second-largest Alliance member. Dominant in central Norway (Trondheim). Known as the most tech-forward Alliance bank."
  },
  "Nordea Norway_Norway": {
    core_banking:"Nordea Group core — Helsinki-managed",
    digital_platform:"Nordea Group digital platform",
    key_vendors:["Group vendors: Accenture, TCS, Infosys"],
    vendor_risk:"Group-level decisions only. No local vendor engagement possible.",
    competitive_threats:["DNB (dominant local player)","SpareBank 1 Alliance","Local savings banks"],
    backbase_competitors_at_bank:["Group-level decisions — see Nordea Group"],
    market_position:"Third-largest in Norway. Losing local market share to DNB and SpareBank 1 banks. Group platform doesn't always serve Norwegian needs first."
  },
  "SpareBank 1 Østlandet_Norway": {
    core_banking:"Alliance shared core",
    digital_platform:"SpareBank 1 shared + post-merger legacy",
    key_vendors:["SpareBank 1 Utvikling","TietoEVRY"],
    vendor_risk:"Post-merger system consolidation may create openness to new platforms. Alliance governance applies.",
    competitive_threats:["DNB","Nordea Norway","Other Alliance banks in overlapping regions"],
    backbase_competitors_at_bank:["Alliance shared platform"],
    market_position:"Eastern Norway savings bank formed from mergers. Growing scale within Alliance but still integrating."
  },
  "Handelsbanken Norway_Norway": {
    core_banking:"Handelsbanken Group core — Stockholm-managed",
    digital_platform:"Group digital platform",
    key_vendors:["Group vendors: TietoEVRY, local Nordic"],
    vendor_risk:"Group-level decisions from Stockholm. No local engagement possible.",
    competitive_threats:["DNB","SpareBank 1 Alliance","Nordea Norway"],
    backbase_competitors_at_bank:["Group-level — see Handelsbanken Group"],
    market_position:"Swedish bank's Norwegian operations. Conservative digital approach falls behind Norwegian digital standards set by DNB/Vipps."
  },
  "Sbanken_Norway": {
    core_banking:"Born-digital proprietary + merging into DNB",
    digital_platform:"Proprietary digital — being integrated into DNB",
    key_vendors:["In-house (pre-acquisition)","Now: DNB tech stack"],
    vendor_risk:"DNB subsidiary. All decisions through DNB. Sbanken platform likely to be gradually merged into DNB's.",
    competitive_threats:["Effectively competing against its own parent DNB for digital-native customers"],
    backbase_competitors_at_bank:["DNB tech decisions apply"],
    market_position:"Norway's first online bank. Beloved brand now under DNB ownership. Future uncertain — may be absorbed into DNB brand."
  },
  "Storebrand Bank_Norway": {
    core_banking:"Storebrand Group technology stack",
    digital_platform:"Pension-centric digital (banking secondary)",
    key_vendors:["Norwegian vendors","In-house Group IT"],
    vendor_risk:"Group-level technology decisions. Banking platform investment competes with pension/insurance priorities. Low vendor competition for banking specifically.",
    competitive_threats:["DNB (full-service)","KLP (pension competitor)","Nordea (wealth)"],
    backbase_competitors_at_bank:["Storebrand Group internal","Pension platform vendors"],
    market_position:"Norway's largest private pension provider with growing banking arm. ESG investing leader. Banking is the expanding business line."
  },
  "Nordea Denmark_Denmark": {
    core_banking:"Nordea Group core",
    digital_platform:"Nordea Group platform",
    key_vendors:["Group vendors"],
    vendor_risk:"Group decisions from Helsinki.",
    competitive_threats:["Danske Bank","Nykredit","Jyske Bank","Lunar"],
    backbase_competitors_at_bank:["Group-level decisions"],
    market_position:"Losing Danish market share. Competitors (Nykredit, Jyske) growing while Nordea feels less 'Danish'."
  },
  "Sydbank_Denmark": {
    core_banking:"BEC (shared Danish bank IT infrastructure)",
    digital_platform:"BEC-based + in-house customization",
    key_vendors:["BEC (Bankernes EDB Central)","JN Data","Local Danish vendors"],
    vendor_risk:"BEC is the primary technology provider for multiple Danish banks. Any engagement platform must integrate with BEC infrastructure. This is both a constraint and an opportunity.",
    competitive_threats:["Danske Bank","Nykredit","Jyske Bank (regional overlap in Jutland)","Nordea Denmark"],
    backbase_competitors_at_bank:["BEC ecosystem","In-house on BEC platform"],
    market_position:"Fourth-largest Danish bank. Strong in southern Jutland and northern Germany. Private banking growth focus."
  },
  "Spar Nord_Denmark": {
    core_banking:"BEC shared infrastructure",
    digital_platform:"BEC-based",
    key_vendors:["BEC","Local vendors"],
    vendor_risk:"Same BEC dependency as Sydbank. Limited budget constrains vendor options.",
    competitive_threats:["Jyske Bank","Sydbank","Danske Bank","National banks entering northern Denmark"],
    backbase_competitors_at_bank:["BEC platform"],
    market_position:"Fifth-largest Danish bank. Community-focused in northern Denmark. Must compete with national banks on digital while maintaining local identity."
  },
  "Lunar_Denmark": {
    core_banking:"Fully proprietary",
    digital_platform:"Proprietary — builds everything",
    key_vendors:["All in-house","Cloud infrastructure"],
    vendor_risk:"ZERO opportunity — builds everything in-house. Track for competitive intelligence only.",
    competitive_threats:["Traditional banks improving digital","Other neobanks","Profitability pressure from investors"],
    backbase_competitors_at_bank:["N/A — not a prospect"],
    market_position:"Nordic's most prominent neobank. Strong SME banking push. Not yet profitable. Competitive reference for incumbent bank conversations."
  },
  "Nordea Finland_Finland": {
    core_banking:"Nordea Group core — GROUP HQ HERE",
    digital_platform:"Group digital platform — DECISIONS MADE HERE",
    key_vendors:["Accenture","TCS","Infosys","Cognizant","Microsoft Azure","AWS"],
    vendor_risk:"Largest potential deal in the Nordics but also the hardest. 6,000-person tech organization may prefer building. But delivery speed is the acknowledged bottleneck — COO function created to 'accelerate.'",
    competitive_threats:["OP Financial Group (78% of Finland)","S-Bank (loyalty scale)","Neobanks","Klarna"],
    backbase_competitors_at_bank:["In-house build (primary risk)","Temenos (historically evaluated)","Potential Backbase opportunity as acceleration layer"],
    market_position:"GROUP HQ. Largest Nordic bank. The One Platform transformation is the defining technology initiative. Engagement layer acceleration is the Backbase value proposition."
  },
  "Danske Bank Finland_Finland": {
    core_banking:"Danske Bank Group core",
    digital_platform:"Group platform from Copenhagen",
    key_vendors:["Group vendors: Accenture, IBM, Infosys"],
    vendor_risk:"Group decisions. Smallest market, lowest priority.",
    competitive_threats:["OP Financial Group","Nordea Finland","S-Bank"],
    backbase_competitors_at_bank:["Group-level decisions"],
    market_position:"Smallest Danske Bank market. Finnish customers prefer local alternatives."
  },
  "Municipality Finance (MuniFin)_Finland": {
    core_banking:"Municipal bond/lending systems",
    digital_platform:"Institutional portal only",
    key_vendors:["Municipal finance specialists"],
    vendor_risk:"NOT APPLICABLE — no retail banking.",
    competitive_threats:["European Investment Bank","Nordic Investment Bank"],
    backbase_competitors_at_bank:["N/A — no engagement platform need"],
    market_position:"AAA-rated municipal lender. No retail banking relevance for Backbase."
  },
  "Savings Bank Group (Säästöpankki)_Finland": {
    core_banking:"Shared cooperative platform (aging)",
    digital_platform:"Savings Bank Centre managed digital",
    key_vendors:["TietoEVRY","In-house central IT","Finnish local vendors"],
    vendor_risk:"Similar to OP — cooperative governance slows decisions. But the platform modernization need is urgent. If OP chooses Backbase, competitive pressure drives Savings Banks to evaluate.",
    competitive_threats:["OP Financial Group (much larger competitor)","Nordea Finland","S-Bank","POP Bank Group"],
    backbase_competitors_at_bank:["TietoEVRY legacy","In-house central platform"],
    market_position:"Finland's second cooperative banking group. 16 member banks competing with OP's 120+. Must modernize to survive."
  },
  "S-Bank_Finland": {
    core_banking:"S Group technology stack",
    digital_platform:"S Group digital ecosystem",
    key_vendors:["S Group IT","Finnish vendors"],
    vendor_risk:"Decisions made at S Group level. Banking is one division of a retail cooperative. Technology priorities go to retail operations first.",
    competitive_threats:["OP Financial Group","Nordea","Savings banks"],
    backbase_competitors_at_bank:["S Group internal platform"],
    market_position:"3M+ customers from S Group loyalty base. Unique retail-banking integration potential. Banking is secondary to S Group's core retail business."
  },
  "POP Bank Group_Finland": {
    core_banking:"Shared micro-cooperative platform",
    digital_platform:"POP Bank Centre managed",
    key_vendors:["Local Finnish vendors","Minimal external"],
    vendor_risk:"Very small scale limits vendor interest and budget. Same cooperative architecture need as OP/Savings Banks but at micro level.",
    competitive_threats:["OP Financial Group","Savings Bank Group","Nordea"],
    backbase_competitors_at_bank:["Current shared platform"],
    market_position:"Smallest Finnish cooperative group. 19 tiny local banks in rural areas. Existential digital modernization need but minimal budget."
  },
  "Aktia Bank_Finland": {
    core_banking:"Legacy Finnish banking systems",
    digital_platform:"In-house + vendor components",
    key_vendors:["Finnish vendors","TietoEVRY (partial)"],
    vendor_risk:"Smaller bank actively modernizing. Open to vendor solutions. Wealth management platform is the highest-priority technology investment.",
    competitive_threats:["OP Financial Group","Nordea","Other Finnish banks in Swedish-speaking market"],
    backbase_competitors_at_bank:["TietoEVRY components","In-house build (limited capacity)","Temenos (awareness)"],
    market_position:"Finnish-Swedish heritage wealth-focused bank. Niche but growing. Digital transformation underway. Backbase Wealth is a natural fit."
  },
  "Landsbankinn_Iceland": {
    core_banking:"Post-crisis rebuilt systems",
    digital_platform:"In-house Icelandic development",
    key_vendors:["Local Icelandic IT companies","Microsoft"],
    vendor_risk:"Small market means limited vendor presence. Landsbankinn has been building in-house but scale limitations make buying increasingly attractive. Low Backbase competition.",
    competitive_threats:["Íslandsbanki (direct competitor)","Arion Bank (digital innovation)"],
    backbase_competitors_at_bank:["In-house build (current approach)","Very few international vendors active in Iceland"],
    market_position:"Iceland's largest bank (38% share). Government-owned. Dominant position but must modernize to maintain leadership as competitors invest in digital."
  },
  "Íslandsbanki_Iceland": {
    core_banking:"Post-crisis systems",
    digital_platform:"In-house development",
    key_vendors:["Local Icelandic vendors","Microsoft"],
    vendor_risk:"Post-IPO creates buyer mentality — must be efficient. Limited vendor competition in Iceland. If Landsbankinn chooses Backbase, Íslandsbanki likely follows.",
    competitive_threats:["Landsbankinn (larger competitor)","Arion Bank (more innovative)"],
    backbase_competitors_at_bank:["In-house","Limited international vendor presence"],
    market_position:"Iceland's second-largest bank. IPO'd 2021. Shareholder pressure for growth and efficiency drives digital investment."
  },
  "Arion Bank_Iceland": {
    core_banking:"Post-crisis modern systems",
    digital_platform:"Most modern of Icelandic banks — fintech-integrated",
    key_vendors:["Fintech partners","Local Icelandic IT","Open banking vendors"],
    vendor_risk:"Innovation-friendly culture. Most likely Icelandic bank to adopt external platform. Small scale but fast decisions.",
    competitive_threats:["Landsbankinn (scale advantage)","Íslandsbanki (IPO momentum)"],
    backbase_competitors_at_bank:["Fintech point solutions","In-house (limited)"],
    market_position:"Smallest but most digitally ambitious Icelandic bank. Innovation leader. Quick decision cycles. Good pilot/reference opportunity."
  }
};
