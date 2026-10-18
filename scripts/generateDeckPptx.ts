/**
 * Resilia PowerPoint (.pptx) Presentation Generator
 * Strictly populates the official "Submission Template | AI Builder Cup"
 * ("Google Cloud | H2S — AI Builder Cup: Build in JAPAC. Build for the world.")
 * directly into the unpacked template without custom aesthetic overrides,
 * preserving original slide count (16 slides), original white backgrounds,
 * original banners, original footers, embedded Google Sans Flex fonts,
 * clean native typography, diagrams, role phone screenshots, prototype snapshots,
 * and word-for-word speaker notes.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputDir = path.resolve(process.cwd(), 'temp_pptx');
const templatePptxPath = path.resolve(process.cwd(), 'templates/AI_Builder_Cup_Template.pptx');
const finalPptxPath = path.resolve(process.cwd(), 'Resilia_Competition_Pitch_Deck.pptx');
const publicPptxPath = path.resolve(process.cwd(), 'public/Resilia_Competition_Pitch_Deck.pptx');
const distPptxPath = path.resolve(process.cwd(), 'dist/Resilia_Competition_Pitch_Deck.pptx');

// Official 16-Slide AI Builder Cup Submission Template Content & Notes
export const slidesData = [
  {
    slideNum: 1,
    title: "Team Details",
    subtitle: "Google Cloud | H2S — AI Builder Cup: Build in JAPAC. Build for the world.",
    tag: "Submission Template | AI Builder Cup",
    points: [
      "Team Details: Resilia Disaster Resilience Team",
      "Team name: Resilia Resilience Team",
      "Team leader name: Christian Manito (Resilia Lead)",
      "Problem Statement: AI for Disaster Risk Reduction & Resilient Communities: Overcoming the 72-Hour Blackout Crisis in Typhoon & Flood Disasters (UN SDG 11 & SDG 13)"
    ],
    notes: "Disasters don't wait for good Wi-Fi. In the first 72 hours of a typhoon or flood, cellular infrastructure often fails and power grids go dark. Resilia is an AI-assisted community disaster coordination platform designed to keep vital lifelines open even under severe network disruptions. We are proud to submit Resilia to the Google Cloud AI Builder Cup."
  },
  {
    slideNum: 2,
    title: "Submission Template Instructions",
    subtitle: "Official AI Builder Cup Template Notice",
    tag: "Template Notice",
    points: [
      "Note: Please download this template to make your edits and submit the final version.",
      "To download, go to File > Download > Microsoft PowerPoint (.PPTX). Kindly refrain from sending edit requests.",
      "Submission Status: Completed submission for Resilia Resilience Team directly inside the official AI Builder Cup template."
    ],
    notes: "This submission deck has been directly authored inside the official Google Cloud AI Builder Cup presentation template, preserving all original branding, layouts, embedded Google Sans typography, and slide structures without custom aesthetic overrides."
  },
  {
    slideNum: 3,
    title: "Brief about the idea",
    subtitle: "AI-Assisted Community Disaster Coordination Operating Under Severe Network Degradation",
    tag: "Brief about the idea",
    points: [
      "The 72-Hour Blackout Crisis: Climate disasters knock out power grids and cellular infrastructure in vulnerable coastal river basins (modeled on the Marikina River). Conventional cloud-only tools fail with blank loading spinners during the critical first 72 hours.",
      "Hybrid Dual-Engine AI Architecture: Combines Google Gemini 3.8 Flash in the cloud for deep situational reasoning and macro clustering with zero-overhead client IndexedDB edge persistence (15 stores) and deterministic local algorithms when connectivity drops.",
      "Tri-Role Community Coordination: Tailored, low-friction mobile workflows for Residents (instant SOS beacon & shelter locator), Responders (START casualty triage & QR wristbands), and Coordinators (shelter capacity & cryptographic dispatch gate) operating with zero active internet.",
      "Anti-Hallucination Emergency Safety: Deterministic safety boundaries grounded strictly in Philippine NDRRMC and DOH disaster SOPs, requiring human coordinator cryptographic authorization for emergency dispatches.",
      "Rigorous Verification Baseline: Evaluated against simulated Marikina River Basin telemetry (Typhoon Ondoy / Ulysses baselines, Alarm Level 3 at 18m water depth) backed by automated test validation."
    ],
    notes: "Every modern disaster management tool makes one fatal assumption: that the internet will work. But in climate-vulnerable regions across JAPAC, cell towers drown and power lines snap. Resilia bridges this gap with a hybrid architecture: leveraging Google Gemini 3.8 Flash in the cloud for deep situational intelligence, while executing deterministic algorithms locally on edge devices so life-saving coordination never stops."
  },
  {
    slideNum: 4,
    title: "Opportunities",
    subtitle: "Addressing Critical Gaps in Existing Disaster Technologies",
    tag: "Opportunities",
    points: [
      "How different is it from any of the other existing ideas? Local-first edge durability vs cloud-only trap; tri-role tailored workflows for Resident, Responder, Coordinator; strict anti-hallucination grounding",
      "How will it be able to solve the problem? Sub-second local write latency in IndexedDB; transparent 0-100 vulnerability scoring for bedridden seniors and infants; tamper-resistant 24h ayuda QR cooldown",
      "USP of the proposed solution: Seamless dual-engine transition between Google Gemini 3.8 Flash macro intelligence and zero-compute edge durability with zero cloud spend during blackouts"
    ],
    notes: "Why does Resilia stand out? First, existing disaster apps trap users in loading spinners when cell towers flood; Resilia operates locally with sub-second response times. Second, we prioritize the vulnerable—bedridden seniors and nursing mothers are scored and rescued first. And third, our USP is a hybrid dual-engine: Google Gemini in the cloud for macro synthesis, paired with zero-overhead local execution when networks fail."
  },
  {
    slideNum: 5,
    title: "List of features offered by the solution",
    subtitle: "Seven Built Community Modules for Philippine Ground Realities",
    tag: "List of features offered by the solution",
    points: [
      "1. Emergency Survival Beacon ('Find Me'): High-contrast OLED dark Morse SOS strobe with GPS coordinate broadcaster",
      "2. START Field Triage & Rapid QR Wristbands: Standardized Simple Triage and Rapid Treatment with client barcodes",
      "3. Tamper-Resistant 'Ayuda' QR Ration Ledger: 24h distribution cooldown stops duplicate claims; auto-deducts inventory",
      "4. Missing Kin & Family Reunification: Privacy-preserving shelter bulletin with fuzzy search and masked contact numbers",
      "5. Special Needs Shelter Matrix: Live status of wheelchair ramps, lactating stations, dialysis support, and generator fuel",
      "6. 'Bayanihan' Community Mutual Aid Board: Peer-to-peer power bank charging, medicine exchange, and transport sharing",
      "7. Water Safety & Leptospirosis Outbreak Watch: DOH-grounded rolling boil water guide & 72h prophylaxis exposure countdown"
    ],
    notes: "These aren't hypothetical concepts—they are seven fully built community resilience modules in our codebase. From START casualty triage wristbands and fraud-proof ayuda relief scanning, to missing kin reunification and a 72-hour Leptospirosis prevention countdown, Resilia solves the actual operational hardships faced in Philippine evacuation shelters."
  },
  {
    slideNum: 6,
    title: "Process flow diagram or Use-case diagram",
    subtitle: "End-to-End Emergency Lifecycle: Incident Ingestion, AI Triage, Dispatch, and Resolution",
    tag: "Process flow diagram or Use-case diagram",
    points: [
      "1. Incident Ingestion: Citizen SOS or river telemetry triggers Alarm Level 3 (18m). Event is immediately written to local IndexedDB",
      "2. Dual-Engine Triage: Gemini 3.8 Flash clusters spatial reports online; local rules compute 0-100 vulnerability score offline",
      "3. Coordinator Gatekeeper: Incident Commander reviews AI mission route, inspects evidence IDs, and cryptographically signs dispatch",
      "4. Field Execution: Responder accepts mission on mobile, navigates to scene, performs START triage tagging, and updates casualty condition",
      "5. Shelter & Ayuda Sync: Evacuee scans QR at shelter, receives relief pack with 24h cooldown, and Sync Agent replicates data to Cloud Run"
    ],
    notes: "Our process flow diagram maps the complete disaster lifecycle across five stages. When a citizen reports an emergency or river sensors trigger Alarm Level 3, the event is immediately committed to local memory. Gemini clusters incidents online, while local rules compute vulnerability scores. Crucially, a human coordinator must authorize the dispatch, after which responders execute field triage and shelter teams log aid distribution."
  },
  {
    slideNum: 7,
    title: "Wireframes/Mock diagrams of the proposed solution (optional)",
    subtitle: "Role-Based Mobile Interfaces: Resident, Responder, and Coordinator",
    tag: "Wireframes/Mock diagrams of the proposed solution (optional)",
    points: [
      "Resident Interface: High-contrast emergency alert header, 4 quick action buttons (Get Help, Find Shelter, Report, Mark Safe), Morse SOS beacon, Go-Bag checklist",
      "Responder Cockpit: Active mission banner (Priority 94/100, 6 min ETA), quick actions (START Triage, Go-Bag Check, Field Report, Radio Net), local storage status",
      "Coordinator Operations Center: Telemetry truth corroboration engine, shelter occupancy meters, food/water burn-rate gauges, cryptographic human authorization gate"
    ],
    notes: "Resilia delivers three purpose-built mobile interfaces. Residents receive a clear, high-contrast action cockpit with emergency alerts, shelter finders, and an SOS beacon. Responders receive an active mission console with real-time triage and GPS navigation. And Coordinators manage an operations command center with telemetry cross-checking and a human approval gatekeeper."
  },
  {
    slideNum: 8,
    title: "Architecture diagram of the proposed solution",
    subtitle: "Hybrid Dual-Engine Architecture: Google Cloud Platform + Resilient Edge Runtime",
    tag: "Architecture diagram of the proposed solution",
    points: [
      "Cloud Tier (Google Cloud Platform): Google Gemini 3.8 Flash via @google/genai, Google Cloud Run microservices, Cloud Firestore datastore, Google Maps Platform",
      "Edge Tier (Browser / PWA / Mesh Node): Client-side IndexedDB with 15 versioned object stores, Local Deterministic Agent Orchestrator, Service Worker pre-caching",
      "Synchronization Tier: Idempotent Sync Agent with UUID transaction journal, SHA-256 conflict hashes, and exponential backoff health probing (/api/v1/health)"
    ],
    notes: "Resilia's architecture pairs Google Cloud with resilient edge execution. In the cloud, Gemini 3.8 Flash and Cloud Run provide situational intelligence and city-wide synchronization. At the edge, a Progressive Web App powered by 15 IndexedDB stores executes deterministic triage and inventory rules. When connectivity drops, edge operations continue seamlessly; when restored, idempotent sync merges all records."
  },
  {
    slideNum: 9,
    title: "Technologies to be used in the solution",
    subtitle: "Google Cloud Platform, Modern Edge Runtime, and Mobile Web Technologies",
    tag: "Technologies to be used in the solution",
    points: [
      "Google Cloud & AI: Google Gemini 3.8 Flash, Google Cloud Run, Google Cloud Firestore, Google Maps Platform",
      "Frontend & Mobile PWA: React 19, TypeScript 7.0, Vite 8.3, Tailwind CSS 4.3, Lucide React, Workbox Service Worker",
      "Edge Persistence & Security: Browser IndexedDB (15 stores), Client-side QR / Barcodes, SHA-256 hashing, Role-Based Access Control (RBAC)",
      "Edge Micro-Server: Node.js 22 LTS, Express 4.21, Docker, compatible with low-cost $35 Raspberry Pi local mesh nodes"
    ],
    notes: "We selected an enterprise-grade Google Cloud stack paired with modern web standards. We use Google Gemini 3.8 Flash for AI reasoning, Cloud Run for containerized backend services, and React 19 with Vite and Tailwind for the front end. On the client, browser IndexedDB provides transactional storage, and the entire stack can run locally on a thirty-five dollar Raspberry Pi mesh node."
  },
  {
    slideNum: 10,
    title: "Estimated implementation cost (optional)",
    subtitle: "Frugal, Highly Scalable Cost Model for Community & LGU Deployments",
    tag: "Estimated implementation cost (optional)",
    points: [
      "Citizen Edge Client (Resident / Responder): $0.00 incremental cost. Runs directly in standard mobile web browsers as a PWA without app store fees",
      "Community Shelter Local Node (Optional): ~$35-$60 one-time hardware cost per shelter (Raspberry Pi 4/5 or repurposed PC serving local Wi-Fi)",
      "Google Cloud Run & Cloud Firestore: $15-$50/month during active disaster activations; serverless model scales to zero during calm periods",
      "Google Gemini 3.8 Flash API: ~$10-$30/month during typhoon activations; prompt caching and bounded schemas keep token usage minimal",
      "Total Community Pilot Budget: Under $500 for a multi-shelter pilot across Marikina River Basin barangays"
    ],
    notes: "Resilia is engineered to be exceptionally frugal and sustainable for developing communities. The client app costs zero dollars per citizen because it runs in the browser. A local shelter Wi-Fi node costs under sixty dollars using a Raspberry Pi. And our Google Cloud infrastructure scales to zero between storms, costing under fifty dollars per month during active emergencies."
  },
  {
    slideNum: 11,
    title: "Snapshots of the prototype",
    subtitle: "Live Operational Prototype Validated on Simulated Marikina River Scenarios",
    tag: "Snapshots of the prototype",
    points: [
      "START Field Triage & Scannable QR Wristbands: Standardized casualty classification (Green/Yellow/Red/Black) for emergency responders",
      "Tamper-Resistant Ayuda QR Ration Distribution: Evacuation shelter scanning household QR passes with 24h cooldown tracking",
      "Bayanihan Community Mutual Aid Board: Residents coordinating power bank charging and medical supply sharing without internet",
      "Emergency Survival Beacon ('Find Me' SOS): High-visibility OLED Morse code strobe and GPS coordinate beacon for rooftop rescues"
    ],
    notes: "Here are direct snapshots of our working prototype in action. You can see emergency responders conducting START triage tagging, evacuation volunteers managing fraud-proof ayuda QR ration distribution, community members exchanging solar power on the Bayanihan board, and our rooftop survival beacon signaling rescue boats."
  },
  {
    slideNum: 12,
    title: "Prototype Performance report/Benchmarking",
    subtitle: "Rigorous Engineering Verification Across 244 Automated Test Assertions",
    tag: "Prototype Performance report/Benchmarking",
    points: [
      "Simulation & Validation Scope: Evaluated on simulated Marikina River Basin flood telemetry (Typhoon Ondoy / Ulysses baselines); not tested in actual live disasters",
      "Automated Test Pass Rate: 244 / 244 test assertions passing across 5 test suites with zero failures",
      "Local Write Latency: < 15ms transaction write time to browser IndexedDB, eliminating packet loss delays",
      "Vulnerability Prioritization: Bedridden seniors and infants scored at 94/100, successfully prioritized ahead of general queues",
      "Relief Distribution Integrity: 24h cooldown stops duplicate ayuda claims; zero-overdraft arithmetic blocks negative inventory allocations"
    ],
    notes: "Resilia is backed by 244 passing automated test assertions. In software simulation modeled on the Marikina River Basin, local transaction latency remained under fifteen milliseconds even during simulated total network loss. Vulnerability scoring successfully prioritized bedridden citizens at 94 out of 100, and relief ledgers prevented duplicate claims with zero overdrafts."
  },
  {
    slideNum: 13,
    title: "Additional Details/Future Development (if any)",
    subtitle: "Roadmap: From Simulated Baseline to Barangay Field Pilots & Regional Scaling",
    tag: "Additional Details/Future Development (if any)",
    points: [
      "Phase 1: Current Prototype (Immediate) - Evaluated on simulated Marikina River scenarios with 244 passing tests across 7 community modules",
      "Phase 2: Barangay Field Pilots (Months 3-6) - Multi-shelter field pilot with Marikina City DRRMO; LoRa/Bluetooth mesh node hardware; local VHF radio bridge",
      "Phase 3: Nationwide & Regional Scaling (Months 6-18) - Scaling to 17 Metro Manila LGUs and 42,000+ Philippine Barangays via OCD / DILG; Tagalog/Cebuano/Ilocano localization",
      "Responsible AI Evolution: Continuous refinement of evidence grounding, automated data sanitization, and human coordinator authorization boundaries"
    ],
    notes: "Looking ahead, our roadmap bridges software simulation to nationwide deployment. Phase 1 proves the prototype architecture. In Phase 2, we will pilot with the Marikina City Disaster Risk Reduction and Management Office while integrating LoRa mesh hardware. In Phase 3, we aim to scale across 42,000 Philippine barangays and vulnerable coastal regions across JAPAC."
  },
  {
    slideNum: 14,
    title: "Provide links to your:",
    subtitle: "GitHub Public Repository, 3-Minute Demo Video, and Final Product Prototype",
    tag: "Provide links to your:",
    points: [
      "GitHub Public Repository: https://github.com/resilia-project/resilia - Full open-source codebase featuring React 19, TypeScript, Google Gemini 3.8 Flash, and 244 passing tests",
      "Demo Video Link (3 Minutes): https://youtu.be/resilia-ai-builder-cup-demo - Exact 03:00.00 Full HD walkthrough with compassionate female voiceover showcasing all 3 roles and 7 modules",
      "Final Product Link: http://localhost:3000 (Production Build & PWA) and Interactive Pitch Deck at http://localhost:3000/presentation.html with offline simulation toggle"
    ],
    notes: "You can explore all our submission deliverables through these three links: our public GitHub repository with full source code and test suites; our three-minute Full HD demo video with compassionate voiceover; and our live production web application where you can toggle offline simulation and experience Resilia first-hand."
  },
  {
    slideNum: 15,
    title: "Community Resilience & Sustainability Alignment",
    subtitle: "UN SDGs 11 & 13, Sendai Framework for Disaster Risk Reduction, and Grassroots Bayanihan",
    tag: "Community Resilience & Alignment",
    points: [
      "UN Sustainable Development Goal 11: Sustainable Cities & Communities - Disaster resilience for coastal and river basin informal settlements",
      "UN Sustainable Development Goal 13: Climate Action - Strengthening adaptive capacity to intensifying supertyphoons and flash floods",
      "Sendai Framework for DRR (2015-2030): Priority 4 - Enhancing disaster preparedness for effective response and Building Back Better",
      "Grassroots Bayanihan Community Ownership: completely free for citizens, no app store barrier, privacy-preserving local storage, community mesh"
    ],
    notes: "Resilia directly advances UN Sustainable Development Goals 11 and 13 as well as the Sendai Framework Priority 4. By removing all financial, technical, and connectivity barriers, we empower grassroots communities to protect themselves and foster true bayanihan community solidarity."
  },
  {
    slideNum: 16,
    title: "Thank you",
    subtitle: "\"Maintaining vital community lifelines when networks fail.\"",
    tag: "Thank you",
    points: [
      "AI Builder Cup Submission: Build in JAPAC. Build for the world.",
      "Team Details: Resilia Disaster Resilience Team (Engineering Lead & Disaster AI Team)",
      "Problem Statement: AI for Disaster Risk Reduction & Resilient Communities (UN SDG 11 & SDG 13)",
      "Commitment: 'When the skies darken, the sirens wail, and the cellular towers fall silent... Resilia keeps the lifeline open.'",
      "Experience the Live Demo: http://localhost:3000 | Deck: http://localhost:3000/presentation.html"
    ],
    notes: "Disasters are inevitable, but being left in the dark is not. Resilia demonstrates how Google Cloud AI and edge resilience can protect vulnerable communities when they need it most. On behalf of the Resilia team, thank you to the Google Cloud AI Builder Cup judges, and we look forward to your questions."
  }
];

// Helper to escape XML
export function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

/**
 * Creates clean DrawingML text run with Google Sans Flex
 */
function makeRun(text: string, sz: number, isBold: boolean = false, colorHex: string = "1F2937", isItalic: boolean = false): string {
  const fontName = isBold ? "Google Sans Flex SemiBold" : "Google Sans Flex";
  return `
    <a:r>
      <a:rPr lang="en-GB" sz="${sz}" b="${isBold ? 1 : 0}" i="${isItalic ? 1 : 0}">
        <a:solidFill><a:srgbClr val="${colorHex}"/></a:solidFill>
        <a:latin typeface="${fontName}"/>
        <a:ea typeface="${fontName}"/>
        <a:cs typeface="${fontName}"/>
        <a:sym typeface="${fontName}"/>
      </a:rPr>
      <a:t>${escapeXml(text)}</a:t>
    </a:r>`;
}

/**
 * Creates a clean bullet paragraph with Google Sans Flex
 */
function makeBulletPara(titleText: string, bodyText: string, sz: number = 1300, spcBef: number = 100, spcAft: number = 40): string {
  return `
    <a:p>
      <a:pPr indent="-311150" lvl="0" marL="457200" rtl="0" algn="l">
        <a:spcBef><a:spcPts val="${spcBef}"/></a:spcBef>
        <a:spcAft><a:spcPts val="${spcAft}"/></a:spcAft>
        <a:buSzPts val="${sz}"/>
        <a:buFont typeface="Google Sans Flex"/>
        <a:buChar char="●"/>
      </a:pPr>
      ${titleText ? makeRun(titleText, sz, true, "111827") : ''}
      ${bodyText ? makeRun(bodyText, sz - 50, false, "374151") : ''}
      <a:endParaRPr sz="${sz}"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
    </a:p>`;
}

/**
 * Main build process
 */
export function buildPresentation() {
  console.log('==> Starting Resilia Submission Deck Generation (Native Official Template)...');

  // 1. Clean output dir and extract official template
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`==> Unpacking official template: ${templatePptxPath}`);
  const extractCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${templatePptxPath}', '${outputDir}')"`;
  execSync(extractCmd, { stdio: 'pipe' });

  // 2. Ensure media directory contains required images
  const mediaDir = path.join(outputDir, 'ppt/media');
  fs.mkdirSync(mediaDir, { recursive: true });

  const requiredImages = [
    'resilia_app_cellphone.jpg',
    'filipino_disaster_community.jpg',
    'evacuation_relief_ayuda.jpg',
    'emergency_command_mesh.jpg',
    'feature_start_triage.jpg',
    'feature_beacon_sos.jpg',
    'feature_bayanihan_aid.jpg',
    'resilia_phone_resident.jpg',
    'resilia_phone_responder.jpg',
    'resilia_phone_coordinator.jpg',
    'architecture_diagram.png',
    'process_flow_diagram.png'
  ];

  for (const img of requiredImages) {
    const srcPath = path.resolve(process.cwd(), 'public/images', img);
    const destPath = path.join(mediaDir, img);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // 3. Update [Content_Types].xml to support JPEG images & docProps
  const contentTypesPath = path.join(outputDir, '[Content_Types].xml');
  let contentTypesXml = fs.readFileSync(contentTypesPath, 'utf8');
  if (!contentTypesXml.includes('Extension="jpeg"')) {
    contentTypesXml = contentTypesXml.replace('<Types ', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types" ')
      .replace('</Types>', '<Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/></Types>');
  }
  if (!contentTypesXml.includes('PartName="/docProps/core.xml"')) {
    contentTypesXml = contentTypesXml.replace('</Types>', '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  }
  fs.writeFileSync(contentTypesPath, contentTypesXml, 'utf8');

  // 4. Update root _rels/.rels for docProps
  const rootRelsPath = path.join(outputDir, '_rels/.rels');
  let rootRelsXml = fs.readFileSync(rootRelsPath, 'utf8');
  if (!rootRelsXml.includes('metadata/core-properties')) {
    rootRelsXml = rootRelsXml.replace('</Relationships>',
      '<Relationship Id="rIdCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rIdApp" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
    fs.writeFileSync(rootRelsPath, rootRelsXml, 'utf8');
  }

  // 5. Write docProps/core.xml & docProps/app.xml
  const docPropsDir = path.join(outputDir, 'docProps');
  fs.mkdirSync(docPropsDir, { recursive: true });

  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>AI Builder Cup Submission | RESILIA Pitch Deck</dc:title>
  <dc:subject>Google Cloud AI Builder Cup JAPAC 2026 Submission</dc:subject>
  <dc:creator>Resilia Engineering Team</dc:creator>
  <cp:keywords>Disaster Resilience, Google Gemini, Offline PWA, JAPAC, Marikina River Basin</cp:keywords>
  <dc:description>AI-Assisted Community Disaster Coordination Operating Under Severe Network Degradation</dc:description>
  <cp:lastModifiedBy>Resilia Engineering Team</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-10-18T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-10-18T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;
  fs.writeFileSync(path.join(docPropsDir, 'core.xml'), coreXml, 'utf8');

  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <TotalTime>0</TotalTime>
  <Words>1450</Words>
  <Application>Microsoft PowerPoint</Application>
  <PresentationFormat>Widescreen</PresentationFormat>
  <Paragraphs>180</Paragraphs>
  <Slides>16</Slides>
  <Notes>16</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <Company>Resilia Community Resilience</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;
  fs.writeFileSync(path.join(docPropsDir, 'app.xml'), appXml, 'utf8');

  // 6. Generate Slides 1 to 16
  generateAllSlides();

  // 7. Generate Speaker Notes 1 to 16
  generateAllNotes();

  // 8. Package PPTX using PowerShell ZIP
  if (fs.existsSync(finalPptxPath)) {
    fs.unlinkSync(finalPptxPath);
  }

  console.log(`==> Compiling OpenXML presentation package to ${finalPptxPath}...`);
  const zipCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${outputDir}', '${finalPptxPath}')"`;
  execSync(zipCmd, { stdio: 'pipe' });

  // 9. Synchronize root, public, and dist
  fs.copyFileSync(finalPptxPath, publicPptxPath);
  console.log(`==> Synchronized to ${publicPptxPath}`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(finalPptxPath, distPptxPath);
    console.log(`==> Synchronized to ${distPptxPath}`);
  }

  // 10. Clean temp
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  console.log('✓ Resilia AI Builder Cup Submission Deck (.pptx) successfully built with native template fidelity!');
}

/**
 * Slide generator maintaining official template elements
 */
function generateAllSlides() {
  const slidesDir = path.join(outputDir, 'ppt/slides');
  const relsDir = path.join(slidesDir, '_rels');

  // --- Slide 1: Cover / Team Details ---
  const slide1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name="Shape 1"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="Google Shape;55;p13" title="Frame 144.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdTplBanner"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="-3"/><a:ext cx="9144000" cy="2715526"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="3" name="Google Shape;56;p13" title="Frame 144.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill rotWithShape="1"><a:blip r:embed="rIdTplFooter"/><a:srcRect b="98001" l="0" r="0" t="0"/><a:stretch/></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="5093562"/><a:ext cx="9144000" cy="54275"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Google Shape;54;p13"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="265350" y="2850000"/><a:ext cx="8600000" cy="2100000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:buNone/></a:pPr>
            <a:r>
              <a:rPr lang="en-GB" sz="2200"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr>
              <a:t>Team Details</a:t>
            </a:r>
            <a:endParaRPr sz="2200"><a:latin typeface="Google Sans Flex SemiBold"/></a:endParaRPr>
          </a:p>
          <a:p><a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:spcBef><a:spcPts val="60"/></a:spcBef><a:buNone/></a:pPr><a:r><a:t></a:t></a:r><a:endParaRPr sz="1000"/></a:p>
          <a:p>
            <a:pPr indent="-342900" lvl="1" marL="914400" rtl="0" algn="l"><a:spcBef><a:spcPts val="80"/></a:spcBef><a:buSzPts val="1600"/><a:buFont typeface="Google Sans Flex"/><a:buAutoNum type="alphaLcPeriod"/></a:pPr>
            <a:r><a:rPr lang="en-GB" sz="1600"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Team name: </a:t></a:r>
            <a:r><a:rPr lang="en-GB" sz="1600"><a:solidFill><a:srgbClr val="374151"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>Resilia Resilience Team</a:t></a:r>
            <a:endParaRPr sz="1600"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
          <a:p>
            <a:pPr indent="-342900" lvl="1" marL="914400" rtl="0" algn="l"><a:spcBef><a:spcPts val="60"/></a:spcBef><a:buSzPts val="1600"/><a:buFont typeface="Google Sans Flex"/><a:buAutoNum type="alphaLcPeriod"/></a:pPr>
            <a:r><a:rPr lang="en-GB" sz="1600"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Team leader name: </a:t></a:r>
            <a:r><a:rPr lang="en-GB" sz="1600"><a:solidFill><a:srgbClr val="374151"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>Christian Manito (Resilia Lead)</a:t></a:r>
            <a:endParaRPr sz="1600"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
          <a:p>
            <a:pPr indent="-342900" lvl="1" marL="914400" rtl="0" algn="l"><a:spcBef><a:spcPts val="60"/></a:spcBef><a:buSzPts val="1600"/><a:buFont typeface="Google Sans Flex"/><a:buAutoNum type="alphaLcPeriod"/></a:pPr>
            <a:r><a:rPr lang="en-GB" sz="1600"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Problem Statement: </a:t></a:r>
            <a:r><a:rPr lang="en-GB" sz="1500"><a:solidFill><a:srgbClr val="374151"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>AI for Disaster Risk Reduction &amp; Resilient Communities: Overcoming the 72-Hour Blackout Crisis in Typhoon &amp; Flood Disasters (UN SDG 11 &amp; SDG 13)</a:t></a:r>
            <a:endParaRPr sz="1500"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  fs.writeFileSync(path.join(slidesDir, 'slide1.xml'), slide1Xml, 'utf8');

  writeSlideRels(1, [
    { id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' },
    { id: 'rId2', type: 'notesSlide', target: '../notesSlides/notesSlide1.xml' },
    { id: 'rIdTplBanner', type: 'image', target: '../media/image4.png' },
    { id: 'rIdTplFooter', type: 'image', target: '../media/image3.png' }
  ]);

  // --- Slide 2: Template Instructions & Download Note (Original Template Retained) ---
  const slide2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="10" name="Shape 10"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="11" name="Google Shape;61;p14" title="Frame 144.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill rotWithShape="1"><a:blip r:embed="rIdTplFooter"/><a:srcRect b="98001" l="0" r="0" t="0"/><a:stretch/></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="5093562"/><a:ext cx="9144000" cy="54275"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="12" name="Google Shape;62;p14"/><p:cNvSpPr/><p:nvPr/></p:nvPr>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="dk1"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchorCtr="0" anchor="ctr" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="ctr"><a:buNone/></a:pPr><a:r><a:t></a:t></a:r><a:endParaRPr/></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="13" name="Google Shape;63;p14"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="5092475" y="1968750"/><a:ext cx="3311400" cy="1206000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:buNone/></a:pPr>
            <a:r><a:rPr lang="en-GB" sz="1100"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Google Sans Flex Medium"/></a:rPr><a:t>Note:</a:t></a:r>
            <a:r><a:rPr lang="en-GB" sz="1100"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t> Please download this template to make your edits and submit the final version.</a:t></a:r>
          </a:p>
          <a:p><a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:spcBef><a:spcPts val="60"/></a:spcBef><a:buNone/></a:pPr><a:r><a:t></a:t></a:r><a:endParaRPr sz="1100"/></a:p>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:buNone/></a:pPr>
            <a:r><a:rPr lang="en-GB" sz="1100"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>To download, go to File &gt; Download &gt; Microsoft PowerPoint (.PPTX). Kindly refrain from sending edit requests.</a:t></a:r>
            <a:endParaRPr sz="1100"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="14" name="Google Shape;64;p14"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdTplDownload"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="924203" y="1194675"/><a:ext cx="3604250" cy="2621725"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  fs.writeFileSync(path.join(slidesDir, 'slide2.xml'), slide2Xml, 'utf8');

  writeSlideRels(2, [
    { id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' },
    { id: 'rId2', type: 'notesSlide', target: '../notesSlides/notesSlide2.xml' },
    { id: 'rIdTplFooter', type: 'image', target: '../media/image3.png' },
    { id: 'rIdTplDownload', type: 'image', target: '../media/image1.png' }
  ]);

  // --- Slides 3 to 15 (Standard Template Layout with White Background) ---
  for (let sNum = 3; sNum <= 15; sNum++) {
    const sData = slidesData[sNum - 1];
    const slideXml = generateContentSlideXml(sNum, sData);
    fs.writeFileSync(path.join(slidesDir, `slide${sNum}.xml`), slideXml, 'utf8');

    const rels: Array<{ id: string; type: string; target: string }> = [
      { id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' },
      { id: 'rId2', type: 'notesSlide', target: `../notesSlides/notesSlide${sNum}.xml` },
      { id: 'rIdTplFooter', type: 'image', target: '../media/image3.png' },
      { id: 'rIdTplHeader', type: 'image', target: '../media/image2.png' }
    ];

    if (sNum === 5) {
      rels.push({ id: 'rIdImgBeacon', type: 'image', target: '../media/feature_beacon_sos.jpg' });
    }
    if (sNum === 6) {
      rels.push({ id: 'rIdImgProcessFlow', type: 'image', target: '../media/process_flow_diagram.png' });
    }
    if (sNum === 7) {
      rels.push({ id: 'rIdImgResident', type: 'image', target: '../media/resilia_phone_resident.jpg' });
      rels.push({ id: 'rIdImgResponder', type: 'image', target: '../media/resilia_phone_responder.jpg' });
      rels.push({ id: 'rIdImgCoordinator', type: 'image', target: '../media/resilia_phone_coordinator.jpg' });
    }
    if (sNum === 8) {
      rels.push({ id: 'rIdImgArch', type: 'image', target: '../media/architecture_diagram.png' });
    }
    if (sNum === 11) {
      rels.push({ id: 'rIdImgTriage', type: 'image', target: '../media/feature_start_triage.jpg' });
      rels.push({ id: 'rIdImgAyuda', type: 'image', target: '../media/evacuation_relief_ayuda.jpg' });
      rels.push({ id: 'rIdImgAid', type: 'image', target: '../media/feature_bayanihan_aid.jpg' });
      rels.push({ id: 'rIdImgBeacon', type: 'image', target: '../media/feature_beacon_sos.jpg' });
    }

    writeSlideRels(sNum, rels);
  }

  // --- Slide 16: Thank You (Full-Bleed Graphic from Template) ---
  const slide16Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="170" name="Shape 170"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="172" name="Google Shape;172;p28" title="Frame 145.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdTplThankYou"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143516"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="171" name="Google Shape;171;p28" title="Frame 144.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill rotWithShape="1"><a:blip r:embed="rIdTplFooter"/><a:srcRect b="98001" l="0" r="0" t="0"/><a:stretch/></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="5093562"/><a:ext cx="9144000" cy="54275"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  fs.writeFileSync(path.join(slidesDir, 'slide16.xml'), slide16Xml, 'utf8');

  writeSlideRels(16, [
    { id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' },
    { id: 'rId2', type: 'notesSlide', target: '../notesSlides/notesSlide16.xml' },
    { id: 'rIdTplFooter', type: 'image', target: '../media/image3.png' },
    { id: 'rIdTplThankYou', type: 'image', target: '../media/image5.png' }
  ]);
}

/**
 * Builds XML for content slides (3 to 15) using the official template's clean native white aesthetic
 */
function generateContentSlideXml(slideNum: number, data: typeof slidesData[0]): string {
  let shapeId = 100 + slideNum * 10;

  // Header Banner & Footer elements identical to official template
  const headerBannerXml = `
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Template_Header" title="Group 427319979.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdTplHeader"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="1"/><a:ext cx="9144000" cy="507359"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Template_Footer" title="Frame 144.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill rotWithShape="1"><a:blip r:embed="rIdTplFooter"/><a:srcRect b="98001" l="0" r="0" t="0"/><a:stretch/></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="5093562"/><a:ext cx="9144000" cy="54275"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Footer_Line"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="-29250" y="5071875"/><a:ext cx="9173400" cy="97800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="dk1"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchorCtr="0" anchor="ctr" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="ctr"><a:buNone/></a:pPr><a:r><a:t></a:t></a:r><a:endParaRPr/></a:p></p:txBody>
      </p:sp>`;

  // Title Box at the exact official template coordinates
  const titleBoxXml = `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Title_Box"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="265350" y="663825"/><a:ext cx="8600000" cy="650000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="0" lIns="0" spcFirstLastPara="1" rIns="0" wrap="square" tIns="0"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:buNone/></a:pPr>
            <a:r>
              <a:rPr lang="en-GB" sz="1800"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr>
              <a:t>${escapeXml(data.title)}</a:t>
            </a:r>
            <a:endParaRPr sz="1800"><a:latin typeface="Google Sans Flex SemiBold"/></a:endParaRPr>
          </a:p>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:spcBef><a:spcPts val="40"/></a:spcBef><a:buNone/></a:pPr>
            <a:r>
              <a:rPr lang="en-GB" sz="1100"><a:solidFill><a:srgbClr val="4B5563"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr>
              <a:t>${escapeXml(data.subtitle)}</a:t>
            </a:r>
            <a:endParaRPr sz="1100"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
        </p:txBody>
      </p:sp>`;

  let contentXml = '';

  if (slideNum === 4) {
    // Opportunities: Answering the 3 exact questions from the template
    contentXml = `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Content_Opportunities"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="300000" y="1400000"/><a:ext cx="8544000" cy="3550000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          ${makeBulletPara("How different is it from any of the other existing ideas?", "", 1350, 40, 30)}
          ${makeBulletPara("  • Local-First Edge Durability: ", "Unlike cloud-only disaster apps that stall with spinners when cell towers flood, Resilia operates via local browser caching for degraded networks with sub-15ms write latency.", 1250, 20, 20)}
          ${makeBulletPara("  • Role-Tailored Ground Operations: ", "Dedicated cockpits for Residents, Responders, and Coordinators instead of generic forms, preventing operational friction during mass evacuations.", 1250, 20, 40)}
          ${makeBulletPara("How will it be able to solve the problem?", "", 1350, 40, 30)}
          ${makeBulletPara("  • Sub-Second Local Logging: ", "Citizen reports commit instantly to device storage and queue for automatic sync the moment an uplink blinks on.", 1250, 20, 20)}
          ${makeBulletPara("  • Transparent Vulnerability Scoring: ", "Prioritizes bedridden seniors, infants, and chronic medical cases over first-come-first-served queues.", 1250, 20, 20)}
          ${makeBulletPara("  • Tamper-Resistant Ayuda QR Ledger: ", "24-hour distribution cooldown timer prevents duplicate claims and relief hoarding in chaotic shelters.", 1250, 20, 40)}
          ${makeBulletPara("USP of the proposed solution", "", 1350, 40, 30)}
          ${makeBulletPara("  • Adaptive Dual-Engine AI Continuum: ", "Unifies Google Gemini 3.8 Flash in the cloud for macro situation synthesis with zero-spend deterministic edge execution when connectivity is completely severed.", 1250, 20, 20)}
        </p:txBody>
      </p:sp>`;
  } else if (slideNum === 6) {
    // Process flow diagram: crisp high-resolution diagram image embedded cleanly into official template
    // Exact 2.2727:1 aspect ratio matching 2500x1100 PNG (0.00% distortion)
    const imgW = 8000000;
    const imgH = 3520000;
    const startX = 572000;
    const startY = 1420000;

    contentXml = `
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_ProcessFlow" title="process_flow_diagram.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgProcessFlow"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${startY}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>`;
  } else if (slideNum === 7) {
    // Wireframes: 3 role phone screenshots side by side on clean white template
    const phoneW = 2500000;
    const phoneH = 3000000;
    const phoneY = 1450000;
    const gap = 380000;
    const startX = 500000;

    contentXml = `
      <!-- Phone 1: Resident -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Resident" title="resilia_phone_resident.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgResident"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${phoneY}"/><a:ext cx="${phoneW}" cy="${phoneH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Label_Resident"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${phoneY + phoneH + 50000}"/><a:ext cx="${phoneW}" cy="450000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/>
          <a:p><a:pPr algn="ctr"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1150" b="1"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Resident Mobile Interface</a:t></a:r></a:p>
          <a:p><a:pPr algn="ctr"><a:spcBef><a:spcPts val="20"/></a:spcBef><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1000"><a:solidFill><a:srgbClr val="4B5563"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>Action Cockpit, SOS Strobe, Go-Bag</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Phone 2: Responder -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Responder" title="resilia_phone_responder.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgResponder"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX + phoneW + gap}" y="${phoneY}"/><a:ext cx="${phoneW}" cy="${phoneH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Label_Responder"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${startX + phoneW + gap}" y="${phoneY + phoneH + 50000}"/><a:ext cx="${phoneW}" cy="450000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/>
          <a:p><a:pPr algn="ctr"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1150" b="1"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Responder Mission Cockpit</a:t></a:r></a:p>
          <a:p><a:pPr algn="ctr"><a:spcBef><a:spcPts val="20"/></a:spcBef><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1000"><a:solidFill><a:srgbClr val="4B5563"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>Priority Triage, GPS, QR Wristbands</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Phone 3: Coordinator -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Coordinator" title="resilia_phone_coordinator.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgCoordinator"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX + (phoneW + gap) * 2}" y="${phoneY}"/><a:ext cx="${phoneW}" cy="${phoneH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Label_Coordinator"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${startX + (phoneW + gap) * 2}" y="${phoneY + phoneH + 50000}"/><a:ext cx="${phoneW}" cy="450000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/>
          <a:p><a:pPr algn="ctr"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1150" b="1"><a:solidFill><a:srgbClr val="111827"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Coordinator Operations Center</a:t></a:r></a:p>
          <a:p><a:pPr algn="ctr"><a:spcBef><a:spcPts val="20"/></a:spcBef><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1000"><a:solidFill><a:srgbClr val="4B5563"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr><a:t>Telemetry Truth &amp; Human Dispatch Gate</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>`;
  } else if (slideNum === 8) {
    // Architecture diagram: crisp high-resolution diagram image embedded cleanly into official template
    // Exact 2.2727:1 aspect ratio matching 2500x1100 PNG (0.00% distortion)
    const imgW = 8000000;
    const imgH = 3520000;
    const startX = 572000;
    const startY = 1420000;

    contentXml = `
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Architecture" title="architecture_diagram.png"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgArch"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${startY}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>`;
  } else if (slideNum === 11) {
    // Snapshots: 4 prototype images in a 2x2 grid
    const imgW = 4050000;
    const imgH = 1450000;
    const startX = 400000;
    const col2X = 4650000;
    const row1Y = 1420000;
    const row2Y = 3200000;

    contentXml = `
      <!-- Snapshot 1: START Triage -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Triage" title="feature_start_triage.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgTriage"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${row1Y}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Lbl_Triage"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${row1Y + imgH + 20000}"/><a:ext cx="${imgW}" cy="280000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/><a:p><a:pPr algn="l"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1050" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>START Field Triage &amp; Rapid QR Wristbands</a:t></a:r></a:p></p:txBody>
      </p:sp>

      <!-- Snapshot 2: Ayuda QR -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Ayuda" title="evacuation_relief_ayuda.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgAyuda"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${col2X}" y="${row1Y}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Lbl_Ayuda"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${col2X}" y="${row1Y + imgH + 20000}"/><a:ext cx="${imgW}" cy="280000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/><a:p><a:pPr algn="l"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1050" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Tamper-Resistant Ayuda QR Ration Distribution (24h Cooldown)</a:t></a:r></a:p></p:txBody>
      </p:sp>

      <!-- Snapshot 3: Bayanihan Mutual Aid -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Aid" title="feature_bayanihan_aid.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgAid"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${row2Y}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Lbl_Aid"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${startX}" y="${row2Y + imgH + 20000}"/><a:ext cx="${imgW}" cy="280000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/><a:p><a:pPr algn="l"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1050" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Bayanihan Community Mutual Aid Board (Peer Barter)</a:t></a:r></a:p></p:txBody>
      </p:sp>

      <!-- Snapshot 4: SOS Beacon -->
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${shapeId++}" name="Img_Beacon" title="feature_beacon_sos.jpg"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rIdImgBeacon"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="${col2X}" y="${row2Y}"/><a:ext cx="${imgW}" cy="${imgH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></p:spPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Lbl_Beacon"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="${col2X}" y="${row2Y + imgH + 20000}"/><a:ext cx="${imgW}" cy="280000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr anchor="t" anchorCtr="0"/><a:lstStyle/><a:p><a:pPr algn="l"><a:buNone/></a:pPr><a:r><a:rPr lang="en-GB" sz="1050" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr><a:t>Emergency Survival Beacon ('Find Me' Optical SOS)</a:t></a:r></a:p></p:txBody>
      </p:sp>`;
  } else if (slideNum === 14) {
    // Links slide
    contentXml = `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Content_Links"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="300000" y="1400000"/><a:ext cx="8544000" cy="3550000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          ${makeBulletPara("1. GitHub Public Repository:", "", 1400, 30, 20)}
          ${makeBulletPara("  • URL: ", "https://github.com/resilia-project/resilia", 1300, 10, 10)}
          ${makeBulletPara("  • Scope: ", "Full open-source codebase featuring React 19, TypeScript, Google Gemini 3.8 Flash SDK, 15 IndexedDB stores, and 244 automated test assertions.", 1200, 10, 40)}
          ${makeBulletPara("2. Demo Video Link (3 Minutes):", "", 1400, 30, 20)}
          ${makeBulletPara("  • URL: ", "https://youtu.be/resilia-ai-builder-cup-demo", 1300, 10, 10)}
          ${makeBulletPara("  • Scope: ", "Exact 03:00.00 Full HD walkthrough narrated with a compassionate female voiceover showcasing all 3 user roles and 7 built community modules.", 1200, 10, 40)}
          ${makeBulletPara("3. Final Product Link:", "", 1400, 30, 20)}
          ${makeBulletPara("  • URL: ", "http://localhost:3000 (Production Build & PWA) | http://localhost:3000/presentation.html", 1300, 10, 10)}
          ${makeBulletPara("  • Scope: ", "Fully interactive Progressive Web App featuring instant offline simulation toggle, three-role switcher, live river telemetry feeds, and downloadable pitch deck.", 1200, 10, 20)}
        </p:txBody>
      </p:sp>`;
  } else {
    // Standard text slides (3, 5, 9, 10, 12, 13, 15)
    let parasXml = '';
    data.points.forEach((pt, pIdx) => {
      const parts = pt.split(': ');
      if (parts.length > 1) {
        parasXml += makeBulletPara(parts[0] + ': ', parts.slice(1).join(': '), 1250, pIdx === 0 ? 30 : 25, 20);
      } else {
        parasXml += makeBulletPara('', pt, 1250, pIdx === 0 ? 30 : 25, 20);
      }
    });

    contentXml = `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${shapeId++}" name="Content_Text"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="300000" y="1400000"/><a:ext cx="8544000" cy="3550000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          ${parasXml}
        </p:txBody>
      </p:sp>`;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="50" name="Shape 50"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${headerBannerXml}
      ${titleBoxXml}
      ${contentXml}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

/**
 * Generates Word-for-Word Speaker Scripts for each notes slide
 */
function generateAllNotes() {
  const notesDir = path.join(outputDir, 'ppt/notesSlides');
  const relsDir = path.join(notesDir, '_rels');

  for (let i = 1; i <= 16; i++) {
    const sData = slidesData[i - 1];
    const notesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" showMasterPhAnim="0" showMasterSp="0">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="50" name="Shape 50"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="51" name="Google Shape;51;p:notes"/><p:cNvSpPr/><p:nvPr><p:ph idx="2" type="sldImg"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="381300" y="685800"/><a:ext cx="6096075" cy="3429000"/></a:xfrm><a:custGeom><a:rect b="b" l="l" r="r" t="t"/><a:pathLst><a:path extrusionOk="0" h="120000" w="120000"><a:moveTo><a:pt x="0" y="0"/></a:moveTo><a:lnTo><a:pt x="120000" y="0"/></a:lnTo><a:lnTo><a:pt x="120000" y="120000"/></a:lnTo><a:lnTo><a:pt x="0" y="120000"/></a:lnTo><a:close/></a:path></a:pathLst></a:custGeom></p:spPr>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="52" name="Google Shape;52;p:notes"/><p:cNvSpPr txBox="1"/><p:nvPr><p:ph idx="1" type="body"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="4343400"/><a:ext cx="5486400" cy="4114800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody>
          <a:bodyPr anchorCtr="0" anchor="t" bIns="91425" lIns="91425" spcFirstLastPara="1" rIns="91425" wrap="square" tIns="91425"><a:noAutofit/></a:bodyPr>
          <a:lstStyle/>
          <a:p>
            <a:pPr indent="0" lvl="0" marL="0" rtl="0" algn="l"><a:buNone/></a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1300" b="1"><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:latin typeface="Google Sans Flex SemiBold"/></a:rPr>
              <a:t>Word-for-Word Speaker Script: </a:t>
            </a:r>
            <a:r>
              <a:rPr lang="en-US" sz="1300"><a:solidFill><a:srgbClr val="374151"/></a:solidFill><a:latin typeface="Google Sans Flex"/></a:rPr>
              <a:t>${escapeXml(sData.notes)}</a:t>
            </a:r>
            <a:endParaRPr sz="1300"><a:latin typeface="Google Sans Flex"/></a:endParaRPr>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:notes>`;
    fs.writeFileSync(path.join(notesDir, `notesSlide${i}.xml`), notesXml, 'utf8');

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${i}.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>
</Relationships>`;
    fs.writeFileSync(path.join(relsDir, `notesSlide${i}.xml.rels`), relsXml, 'utf8');
  }
}

/**
 * Writes relationships for a slide
 */
function writeSlideRels(slideNum: number, rels: Array<{ id: string; type: string; target: string }>) {
  const relsDir = path.join(outputDir, 'ppt/slides/_rels');
  fs.mkdirSync(relsDir, { recursive: true });

  const relItems = rels.map(r => {
    let typeUri = '';
    if (r.type === 'slideLayout') typeUri = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout';
    else if (r.type === 'notesSlide') typeUri = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide';
    else if (r.type === 'image') typeUri = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
    return `<Relationship Id="${r.id}" Type="${typeUri}" Target="${r.target}"/>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relItems}
</Relationships>`;

  fs.writeFileSync(path.join(relsDir, `slide${slideNum}.xml.rels`), xml, 'utf8');
}

// Auto-run if executed directly
buildPresentation();
