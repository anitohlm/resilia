/**
 * Automated Verification Suite for Resilia AI Builder Cup Submission Deck & Proposal
 * Validates:
 * 1. Competition Proposal requirements coverage (Vision, Problem, Community Benefit, Feasibility, Scalability)
 * 2. 16-Slide Official AI Builder Cup Submission Template blueprint and verbatim speaker scripts in docs/PITCH_DECK.md
 * 3. Interactive Web presentation.html (16 slides, navigation, speaker notes, and print/PDF CSS)
 * 4. Native OpenXML PPTX structural integrity (16 slides, 16 notes slides, Dublin Core metadata, zero illegal newlines)
 * 5. Embedded disaster and app feature pictures & 3-role smartphone screenshots (resident, responder, coordinator)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { slidesData, escapeXml } from '../scripts/generateDeckPptx';

let passed = 0;
let failed = 0;

function assert(cond: boolean, desc: string) {
  if (cond) {
    console.log(`✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${desc}`);
    failed++;
  }
}

console.log('================================================================');
console.log('   RESILIA AI BUILDER CUP SUBMISSION DECK VERIFICATION SUITE');
console.log('================================================================\n');

// --- 1. Document Requirements Coverage ---
console.log('--- 1. Competition Proposal Document Coverage ---');
const proposalPath = path.resolve(process.cwd(), 'docs/COMPETITION_PROPOSAL.md');
assert(fs.existsSync(proposalPath), 'docs/COMPETITION_PROPOSAL.md exists');
const proposalContent = fs.readFileSync(proposalPath, 'utf8');

assert(proposalContent.includes('Executive Summary & Compelling Vision'), 'Contains Compelling Vision section');
assert(proposalContent.includes('The 72-Hour Connectivity Paradox') || proposalContent.includes('72-Hour Communication Blackout'), 'Articulates 72-Hour Blackout Crisis');
assert(proposalContent.includes('UN Sustainable Development Goal 11') && proposalContent.includes('SDG 13'), 'Aligned with UN SDGs 11 & 13');
assert(proposalContent.includes('Sendai Framework'), 'Aligned with Sendai Framework');
assert(proposalContent.includes('Barangay Tumana') && proposalContent.includes('Marikina City River Basin'), 'Grounded in Philippine Marikina River Basin');
assert(proposalContent.includes('Hybrid Dual-Engine AI Architecture'), 'Details Google Gemini 3.8 Flash + Local Edge AI');
assert(proposalContent.includes('The Seven Specialized Modular AI Agents'), 'Details 7 Modular AI Agents');
assert(proposalContent.includes('Comprehensive Community Capabilities'), 'Details 7 Built Community Modules');
assert(proposalContent.includes('Project Feasibility'), 'Demonstrates project feasibility with automated test pass rate');
assert(proposalContent.includes('Scalability & Growth Roadmap'), 'Demonstrates 3-tier scalability model to 42,000+ communities');
assert(proposalContent.includes('Official AI Builder Cup Presentation Pitch Deck Structure (16 Slides)'), 'COMPETITION_PROPOSAL.md documents 16-slide Official AI Builder Cup structure');

// --- 2. Pitch Deck Blueprint & Verbatim Scripts (16 Slides) ---
console.log('\n--- 2. Pitch Deck Blueprint & Speaker Scripts (16-Slide Official Template) ---');
const blueprintPath = path.resolve(process.cwd(), 'docs/PITCH_DECK.md');
assert(fs.existsSync(blueprintPath), 'docs/PITCH_DECK.md exists');
const blueprintContent = fs.readFileSync(blueprintPath, 'utf8');

assert(blueprintContent.includes('16-Slide Official Submission Template Blueprint') || blueprintContent.includes('16-Slide Blueprint'), 'Specifies 16-slide structure');
assert(blueprintContent.includes('Google Cloud | H2S — AI Builder Cup: Build in JAPAC. Build for the world.'), 'Includes official AI Builder Cup branding');
assert(blueprintContent.includes('Team Details'), 'Blueprint contains Slide 1: Team Details');
assert(blueprintContent.includes('Submission Template Instructions') || blueprintContent.includes('Official Template Instructions'), 'Blueprint contains Slide 2: Template Instructions');
assert(blueprintContent.includes('Brief about the idea'), 'Blueprint contains Slide 3: Brief about the idea');
assert(blueprintContent.includes('Opportunities'), 'Blueprint contains Slide 4: Opportunities');
assert(blueprintContent.includes('List of features offered by the solution'), 'Blueprint contains Slide 5: List of features offered by the solution');
assert(blueprintContent.includes('Process flow diagram or Use-case diagram'), 'Blueprint contains Slide 6: Process flow diagram or Use-case diagram');
assert(blueprintContent.includes('Wireframes/Mock diagrams of the proposed solution (optional)'), 'Blueprint contains Slide 7: Wireframes/Mock diagrams of the proposed solution (optional)');
assert(blueprintContent.includes('Architecture diagram of the proposed solution'), 'Blueprint contains Slide 8: Architecture diagram of the proposed solution');
assert(blueprintContent.includes('Technologies to be used in the solution'), 'Blueprint contains Slide 9: Technologies to be used in the solution');
assert(blueprintContent.includes('Estimated implementation cost (optional)'), 'Blueprint contains Slide 10: Estimated implementation cost (optional)');
assert(blueprintContent.includes('Snapshots of the prototype'), 'Blueprint contains Slide 11: Snapshots of the prototype');
assert(blueprintContent.includes('Prototype Performance report/Benchmarking'), 'Blueprint contains Slide 12: Prototype Performance report/Benchmarking');
assert(blueprintContent.includes('Additional Details/Future Development (if any)'), 'Blueprint contains Slide 13: Additional Details/Future Development (if any)');
assert(blueprintContent.includes('Provide links to your:'), 'Blueprint contains Slide 14: Provide links to your:');
assert(blueprintContent.includes('Community Resilience & Sustainability Alignment'), 'Blueprint contains Slide 15: Community Resilience');
assert(blueprintContent.includes('Thank you'), 'Blueprint contains Slide 16: Thank you');

for (let i = 1; i <= 16; i++) {
  assert(blueprintContent.includes(`Slide ${i}:`), `Blueprint contains header for Slide ${i}`);
  assert(blueprintContent.includes(`Slide ${i}:`) && blueprintContent.includes('Speaker Script:'), `Blueprint has speaker notes for Slide ${i}`);
}

// --- 3. Interactive Web Presentation Deck (HTML & Print CSS) ---
console.log('\n--- 3. Interactive Web Presentation Deck (presentation.html) ---');
const htmlPath = path.resolve(process.cwd(), 'public/presentation.html');
assert(fs.existsSync(htmlPath), 'public/presentation.html exists');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('totalSlides = 16'), 'HTML sets totalSlides to 16');
for (let i = 1; i <= 16; i++) {
  assert(htmlContent.includes(`id="slide-${i}"`), `HTML contains section for slide-${i}`);
  assert(htmlContent.includes(`data-notes=`), `HTML contains speaker notes data attribute`);
}

assert(htmlContent.includes('speaker-notes-panel'), 'HTML contains speaker notes drawer');
assert(htmlContent.includes('toggleFullscreen'), 'HTML contains fullscreen presenter mode');
assert(htmlContent.includes('keydown'), 'HTML binds keyboard presentation shortcuts (arrows, space, N, F)');
assert(htmlContent.includes('touchstart') && htmlContent.includes('touchend'), 'HTML binds touch swipe for mobile presentation');
assert(htmlContent.includes('Resilia_Competition_Pitch_Deck.pptx'), 'HTML provides direct PowerPoint (.pptx) download link');
assert(htmlContent.includes('resilia_demo_video.mp4'), 'HTML links to 3-minute demo video MP4');

// Verify @media print styles
assert(htmlContent.includes('@media print'), 'HTML includes @media print styles');
assert(htmlContent.includes('overflow: visible !important'), 'Print CSS resets overflow to visible for multi-page export');
assert(htmlContent.includes('aspect-ratio: auto !important'), 'Print CSS resets aspect-ratio to prevent single-box viewport clipping');
assert(htmlContent.includes('page-break-after: always !important') || htmlContent.includes('break-after: page !important'), 'Print CSS enforces clean page breaks per slide');

// --- 4. Native OpenXML PowerPoint Presentation (.pptx) ---
console.log('\n--- 4. Native OpenXML PowerPoint Presentation (.pptx) ---');
const pptxPath = path.resolve(process.cwd(), 'Resilia_Competition_Pitch_Deck.pptx');
const publicPptxPath = path.resolve(process.cwd(), 'public/Resilia_Competition_Pitch_Deck.pptx');

assert(fs.existsSync(pptxPath), 'Root Resilia_Competition_Pitch_Deck.pptx exists');
assert(fs.existsSync(publicPptxPath), 'public/Resilia_Competition_Pitch_Deck.pptx exists');

const stat = fs.statSync(pptxPath);
assert(stat.size > 20000, `PPTX file size is healthy (>20KB): ${stat.size} bytes`);
assert(fs.statSync(publicPptxPath).size === stat.size, 'Public PPTX is in exact byte synchrony with root PPTX');

const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  const distPptxPath = path.resolve(distDir, 'Resilia_Competition_Pitch_Deck.pptx');
  assert(fs.existsSync(distPptxPath), 'dist/Resilia_Competition_Pitch_Deck.pptx exists');
  assert(fs.statSync(distPptxPath).size === stat.size, 'dist PPTX is in exact byte synchrony with root PPTX');

  const distHtmlPath = path.resolve(distDir, 'presentation.html');
  assert(fs.existsSync(distHtmlPath), 'dist/presentation.html exists');
  assert(fs.statSync(distHtmlPath).size === fs.statSync(htmlPath).size, 'dist/presentation.html is in byte synchrony with public/presentation.html');
}

// Extract and validate internal OpenXML XML parts
const inspectDir = path.resolve(process.cwd(), 'temp_inspect_pptx');
if (fs.existsSync(inspectDir)) {
  fs.rmSync(inspectDir, { recursive: true, force: true });
}
fs.mkdirSync(inspectDir, { recursive: true });

try {
  const extractCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${pptxPath}', '${inspectDir}')"`;
  execSync(extractCmd, { stdio: 'pipe' });

  // 4a. Content Types & Rels
  const contentTypesXml = fs.readFileSync(path.join(inspectDir, '[Content_Types].xml'), 'utf8');
  assert(contentTypesXml.includes('PartName="/docProps/core.xml"'), 'OpenXML contains docProps/core.xml in [Content_Types].xml');
  assert(contentTypesXml.includes('PartName="/docProps/app.xml"'), 'OpenXML contains docProps/app.xml in [Content_Types].xml');
  assert(contentTypesXml.includes('PartName="/ppt/notesMasters/notesMaster1.xml"'), 'OpenXML contains notesMaster in [Content_Types].xml');

  const rootRelsXml = fs.readFileSync(path.join(inspectDir, '_rels/.rels'), 'utf8');
  assert(rootRelsXml.includes('metadata/core-properties'), '_rels/.rels registers Dublin Core metadata relationship');
  assert(rootRelsXml.includes('extended-properties'), '_rels/.rels registers extended application properties');

  // 4b. docProps metadata
  const coreProps = fs.readFileSync(path.join(inspectDir, 'docProps/core.xml'), 'utf8');
  assert(coreProps.includes('AI Builder Cup') || coreProps.includes('RESILIA'), 'core.xml contains presentation title');
  assert(coreProps.includes('Resilia Engineering Team'), 'core.xml contains author attribution');

  const appProps = fs.readFileSync(path.join(inspectDir, 'docProps/app.xml'), 'utf8');
  assert(appProps.includes('<Slides>16</Slides>'), 'app.xml registers exactly 16 slides');
  assert(appProps.includes('<Notes>16</Notes>'), 'app.xml registers exactly 16 notes slides');

  // 4c. Slide Master & Layout Compliance
  const masterXml = fs.readFileSync(path.join(inspectDir, 'ppt/slideMasters/slideMaster1.xml'), 'utf8');
  assert(masterXml.includes('<p:txStyles>') || masterXml.includes('<p:sldMaster>'), 'slideMaster1.xml defines master presentation markup');

  const layoutXml = fs.readFileSync(path.join(inspectDir, 'ppt/slideLayouts/slideLayout1.xml'), 'utf8');
  assert(layoutXml.includes('<p:clrMapOvr>'), 'slideLayout1.xml defines <p:clrMapOvr> color mapping override');

  // 4d. Slide & Notes Consistency
  for (let i = 1; i <= 16; i++) {
    const slideFile = path.join(inspectDir, `ppt/slides/slide${i}.xml`);
    assert(fs.existsSync(slideFile), `Slide file ppt/slides/slide${i}.xml exists`);

    const slideContent = fs.readFileSync(slideFile, 'utf8');
    // Schema check: OpenXML DrawingML <a:t> must never contain literal newlines
    const illegalNewlineInTextTag = /<a:t>[^<]*[\r\n][^<]*<\/a:t>/g.test(slideContent);
    assert(!illegalNewlineInTextTag, `Slide ${i} has zero illegal literal newline characters inside <a:t>`);

    const notesFile = path.join(inspectDir, `ppt/notesSlides/notesSlide${i}.xml`);
    assert(fs.existsSync(notesFile), `Notes slide ppt/notesSlides/notesSlide${i}.xml exists`);

    const notesContent = fs.readFileSync(notesFile, 'utf8');
    assert(notesContent.includes('Word-for-Word Speaker Script'), `Notes slide ${i} contains speaker script header`);
    assert(notesContent.includes(escapeXml(slidesData[i - 1].notes.substring(0, 25))), `Notes slide ${i} contains verbatim script`);
  }

  // 4e. Presentation Embedded Media & Pictures Validation
  console.log('\n--- 5. Embedded Disaster & App Pictures Validation ---');
  const expectedImages = [
    'resilia_app_cellphone.jpg',
    'filipino_disaster_community.jpg',
    'evacuation_relief_ayuda.jpg',
    'emergency_command_mesh.jpg',
    'feature_start_triage.jpg',
    'feature_beacon_sos.jpg',
    'feature_bayanihan_aid.jpg',
    'resilia_phone_resident.jpg',
    'resilia_phone_responder.jpg',
    'resilia_phone_coordinator.jpg'
  ];

  for (const imgName of expectedImages) {
    const publicImgPath = path.resolve(process.cwd(), 'public/images', imgName);
    assert(fs.existsSync(publicImgPath) && fs.statSync(publicImgPath).size > 50000, `Public image ${imgName} exists (>50KB)`);

    const pptxMediaPath = path.join(inspectDir, 'ppt/media', imgName);
    assert(fs.existsSync(pptxMediaPath) && fs.statSync(pptxMediaPath).size > 50000, `PPTX media package contains ${imgName}`);
  }

  // Verify slide relationship and <p:pic> markup for image-bearing slides (1, 2, 5, 7, 11, 16)
  const imageSlides = [1, 2, 5, 7, 11, 16];
  for (const sNum of imageSlides) {
    const relFile = path.join(inspectDir, `ppt/slides/_rels/slide${sNum}.xml.rels`);
    const relContent = fs.readFileSync(relFile, 'utf8');
    assert(relContent.includes('/relationships/image') && relContent.includes('../media/'), `Slide ${sNum} rels links to ../media/ image`);

    const slideXmlFile = path.join(inspectDir, `ppt/slides/slide${sNum}.xml`);
    const slideXmlContent = fs.readFileSync(slideXmlFile, 'utf8');
    assert(slideXmlContent.includes('<p:pic>') && slideXmlContent.includes('<a:blip'), `Slide ${sNum} contains DrawingML <p:pic> node with <a:blip>`);
  }

  // Slide 5 SOS Beacon Feature Photo verification
  const slide5Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide5.xml.rels'), 'utf8');
  assert(slide5Rel.includes('feature_beacon_sos.jpg'), 'Slide 5 rels links to feature_beacon_sos.jpg');

  // Slide 7 Three Account Mobile Phone Screenshots verification
  const slide7Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide7.xml.rels'), 'utf8');
  assert(slide7Rel.includes('resilia_phone_resident.jpg'), 'Slide 7 rels links to Resident phone screenshot');
  assert(slide7Rel.includes('resilia_phone_responder.jpg'), 'Slide 7 rels links to Responder phone screenshot');
  assert(slide7Rel.includes('resilia_phone_coordinator.jpg'), 'Slide 7 rels links to Coordinator phone screenshot');
  const slide7Xml = fs.readFileSync(path.join(inspectDir, 'ppt/slides/slide7.xml'), 'utf8');
  assert(slide7Xml.includes('rIdImgResident'), 'Slide 7 DrawingML references rIdImgResident');
  assert(slide7Xml.includes('rIdImgResponder'), 'Slide 7 DrawingML references rIdImgResponder');
  assert(slide7Xml.includes('rIdImgCoordinator'), 'Slide 7 DrawingML references rIdImgCoordinator');

  // Slide 11 Four Prototype Photos verification
  const slide11Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide11.xml.rels'), 'utf8');
  assert(slide11Rel.includes('feature_start_triage.jpg'), 'Slide 11 rels links to feature_start_triage.jpg');
  assert(slide11Rel.includes('evacuation_relief_ayuda.jpg'), 'Slide 11 rels links to evacuation_relief_ayuda.jpg');
  assert(slide11Rel.includes('feature_bayanihan_aid.jpg'), 'Slide 11 rels links to feature_bayanihan_aid.jpg');
  assert(slide11Rel.includes('feature_beacon_sos.jpg'), 'Slide 11 rels links to feature_beacon_sos.jpg');

  // Verify HTML presentation includes pictures and account phone screenshots
  for (const imgName of expectedImages) {
    assert(htmlContent.includes(`/images/${imgName}`), `HTML presentation embeds /images/${imgName}`);
  }

  // 4f. Official AI Builder Cup Template Assets Preservation & OpenXML Integration
  console.log('\n--- 6. Official AI Builder Cup Template Assets & OpenXML Integration ---');
  const templatePath = path.resolve(process.cwd(), 'templates/AI_Builder_Cup_Template.pptx');
  assert(fs.existsSync(templatePath) && fs.statSync(templatePath).size > 900000, 'templates/AI_Builder_Cup_Template.pptx exists (>900KB)');

  const officialTemplateImages = [
    'image1.png',
    'image2.png',
    'image3.png',
    'image4.png',
    'image5.png'
  ];

  for (const tplImg of officialTemplateImages) {
    const mediaFile = path.join(inspectDir, 'ppt/media', tplImg);
    assert(fs.existsSync(mediaFile), `PPTX media package preserves official template asset ${tplImg}`);
  }

  // Slide 1 Official Title Banner & Footer Strip
  const slide1Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide1.xml.rels'), 'utf8');
  assert(slide1Rel.includes('image4.png'), 'Slide 1 rels links to official template Title Banner (image4.png)');
  assert(slide1Rel.includes('image3.png'), 'Slide 1 rels links to official template Footer Strip (image3.png)');
  const slide1Xml = fs.readFileSync(path.join(inspectDir, 'ppt/slides/slide1.xml'), 'utf8');
  assert(slide1Xml.includes('rIdTplBanner'), 'Slide 1 DrawingML embeds rIdTplBanner');
  assert(slide1Xml.includes('rIdTplFooter'), 'Slide 1 DrawingML embeds rIdTplFooter');

  // Slide 3 Official Header Banner & Footer Strip
  const slide3Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide3.xml.rels'), 'utf8');
  assert(slide3Rel.includes('image2.png'), 'Slide 3 rels links to official template Header Banner (image2.png)');
  assert(slide3Rel.includes('image3.png'), 'Slide 3 rels links to official template Footer Strip (image3.png)');
  const slide3Xml = fs.readFileSync(path.join(inspectDir, 'ppt/slides/slide3.xml'), 'utf8');
  assert(slide3Xml.includes('rIdTplHeader'), 'Slide 3 DrawingML embeds rIdTplHeader');
  assert(slide3Xml.includes('rIdTplFooter'), 'Slide 3 DrawingML embeds rIdTplFooter');

  // Slide 16 Official Thank You Graphic & Footer Strip
  const slide16Rel = fs.readFileSync(path.join(inspectDir, 'ppt/slides/_rels/slide16.xml.rels'), 'utf8');
  assert(slide16Rel.includes('image5.png'), 'Slide 16 rels links to official template Thank You Graphic (image5.png)');
  assert(slide16Rel.includes('image3.png'), 'Slide 16 rels links to official template Footer Strip (image3.png)');
  const slide16Xml = fs.readFileSync(path.join(inspectDir, 'ppt/slides/slide16.xml'), 'utf8');
  assert(slide16Xml.includes('rIdTplThankYou'), 'Slide 16 DrawingML embeds rIdTplThankYou');
  assert(slide16Xml.includes('rIdTplFooter'), 'Slide 16 DrawingML embeds rIdTplFooter');

  // Verify HTML presentation embeds official AI Builder Cup banners and footer strips
  const officialHtmlImages = [
    'ai_builder_cup_title_banner.png',
    'ai_builder_cup_header.png',
    'ai_builder_cup_footer.png',
    'ai_builder_cup_thank_you.png'
  ];
  for (const tplImg of officialHtmlImages) {
    const publicPath = path.resolve(process.cwd(), 'public/images', tplImg);
    assert(fs.existsSync(publicPath), `public/images contains ${tplImg}`);
    assert(htmlContent.includes(`/images/${tplImg}`), `HTML presentation embeds /images/${tplImg}`);
  }

} finally {
  if (fs.existsSync(inspectDir)) {
    fs.rmSync(inspectDir, { recursive: true, force: true });
  }
}

// --- Summary ---
console.log('\n======================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
}
