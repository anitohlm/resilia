# Synthesizes 12 narration segments using Microsoft Zira Desktop (English Female)
$ErrorActionPreference = "Stop"

$audioDir = "c:\Users\hmanito\antigravity\Resilia\video_build\audio"
if (-not (Test-Path $audioDir)) {
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
}

$scenes = @(
    @{
        Id = 1
        Text = "Disasters do not wait for good Wi-Fi. In the first 72 hours of a typhoon or flood, cellular infrastructure often fails and grids go dark. Resilia is an AI-assisted community disaster coordination platform, built so that life-saving emergency communications continue even under severe network disruptions."
    },
    @{
        Id = 2
        Text = "Every year, climate-vulnerable communities face devastating typhoons and flash floods. When cell towers flood and power grids collapse, cloud-dependent disaster apps display blank loading screens. Families on rooftops cannot call for help, vulnerable citizens are lost in the confusion, and coordinators lose ground visibility."
    },
    @{
        Id = 3
        Text = "Aligned with UN Sustainable Development Goals 11 and 13, and Sendai Framework Priority 4, Resilia was evaluated on simulated disaster baselines modeled after the Marikina River basin, where monsoon floodwaters can surge past critical alarm levels in just minutes."
    },
    @{
        Id = 4
        Text = "Our vision is simple: no community should ever be abandoned in the dark. Resilia is built with a dual-engine architecture. When connected, it harnesses Google Gemini for deep semantic synthesis. When local networks degrade, it seamlessly falls back to deterministic local processing without losing critical citizen records."
    },
    @{
        Id = 5
        Text = "Seven specialized AI agents coordinate the disaster lifecycle. From clustering citizen hazard reports and transparently prioritizing vulnerable households, to preventing relief supply overdrafts, every action is governed by strict anti-hallucination guardrails and human verification."
    },
    @{
        Id = 6
        Text = "For residents, Resilia provides an authentic, accessible mobile experience. Citizens can trigger an emergency S.O.S. beacon, complete their 72-hour family Go-Bag preparedness checklist, view real-time shelter statuses, and submit instant one-tap distress calls for rescue, medical help, or entrapment."
    },
    @{
        Id = 7
        Text = "First responders receive an action-oriented mission cockpit. Responders see high-priority rescue dispatches scored by vulnerability, such as bedridden seniors or infants, complete with real-time estimated time of arrival, S.T.A.R.T. field casualty triage, and offline-tolerant dispatch queues."
    },
    @{
        Id = 8
        Text = "For municipal coordinators, Resilia delivers comprehensive situational awareness. Live river telemetry tracks flood alarms, occupancy gauges monitor community shelters, and the AI proposal gate enforces human authorization before any rescue team or relief resource is officially dispatched."
    },
    @{
        Id = 9
        Text = "Resilia includes seven specialized community modules: color-coded S.T.A.R.T. field triage wristbands, a fraud-proof relief distribution ledger with a 24-hour Q.R. cooldown to prevent hoarding, privacy-preserving missing kin reunification, and an automated 72-hour Leptospirosis prevention countdown."
    },
    @{
        Id = 10
        Text = "In an emergency, an A.I. hallucination can cost lives. Resilia strictly enforces anti-hallucination standards. Every advisory cites verifiable records and official guidelines. If offline, the platform explicitly discloses local retrieval mode, ensuring transparent and trustworthy decision-making."
    },
    @{
        Id = 11
        Text = "Resilia is a functional working prototype evaluated through 193 automated unit and integration tests. We rigorously verified deterministic arithmetic, local storage resilience, and synchronization queues under simulated network loss. While not yet deployed in live disaster operations, it demonstrates robust engineering feasibility."
    },
    @{
        Id = 12
        Text = "From barangay shelters to city command centers, Resilia scales from citizen smartphones to low-power edge nodes and Google Cloud Run. Disasters are inevitable, but being left in the dark is not. Resilia: maintaining vital community lifelines when networks fail."
    }
)

$token = New-Object -ComObject SAPI.SpObjectToken
$token.SetId("HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices\Tokens\TTS_MS_EN-US_ZIRA_11.0")

$results = @()

foreach ($scene in $scenes) {
    $filePath = Join-Path $audioDir ("scene_{0:D2}.wav" -f $scene.Id)
    if (Test-Path $filePath) { Remove-Item $filePath -Force }
    
    $voice = New-Object -ComObject SAPI.SpVoice
    $voice.Voice = $token
    $voice.Rate = -1 # Compassionate, articulate, steady pacing
    $voice.Volume = 100

    $fileStream = New-Object -ComObject SAPI.SpFileStream
    # 38 = SAFT48kHz16BitMono
    $fileStream.Format.Type = 38
    # 3 = SSFMCreateForWrite
    $fileStream.Open($filePath, 3, $false)
    $voice.AudioOutputStream = $fileStream
    $voice.Speak($scene.Text)
    $fileStream.Close()

    # Get duration
    $fileItem = Get-Item $filePath
    # 48000 Hz * 16 bit (2 bytes) = 96000 bytes per second (+44 byte header)
    $durationSeconds = [math]::Round(($fileItem.Length - 44) / 96000.0, 2)
    
    $results += [PSCustomObject]@{
        Scene = $scene.Id
        Duration = $durationSeconds
        Path = $filePath
    }
    Write-Output "Scene $($scene.Id): $durationSeconds seconds -> $filePath"
}

$totalDuration = ($results | Measure-Object -Property Duration -Sum).Sum
Write-Output "TOTAL AUDIO DURATION: $totalDuration seconds (~$([math]::Round($totalDuration / 60, 2)) minutes)"
