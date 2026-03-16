export const VALUE_SELLING = {
  "SEB_Sweden": {
    value_hypothesis: {
      if_condition: "SEB has created a dedicated COO function to 'accelerate technology adoption,' appointed a new Head of Business & Retail Banking (Sven Eggefalk), and consolidated Wealth into a single division (William Paus) — three leaders making platform decisions NOW",
      then_outcome: "Backbase can deliver a unified engagement platform across Retail, Wealth, and Corporate within the 2025-2027 business plan cycle",
      by_deploying: "Backbase Wealth (advisor cockpit + client portal) as entry, expanding to Retail Banking (mobile + PFM) and Business Banking (SME portal + lending)",
      resulting_in: "30-40% faster time-to-market for new digital products, 25% improvement in digital NPS (extending #1 call center quality to digital), €20-40M platform consolidation savings across Sweden + Baltics over 5 years",
      one_liner: "Extend SEB's #1 call center quality to every digital channel — before Klarna captures the next generation."
    },
    product_mapping: [
      {zone:"Wealth & Asset Management Platform",products:["Backbase Wealth"],modules:["Advisor Cockpit","Client Portal","Portfolio View","Digital Onboarding"],timeline:"6-9 months",users:"~100K wealth clients + ~500 advisors"},
      {zone:"Business & Retail Banking",products:["Backbase Retail Banking","Backbase Business Banking"],modules:["Mobile Banking","PFM","Digital Sales","SME Dashboard","Lending Origination"],timeline:"12-18 months",users:"~4M retail + ~300K SME customers"},
      {zone:"Corporate RM Engagement",products:["Backbase Assist"],modules:["Client 360","Next-Best-Action","Deal Pipeline","Relationship Dashboard"],timeline:"6-9 months",users:"~2,000 corporate RMs"},
      {zone:"Baltic Digital Banking",products:["Backbase Retail Banking"],modules:["Multi-market deployment","Localized onboarding","Mobile Banking"],timeline:"9-12 months",users:"~2M Baltic customers"},
      {zone:"Green Product Origination",products:["Backbase Lending","Backbase Origination"],modules:["Green Mortgage Origination","ESG Investment Onboarding","Sustainability Scoring"],timeline:"6 months (add-on)",users:"All lending customers"}
    ],
    reference_customers: [
      {name:"ABN AMRO",relevance:"Similar-sized European universal bank. Wealth + retail + corporate deployment. Kirsten Renner (SEB's Head of Group Tech) was ABN AMRO CIO — she KNOWS Backbase.",region:"Netherlands"},
      {name:"Barclays",relevance:"Large-scale retail + wealth + corporate engagement platform. Multi-entity UK deployment.",region:"UK"},
      {name:"Julius Baer",relevance:"Pure wealth management Backbase deployment. Advisor cockpit reference for SEB's new Wealth division.",region:"Switzerland"}
    ],
    discovery_questions: [
      "The new COO function was created to 'increase pace of technology adoption' — what specific digital capabilities are you targeting to deliver by end of 2026?",
      "Sven Eggefalk came from running a bank CEO role into Head of Business & Retail. How is he rethinking the retail digital platform vs what SEB had before?",
      "Your call center ranks #1 in Sweden. What's the plan to deliver that same service quality through digital self-service and mobile?",
      "William Paus consolidated Wealth & Asset Management into one division. Is he evaluating a unified digital advisory platform across the advisor and client experience?",
      "SEB Cards operates on a separate tech stack. Is there a roadmap to integrate the cards experience into the core banking app?",
      "The Baltic operations serve 3 countries on different systems. Is platform consolidation on the agenda, and what's the timeline?",
      "You've been investing heavily in ESG and green bonds. How are you thinking about digital origination journeys for green financial products?"
    ]
  },
  "Danske Bank_Denmark": {
    value_hypothesis: {
      if_condition: "Danske Bank has paid $2B in AML fines and is pivoting from remediation to growth under CEO Egeriis, having lost market share to Nykredit and Jyske during the scandal, while operating fragmented platforms across 5 Nordic markets",
      then_outcome: "Backbase can be the growth platform that proves Danske Bank is back — winning customers through digital experience excellence rather than just retaining them through inertia",
      by_deploying: "Pan-Nordic Retail Banking platform (unified across DK/NO/SE/FI) + Danish SME Banking portal + Realkredit Danmark mortgage origination",
      resulting_in: "€30-50M cost savings from consolidating 5 market platforms into one, 20% improvement in customer acquisition (digital onboarding), recovery of 50K+ customers lost to Nykredit/Jyske through superior digital experience",
      one_liner: "Turn the post-AML pivot into a digital experience advantage — make Danske Bank the comeback story of Nordic banking."
    },
    product_mapping: [
      {zone:"Pan-Nordic Retail Digital",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments","Cards"],timeline:"12-18 months (DK first, then NO/SE/FI)",users:"~3.3M personal customers across 4 markets"},
      {zone:"Danish SME Banking",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Lending Origination","Invoice Management","Cash Management"],timeline:"9-12 months",users:"~200K business customers"},
      {zone:"Mortgage Origination (Realkredit)",products:["Backbase Lending","Backbase Origination"],modules:["Covered Bond Origination","Mortgage Application","Document Management","Rate Advisory"],timeline:"9-12 months",users:"~800K mortgage customers"},
      {zone:"KYC/Onboarding Excellence",products:["Backbase Identity","Backbase Origination"],modules:["Digital Onboarding","KYC/AML","Document Verification","MitID Integration"],timeline:"6 months",users:"All new customers"},
      {zone:"Ecosystem Banking (Vipps/MobilePay)",products:["Backbase Retail Banking"],modules:["Open Banking APIs","Payment Integrations","Marketplace Banking"],timeline:"6-9 months (add-on)",users:"~2M MobilePay users"}
    ],
    reference_customers: [
      {name:"ING",relevance:"Pan-European bank that unified multiple country platforms into one engagement layer. Similar scale and multi-market challenge.",region:"Netherlands/Europe"},
      {name:"Lloyds Banking Group",relevance:"Large retail bank that modernized post-regulatory-pressure. Digital transformation at scale with millions of customers.",region:"UK"},
      {name:"BNP Paribas",relevance:"Multi-country European universal bank. Complex regulatory environment. Pan-European platform consolidation.",region:"France/Europe"}
    ],
    discovery_questions: [
      "The pivot from remediation to growth — what does 'growth' look like digitally? Is it winning new customers, deepening existing relationships, or both?",
      "Dr Fiona Browne is your first Head of AI. What's her mandate for AI in customer engagement specifically, and what platform does she need to deliver it?",
      "You operate banking platforms in 5 Nordic markets. What's the cost of maintaining 5 separate digital experiences vs a unified approach?",
      "Nykredit and Jyske gained market share during the AML period. What digital experience would convince those customers to come back?",
      "Realkredit Danmark's covered bond system is unique globally. How are you thinking about digitizing that origination journey?",
      "You have a significant Vipps MobilePay stake. How are you leveraging that for ecosystem banking — embedded finance, payment-linked offers?",
      "Post-AML, compliance and customer experience seem like opposing forces. How do you make KYC/onboarding feel effortless while being fully compliant?"
    ]
  },
  "Nordea Finland_Finland": {
    value_hypothesis: {
      if_condition: "Nordea's One Platform transformation across 4 Nordic countries is behind schedule, with 6,000 engineers struggling to deliver customer-facing engagement fast enough while modernizing legacy core, and a new strategy period starting in 2025+",
      then_outcome: "Backbase can accelerate customer-facing digital delivery by 50% by providing the engagement layer ON TOP of Nordea's core modernization — decoupling CX speed from core complexity",
      by_deploying: "Backbase Retail Banking + Wealth as the pan-Nordic engagement layer, deployed market-by-market starting with the highest-urgency country",
      resulting_in: "12-month faster time-to-market for new digital products across 4 markets, 25% reduction in multi-market digital development cost, unified 10M+ customer experience that finally delivers on the 'One Nordea' promise",
      one_liner: "Decouple the speed of customer experience from the complexity of core transformation — deliver One Nordea digitally while the platform catches up."
    },
    product_mapping: [
      {zone:"Pan-Nordic Unified Retail",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Payments","Digital Sales","Cards"],timeline:"18-24 months (phased by country)",users:"~10M personal customers across 4 markets"},
      {zone:"Wealth & Asset Management",products:["Backbase Wealth"],modules:["Advisor Cockpit","Client Portal","Portfolio Management","Digital Advisory"],timeline:"9-12 months",users:"~500K wealth clients + ~3,500 advisors"},
      {zone:"SME/Business Banking",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Lending","Cash Management","Invoicing"],timeline:"12-15 months",users:"~500K+ business customers"},
      {zone:"Digital Onboarding & KYC",products:["Backbase Identity","Backbase Origination"],modules:["Multi-country onboarding","BankID/MitID/NemID","KYC/AML"],timeline:"6-9 months",users:"All new customers across 4 markets"}
    ],
    reference_customers: [
      {name:"HSBC",relevance:"Global bank with multi-market platform challenge. Backbase deployed at massive scale across markets.",region:"Global"},
      {name:"ABN AMRO",relevance:"Kirsten Renner connection (SEB's tech head, ex-ABN CIO). Similar European universal bank scale.",region:"Netherlands"},
      {name:"Raiffeisen Bank International",relevance:"Multi-country CEE deployment. Platform serving multiple national banking operations.",region:"Austria/CEE"}
    ],
    discovery_questions: [
      "The One Platform vision has been running since 2018. What's working, what's proving harder than expected, and where could an acceleration layer help?",
      "You have 6,000 engineers and €1.5B tech spend. What percentage goes to maintaining legacy vs building new customer-facing capabilities?",
      "Customer satisfaction is 'up across the board' per your annual report. But where does Nordea still lag behind neobanks like Klarna on digital engagement?",
      "The new strategy period starting 2025+ — what's the digital experience ambition that differentiates it from the current strategy?",
      "Martin Persson is building the wealth management division. What digital advisory tools does he envision for Nordic affluent clients?",
      "5M+ users actively use your app. What engagement metrics (beyond logins) are you tracking, and which ones need improvement?"
    ]
  },
  "Nordea_Sweden": {
    value_hypothesis: {
      if_condition: "Nordea's Swedish operations serve millions of customers on a platform being unified under the One Nordea vision from Helsinki, while Swedish neobanks (Klarna, etc.) capture younger demographics with superior engagement",
      then_outcome: "Backbase can deliver Swedish-market-specific engagement features at speed, within the group platform framework, to stop customer attrition to neobanks",
      by_deploying: "Backbase Retail Banking mobile engagement layer + PFM + Digital Sales for the Swedish market, integrated with group platform",
      resulting_in: "Halt the under-35 demographic attrition to neobanks, 35% increase in mobile engagement metrics, Swedish digital NPS matching or exceeding SEB/Swedbank within 18 months",
      one_liner: "Win back Swedish millennials before Klarna finishes building a bank."
    },
    product_mapping: [
      {zone:"Swedish Retail Engagement",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Spending Insights"],timeline:"12-15 months",users:"~3M Swedish retail customers"},
      {zone:"Swedish Wealth Digital",products:["Backbase Wealth"],modules:["Client Portal","Advisory Tools","Portfolio View"],timeline:"9-12 months",users:"~200K Swedish wealth clients"}
    ],
    reference_customers: [
      {name:"ABN AMRO",relevance:"Kirsten Renner connection. Similar European market. Retail + wealth deployment.",region:"Netherlands"},
      {name:"BPCE/Banque Populaire",relevance:"Large retail bank modernizing engagement in a competitive European market.",region:"France"}
    ],
    discovery_questions: [
      "Swedish customers under 35 are increasingly choosing Klarna for daily financial management. What's Nordea's strategy to win them back?",
      "How does the group One Platform approach handle Swedish-specific needs like Swish integration and BankID?",
      "What's the biggest friction point in your Swedish customer onboarding journey today?"
    ]
  },
  "DNB_Norway": {
    value_hypothesis: {
      if_condition: "DNB dominates Norway (30% share) but runs two digital platforms post-Sbanken acquisition, while the SpareBank 1 Alliance is collectively investing in a shared modern platform that could leapfrog DNB on engagement",
      then_outcome: "Backbase can unify the DNB + Sbanken digital experience AND deliver engagement capabilities that maintain DNB's digital leadership against the Alliance's collective investment",
      by_deploying: "Post-Sbanken Unified Retail Platform + SME Banking Portal (200K+ businesses) + Ecosystem Banking integration with Vipps MobilePay",
      resulting_in: "Platform consolidation saving NOK 200-400M over 5 years, 40% improvement in SME digital banking NPS, maintaining #1 digital banking position in Norway against SpareBank 1 Alliance",
      one_liner: "Unify DNB + Sbanken into Norway's undisputed digital banking champion — before SpareBank 1 closes the gap."
    },
    product_mapping: [
      {zone:"Post-Sbanken Unified Retail",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Payments","Cards","Savings Goals"],timeline:"12-15 months",users:"~2.1M personal + ~350K Sbanken customers"},
      {zone:"SME/Business Banking Portal",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Lending Origination","Cash Management","Invoice Tools"],timeline:"9-12 months",users:"~200K corporate/SME clients"},
      {zone:"Wealth & Savings",products:["Backbase Wealth"],modules:["Digital Advisory","Portfolio Management","Pension Tools"],timeline:"9-12 months",users:"~300K wealth/pension customers"},
      {zone:"Ecosystem Banking (Vipps)",products:["Backbase Retail Banking"],modules:["Open Banking APIs","Marketplace Banking","Payment-Linked Engagement"],timeline:"6-9 months (add-on)",users:"~4M Vipps users (overlap)"}
    ],
    reference_customers: [
      {name:"Lloyds Banking Group",relevance:"Post-acquisition platform unification (Lloyds + HBOS). Similar scale retail banking modernization.",region:"UK"},
      {name:"BNP Paribas",relevance:"European universal bank with multiple brand platforms unified through engagement layer.",region:"France"},
      {name:"Rabobank",relevance:"Dominant domestic market player (like DNB in Norway). Cooperative heritage. Ecosystem banking approach.",region:"Netherlands"}
    ],
    discovery_questions: [
      "Two years post-Sbanken acquisition — are you converging on one platform, running two, or building something new? What's the digital experience roadmap?",
      "Elin Sandnes came from McKinsey to lead Technology. What 'platform mindset' is she bringing — build vs buy philosophy?",
      "SpareBank 1 Alliance is collectively investing in shared digital banking. Does that competitive dynamic accelerate your platform decisions?",
      "The new CFO sits on the Vipps MobilePay board. How are you thinking about ecosystem banking — payments as a gateway to deeper engagement?",
      "200K+ corporate clients use dated SME tools. What would a 'best-in-Norway' SME banking experience look like to you?",
      "34% government ownership creates a 'best bank for Norway' mandate. How does that translate into digital experience investment priority?"
    ]
  },
  "OP Financial Group_Finland": {
    value_hypothesis: {
      if_condition: "OP is a cooperative of 120+ independent banks serving 78% of Finland, needing a unified digital platform that preserves local identity while delivering consistent quality — the exact multi-entity architecture challenge Backbase was built for",
      then_outcome: "Backbase can deploy ONE platform across 120+ cooperative banks, each with its own branding and local configuration, while sharing core capabilities — something no other vendor can do at this scale",
      by_deploying: "Multi-Entity Retail Banking platform + Bancassurance Journey Orchestration + Employee Assist across all cooperatives",
      resulting_in: "€50-100M savings from consolidating 120+ bank digital experiences onto one platform, 35% improvement in cross-product journey completion (banking→insurance), becoming THE global reference for cooperative banking platforms",
      one_liner: "One platform, 120 banks, 4.4 million customers — the cooperative banking deployment that becomes Backbase's global reference."
    },
    product_mapping: [
      {zone:"Multi-Entity Cooperative Platform",products:["Backbase Retail Banking"],modules:["Multi-Entity Architecture","White-Label Customization","Central Management","Local Configuration"],timeline:"18-24 months (phased rollout across cooperatives)",users:"~4.4M customers across 120+ banks"},
      {zone:"Bancassurance Journeys",products:["Backbase Origination","Backbase Retail Banking"],modules:["Cross-Product Origination","Insurance Quoting","Mortgage→Insurance Bundle","Life Event Triggers"],timeline:"12-15 months",users:"~3M bancassurance customers"},
      {zone:"SME & Entrepreneur Banking",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Lending","Local Business Support"],timeline:"12 months",users:"~500K SME customers"},
      {zone:"Employee Assist",products:["Backbase Assist"],modules:["RM Cockpit","Client 360","Cross-Cooperative Intelligence","Service Queue"],timeline:"9-12 months",users:"~5,000 frontline staff across cooperatives"}
    ],
    reference_customers: [
      {name:"Rabobank",relevance:"Dutch cooperative bank. Multi-entity deployment. Similar federated governance. THE primary reference.",region:"Netherlands"},
      {name:"Crédit Agricole",relevance:"French cooperative banking group with 39 regional banks. Federated model. Large-scale multi-entity.",region:"France"},
      {name:"Desjardins",relevance:"Canadian cooperative financial group. Insurance + banking (bancassurance). Similar scale.",region:"Canada"}
    ],
    discovery_questions: [
      "120+ independent cooperative banks on a shared platform — what's the biggest tension between 'centralized consistency' and 'local autonomy' in digital experience?",
      "OP Light proved you can launch innovative digital products. What prevented that same experience from rolling out across all cooperatives?",
      "The bancassurance model is OP's differentiator. But how seamless is the customer journey BETWEEN banking and insurance products today? Where does it break?",
      "When a member bank CEO says 'I want something different from the standard platform' — how do you handle that today? What would ideal flexibility look like?",
      "4.4M customers means any platform improvement has massive scale impact. What's the one digital experience metric you most want to move in the next 2 years?",
      "The cooperative governance model means shared decisions. How long does a major platform decision typically take, and who needs to say yes?"
    ]
  },
  "Swedbank_Sweden": {
    value_hypothesis: {
      if_condition: "Swedbank has Sweden's largest retail customer base (7.2M) but post-AML brand damage is driving attrition to neobanks, while 500K+ SME customers use dated digital tools and Baltic operations need platform consolidation",
      then_outcome: "Backbase can be the digital proof that Swedbank has turned the corner — a visibly modern customer experience that gives 7.2M customers a reason to stay",
      by_deploying: "Retail Banking platform (Sweden) + SME Banking portal (500K businesses) + Baltic multi-country deployment (Estonia, Latvia, Lithuania)",
      resulting_in: "Halt post-scandal customer attrition (save ~200K customers), 50% improvement in SME digital satisfaction, Baltic platform consolidation saving €15-25M over 5 years",
      one_liner: "Give 7.2 million Swedes a reason to stay — make Swedbank's digital experience match its market-leading scale."
    },
    product_mapping: [
      {zone:"Retail Digital (7.2M customers)",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments","Spending Insights"],timeline:"12-15 months",users:"~7.2M retail customers"},
      {zone:"SME Banking (500K businesses)",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Lending Origination","Invoice Management","Cash Flow Tools"],timeline:"9-12 months",users:"~500K SME customers"},
      {zone:"Baltic Operations",products:["Backbase Retail Banking"],modules:["Multi-Market Deployment","Localized Onboarding","Local Payment Integration"],timeline:"12-18 months",users:"~2.5M Baltic customers"},
      {zone:"KYC/AML Onboarding",products:["Backbase Identity","Backbase Origination"],modules:["Digital Onboarding","AML Screening","Document Verification"],timeline:"6-9 months",users:"All new customers"}
    ],
    reference_customers: [
      {name:"ING",relevance:"Large European retail bank that modernized engagement. Similar customer scale. Multi-market operations.",region:"Netherlands/Europe"},
      {name:"Raiffeisen Bank International",relevance:"Multi-country CEE deployment (like Swedbank's Baltics). Platform serving multiple national operations.",region:"Austria/CEE"},
      {name:"Bank of Ireland",relevance:"Post-crisis reputation rebuilding through digital modernization. Similar narrative.",region:"Ireland"}
    ],
    discovery_questions: [
      "7.2M customers is Sweden's largest retail base. Post-AML, what's the digital experience strategy to retain them against Klarna and Revolut?",
      "CIO Lotta Lovén rose from Head of Digital Banking. What's her vision for the engagement layer specifically?",
      "500K+ SME customers on dated tools — what's the timeline for a modern SME digital banking experience?",
      "The Baltic operations serve 3 countries on separate platforms. Is consolidation on the roadmap, and could the Baltics be a pilot for a new platform?",
      "Post-scandal, organizational resistance to change is reportedly lower. Is this window being used for bold platform decisions?",
      "Board Chair Göran Persson (former PM) frames banking as 'serving Sweden.' How does that translate into digital investment appetite?"
    ]
  },
  "TF Bank_Sweden": {
    value_hypothesis: {
      if_condition: "TF Bank is rebranding to Avarda Bank across 14 European countries while growing from 200K to 1-2M credit cards, with ZERO customer-facing digital engagement infrastructure — building CX from scratch",
      then_outcome: "Backbase can be the digital experience platform for the entire Avarda Bank brand launch — the only vendor that can deploy across 14 countries from day one with configurable, localized engagement",
      by_deploying: "Avarda Bank Digital Experience (multi-market mobile + web) + Credit Card Engagement App + Multi-Market Onboarding Orchestration",
      resulting_in: "Launch Avarda Bank brand digitally across 14 markets in 9-12 months, 5x cardholder engagement (from zero direct interaction to daily-use app), convert broker-acquired customers into direct relationships increasing lifetime value by 40%",
      one_liner: "Build Avarda Bank's digital identity from scratch — 14 countries, one platform, zero legacy to replace."
    },
    product_mapping: [
      {zone:"Avarda Bank Digital Experience",products:["Backbase Retail Banking"],modules:["Mobile Banking","Web Portal","Multi-Language","Multi-Market Config","Brand Customization"],timeline:"9-12 months",users:"~1M+ customers across 14 markets"},
      {zone:"Credit Card Engagement App",products:["Backbase Retail Banking"],modules:["Card Management","Transaction Alerts","Spending Insights","Rewards","Fraud Reporting"],timeline:"6-9 months",users:"200K→1-2M cardholders"},
      {zone:"Multi-Market Onboarding",products:["Backbase Origination","Backbase Identity"],modules:["Digital Onboarding","Multi-Country KYC","Local ID Verification","Regulatory Config"],timeline:"6-9 months",users:"All new customers in 14 markets"},
      {zone:"Merchant Portal (B2B)",products:["Backbase Business Banking"],modules:["Merchant Dashboard","Settlement Views","Analytics"],timeline:"6 months (add-on)",users:"~5,000 e-commerce merchants"}
    ],
    reference_customers: [
      {name:"Advanzia Bank",relevance:"Pan-European card issuer. Multi-market digital banking. Similar niche banking model.",region:"Luxembourg/Europe"},
      {name:"N26",relevance:"Multi-market European digital bank. Scaled mobile-first experience across countries. Different model but similar multi-market challenge.",region:"Germany/Europe"},
      {name:"Openbank (Santander)",relevance:"Digital bank built on modern platform. Multi-market European expansion.",region:"Spain/Europe"}
    ],
    discovery_questions: [
      "The Avarda rebrand is a once-in-a-decade moment. What's the digital experience vision for the new brand — what should Avarda FEEL like to a customer?",
      "You're going from 200K to 1-2M cards. At what point does the broker-intermediated model break, and direct customer engagement become essential?",
      "Stefan, you built the proprietary back-end platform. For the customer-facing layer — build again from scratch, or partner for speed?",
      "14 countries means 14 regulatory regimes for onboarding. How are you solving multi-market KYC today, and what breaks as you scale?",
      "Claudia Wiese came from Solaris and Fidor — both platform banking companies. What platform thinking is she bringing to Avarda's operational build-out?",
      "The NICE Actimize deal showed willingness to buy best-of-breed. Is the engagement layer the next buy decision?"
    ]
  },
  "SpareBank 1 SR-Bank_Norway": {
    value_hypothesis: {
      if_condition: "SR-Bank is the largest member of the SpareBank 1 Alliance (14 independent banks, ~30% of Norway's retail market), using a shared but aging digital platform that can't match DNB's digital experience",
      then_outcome: "Backbase can provide the Alliance's next-generation shared digital banking platform — one platform, 14 independent banks, local customization, shared innovation",
      by_deploying: "Multi-Entity Retail Banking platform for the SpareBank 1 Alliance, starting with SR-Bank pilot + SMN as co-pilot, expanding Alliance-wide",
      resulting_in: "Alliance-wide digital experience matching DNB, €10-20M+ deal across 14 banks, 30% reduction in per-bank digital platform costs through shared architecture, new wealth management digital capabilities for oil-economy clients",
      one_liner: "Unite 14 independent banks on one platform — and give the SpareBank 1 Alliance the digital firepower to challenge DNB."
    },
    product_mapping: [
      {zone:"Alliance Multi-Entity Platform",products:["Backbase Retail Banking"],modules:["Multi-Entity Architecture","White-Label per Bank","Shared Components","Central Governance"],timeline:"18-24 months Alliance-wide (12 months SR-Bank pilot)",users:"~1.5M customers (SR-Bank) → ~4M+ (Alliance)"},
      {zone:"Oil Economy Wealth Management",products:["Backbase Wealth"],modules:["Digital Advisory","Portfolio Management","Investment Onboarding","Pension Tools"],timeline:"9-12 months",users:"~200K wealth clients in Rogaland"},
      {zone:"SME Banking (Energy Sector)",products:["Backbase Business Banking","Backbase Lending"],modules:["Business Dashboard","Green Lending Origination","Cash Management"],timeline:"9-12 months",users:"~50K corporate/SME clients"}
    ],
    reference_customers: [
      {name:"Rabobank",relevance:"Cooperative bank with local entities sharing one platform. THE reference for Alliance model.",region:"Netherlands"},
      {name:"OP Financial Group",relevance:"If OP chooses Backbase, it proves the cooperative model at 120+ bank scale.",region:"Finland"},
      {name:"Crédit Agricole",relevance:"39 regional banks on shared platform. Similar federated governance.",region:"France"}
    ],
    discovery_questions: [
      "The Alliance shares technology through SpareBank 1 Utvikling. What's the current platform's biggest limitation for your digital ambitions?",
      "As the largest Alliance member, how much influence does SR-Bank have over shared technology decisions? Could you pilot a new platform independently?",
      "DNB's digital banking experience is the benchmark in Norway. What specific capabilities do you wish the Alliance platform had to compete?",
      "The oil-to-renewables transition is reshaping Rogaland's economy. What new digital banking products do your energy sector clients need?",
      "14 independent banks with different local needs on one platform — what's the right balance between standardization and customization?",
      "SpareBank 1 SMN is known as the Alliance's innovation leader. Could SR-Bank and SMN co-pilot a new platform before Alliance-wide rollout?"
    ]
  },
  "Nykredit_Denmark": {
    value_hypothesis: {
      if_condition: "Nykredit is Denmark's largest mortgage lender transforming into a full-service retail bank, having acquired hundreds of thousands of customers from Danske Bank's weakness, but lacking the retail engagement platform those customers expect",
      then_outcome: "Backbase can deliver the entire retail banking engagement experience Nykredit has never had — built on top of the mortgage infrastructure, turning one-time mortgage customers into daily banking relationships",
      by_deploying: "Retail Banking Platform (greenfield) + Mortgage-to-Relationship Journey Orchestration + Business Banking + Digital Onboarding",
      resulting_in: "Convert 50% of mortgage-only customers to multi-product relationships (2.5x revenue per customer), retain 90%+ of customers acquired during Danske Bank weakness, launch competitive daily banking app within 12 months",
      one_liner: "Build the retail bank Nykredit has never been — before the customers acquired from Danske Bank walk out the door."
    },
    product_mapping: [
      {zone:"Retail Banking Platform (Greenfield)",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments","Cards","Savings"],timeline:"12-15 months",users:"~1M+ retail customers (and growing)"},
      {zone:"Mortgage-to-Relationship Journey",products:["Backbase Origination","Backbase Retail Banking"],modules:["Cross-Sell Engine","Product Recommendations","Insurance Integration","Savings Goals"],timeline:"6-9 months (after retail launch)",users:"~800K mortgage customers"},
      {zone:"Business Banking",products:["Backbase Business Banking","Backbase Lending"],modules:["SME Dashboard","Business Lending","Cash Management"],timeline:"12-15 months",users:"~100K business clients"},
      {zone:"Digital Onboarding",products:["Backbase Origination","Backbase Identity"],modules:["Retail Onboarding","MitID Integration","KYC/AML","Account Opening"],timeline:"6 months (phase 1)",users:"All new customers"}
    ],
    reference_customers: [
      {name:"Nationwide Building Society",relevance:"UK mortgage-focused institution that expanded into full retail banking. Exact same transformation story.",region:"UK"},
      {name:"ING",relevance:"Built modern retail banking engagement from a historically wholesale/commercial base.",region:"Netherlands"},
      {name:"ABN AMRO",relevance:"Dutch bank that transformed its retail engagement. Similar market size.",region:"Netherlands"}
    ],
    discovery_questions: [
      "You've acquired significant retail market share from Danske Bank's weakness. What percentage of those customers are 'mortgage-only' vs multi-product relationships today?",
      "The covered bond mortgage system is world-class. But what does a daily banking experience look like for a Nykredit customer beyond the mortgage?",
      "What's the biggest gap when a new retail customer opens their first Nykredit account — what do they miss coming from Danske Bank or Nordea?",
      "David Hellemann is driving the retail expansion. What's the 2-year vision for Nykredit's retail digital banking experience?",
      "You've announced major technology investment. Is that investment directed at modernizing the mortgage platform, building the retail platform, or both?",
      "Business banking is growing. How are you differentiating the SME experience from what Danske Bank and Jyske offer?"
    ]
  },
  "Handelsbanken_Sweden": {
    value_hypothesis: {
      if_condition: "Handelsbanken is closing 200+ UK branches and must build a digital bank for remaining UK customers, while its Nordic app ratings (3.8-4.1) are the lowest of any major Nordic bank and the decentralized branch model needs digital empowerment tools",
      then_outcome: "Backbase can deliver the UK digital banking platform AND the branch-manager empowerment tools that preserve Handelsbanken's unique decentralized model — digitally",
      by_deploying: "UK Digital Banking (greenfield retail) + Assist (Branch Manager Empowerment) + Nordic Retail Digital (multi-market)",
      resulting_in: "UK digital banking live in 9-12 months (saving the UK franchise), 40% improvement in Nordic app ratings, branch managers making better decisions faster with AI-powered client insights — without centralizing control",
      one_liner: "Build the digital bank that saves Handelsbanken's UK franchise — then bring those superpowers to every Nordic branch manager."
    },
    product_mapping: [
      {zone:"UK Digital Banking (Greenfield)",products:["Backbase Retail Banking","Backbase Origination"],modules:["Mobile Banking","Web Banking","Digital Onboarding","Mortgage Origination","PFM"],timeline:"9-12 months",users:"~200K UK customers"},
      {zone:"Branch Manager Empowerment (Assist)",products:["Backbase Assist"],modules:["Client 360","Next-Best-Action","Proactive Alerts","Relationship Dashboard"],timeline:"6-9 months",users:"~5,000 branch managers across Nordics"},
      {zone:"Nordic Retail Digital",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments"],timeline:"12-18 months",users:"~5M Nordic retail customers"},
      {zone:"Digital Onboarding",products:["Backbase Origination","Backbase Identity"],modules:["KYC/AML","Multi-Market Onboarding","BankID Integration"],timeline:"6 months",users:"All new customers"}
    ],
    reference_customers: [
      {name:"HSBC",relevance:"Global bank with decentralized country operations. Multi-market Backbase deployment at massive scale.",region:"Global"},
      {name:"Lloyds Banking Group",relevance:"UK retail banking platform modernization. Similar UK market challenge.",region:"UK"},
      {name:"Metro Bank",relevance:"Branch-centric UK bank investing in digital alongside physical. Same philosophy as Handelsbanken.",region:"UK"}
    ],
    discovery_questions: [
      "200+ UK branches closed. What's the plan for the remaining UK customers — migrate to digital, refer to Nordic operations, or build a UK digital bank?",
      "The decentralized model gives branch managers autonomy. What digital tools would make them MORE empowered, not less — what does a 'digital superpower' for a branch manager look like?",
      "Your app ratings are 3.8-4.1 — lowest among Swedish Big 4. Is that a conscious trade-off for the relationship model, or is it becoming a liability?",
      "CIO Mattias Forsberg is empowered in the new streamlined executive team. What's his technology modernization priority for the next 18 months?",
      "Customer satisfaction leadership is Handelsbanken's crown jewel. As branch traffic declines, how do you maintain that satisfaction through digital channels?",
      "The UK transformation could be a blueprint for Nordic digital modernization. Are you thinking about it that way — UK as pilot for a broader platform?"
    ]
  },
  "Jyske Bank_Denmark": {
    value_hypothesis: {
      if_condition: "Jyske Bank acquired Handelsbanken Denmark and now runs two customer bases on two different tech stacks, while needing to compete with Danske Bank and Nykredit on digital experience quality",
      then_outcome: "Backbase can unify the Jyske + Handelsbanken Denmark customer experience in one platform — turning the acquisition integration from a cost center into a digital leap forward",
      by_deploying: "Unified Retail Banking Platform + Private Banking Digital Advisory + Branch-Digital Integration for Jyske's 'Experience Centers'",
      resulting_in: "Single customer experience across merged entity within 12 months, 30% reduction in dual-platform maintenance costs, private banking AuM growth through digital advisory, reinvention of the 'experience center' concept digitally",
      one_liner: "Turn Jyske's acquisition headache into Denmark's most innovative digital banking experience."
    },
    product_mapping: [
      {zone:"Post-Acquisition Unified Platform",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments","Account Migration Tools"],timeline:"12-15 months",users:"~1.5M merged customers"},
      {zone:"Private Banking Digital Advisory",products:["Backbase Wealth"],modules:["Advisor Cockpit","Client Portal","Portfolio View","Investment Recommendations"],timeline:"9-12 months",users:"~80K private banking clients + ~500 advisors"},
      {zone:"Branch-Digital Experience Centers",products:["Backbase Assist","Backbase Retail Banking"],modules:["In-Branch Digital Tools","Client 360","Appointment Booking","Digital Signing"],timeline:"6-9 months",users:"~4,200 branch staff"}
    ],
    reference_customers: [
      {name:"ABN AMRO",relevance:"Post-merger bank that unified multiple platforms. Similar integration challenge.",region:"Netherlands"},
      {name:"Virgin Money UK",relevance:"Post-CYBG merger platform unification. Contrarian brand like Jyske.",region:"UK"},
      {name:"Julius Baer",relevance:"Wealth management Backbase deployment. Reference for Jyske's private banking ambition.",region:"Switzerland"}
    ],
    discovery_questions: [
      "Handelsbanken Denmark customers came from a relationship-first culture. Jyske is known for 'experience centers.' How are you blending these two service philosophies into one digital experience?",
      "Two tech stacks post-acquisition — what's the consolidation timeline, and is it driving platform evaluation decisions right now?",
      "Jyske's 'experience center' branches are famous for innovation. What would the digital equivalent of an experience center look like?",
      "Private banking is growing. How are your advisors currently equipped digitally — and what's the gap between what they have and what they need?",
      "Lars Stensgaard Mørch is known for unconventional thinking. Does that openness extend to technology platform choices — would you consider approaches other banks haven't tried?"
    ]
  },
  "Landsbankinn_Iceland": {
    value_hypothesis: {
      if_condition: "Landsbankinn controls 38% of Iceland's banking market (380K population) with systems rebuilt after the 2008 crisis now approaching 15+ years old, while government stake reduction increases commercial pressure to demonstrate digital leadership",
      then_outcome: "Backbase can deliver a complete digital banking transformation for Iceland's largest bank — a clean, bounded deployment that covers an entire national market",
      by_deploying: "Full Retail Banking Platform + SME Tourism Banking + Digital Lending & Mortgage",
      resulting_in: "Iceland's best digital banking experience within 12 months, 30% cost reduction through digital automation, new revenue from tourism sector digital products, a Nordic island banking reference deployable to similar markets",
      one_liner: "Transform Iceland's largest bank into a digital showcase — one island, one platform, 38% of the market."
    },
    product_mapping: [
      {zone:"Full Retail Digital Banking",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Payments","Cards","Savings","Digital Sales"],timeline:"9-12 months",users:"~145K retail customers"},
      {zone:"SME Tourism Banking",products:["Backbase Business Banking","Backbase Lending"],modules:["Business Dashboard","Seasonal Lending","FX Tools","Payment Processing"],timeline:"6-9 months",users:"~15K tourism SMEs"},
      {zone:"Digital Lending & Mortgage",products:["Backbase Lending","Backbase Origination"],modules:["Mortgage Origination","Consumer Lending","Auto Decisioning"],timeline:"6-9 months",users:"~50K lending customers"}
    ],
    reference_customers: [
      {name:"Bank of Ireland",relevance:"Island-nation bank (similar scale to Iceland). Post-crisis digital modernization. Strong reference for national-scale deployment.",region:"Ireland"},
      {name:"ASB Bank (New Zealand)",relevance:"Small-market national bank with Backbase deployment. Similar population scale.",region:"New Zealand"},
      {name:"Banque Internationale à Luxembourg",relevance:"Small-market European bank. Digital modernization at national scale.",region:"Luxembourg"}
    ],
    discovery_questions: [
      "Your systems were rebuilt after 2008 — they're now 15+ years old. Where are you feeling the age most: customer-facing, back-office, or both?",
      "Government stake is being reduced. How does that change the urgency for demonstrating commercial and digital competitiveness?",
      "Iceland's tourism boom created unique banking needs. What digital products would your tourism business customers most value?",
      "With 38% market share and 380K population — one platform decision covers the whole country. Are you thinking about this as a national-scale digital transformation?",
      "Íslandsbanki IPO'd in 2021 and Arion Bank is innovating fast. What's your strategy to maintain digital leadership against them?"
    ]
  },
  "Aktia Bank_Finland": {
    value_hypothesis: {
      if_condition: "Aktia is a wealth-focused Finnish bank with Swedish-speaking heritage, competing against OP and Nordea for affluent clients but lacking the digital advisory tools those competitors are building",
      then_outcome: "Backbase Wealth can deliver the digital private banking experience that differentiates Aktia — hybrid advisory, client portals, and portfolio tools that match the human advisory quality Aktia is known for",
      by_deploying: "Backbase Wealth (advisor cockpit + client portal) + Bilingual Digital Experience (Finnish/Swedish) + Digital Lending",
      resulting_in: "20% increase in AuM through digital client acquisition, 30% advisor productivity improvement through Backbase Assist, bilingual digital experience that no competitor matches, becoming THE digital wealth bank for Swedish-speaking Finland",
      one_liner: "Give Aktia's private bankers digital tools as good as their advice — and become Finland's digital wealth leader."
    },
    product_mapping: [
      {zone:"Wealth Management Digital Platform",products:["Backbase Wealth"],modules:["Advisor Cockpit","Client Portal","Portfolio View","Investment Onboarding","Reporting"],timeline:"9-12 months",users:"~40K wealth clients + ~250 advisors"},
      {zone:"Bilingual Digital Experience",products:["Backbase Retail Banking"],modules:["Mobile Banking","Multi-Language Config","PFM","Digital Sales"],timeline:"12 months",users:"~300K retail customers"},
      {zone:"Digital Lending",products:["Backbase Lending","Backbase Origination"],modules:["Mortgage Origination","Consumer Lending","Digital Signing"],timeline:"6-9 months",users:"~80K lending customers"}
    ],
    reference_customers: [
      {name:"Julius Baer",relevance:"Pure private banking Backbase Wealth deployment. THE reference for wealth-focused banks.",region:"Switzerland"},
      {name:"EFG International",relevance:"Mid-tier wealth manager with Backbase digital advisory. Similar scale to Aktia.",region:"Switzerland"},
      {name:"ABN AMRO Private Banking",relevance:"Multi-language wealth management platform. Dutch/English like Aktia's Finnish/Swedish.",region:"Netherlands"}
    ],
    discovery_questions: [
      "Your private bankers are known for advisory quality. What digital tools would make them even better — not replace the relationship, but enhance it?",
      "Bilingual service (Finnish/Swedish) is a differentiator. How well does your current digital platform handle both languages — is it truly bilingual or translated?",
      "OP and Nordea are investing heavily in wealth technology. What's Aktia's strategy to compete digitally for affluent clients?",
      "CEO Juha Hammarén is driving digital transformation. What's the wealth platform priority vs retail platform priority — which comes first?"
    ]
  },
  "Storebrand Bank_Norway": {
    value_hypothesis: {
      if_condition: "Storebrand is Norway's largest private pension provider expanding its banking arm, needing to integrate pension-to-banking journeys digitally while differentiating through ESG leadership",
      then_outcome: "Backbase can deliver the integrated pension-banking digital experience that turns Storebrand's pension customers into full banking relationships",
      by_deploying: "Pension-Banking Integration Platform + ESG Investment Journeys + Retail Banking Expansion",
      resulting_in: "Convert 30% of pension-only customers to banking relationships (incremental revenue from existing customer base), launch Norway's first fully digital ESG banking product suite, 25% growth in banking AuM through digital advisory",
      one_liner: "Turn Norway's pension leader into a digital banking powerhouse — sustainable finance, seamless journeys, pension to daily banking."
    },
    product_mapping: [
      {zone:"Pension-Banking Integration",products:["Backbase Retail Banking","Backbase Wealth"],modules:["Pension Dashboard","Banking Integration","Savings Goals","Retirement Planning"],timeline:"12 months",users:"~500K pension customers → banking conversion"},
      {zone:"ESG Investment Journeys",products:["Backbase Wealth","Backbase Origination"],modules:["ESG Portfolio Builder","Green Mortgage","Sustainability Scoring","Impact Reporting"],timeline:"6-9 months",users:"~200K investment customers"},
      {zone:"Retail Banking Growth",products:["Backbase Retail Banking"],modules:["Mobile Banking","PFM","Digital Sales","Payments"],timeline:"12-15 months",users:"~100K banking customers (growing)"}
    ],
    reference_customers: [
      {name:"Aegon/Transamerica",relevance:"Pension/insurance group expanding into digital banking. Same pension-to-banking journey.",region:"Netherlands/US"},
      {name:"Standard Life Aberdeen",relevance:"Pension and investment group with banking ambitions. ESG focus.",region:"UK"},
      {name:"Rabobank",relevance:"Sustainability-focused Dutch bank. ESG product origination reference.",region:"Netherlands"}
    ],
    discovery_questions: [
      "500K+ pension customers who don't bank with Storebrand — what's the conversion strategy, and what digital experience would trigger that switch?",
      "You're a global ESG investing leader. What would a 'fully sustainable digital banking' product suite look like — green mortgage, ESG savings, impact dashboard?",
      "The banking arm is growing but still small relative to pensions. At what scale does banking justify its own platform investment?",
      "Pension drawdown → daily banking is the key journey. How seamless is that transition today, and where does it break?"
    ]
  }
};
