export const CX_DATA = {
  "Nordea_Sweden": {
    app_rating_ios: 4.6, app_rating_android: 4.3,
    app_name: "Nordea Mobile",
    app_store_url: "https://apps.apple.com/app/nordea-mobile-sweden/id393498075",
    play_store_url: "https://play.google.com/store/apps/details?id=com.nordea.mobilebank",
    digital_channels: ["Mobile App","Web Banking","Tablet App","Smartwatch"],
    cx_strengths: ["Clean mobile UI with good transaction overview","Strong BankID integration across Nordics","Swish payments deeply integrated","Multi-market login (one app, 4 countries)","AI-driven spending categorization"],
    cx_weaknesses: ["Wealth management tools feel dated vs neobanks","SME/Business app is separate and inferior","Onboarding for new customers has friction","Cross-sell within app is minimal","No marketplace/beyond-banking features"],
    digital_maturity: "HIGH",
    nps_estimate: "~35",
    ux_assessment: "Nordea's retail mobile app is solid but incremental. It handles transactions well but lacks the engagement layer — personalized nudges, financial wellness, product recommendations. The business app is a separate, weaker experience. Wealth clients still rely heavily on advisor calls. The gap between Nordea's app and neobanks like Klarna/Lunar is in engagement, not functionality."
  },
  "SEB_Sweden": {
    app_rating_ios: 4.5, app_rating_android: 4.2,
    app_name: "SEB",
    app_store_url: "https://apps.apple.com/app/seb/id390498803",
    play_store_url: "https://play.google.com/store/apps/details?id=se.seb.privatkund",
    digital_channels: ["Mobile App","Web Banking","Corporate Portal","Trading Platform"],
    cx_strengths: ["Call center ranked #1 in Sweden — excellent human channel","Strong corporate/trading digital tools","Solid mobile banking for daily transactions","Good security and BankID integration"],
    cx_weaknesses: ["Retail app lacks engagement features","Wealth advisory is primarily human, not digital-hybrid","Cards experience is on separate platform","Baltic customers on different digital experience","No PFM or financial wellness features"],
    digital_maturity: "HIGH",
    nps_estimate: "~40",
    ux_assessment: "SEB's strength is its human channel (#1 call center) but its digital engagement is average. The retail app handles basics well but doesn't inspire. The wealth experience is human-centric with minimal digital advisory tools. The new COO function was created specifically to 'increase pace of technology adoption' — acknowledging the gap. Cards are on a separate tech stack creating a fragmented experience."
  },
  "DNB_Norway": {
    app_rating_ios: 4.7, app_rating_android: 4.5,
    app_name: "DNB",
    app_store_url: "https://apps.apple.com/app/dnb/id390631068",
    play_store_url: "https://play.google.com/store/apps/details?id=no.dnb.android",
    digital_channels: ["Mobile App","Web Banking","Vipps Integration","Corporate Portal","AI Assistant"],
    cx_strengths: ["Highest-rated Nordic bank app","AI-driven financial insights and tips","Vipps deeply integrated for payments","Automated savings (round-ups, goals)","Strong design and UX team"],
    cx_weaknesses: ["SME banking tools lag behind retail quality","Wealth advisory digitalization incomplete","Sbanken acquisition integration creating UX friction","Corporate banking portal is separate ecosystem"],
    digital_maturity: "VERY HIGH",
    nps_estimate: "~45",
    ux_assessment: "DNB has the strongest digital banking experience in Norway and arguably the Nordics. Their mobile app is feature-rich with AI insights, automated savings, and Vipps integration. However, the Sbanken acquisition creates a dual-experience challenge, and their SME/corporate digital tools don't match the retail quality. The gap for Backbase is in engagement orchestration across channels — DNB's app is good at individual features but weak at connected customer journeys."
  },
  "Handelsbanken_Sweden": {
    app_rating_ios: 4.1, app_rating_android: 3.8,
    app_name: "Handelsbanken SE",
    app_store_url: "https://apps.apple.com/app/handelsbanken-se/id389654814",
    play_store_url: "https://play.google.com/store/apps/details?id=com.handelsbanken.mobile",
    digital_channels: ["Mobile App","Web Banking","UK Mobile App (separate)"],
    cx_strengths: ["Personal relationship with branch manager is the 'channel'","Reliable and secure","Simple interface — not overwhelming"],
    cx_weaknesses: ["Lowest-rated major Nordic bank app","Features significantly behind SEB/Nordea/DNB","UK app on completely separate platform","No AI features, no PFM, no engagement","Digital experience contradicts the branch relationship promise"],
    digital_maturity: "LOW-MEDIUM",
    nps_estimate: "~30",
    ux_assessment: "Handelsbanken's digital experience is the weakest of the Big 4 Swedish banks. This is intentional — the bank's strategy is built on personal branch relationships, not digital features. However, as younger customers demand digital-first experiences, this gap is becoming unsustainable. The UK app is on a completely separate stack. The opportunity for Backbase is to build a digital experience that ENHANCES the branch relationship model rather than replacing it."
  },
  "Swedbank_Sweden": {
    app_rating_ios: 4.4, app_rating_android: 4.2,
    app_name: "Swedbank",
    app_store_url: "https://apps.apple.com/app/swedbank/id311737929",
    play_store_url: "https://play.google.com/store/apps/details?id=se.swedbank.mobil",
    digital_channels: ["Mobile App","Web Banking","Baltic Apps (3 countries)","Swish Integration"],
    cx_strengths: ["Large retail customer base means extensive testing","Good Swish integration","Baltic apps serve 3 additional markets","Improving after post-AML technology investment"],
    cx_weaknesses: ["Post-AML brand damage still affects trust","Baltic experience inconsistent with Swedish","SME digital banking is basic","Customer acquisition tools weak — losing to neobanks","Design feels dated compared to Klarna/Nordea"],
    digital_maturity: "MEDIUM-HIGH",
    nps_estimate: "~25",
    ux_assessment: "Swedbank has Sweden's largest retail base but its digital experience doesn't reflect that scale advantage. Post-AML remediation consumed technology budget, and the app feels a step behind Nordea and SEB. The Baltic multi-market deployment is an asset but creates complexity. The opportunity is significant — Swedbank MUST modernize its digital engagement to retain customers who are being pulled toward neobanks and Nordea."
  },
  "Danske Bank_Denmark": {
    app_rating_ios: 4.5, app_rating_android: 4.3,
    app_name: "Danske Bank",
    app_store_url: "https://apps.apple.com/app/danske-bank/id477685592",
    play_store_url: "https://play.google.com/store/apps/details?id=com.danskebank.mobilebank3.dk",
    digital_channels: ["Mobile App","Web Banking","Vipps MobilePay stake","Corporate Portal","Sunday (now discontinued)"],
    cx_strengths: ["Strong mobile app with good feature set","Vipps MobilePay integration","Pan-Nordic app (DK, NO, SE, FI)","Good business banking tools","Dr Fiona Browne leading AI integration"],
    cx_weaknesses: ["AML scandal destroyed customer trust — still recovering","Sunday (open banking) was shut down","Lost customers to Nykredit and Jyske during scandal","Compliance tech investment crowded out CX investment","Pan-Nordic complexity creates inconsistencies"],
    digital_maturity: "HIGH",
    nps_estimate: "~20 (depressed by AML trust damage)",
    ux_assessment: "Danske Bank's app is technically capable but the brand damage from the AML scandal depressed customer satisfaction regardless of feature quality. The pivot from 'remediation to growth' under CEO Egeriis means CX investment is now a priority. Dr Fiona Browne (first Head of AI) signals serious intent on AI-powered engagement. The opportunity for Backbase is to help Danske rebuild customer trust through superior digital experiences."
  },
  "OP Financial Group_Finland": {
    app_rating_ios: 4.6, app_rating_android: 4.4,
    app_name: "OP-mobile",
    app_store_url: "https://apps.apple.com/app/op-mobile/id524420624",
    play_store_url: "https://play.google.com/store/apps/details?id=fi.op.android.opmbp",
    digital_channels: ["Mobile App","Web Banking","OP Light (youth)","Insurance App","Wealth App"],
    cx_strengths: ["Highly rated Finnish app","Bancassurance integration (insurance+banking in one app)","OP Light targeting young customers","Strong loyalty program (OP bonuses)","4.4M customers = massive user base feedback loop"],
    cx_weaknesses: ["120+ cooperative banks create inconsistency potential","Insurance integration can feel cluttered","Onboarding flow needs modernization","Cross-sell between banking and insurance products is basic","Multiple apps (main, Light, insurance) fragment the experience"],
    digital_maturity: "HIGH",
    nps_estimate: "~40",
    ux_assessment: "OP's app is strong by Finnish standards but the cooperative structure creates unique CX challenges. 120+ member banks need consistent but locally configurable digital experiences. The bancassurance angle (banking + insurance in one app) is both a strength and a complexity challenge. OP Light shows they understand the need to engage younger users differently. The Backbase opportunity is orchestrating a unified engagement experience across the cooperative while enabling local customization."
  },
  "TF Bank_Sweden": {
    app_rating_ios: 3.2, app_rating_android: 3.0,
    app_name: "TF Bank (rebranding to Avarda)",
    app_store_url: null,
    play_store_url: null,
    digital_channels: ["Web Portal","Partner/Broker Portals","Basic Mobile"],
    cx_strengths: ["Proprietary tech allows fast iteration","14-country deployment from single platform","Strong broker channel partnerships"],
    cx_weaknesses: ["NO real customer-facing app — broker-intermediated model","Direct customer engagement essentially doesn't exist","Rebranding to Avarda requires building CX from scratch","200K cards growing to 1-2M needs engagement infrastructure","No mobile banking app — critical gap"],
    digital_maturity: "LOW (customer-facing) / HIGH (back-end)",
    nps_estimate: "N/A — no direct customer channel to measure",
    ux_assessment: "TF Bank has a sophisticated back-end (proprietary, Azure-based, 14-country deployment) but essentially ZERO customer engagement infrastructure. Customers are acquired through brokers and have minimal direct interaction with TF Bank. The Avarda rebrand + expansion from 200K to 1-2M cards = they MUST build a customer-facing engagement platform from scratch. This is the cleanest Backbase greenfield opportunity in the Nordics."
  },
  "Nykredit_Denmark": {
    app_rating_ios: 4.3, app_rating_android: 4.1,
    app_name: "Nykredit",
    app_store_url: "https://apps.apple.com/app/nykredit/id1067456498",
    play_store_url: "https://play.google.com/store/apps/details?id=dk.nykredit.mobilbank",
    digital_channels: ["Mobile App","Web Banking","Mortgage Portal","Business Portal"],
    cx_strengths: ["Strong mortgage origination flow","Growing retail banking features","Clean modern design language"],
    cx_weaknesses: ["Mortgage-centric — retail banking features feel bolted on","Onboarding for non-mortgage customers is weak","PFM and engagement features minimal","Business banking tools basic","Not built for daily banking engagement"],
    digital_maturity: "MEDIUM",
    nps_estimate: "~30",
    ux_assessment: "Nykredit's app was built for mortgage customers, not daily retail banking. As Nykredit pivots to full-service banking, the app needs a fundamental engagement layer upgrade. New retail customers acquired from Danske Bank expect modern digital banking — not a mortgage portal with a savings account bolted on. This is the core Backbase value proposition."
  }
  ,
  "Länsförsäkringar_Sweden": {
    app_rating_ios:4.5, app_rating_android:4.3, app_name:"Länsförsäkringar",
    app_store_url:"https://apps.apple.com/app/lansforsakringar/id453541622",
    play_store_url:"https://play.google.com/store/apps/details?id=se.lfriken.mobile",
    digital_channels:["Mobile App","Web Banking","Insurance App","My Pages Portal"],
    cx_strengths:["Combined insurance + banking in one app","Strong regional brand trust","Good mobile banking fundamentals","BankID integration"],
    cx_weaknesses:["Insurance and banking feel like two bolted-together apps","23 regional variations create UX inconsistency","No PFM or financial wellness features","Business banking tools are basic","Cross-product journey (insurance→bank) is clunky"],
    digital_maturity:"MEDIUM", nps_estimate:"~35",
    ux_assessment:"LF's app handles insurance and banking but doesn't integrate them well. The experience feels like two apps in one skin. The 23 regional companies add complexity. The opportunity is a unified engagement layer that seamlessly orchestrates insurance and banking products."
  },
  "SBAB_Sweden": {
    app_rating_ios:4.6, app_rating_android:4.4, app_name:"SBAB",
    app_store_url:"https://apps.apple.com/app/sbab/id1115269498",
    play_store_url:"https://play.google.com/store/apps/details?id=se.sbab.bankapp",
    digital_channels:["Mobile App","Web Banking"],
    cx_strengths:["Fast digital mortgage application","Clean simple UI","Good rate comparison tools","Transparent pricing"],
    cx_weaknesses:["Narrow product range limits engagement","No PFM beyond mortgage","No business banking","Limited investment/savings features","Government-owned feel — lacks consumer appeal"],
    digital_maturity:"HIGH (for its niche)", nps_estimate:"~40",
    ux_assessment:"SBAB excels at digital mortgage origination but lacks the breadth for engagement banking. The app is clean but shallow. Growing into savings/investment creates platform needs beyond current capability."
  },
  "Skandiabanken_Sweden": {
    app_rating_ios:4.2, app_rating_android:4.0, app_name:"Skandia",
    app_store_url:"https://apps.apple.com/app/skandia/id390899444",
    play_store_url:"https://play.google.com/store/apps/details?id=se.skandia.android",
    digital_channels:["Mobile App","Web Banking","Pension Portal"],
    cx_strengths:["Pension management integration","Fund investment tools","Skandia brand trust"],
    cx_weaknesses:["Banking feels secondary to pension/insurance","Limited daily banking features","No modern engagement capabilities","Pension UX more developed than banking UX"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Skandia's digital experience is pension-first, banking-second. The banking features feel like an add-on to the pension platform rather than a standalone banking experience."
  },
  "Klarna Bank_Sweden": {
    app_rating_ios:4.7, app_rating_android:4.5, app_name:"Klarna",
    app_store_url:"https://apps.apple.com/app/klarna-shop-now-pay-later/id1115120118",
    play_store_url:"https://play.google.com/store/apps/details?id=com.myklarnamobile",
    digital_channels:["Mobile App","Web","Browser Extension","In-Store"],
    cx_strengths:["Best-in-class BNPL UX","AI shopping assistant","Spending insights","Smooth onboarding","Beautiful design language"],
    cx_weaknesses:["Trust concerns from BNPL debt","Banking features (savings, checking) still immature","Customer service complaints during rapid scaling","Not perceived as a 'real bank' by older demographics"],
    digital_maturity:"VERY HIGH", nps_estimate:"~45 (shopping), ~25 (banking)",
    ux_assessment:"Klarna sets the bar for digital engagement. Their app is what traditional banks aspire to. NOT a Backbase prospect — track as the competitive benchmark that justifies why incumbent banks need Backbase."
  },
  "SpareBank 1 SR-Bank_Norway": {
    app_rating_ios:4.4, app_rating_android:4.2, app_name:"SpareBank 1",
    app_store_url:"https://apps.apple.com/app/sparebank-1-mobile-banking/id394458902",
    play_store_url:"https://play.google.com/store/apps/details?id=no.sparebank1.mobilbank",
    digital_channels:["Mobile App (shared Alliance app)","Web Banking","Vipps Integration"],
    cx_strengths:["Shared Alliance app provides scale advantages","Vipps deeply integrated","Good basic banking functionality","Strong local brand trust in Rogaland"],
    cx_weaknesses:["Shared Alliance app limits individual bank differentiation","Digital features behind DNB","Wealth management tools basic","SME banking tools dated","App feels generic across 14 Alliance banks"],
    digital_maturity:"MEDIUM", nps_estimate:"~35",
    ux_assessment:"SR-Bank uses the shared SpareBank 1 Alliance mobile app. This gives scale but limits differentiation. The app handles basics well but can't match DNB's feature depth. The Alliance architecture creates a natural multi-entity platform opportunity."
  },
  "SpareBank 1 SMN_Norway": {
    app_rating_ios:4.4, app_rating_android:4.2, app_name:"SpareBank 1 (shared)",
    app_store_url:"https://apps.apple.com/app/sparebank-1-mobile-banking/id394458902",
    play_store_url:"https://play.google.com/store/apps/details?id=no.sparebank1.mobilbank",
    digital_channels:["Mobile App (shared Alliance)","Web Banking","Vipps"],
    cx_strengths:["Same shared Alliance app as SR-Bank","Innovation-forward within Alliance","NTNU tech ecosystem proximity"],
    cx_weaknesses:["Same Alliance app constraints as SR-Bank","Can't differentiate digitally from other Alliance banks"],
    digital_maturity:"MEDIUM", nps_estimate:"~35",
    ux_assessment:"Uses the same shared SpareBank 1 app. SMN pushes for more innovation within the Alliance framework but is constrained by consensus governance."
  },
  "Nordea Norway_Norway": {
    app_rating_ios:4.6, app_rating_android:4.3, app_name:"Nordea Mobile (Group app)",
    app_store_url:"https://apps.apple.com/app/nordea-mobile-norway/id393534373",
    play_store_url:"https://play.google.com/store/apps/details?id=com.nordea.mobilebank.no",
    digital_channels:["Mobile App (Group)","Web Banking","Vipps Integration"],
    cx_strengths:["Group-level app with full feature set","Consistent pan-Nordic experience","Strong Vipps integration"],
    cx_weaknesses:["Norwegian-specific needs sometimes deprioritized vs group","Losing local feel vs Norwegian-born competitors"],
    digital_maturity:"HIGH (group platform)", nps_estimate:"~30 (lower than DNB in Norway)",
    ux_assessment:"Uses the Nordea Group app. Solid but feels less 'Norwegian' than DNB or SpareBank 1. Group decisions from Helsinki don't always prioritize Norwegian market needs."
  },
  "SpareBank 1 Østlandet_Norway": {
    app_rating_ios:4.4, app_rating_android:4.2, app_name:"SpareBank 1 (shared)",
    app_store_url:"https://apps.apple.com/app/sparebank-1-mobile-banking/id394458902",
    play_store_url:"https://play.google.com/store/apps/details?id=no.sparebank1.mobilbank",
    digital_channels:["Mobile App (shared Alliance)","Web Banking","Vipps"],
    cx_strengths:["Alliance app provides baseline quality","Eastern Norway community trust"],
    cx_weaknesses:["Post-merger: customers from different banks adapting to shared app","Alliance constraints on customization"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Standard Alliance app experience. Post-merger customer base may face friction adapting to unified digital experience."
  },
  "Handelsbanken Norway_Norway": {
    app_rating_ios:4.1, app_rating_android:3.8, app_name:"Handelsbanken NO (Group app)",
    app_store_url:"https://apps.apple.com/app/handelsbanken-no/id389654814",
    play_store_url:null,
    digital_channels:["Mobile App (Group)","Web Banking"],
    cx_strengths:["Branch relationship model valued by existing customers"],
    cx_weaknesses:["Same digital gaps as Swedish parent","Norwegian competitors (DNB, Vipps) set much higher digital bar","Weakest digital experience in Norwegian market"],
    digital_maturity:"LOW-MEDIUM", nps_estimate:"~25",
    ux_assessment:"Group app inherited from Sweden. In Norway where DNB and Vipps set a very high digital bar, Handelsbanken's conservative digital approach is a significant competitive disadvantage."
  },
  "Sbanken_Norway": {
    app_rating_ios:4.5, app_rating_android:4.3, app_name:"Sbanken",
    app_store_url:"https://apps.apple.com/app/sbanken/id372285624",
    play_store_url:"https://play.google.com/store/apps/details?id=no.skandiabanken",
    digital_channels:["Mobile App","Web Banking"],
    cx_strengths:["Born-digital UX — Norway's first online bank","Clean, intuitive interface","Strong fund investment tools","Loyal customer base"],
    cx_weaknesses:["Under DNB ownership — losing independence","Platform likely to be merged into DNB","Innovation slowing since acquisition","Uncertain brand future"],
    digital_maturity:"HIGH", nps_estimate:"~40 (but declining post-acquisition)",
    ux_assessment:"Sbanken was Norway's digital banking pioneer with a beloved UX. Since DNB acquisition, innovation has slowed and the brand's future is uncertain. Track as part of DNB engagement — Sbanken's digital DNA is valuable context."
  },
  "Storebrand Bank_Norway": {
    app_rating_ios:4.0, app_rating_android:3.8, app_name:"Storebrand",
    app_store_url:"https://apps.apple.com/app/storebrand/id568064942",
    play_store_url:"https://play.google.com/store/apps/details?id=no.storebrand.app",
    digital_channels:["Mobile App","Web Banking","Pension Portal"],
    cx_strengths:["Pension management tools are strong","ESG investment features","Integrated pension+savings view"],
    cx_weaknesses:["Banking features feel like a pension app add-on","Limited daily banking capabilities","No modern engagement features","Small banking customer base limits investment"],
    digital_maturity:"MEDIUM (pension HIGH, banking LOW)", nps_estimate:"~30",
    ux_assessment:"Similar to Skandia in Sweden: pension-first, banking-second. The banking UX needs significant upgrade to compete as a standalone banking experience."
  },
  "Jyske Bank_Denmark": {
    app_rating_ios:4.2, app_rating_android:4.0, app_name:"Jyske Bank",
    app_store_url:"https://apps.apple.com/app/jyske-bank/id1044899502",
    play_store_url:"https://play.google.com/store/apps/details?id=dk.jyskebank.mobilbank",
    digital_channels:["Mobile App","Web Banking","Private Banking Portal"],
    cx_strengths:["Contrarian brand identity differentiates","Branch 'experience centers' are innovative","Private banking reputation","Strong in Jutland region"],
    cx_weaknesses:["Two digital experiences post-Handelsbanken acquisition","App feels dated vs Danske Bank","Private banking tools need digitalization","Business banking features basic","BEC dependency constrains innovation speed"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Post-acquisition, Jyske faces the challenge of unifying two different digital experiences. The app is functional but not inspiring. The 'experience center' branch concept shows innovation appetite that hasn't yet translated to digital."
  },
  "Nordea Denmark_Denmark": {
    app_rating_ios:4.6, app_rating_android:4.3, app_name:"Nordea Mobile (Group app)",
    app_store_url:"https://apps.apple.com/app/nordea-mobile-denmark/id393540383",
    play_store_url:"https://play.google.com/store/apps/details?id=com.nordea.mobilebank.dk",
    digital_channels:["Mobile App (Group)","Web Banking","MobilePay Integration"],
    cx_strengths:["Group platform quality","Pan-Nordic consistency"],
    cx_weaknesses:["Losing Danish customers to Nykredit and Jyske","Not perceived as 'Danish' enough","Group decisions don't always prioritize Danish needs"],
    digital_maturity:"HIGH (group platform)", nps_estimate:"~25 (lowest of Nordea markets)",
    ux_assessment:"Group app applied to Denmark. Technically capable but Nordea is losing the Danish market to more locally-rooted competitors."
  },
  "Sydbank_Denmark": {
    app_rating_ios:4.0, app_rating_android:3.8, app_name:"Sydbank",
    app_store_url:"https://apps.apple.com/app/sydbank/id1488261498",
    play_store_url:"https://play.google.com/store/apps/details?id=dk.sydbank.mobilbank",
    digital_channels:["Mobile App","Web Banking","Private Banking Portal","German Portal"],
    cx_strengths:["Private banking relationship quality","Cross-border DK-Germany capability","Stable, reliable service"],
    cx_weaknesses:["App features behind larger Danish banks","Private banking tools need digital upgrade","Limited innovation pace","German subsidiary adds UX complexity"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Steady but unremarkable digital experience. Private banking clients deserve better digital tools. The Denmark-Germany cross-border angle adds interesting complexity."
  },
  "Spar Nord_Denmark": {
    app_rating_ios:3.9, app_rating_android:3.7, app_name:"Spar Nord",
    app_store_url:"https://apps.apple.com/app/spar-nord/id1496662844",
    play_store_url:"https://play.google.com/store/apps/details?id=dk.sparnord.mobilbank",
    digital_channels:["Mobile App","Web Banking"],
    cx_strengths:["Community banking warmth","Personal service in northern Denmark","Strong local loyalty"],
    cx_weaknesses:["App is basic compared to national banks","Limited features for smaller budget","No PFM or engagement tools","Scale disadvantage in technology investment"],
    digital_maturity:"LOW-MEDIUM", nps_estimate:"~30",
    ux_assessment:"Community bank with a basic digital experience. Customers value the local relationship but increasingly expect digital features matching national bank standards."
  },
  "Lunar_Denmark": {
    app_rating_ios:4.1, app_rating_android:3.5, app_name:"Lunar",
    app_store_url:"https://apps.apple.com/app/lunar-bank/id1219614634",
    play_store_url:"https://play.google.com/store/apps/details?id=com.lunarway.app",
    digital_channels:["Mobile App (mobile-only)","Web Dashboard"],
    cx_strengths:["Mobile-first clean design","Fast onboarding","SME banking features","Subscription management","Spending insights"],
    cx_weaknesses:["Profitability concerns affecting feature investment","Customer service quality inconsistent","Limited product breadth","Trust concerns as venture-backed fintech","Not yet profitable"],
    digital_maturity:"HIGH (tech) / LOW (business maturity)", nps_estimate:"~30",
    ux_assessment:"Lunar is the Nordic neobank benchmark. NOT a Backbase prospect. Track their SME features and onboarding UX as competitive reference for conversations with Danish incumbent banks."
  },
  "Nordea Finland_Finland": {
    app_rating_ios:4.6, app_rating_android:4.3, app_name:"Nordea Mobile (Group HQ)",
    app_store_url:"https://apps.apple.com/app/nordea-mobile-finland/id393496614",
    play_store_url:"https://play.google.com/store/apps/details?id=com.nordea.mobilebank.fi",
    digital_channels:["Mobile App (Group)","Web Banking","Wealth Portal","Corporate Portal"],
    cx_strengths:["Group-level investment in digital","5M+ users across Nordics","Strong wealth management tools","AI spending insights"],
    cx_weaknesses:["One Platform transformation is slow","Experience varies by market","Younger Finns prefer OP or neobanks","In-house build creates vendor resistance"],
    digital_maturity:"HIGH", nps_estimate:"~35",
    ux_assessment:"This is the GROUP HQ app — decisions about this product are made here in Helsinki. The app is solid but the One Platform vision hasn't fully materialized. Engagement layer could accelerate delivery."
  },
  "Danske Bank Finland_Finland": {
    app_rating_ios:4.5, app_rating_android:4.3, app_name:"Danske Bank (Group app)",
    app_store_url:"https://apps.apple.com/app/danske-bank-fi/id477685592",
    play_store_url:null,
    digital_channels:["Mobile App (Group)","Web Banking"],
    cx_strengths:["Group-level app quality"],
    cx_weaknesses:["Smallest Danske market, lowest investment priority","Finnish customers have OP and Nordea as stronger local alternatives"],
    digital_maturity:"MEDIUM (group platform)", nps_estimate:"~20",
    ux_assessment:"Group app in Danske's smallest market. No local differentiation. Finnish customers tend to prefer OP or Nordea."
  },
  "Municipality Finance (MuniFin)_Finland": {
    app_rating_ios:0, app_rating_android:0, app_name:"N/A — No consumer app",
    app_store_url:null, play_store_url:null,
    digital_channels:["Institutional Web Portal"],
    cx_strengths:["Efficient bond issuance platform for municipalities"],
    cx_weaknesses:["No consumer-facing digital banking at all — pure institutional"],
    digital_maturity:"N/A (no retail)", nps_estimate:"N/A",
    ux_assessment:"NOT APPLICABLE. MuniFin is a municipal financing specialist with zero retail or consumer-facing digital banking. No CX relevance for Backbase."
  },
  "Savings Bank Group (Säästöpankki)_Finland": {
    app_rating_ios:4.1, app_rating_android:3.9, app_name:"Säästöpankki",
    app_store_url:"https://apps.apple.com/app/saastopankki/id1191741052",
    play_store_url:"https://play.google.com/store/apps/details?id=fi.saastopankki.mobiili",
    digital_channels:["Mobile App (shared)","Web Banking"],
    cx_strengths:["Community banking warmth","Shared platform provides baseline","Local trust in rural Finland"],
    cx_weaknesses:["Aging shared platform","Features lag behind OP significantly","16 banks with varying digital expectations","Limited tech budget vs larger competitors"],
    digital_maturity:"LOW-MEDIUM", nps_estimate:"~25",
    ux_assessment:"Shared platform across 16 cooperative banks. Aging and falling behind OP's digital experience. The multi-entity architecture need is identical to OP but at smaller scale."
  },
  "S-Bank_Finland": {
    app_rating_ios:4.3, app_rating_android:4.1, app_name:"S-mobiili",
    app_store_url:"https://apps.apple.com/app/s-mobiili/id1145498258",
    play_store_url:"https://play.google.com/store/apps/details?id=fi.sgroup.mobilebank",
    digital_channels:["Mobile App","Web Banking","S Group Loyalty App Integration"],
    cx_strengths:["3M+ customer base from S Group loyalty","S-Bonus integration","Simple, accessible interface"],
    cx_weaknesses:["Basic banking features","Loyalty and banking not deeply integrated yet","Limited lending and investment tools","Banking overshadowed by S Group retail app"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"S-Bank's app is functional but basic. The unique opportunity is deeper integration between S Group retail loyalty data and banking — spending insights, personalized offers based on shopping behavior."
  },
  "POP Bank Group_Finland": {
    app_rating_ios:3.8, app_rating_android:3.5, app_name:"POP Pankki",
    app_store_url:"https://apps.apple.com/app/pop-pankki/id1257710267",
    play_store_url:"https://play.google.com/store/apps/details?id=fi.poppankki.mobiili",
    digital_channels:["Mobile App (shared)","Web Banking"],
    cx_strengths:["Community presence in rural Finland"],
    cx_weaknesses:["Most basic digital experience of any Finnish banking group","Very limited features","Aging shared platform","Tiny budget for digital innovation"],
    digital_maturity:"LOW", nps_estimate:"~20",
    ux_assessment:"Smallest and most basic digital experience among Finnish cooperative groups. 19 micro-banks with minimal tech investment. Same multi-entity need as OP/Savings Banks but micro-scale."
  },
  "Aktia Bank_Finland": {
    app_rating_ios:4.0, app_rating_android:3.8, app_name:"Aktia",
    app_store_url:"https://apps.apple.com/app/aktia/id944474710",
    play_store_url:"https://play.google.com/store/apps/details?id=fi.aktia.mobiilipankki",
    digital_channels:["Mobile App","Web Banking","Wealth Portal"],
    cx_strengths:["Wealth management reputation","Bilingual FI/SV service","Personal advisory relationships"],
    cx_weaknesses:["App features behind OP and Nordea","Wealth advisory tools need digital upgrade","Legacy platform constraining innovation","Small scale limits tech investment"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Aktia's strength is wealth management advisory, but the digital tools don't match the human advisory quality. Bilingual (Finnish/Swedish) requirement adds complexity. Backbase Wealth is a strong fit."
  },
  "Landsbankinn_Iceland": {
    app_rating_ios:4.3, app_rating_android:4.1, app_name:"Landsbankinn",
    app_store_url:"https://apps.apple.com/app/landsbankinn/id1064131498",
    play_store_url:"https://play.google.com/store/apps/details?id=is.landsbankinn.app",
    digital_channels:["Mobile App","Web Banking","ATM Network"],
    cx_strengths:["Largest Icelandic bank — most features","Post-crisis modernization mindset","Good basic banking functionality"],
    cx_weaknesses:["Island-scale limits feature investment","No AI or advanced engagement features","Tourism banking tools underdeveloped","Limited wealth management digital"],
    digital_maturity:"MEDIUM", nps_estimate:"~30",
    ux_assessment:"Solid basic banking for Iceland but lacks modern engagement features. Post-crisis rebuild created cleaner architecture than some legacy banks, making modernization potentially easier."
  },
  "Íslandsbanki_Iceland": {
    app_rating_ios:4.2, app_rating_android:4.0, app_name:"Íslandsbanki",
    app_store_url:"https://apps.apple.com/app/islandsbanki/id1179325498",
    play_store_url:"https://play.google.com/store/apps/details?id=is.islandsbanki.app",
    digital_channels:["Mobile App","Web Banking"],
    cx_strengths:["Post-IPO investment in digital","Clean interface","Good savings tools"],
    cx_weaknesses:["Features similar to Landsbankinn — no differentiation","Post-IPO cost pressure may limit spending","Limited engagement beyond transactions"],
    digital_maturity:"MEDIUM", nps_estimate:"~28",
    ux_assessment:"Similar to Landsbankinn but slightly behind. Post-IPO pressure creates urgency to differentiate digitally. If Landsbankinn modernizes first, Íslandsbanki must follow."
  },
  "Arion Bank_Iceland": {
    app_rating_ios:4.4, app_rating_android:4.2, app_name:"Arion",
    app_store_url:"https://apps.apple.com/app/arion-banki/id1062523463",
    play_store_url:"https://play.google.com/store/apps/details?id=is.arionbanki.app",
    digital_channels:["Mobile App","Web Banking","Open Banking APIs"],
    cx_strengths:["Most digitally ambitious Icelandic bank","Fintech partnerships","First to launch new features","Open banking pioneer in Iceland"],
    cx_weaknesses:["Smallest bank — scale disadvantage","Feature richness doesn't compensate for smaller branch network","Innovation sometimes outpaces customer adoption"],
    digital_maturity:"MEDIUM-HIGH", nps_estimate:"~32",
    ux_assessment:"Most innovative Icelandic bank digitally. First to adopt new features, open banking APIs, fintech partnerships. Despite being smallest, often leads on digital. Quick deployment potential."
  }
};
