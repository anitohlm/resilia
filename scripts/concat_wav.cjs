const fs = require('fs');
const path = require('path');

const audioDir = path.resolve('video_build/audio');
const outputWav = path.resolve('video_build/full_voiceover.wav');
const bytesPerSec = 96000; // 48kHz * 16-bit * 1 channel / 8
const sceneDurationSec = 15;
const sceneTargetBytes = sceneDurationSec * bytesPerSec; // 1,440,000 bytes of PCM

const allPcm = [];

for (let i = 1; i <= 12; i++) {
  const padIndex = String(i).padStart(2, '0');
  const rawPath = path.join(audioDir, `raw_scene_${padIndex}.wav`);
  const finalClipPath = path.join(audioDir, `scene_${padIndex}.wav`);

  if (!fs.existsSync(rawPath)) {
    console.warn(`Warning: raw file not found: ${rawPath}, using silence.`);
    const silence = Buffer.alloc(sceneTargetBytes, 0);
    allPcm.push(silence);
    continue;
  }

  const rawBuf = fs.readFileSync(rawPath);
  const pcm = rawBuf.subarray(44); // skip standard 44-byte WAV header

  let sceneBuffer;
  if (pcm.length >= sceneTargetBytes) {
    sceneBuffer = pcm.subarray(0, sceneTargetBytes);
  } else {
    const silenceNeeded = sceneTargetBytes - pcm.length;
    sceneBuffer = Buffer.concat([pcm, Buffer.alloc(silenceNeeded, 0)]);
  }

  // Also write padded scene wav
  const sceneHeader = Buffer.alloc(44);
  rawBuf.copy(sceneHeader, 0, 0, 44);
  sceneHeader.writeUInt32LE(sceneBuffer.length + 36, 4);
  sceneHeader.writeUInt32LE(sceneBuffer.length, 40);
  fs.writeFileSync(finalClipPath, Buffer.concat([sceneHeader, sceneBuffer]));

  allPcm.push(sceneBuffer);
}

const masterPcm = Buffer.concat(allPcm);
const masterHeader = Buffer.alloc(44);

// RIFF header
masterHeader.write('RIFF', 0);
masterHeader.writeUInt32LE(masterPcm.length + 36, 4);
masterHeader.write('WAVE', 8);

// fmt subchunk
masterHeader.write('fmt ', 12);
masterHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
masterHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
masterHeader.writeUInt16LE(1, 22);  // NumChannels (1 mono)
masterHeader.writeUInt32LE(48000, 24); // SampleRate
masterHeader.writeUInt32LE(96000, 28); // ByteRate
masterHeader.writeUInt16LE(2, 32);  // BlockAlign
masterHeader.writeUInt16LE(16, 34); // BitsPerSample

// data subchunk
masterHeader.write('data', 36);
masterHeader.writeUInt32LE(masterPcm.length, 40);

fs.writeFileSync(outputWav, Buffer.concat([masterHeader, masterPcm]));
console.log(`Master WAV generated: ${outputWav} (${fs.statSync(outputWav).size} bytes)`);
