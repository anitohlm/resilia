import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function pass(msg: string) {
  console.log(`\x1b[32m✓ [PASS]\x1b[0m ${msg}`);
}

function fail(msg: string) {
  console.error(`\x1b[31m✗ [FAIL]\x1b[0m ${msg}`);
  process.exit(1);
}

function assert(condition: boolean, msg: string) {
  if (condition) {
    pass(msg);
  } else {
    fail(msg);
  }
}

console.log('--- 6. Resilia 3-Minute Demo Video (MP4) Validation ---');

const publicVideoPath = path.resolve(process.cwd(), 'public/resilia_demo_video.mp4');
const rootVideoPath = path.resolve(process.cwd(), 'Resilia_Demo_Video.mp4');

// 1. Artifact Existence & Synchrony
assert(fs.existsSync(publicVideoPath), 'public/resilia_demo_video.mp4 exists');
const pubStat = fs.statSync(publicVideoPath);
assert(pubStat.size > 5_000_000, `Public video file size is substantial (${pubStat.size} bytes > 5MB)`);

assert(fs.existsSync(rootVideoPath), 'Resilia_Demo_Video.mp4 exists in root');
const rootStat = fs.statSync(rootVideoPath);
const distVideoPath = path.resolve(process.cwd(), 'dist/resilia_demo_video.mp4');
const distInSync = !fs.existsSync(distVideoPath) || fs.statSync(distVideoPath).size === pubStat.size;
assert(rootStat.size === pubStat.size && distInSync, 'Root and dist MP4 are in exact byte synchrony with public MP4');

// 2. Validate MP4 container header
const fd = fs.openSync(publicVideoPath, 'r');
const headerBuf = Buffer.alloc(12);
fs.readSync(fd, headerBuf, 0, 12, 0);
fs.closeSync(fd);
const ftyp = headerBuf.toString('ascii', 4, 8);
assert(ftyp === 'ftyp', 'Video container contains valid ISO Base Media File Format ftyp box');

// 3. Inspect ffmpeg stream details
const ffmpegPath = 'C:\\Program Files\\BlueStacks_nxt\\ffmpeg.exe';
if (fs.existsSync(ffmpegPath)) {
  try {
    const ffOut = execSync(`"${ffmpegPath}" -i "${publicVideoPath}" 2>&1`, { encoding: 'utf8' });
    assert(ffOut.includes('Duration: 00:02:59') || ffOut.includes('Duration: 00:03:00'), 'Video duration is ~3 minutes (~180 seconds)');
    assert(ffOut.includes('1920x1080'), 'Video stream resolution is Full HD (1920x1080)');
    assert(ffOut.includes('h264'), 'Video codec is H.264');
    assert(ffOut.includes('Audio: aac'), 'Audio stream codec is AAC');
    assert(ffOut.includes('48000 Hz'), 'Audio sample rate is 48000 Hz');
  } catch (err: any) {
    const ffOut = err.stdout || err.message || '';
    assert(ffOut.includes('Duration: 00:02:59') || ffOut.includes('Duration: 00:03:00'), 'Video duration is ~3 minutes (~180 seconds)');
    assert(ffOut.includes('1920x1080'), 'Video stream resolution is Full HD (1920x1080)');
    assert(ffOut.includes('h264'), 'Video codec is H.264');
    assert(ffOut.includes('Audio: aac'), 'Audio stream codec is AAC');
    assert(ffOut.includes('48000 Hz'), 'Audio sample rate is 48000 Hz');
  }
}

// 4. Validate Frame Generation (12 Scene Slides)
const framesDir = path.resolve(process.cwd(), 'video_build/frames');
assert(fs.existsSync(framesDir), 'video_build/frames directory exists');
for (let i = 1; i <= 12; i++) {
  const num = String(i).padStart(2, '0');
  const framePath = path.join(framesDir, `scene_${num}.jpg`);
  assert(fs.existsSync(framePath), `Scene frame ${num} exists`);
  const frameStat = fs.statSync(framePath);
  assert(frameStat.size > 200_000, `Scene frame ${num} is high-res (>200KB)`);
}

// 5. Validate Audio Synthesis (12 Scene Audio Clips + Master WAV)
const audioDir = path.resolve(process.cwd(), 'video_build/audio');
assert(fs.existsSync(audioDir), 'video_build/audio directory exists');
for (let i = 1; i <= 12; i++) {
  const num = String(i).padStart(2, '0');
  const audioPath = path.join(audioDir, `scene_${num}.wav`);
  assert(fs.existsSync(audioPath), `Scene audio clip ${num} exists`);
  const audioStat = fs.statSync(audioPath);
  assert(audioStat.size > 100_000, `Scene audio clip ${num} is substantial (>100KB)`);
}

const masterWavPath = path.resolve(process.cwd(), 'video_build/full_voiceover.wav');
assert(fs.existsSync(masterWavPath), 'video_build/full_voiceover.wav exists');
const masterWavStat = fs.statSync(masterWavPath);
assert(masterWavStat.size > 15_000_000, `Master WAV is full length (${masterWavStat.size} bytes > 15MB)`);
assert(masterWavStat.size === 17280044, 'Master WAV is exactly 180.000s in length (17,280,044 bytes)');

// 6. Validate Integration in Presentation & Documentation
const presHtml = fs.readFileSync(path.resolve(process.cwd(), 'public/presentation.html'), 'utf8');
assert(presHtml.includes('/resilia_demo_video.mp4'), 'Presentation HTML links to /resilia_demo_video.mp4');
assert(presHtml.includes('🎬 Watch 3-Min Demo Video (MP4)'), 'Slide 13 embeds Watch 3-Min Demo Video button');

// 7. Validate Honest Framing (No 100% claims in video slides)
const slideScript = fs.readFileSync(path.resolve(process.cwd(), 'scripts/generate_video_slides.ps1'), 'utf8');
const honestWordingValid = (
  !slideScript.includes('100% mathematical reliability') &&
  !slideScript.includes('Field-Tested Community Resilience Modules') &&
  !slideScript.includes('100% persistent in local IndexedDB.') &&
  !slideScript.includes('When networks collapse, Resilia continues operating entirely offline from local memory.') &&
  !slideScript.includes('rely 100% on cloud servers') &&
  !slideScript.includes('demonstrate proven architectural feasibility') &&
  !slideScript.includes('zero-overdraft guarantees') &&
  slideScript.includes('Seven Built Community Resilience Modules') &&
  slideScript.includes('Saved locally in browser IndexedDB.') &&
  slideScript.includes('When networks degrade, Resilia falls back to cached local records and deterministic rules.') &&
  slideScript.includes('rely entirely on cloud servers') &&
  slideScript.includes('demonstrate practical architectural feasibility') &&
  slideScript.includes('zero-overdraft validation checks')
);
assert(honestWordingValid, 'Slide generator strictly honors all 6 unexaggerated resilience claim replacements');
assert(slideScript.includes('244 Automated Test Assertions Passing Across 5 Test Suites'), 'Slide generator documents all 244 test assertions');

console.log('\x1b[32mAll Demo Video Validation Checks Passed!\x1b[0m');
