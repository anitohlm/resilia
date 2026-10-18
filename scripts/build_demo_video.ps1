# Master Pipeline for Generating the 3-Minute Resilia Demo Video (MP4)
$ErrorActionPreference = 'Stop'

Write-Output '=== STEP 1: INITIALIZE DIRECTORIES ==='
$buildDir = 'c:\Users\hmanito\antigravity\Resilia\video_build'
$audioDir = Join-Path $buildDir 'audio'
$framesDir = Join-Path $buildDir 'frames'

if (-not (Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir -Force | Out-Null }
if (-not (Test-Path $framesDir)) { New-Item -ItemType Directory -Path $framesDir -Force | Out-Null }

Write-Output '=== STEP 2: GENERATE FEMALE COMPASSIONATE VOICEOVER (RATE 0) ==='
$token = New-Object -ComObject SAPI.SpObjectToken
$token.SetId('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices\Tokens\TTS_MS_EN-US_ZIRA_11.0')

$scenes = @(
    @{
        Id = 1
        Text = 'Disasters do not wait for good Wi-Fi. In the first seventy-two hours of a typhoon, power grids collapse and cellular towers go dark. Resilia is an A.I.-assisted community platform that keeps vital lifelines open when networks fail.'
    },
    @{
        Id = 2
        Text = 'When communications fail, cloud-dependent emergency apps display empty screens. Vulnerable families trapped on rooftops cannot call for help, and ground coordinators lose line-of-sight to the crisis.'
    },
    @{
        Id = 3
        Text = 'Aligned with U.N. Sustainable Development Goals 11 and 13 and Sendai Priority 4, Resilia was evaluated on simulated flood hydrology modeled on the Marikina River basin across Alarm Levels 1, 2, and 3.'
    },
    @{
        Id = 4
        Text = 'Resilia features a resilient dual-engine architecture: cloud Google Gemini for regional crisis analysis, seamlessly transitioning to deterministic local edge processing without data loss when connectivity is severed.'
    },
    @{
        Id = 5
        Text = 'Seven modular A.I. agents coordinate emergency response. They cluster hazard reports, score household vulnerability, and track relief inventories, governed by strict human-in-the-loop oversight.'
    },
    @{
        Id = 6
        Text = 'For residents, Resilia is an accessible personal lifeline: complete a seventy-two hour family Go-Bag checklist, flash an emergency S.O.S. strobe, check shelter capacity, or submit one-tap distress calls offline.'
    },
    @{
        Id = 7
        Text = 'First responders receive an action-focused rescue cockpit. Priority dispatches sort households by vulnerability, backed by S.T.A.R.T. mass-casualty triage wristbands and offline incident logging.'
    },
    @{
        Id = 8
        Text = 'Municipal coordinators maintain complete situational truth: live Marikina river telemetry, shelter headcounts, fraud-proof relief ledgers, and an approval gate for proposed rescue operations.'
    },
    @{
        Id = 9
        Text = 'Specialized community modules address Philippine ground realities: color-coded triage wristbands, a twenty-four hour Q.R. relief cooldown ledger, shelter reunification boards, and leptospirosis health alerts.'
    },
    @{
        Id = 10
        Text = 'In disasters, false information costs lives. Resilia strictly enforces anti-hallucination guardrails: every recommendation cites verified local data, and high-consequence dispatches require human authorization.'
    },
    @{
        Id = 11
        Text = 'Resilia is a functional working prototype evaluated across 244 automated test assertions. While not yet deployed in live disasters, simulation verifies deterministic arithmetic, local storage, and sync queues.'
    },
    @{
        Id = 12
        Text = 'From mobile browsers to thirty-five dollar edge servers and Google Cloud Run, Resilia scales across Philippine barangays. Disasters are inevitable, but being cut off is not. Resilia keeps the lifeline open.'
    }
)

foreach ($s in $scenes) {
    $voice = New-Object -ComObject SAPI.SpVoice
    $voice.Voice = $token
    $voice.Rate = 0
    $voice.Volume = 100

    $rawPath = Join-Path $audioDir ('raw_scene_{0:D2}.wav' -f $s.Id)
    if (Test-Path $rawPath) { Remove-Item $rawPath -Force }

    $fs = New-Object -ComObject SAPI.SpFileStream
    $fs.Format.Type = 38 # 48kHz 16-bit mono
    $fs.Open($rawPath, 3, $false)
    $voice.AudioOutputStream = $fs
    $voice.Speak($s.Text)
    $fs.Close()

    $len = (Get-Item $rawPath).Length
    $dur = [math]::Round(($len - 44) / 96000.0, 3)
    Write-Output ("Raw Scene {0:D2}: {1} s" -f $s.Id, $dur)
}

Write-Output '=== STEP 3: PADDING & MASTER WAV AUDIO TRACK GENERATION ==='
node scripts/concat_wav.cjs

Write-Output '=== STEP 4: RENDER 1080P SLIDE FRAMES ==='
powershell -ExecutionPolicy Bypass -File scripts\generate_video_slides.ps1

Write-Output '=== STEP 5: COMPOSE 1080P MP4 DEMO VIDEO WITH FFMPEG ==='
$concatManifest = Join-Path $buildDir 'scenes_concat.txt'
$masterWav = Join-Path $buildDir 'full_voiceover.wav'
$finalMp4Public = 'c:\Users\hmanito\antigravity\Resilia\public\resilia_demo_video.mp4'
$finalMp4Root = 'c:\Users\hmanito\antigravity\Resilia\Resilia_Demo_Video.mp4'

if (Test-Path $finalMp4Public) { Remove-Item $finalMp4Public -Force }
if (Test-Path $finalMp4Root) { Remove-Item $finalMp4Root -Force }

& 'C:\Program Files\BlueStacks_nxt\ffmpeg.exe' -f concat -safe 0 -i $concatManifest -i $masterWav -c:v libopenh264 -pix_fmt yuv420p -r 25 -c:a aac -b:a 192k -shortest -y $finalMp4Public

Copy-Item $finalMp4Public $finalMp4Root -Force
$finalMp4Dist = 'c:\Users\hmanito\antigravity\Resilia\dist\resilia_demo_video.mp4'
if (Test-Path 'c:\Users\hmanito\antigravity\Resilia\dist') {
    Copy-Item $finalMp4Public $finalMp4Dist -Force
}

Write-Output '=== STEP 6: VERIFY VIDEO ARTIFACTS ==='
$pubItem = Get-Item $finalMp4Public
$rootItem = Get-Item $finalMp4Root

Write-Output ("Generated Public Video: {0} ({1:N0} bytes)" -f $pubItem.FullName, $pubItem.Length)
Write-Output ("Generated Root Video:   {0} ({1:N0} bytes)" -f $rootItem.FullName, $rootItem.Length)
Write-Output '=== VIDEO BUILD COMPLETED SUCCESSFULLY ==='
