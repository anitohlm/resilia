# Full 12-Slide Renderer for Resilia 3-Min Demo Video (1920x1080)
Add-Type -AssemblyName System.Drawing

$outputDir = 'c:\Users\hmanito\antigravity\Resilia\video_build\frames'
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$imagesDir = 'c:\Users\hmanito\antigravity\Resilia\public\images'

function FillRoundedRect {
    param($g, $brush, [int]$x, [int]$y, [int]$w, [int]$h, [int]$radius)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
    $path.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
    $path.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
    $path.Dispose()
}

function DrawRoundedRect {
    param($g, $pen, [int]$x, [int]$y, [int]$w, [int]$h, [int]$radius)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
    $path.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
    $path.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
    $path.CloseFigure()
    $g.DrawPath($pen, $path)
    $path.Dispose()
}

# Colors
$cBg = [System.Drawing.Color]::FromArgb(10, 11, 14)
$cCardBg = [System.Drawing.Color]::FromArgb(18, 20, 26)
$cCardBorder = [System.Drawing.Color]::FromArgb(38, 42, 52)
$cEmerald = [System.Drawing.Color]::FromArgb(16, 185, 129)
$cEmeraldBg = [System.Drawing.Color]::FromArgb(14, 45, 34)
$cAmber = [System.Drawing.Color]::FromArgb(245, 158, 11)
$cAmberBg = [System.Drawing.Color]::FromArgb(45, 32, 10)
$cRed = [System.Drawing.Color]::FromArgb(239, 68, 68)
$cRedBg = [System.Drawing.Color]::FromArgb(48, 16, 16)
$cBlue = [System.Drawing.Color]::FromArgb(59, 130, 246)
$cBlueBg = [System.Drawing.Color]::FromArgb(16, 32, 58)
$cWhite = [System.Drawing.Color]::FromArgb(248, 250, 252)
$cMuted = [System.Drawing.Color]::FromArgb(161, 161, 170)
$cSubMuted = [System.Drawing.Color]::FromArgb(212, 212, 216)

# Brushes
$bBg = New-Object System.Drawing.SolidBrush($cBg)
$bCard = New-Object System.Drawing.SolidBrush($cCardBg)
$bEmerald = New-Object System.Drawing.SolidBrush($cEmerald)
$bEmeraldBg = New-Object System.Drawing.SolidBrush($cEmeraldBg)
$bAmber = New-Object System.Drawing.SolidBrush($cAmber)
$bAmberBg = New-Object System.Drawing.SolidBrush($cAmberBg)
$bRed = New-Object System.Drawing.SolidBrush($cRed)
$bRedBg = New-Object System.Drawing.SolidBrush($cRedBg)
$bBlue = New-Object System.Drawing.SolidBrush($cBlue)
$bBlueBg = New-Object System.Drawing.SolidBrush($cBlueBg)
$bWhite = New-Object System.Drawing.SolidBrush($cWhite)
$bMuted = New-Object System.Drawing.SolidBrush($cMuted)
$bSubMuted = New-Object System.Drawing.SolidBrush($cSubMuted)
$bSubBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 14, 18))

# Pens
$pBorder = New-Object System.Drawing.Pen($cCardBorder, 1.5)
$pEmerald = New-Object System.Drawing.Pen($cEmerald, 2)
$pAmber = New-Object System.Drawing.Pen($cAmber, 2)
$pTop = New-Object System.Drawing.Pen($cCardBorder, 2)

# Fonts
$fBrand = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
$fBadge = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$fTitle = New-Object System.Drawing.Font('Arial', 28, [System.Drawing.FontStyle]::Bold)
$fSubtitle = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$fCardTitle = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Bold)
$fCardBody = New-Object System.Drawing.Font('Arial', 13, [System.Drawing.FontStyle]::Regular)
$fSubTitle = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$fSubText = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Regular)
$fCaption = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)

function SetupCanvas {
    $bmp = New-Object System.Drawing.Bitmap 1920, 1080
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.FillRectangle($bBg, 0, 0, 1920, 1080)
    return @{ Bitmap = $bmp; Graphics = $g }
}

function DrawHeader {
    param($g, [int]$sceneNum, [string]$tagText, [string]$statusText)
    $topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 17, 22))
    $g.FillRectangle($topBrush, 0, 0, 1920, 75)
    $g.DrawLine($pTop, 0, 75, 1920, 75)
    $topBrush.Dispose()

    FillRoundedRect -g $g -brush $bEmerald -x 60 -y 16 -w 42 -h 42 -radius 8
    $iconFont = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $g.DrawString('R', $iconFont, $blackBrush, 72, 19)
    $iconFont.Dispose(); $blackBrush.Dispose()

    $g.DrawString('RESILIA', $fBrand, $bWhite, 115, 20)

    $tagW = [int]($g.MeasureString($tagText, $fBadge).Width + 24)
    FillRoundedRect -g $g -brush $bEmeraldBg -x 250 -y 22 -w $tagW -h 30 -radius 6
    DrawRoundedRect -g $g -pen $pEmerald -x 250 -y 22 -w $tagW -h 30 -radius 6
    $g.DrawString($tagText, $fBadge, $bEmerald, 262, 28)

    $counterText = ('SCENE {0:D2} / 12' -f $sceneNum)
    $g.DrawString($counterText, $fBadge, $bAmber, 1380, 28)
    $g.DrawString($statusText, $fBadge, $bMuted, 1530, 28)
}

function DrawSubtitles {
    param($g, [string]$voiceText)
    $h = 130
    $y = 925
    FillRoundedRect -g $g -brush $bSubBg -x 50 -y $y -w 1820 -h $h -radius 12
    DrawRoundedRect -g $g -pen $pEmerald -x 50 -y $y -w 1820 -h $h -radius 12

    $g.DrawString('VOICE OVER (FEMALE COMPASSIONATE)', $fSubTitle, $bAmber, 75, ($y + 12))

    $textRect = New-Object System.Drawing.RectangleF(75, ($y + 36), 1770, 80)
    $sf = New-Object System.Drawing.StringFormat
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Near
    $g.DrawString($voiceText, $fSubText, $bWhite, $textRect, $sf)
    $sf.Dispose()
}

function DrawCard {
    param($g, [int]$x, [int]$y, [int]$w, [int]$h, [string]$title, [string]$body, $accentBrush, [string]$badgeText = '')
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 10
    DrawRoundedRect -g $g -pen $pBorder -x $x -y $y -w $w -h $h -radius 10

    if ($accentBrush -ne $null) {
        FillRoundedRect -g $g -brush $accentBrush -x $x -y $y -w $w -h 4 -radius 2
    }

    $curY = $y + 14
    if ($badgeText -ne '') {
        $bw = [int]($g.MeasureString($badgeText, $fBadge).Width + 14)
        $badgeBg = $bEmeraldBg
        $badgeFg = $bEmerald
        if ($accentBrush -eq $bRed) {
            $badgeBg = $bRedBg
            $badgeFg = $bRed
        } elseif ($accentBrush -eq $bAmber) {
            $badgeBg = $bAmberBg
            $badgeFg = $bAmber
        } elseif ($accentBrush -eq $bBlue) {
            $badgeBg = $bBlueBg
            $badgeFg = $bBlue
        }
        FillRoundedRect -g $g -brush $badgeBg -x ($x + 18) -y $curY -w $bw -h 22 -radius 4
        $g.DrawString($badgeText, $fBadge, $badgeFg, ($x + 25), ($curY + 3))
        $curY += 28
    }

    $g.DrawString($title, $fCardTitle, $bWhite, ($x + 18), $curY)
    $curY += 26

    $bodyRect = New-Object System.Drawing.RectangleF(($x + 18), $curY, ($w - 36), ($h - ($curY - $y) - 10))
    $sf = New-Object System.Drawing.StringFormat
    $g.DrawString($body, $fCardBody, $bSubMuted, $bodyRect, $sf)
    $sf.Dispose()
}

function DrawFramedImage {
    param($g, [string]$imagePath, [int]$x, [int]$y, [int]$w, [int]$h, [string]$caption)
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 12
    DrawRoundedRect -g $g -pen $pBorder -x $x -y $y -w $w -h $h -radius 12

    if (Test-Path $imagePath) {
        $img = [System.Drawing.Image]::FromFile($imagePath)
        $pad = 10
        $imgW = $w - ($pad * 2)
        $imgH = $h - 50
        $g.DrawImage($img, ($x + $pad), ($y + $pad), $imgW, $imgH)
        $img.Dispose()
    }

    $capY = $y + $h - 38
    $capBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(14, 15, 20))
    $g.FillRectangle($capBrush, ($x + 2), $capY, ($w - 4), 36)
    $capBrush.Dispose()
    $g.DrawString($caption, $fCaption, $bAmber, ($x + 16), ($capY + 8))
}

function DrawPhoneMockup {
    param($g, [string]$imagePath, [int]$x, [int]$y, [int]$w, [int]$h, [string]$roleName)
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 24
    $phonePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), 2.5)
    DrawRoundedRect -g $g -pen $phonePen -x $x -y $y -w $w -h $h -radius 24
    $phonePen.Dispose()

    if (Test-Path $imagePath) {
        $img = [System.Drawing.Image]::FromFile($imagePath)
        $pad = 12
        $g.DrawImage($img, ($x + $pad), ($y + $pad), ($w - $pad*2), ($h - $pad*2 - 40))
        $img.Dispose()
    }

    $bY = $y + $h - 38
    $bBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(12, 13, 16))
    $g.FillRectangle($bBgBrush, ($x + 4), $bY, ($w - 8), 34)
    $bBgBrush.Dispose()
    $roleText = 'AUTHENTIC INTERFACE: ' + $roleName
    $g.DrawString($roleText, $fCaption, $bEmerald, ($x + 20), ($bY + 8))
}

Write-Output 'Rendering 12 Scene Slides in 1920x1080...'

# ==============================================================================
# SCENE 1: Title & Introduction
# ==============================================================================
$s1 = SetupCanvas
DrawHeader -g $s1.Graphics -sceneNum 1 -tagText 'MISSION AND OVERVIEW' -statusText 'SIMULATED DISASTER EVALUATION'
$s1.Graphics.DrawString('RESILIA', $fTitle, $bWhite, 70, 100)
$s1.Graphics.DrawString('Maintaining Vital Community Lifelines When Networks Fail', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s1.Graphics -x 70 -y 195 -w 860 -h 160 -title 'Dual-Engine Hybrid Intelligence' -body 'Combines Google Gemini 3.8 Flash in the cloud with deterministic edge durability. When networks degrade, Resilia falls back to cached local records and deterministic rules.' -accentBrush $bEmerald -badgeText 'CORE INNOVATION'
DrawCard -g $s1.Graphics -x 70 -y 375 -w 860 -h 160 -title 'Simulated Marikina River Baseline' -body 'Evaluated on realistic disaster hydrology in Barangay Tumana and Malanday. Validated on 15m Prepare, 16m Pre-emptive, and 18m Forced Evacuation thresholds.' -accentBrush $bAmber -badgeText 'EVALUATION CONTEXT'
DrawCard -g $s1.Graphics -x 70 -y 555 -w 860 -h 160 -title '244 Automated Test Assertions Passing' -body 'Automated test suite across 5 modules rigorously validates inventory arithmetic, triage queues, IndexedDB persistence, and UUID sync queues under simulated conditions.' -accentBrush $bBlue -badgeText 'ENGINEERING RIGOR'
DrawCard -g $s1.Graphics -x 70 -y 735 -w 860 -h 160 -title 'Community-First Architecture' -body 'Accessible Progressive Web App designed for low-bandwidth environments, edge micro-servers, and local Wi-Fi mesh coordination.' -accentBrush $bEmerald -badgeText 'COMMUNITY RESILIENCE'

DrawFramedImage -g $s1.Graphics -imagePath (Join-Path $imagesDir 'resilia_app_cellphone.jpg') -x 980 -y 195 -w 870 -h 700 -caption 'RESILIA // Responsive Progressive Web Application (PWA)'
DrawSubtitles -g $s1.Graphics -voiceText 'Disasters do not wait for good Wi-Fi. In the first seventy-two hours of a typhoon, power grids collapse and cellular towers go dark. Resilia is an A.I.-assisted community platform that keeps vital lifelines open when networks fail.'
$s1.Bitmap.Save((Join-Path $outputDir 'scene_01.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s1.Graphics.Dispose(); $s1.Bitmap.Dispose()
Write-Output 'Scene 1 rendered.'

# ==============================================================================
# SCENE 2: The Critical Problem - 72-Hour Connectivity Paradox
# ==============================================================================
$s2 = SetupCanvas
DrawHeader -g $s2.Graphics -sceneNum 2 -tagText 'PROBLEM ANALYSIS' -statusText 'THE 72-HOUR CONNECTIVITY PARADOX'
$s2.Graphics.DrawString('The 72-Hour Connectivity Paradox', $fTitle, $bWhite, 70, 100)
$s2.Graphics.DrawString('Modern Disaster Management Tech Fails Precisely When Stakes Are Highest', $fSubtitle, $bRed, 70, 145)

DrawCard -g $s2.Graphics -x 70 -y 195 -w 860 -h 160 -title 'The Cloud Dependency Trap' -body 'Most disaster relief apps rely entirely on cloud servers. When cell towers flood and power grids fail, they display blank loading spinners and connection errors.' -accentBrush $bRed -badgeText 'INFRASTRUCTURE FAILURE'
DrawCard -g $s2.Graphics -x 70 -y 375 -w 860 -h 160 -title '85%+ Cellular Outages in Floods' -body 'During Category 4 and 5 typhoons, urban cell towers submerge within hours. Stranded families on rooftops cannot request help or signal their locations.' -accentBrush $bAmber -badgeText 'COMMUNICATION BLACKOUT'
DrawCard -g $s2.Graphics -x 70 -y 555 -w 860 -h 160 -title 'Untracked Household Vulnerability' -body 'Evacuation queues treat everyone identically. Bedridden seniors, infants, and wheelchair users remain stranded while able-bodied crowds rush ahead.' -accentBrush $bRed -badgeText 'EQUITY AND TRIAGE CRISIS'
DrawCard -g $s2.Graphics -x 70 -y 735 -w 860 -h 160 -title 'Relief Distribution Chaos and Ayuda Black Holes' -body 'Paper manifests tear and get soaked in floodwater. Relief food packs suffer duplicate claims, hoarding, and zero verification audit trails.' -accentBrush $bAmber -badgeText 'LOGISTICAL BREAKDOWN'

DrawFramedImage -g $s2.Graphics -imagePath (Join-Path $imagesDir 'filipino_disaster_community.jpg') -x 980 -y 195 -w 870 -h 700 -caption 'Filipino Community Flood Inundation // Marikina River Valley Baseline'
DrawSubtitles -g $s2.Graphics -voiceText 'When communications fail, cloud-dependent emergency apps display empty screens. Vulnerable families trapped on rooftops cannot call for help, and ground coordinators lose line-of-sight to the crisis.'
$s2.Bitmap.Save((Join-Path $outputDir 'scene_02.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s2.Graphics.Dispose(); $s2.Bitmap.Dispose()
Write-Output 'Scene 2 rendered.'

# ==============================================================================
# SCENE 3: Global Alignment & Simulated Marikina Baseline
# ==============================================================================
$s3 = SetupCanvas
DrawHeader -g $s3.Graphics -sceneNum 3 -tagText 'PROBLEM STATEMENT ALIGNMENT' -statusText 'GLOBAL AND GRASSROOTS PRIORITIES'
$s3.Graphics.DrawString('Aligned with Global Priorities and Grassroots Needs', $fTitle, $bWhite, 70, 100)
$s3.Graphics.DrawString('UN Sustainable Development Goals, Sendai Framework and Marikina Hydrology', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s3.Graphics -x 70 -y 195 -w 860 -h 220 -title 'UN Sustainable Development Goal 11: Target 11.5' -body 'Substantially reduce the number of deaths and people affected by water-related disasters. Resilia focuses on community vulnerability indexing to safeguard vulnerable citizens first.' -accentBrush $bEmerald -badgeText 'UN SDG 11 // SUSTAINABLE CITIES'
DrawCard -g $s3.Graphics -x 70 -y 435 -w 860 -h 220 -title 'UN Sustainable Development Goal 13: Target 13.1' -body 'Strengthen resilience and adaptive capacity to climate-induced extreme hydrometeorological hazards and flash flood events across vulnerable river basin settlements.' -accentBrush $bBlue -badgeText 'UN SDG 13 // CLIMATE ACTION'
DrawCard -g $s3.Graphics -x 70 -y 675 -w 860 -h 220 -title 'Sendai Framework for Disaster Risk Reduction' -body 'Priority 4: Enhancing disaster preparedness for effective response and Build Back Better. Emphasizes multi-hazard early warning, local governance, and resilient emergency operations.' -accentBrush $bAmber -badgeText 'SENDAI FRAMEWORK // PRIORITY 4'

FillRoundedRect -g $s3.Graphics -brush $bCard -x 980 -y 195 -w 870 -h 700 -radius 12
DrawRoundedRect -g $s3.Graphics -pen $pBorder -x 980 -y 195 -w 870 -h 700 -radius 12
FillRoundedRect -g $s3.Graphics -brush $bEmerald -x 980 -y 195 -w 870 -h 4 -radius 2

$s3.Graphics.DrawString('SIMULATED MARIKINA RIVER BASIN BASELINE', $fCardTitle, $bWhite, 1010, 220)
$s3.Graphics.DrawString('Evaluated on realistic hydrometeorological simulation data; not tested in actual disasters.', $fCardBody, $bMuted, 1010, 250)

DrawCard -g $s3.Graphics -x 1010 -y 290 -w 810 -h 120 -title 'Alarm Level 1 [15.0m] // Preparedness Phase' -body 'Barangay Tumana early siren activation. Residents verify 72-hour Go-Bags, charge power banks, and check shelter capacity.' -accentBrush $bEmerald -badgeText 'ALARM 1 // PREPARE'
DrawCard -g $s3.Graphics -x 1010 -y 430 -w 810 -h 120 -title 'Alarm Level 2 [16.0m] // Pre-emptive Evacuation' -body 'Malanday Elementary School opens. High-vulnerability households (bedridden, infants) prioritized for rescue asset deployment.' -accentBrush $bAmber -badgeText 'ALARM 2 // PRE-EMPTIVE'
DrawCard -g $s3.Graphics -x 1010 -y 570 -w 810 -h 120 -title 'Alarm Level 3 [18.0m] // Forced Evacuation and Rescue' -body 'Full inundation. Cellular backhauls degrade. Resilia transitions to local edge mode, keeping local triage and ration ledgers active.' -accentBrush $bRed -badgeText 'ALARM 3 // FORCED EVACUATION'

FillRoundedRect -g $s3.Graphics -brush $bEmeraldBg -x 1010 -y 715 -w 810 -h 150 -radius 8
DrawRoundedRect -g $s3.Graphics -pen $pEmerald -x 1010 -y 715 -w 810 -h 150 -radius 8
$s3.Graphics.DrawString('HONEST ENGINEERING PROTOTYPE DISCLOSURE', $fCardTitle, $bEmerald, 1030, 730)
$calloutText = 'Resilia is presented transparently as a functional software prototype evaluated against simulated flood telemetry and automated test suites. We do not claim 100% reliability in live disasters, but demonstrate practical architectural feasibility under severe network loss.'
$cRect = New-Object System.Drawing.RectangleF(1030, 760, 770, 95)
$s3.Graphics.DrawString($calloutText, $fCardBody, $bWhite, $cRect)

DrawSubtitles -g $s3.Graphics -voiceText 'Aligned with U.N. Sustainable Development Goals 11 and 13 and Sendai Priority 4, Resilia was evaluated on simulated flood hydrology modeled on the Marikina River basin across Alarm Levels 1, 2, and 3.'
$s3.Bitmap.Save((Join-Path $outputDir 'scene_03.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s3.Graphics.Dispose(); $s3.Bitmap.Dispose()
Write-Output 'Scene 3 rendered.'

# ==============================================================================
# SCENE 4: Dual-Engine Hybrid Architecture
# ==============================================================================
$s4 = SetupCanvas
DrawHeader -g $s4.Graphics -sceneNum 4 -tagText 'SYSTEM ARCHITECTURE' -statusText 'DUAL-ENGINE RESILIENCE'
$s4.Graphics.DrawString('Dual-Engine Hybrid Architecture', $fTitle, $bWhite, 70, 100)
$s4.Graphics.DrawString('Google Gemini Cloud Intelligence + Grounded Edge Autonomy', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s4.Graphics -x 70 -y 195 -w 860 -h 220 -title 'ONLINE MODE // Google Gemini Cloud Engine' -body 'When connected to cellular or Starlink backhaul, Resilia leverages Google Gemini 3.8 Flash via the official Gemini SDK. Synthesizes multi-barangay crisis briefings, translates Tagalog-English citizen queries, and forecasts supply chain depletion rates.' -accentBrush $bBlue -badgeText 'ONLINE // SEMANTIC SYNTHESIS'
DrawCard -g $s4.Graphics -x 70 -y 435 -w 860 -h 220 -title 'OFFLINE MODE // Local Edge Durability Engine' -body 'When local towers go dark, Resilia falls back seamlessly to deterministic edge execution. 15 versioned IndexedDB stores handle triage queues, shelter records, and zero-overdraft ration ledgers locally in milliseconds.' -accentBrush $bEmerald -badgeText 'OFFLINE // DETERMINISTIC EDGE'
DrawCard -g $s4.Graphics -x 70 -y 675 -w 860 -h 220 -title 'Idempotent Sync Queue // UUID Reconnection' -body 'All local actions are cryptographically UUID-stamped in an append-only transaction log. When connection restores, events replicate upstream to Cloud Run without duplicate submissions or conflicts.' -accentBrush $bAmber -badgeText 'SYNCHRONIZATION // ZERO DATA LOSS'

DrawFramedImage -g $s4.Graphics -imagePath (Join-Path $imagesDir 'emergency_command_mesh.jpg') -x 980 -y 195 -w 870 -h 700 -caption 'Emergency Command and Mesh Deployment // Edge Micro-Server Architecture'
DrawSubtitles -g $s4.Graphics -voiceText 'Resilia features a resilient dual-engine architecture: cloud Google Gemini for regional crisis analysis, seamlessly transitioning to deterministic local edge processing without data loss when connectivity is severed.'
$s4.Bitmap.Save((Join-Path $outputDir 'scene_04.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s4.Graphics.Dispose(); $s4.Bitmap.Dispose()
Write-Output 'Scene 4 rendered.'

# ==============================================================================
# SCENE 5: The Seven Modular AI Agents
# ==============================================================================
$s5 = SetupCanvas
DrawHeader -g $s5.Graphics -sceneNum 5 -tagText 'MULTI-AGENT SYSTEM' -statusText 'COORDINATED CRISIS INTELLIGENCE'
$s5.Graphics.DrawString('Seven Specialized Disaster Agents', $fTitle, $bWhite, 70, 100)
$s5.Graphics.DrawString('Modular Intelligence Across the Disaster Lifecycle', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s5.Graphics -x 70 -y 195 -w 560 -h 220 -title '1. Orchestrator Agent' -body 'System gatekeeper. Enforces JSON schemas, anti-hallucination boundaries, and human coordinator authorization gates for dispatches.' -accentBrush $bEmerald -badgeText 'SAFETY AND GATEWAY'
DrawCard -g $s5.Graphics -x 70 -y 435 -w 560 -h 220 -title '2. Information Agent' -body 'Dual-engine Q&A. Answers resident queries citing verified shelter records and CDRRMO protocols; never hallucinates dry routes.' -accentBrush $bBlue -badgeText 'GROUNDED Q&A'
DrawCard -g $s5.Graphics -x 70 -y 675 -w 560 -h 220 -title '3. Situation Agent' -body 'Spatial hazard clustering. Groups citizen flood and power line reports to identify submerged roads and safe rescue paths.' -accentBrush $bAmber -badgeText 'SPATIAL CLUSTERING'

DrawCard -g $s5.Graphics -x 660 -y 195 -w 560 -h 220 -title '4. Resource Agent' -body 'Mathematical inventory tracking. Calculates warehouse burn rates with strict zero-overdraft validation checks for relief supplies.' -accentBrush $bEmerald -badgeText 'INVENTORY ARITHMETIC'
DrawCard -g $s5.Graphics -x 660 -y 435 -w 560 -h 220 -title '5. Needs and Coordination Agent' -body 'Transparent vulnerability scoring [0-100]. Prioritizes bedridden seniors and infants for boat dispatch matching.' -accentBrush $bRed -badgeText 'VULNERABILITY TRIAGE'
DrawCard -g $s5.Graphics -x 660 -y 675 -w 560 -h 220 -title '6. Verification Agent' -body 'Corroboration engine. Compares conflicting citizen reports and maintains immutable audit trails of coordinator decisions.' -accentBrush $bBlue -badgeText 'AUDIT AND TRUTH'

DrawCard -g $s5.Graphics -x 1250 -y 195 -w 600 -h 340 -title '7. Sync Agent // Cloud Replication' -body 'Manages network transitions with exponential backoff and health checks. Batches pending offline transactions to Cloud Run and Firestore with zero data loss.' -accentBrush $bAmber -badgeText 'DURABLE REPLICATION'

FillRoundedRect -g $s5.Graphics -brush $bEmeraldBg -x 1250 -y 555 -w 600 -h 340 -radius 12
DrawRoundedRect -g $s5.Graphics -pen $pEmerald -x 1250 -y 555 -w 600 -h 340 -radius 12
$s5.Graphics.DrawString('PRODUCT PRINCIPLE 5 // HUMAN-IN-THE-LOOP', $fCardTitle, $bEmerald, 1275, 580)
$p5Text = 'Resilia agents propose optimal dispatches and shelter allocations, but NEVER trigger real-world deployment automatically. High-consequence decisions strictly require the explicit approval of an authorized human Emergency Coordinator.'
$p5Rect = New-Object System.Drawing.RectangleF(1275, 620, 550, 180)
$s5.Graphics.DrawString($p5Text, $fCardBody, $bWhite, $p5Rect)

DrawSubtitles -g $s5.Graphics -voiceText 'Seven modular A.I. agents coordinate emergency response. They cluster hazard reports, score household vulnerability, and track relief inventories, governed by strict human-in-the-loop oversight.'
$s5.Bitmap.Save((Join-Path $outputDir 'scene_05.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s5.Graphics.Dispose(); $s5.Bitmap.Dispose()
Write-Output 'Scene 5 rendered.'

# ==============================================================================
# SCENE 6: Account Role 1 - Resident Mobile Interface
# ==============================================================================
$s6 = SetupCanvas
DrawHeader -g $s6.Graphics -sceneNum 6 -tagText 'AUTHENTIC ROLE INTERFACE' -statusText 'ROLE 1: RESIDENT CITIZEN'
$s6.Graphics.DrawString('Resident Experience: Preparedness and Lifeline', $fTitle, $bWhite, 70, 100)
$s6.Graphics.DrawString('Accessible Mobile Lifeline for Citizen Safety, Preparedness and Distress', $fSubtitle, $bEmerald, 70, 145)

DrawPhoneMockup -g $s6.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_resident.jpg') -x 70 -y 195 -w 500 -h 700 -roleName 'Resident Citizen'

DrawCard -g $s6.Graphics -x 610 -y 195 -w 1240 -h 160 -title 'Emergency SOS Beacon - Find Me' -body 'High-contrast OLED dark Morse SOS strobe and GPS coordinate broadcaster designed to guide rooftop helicopter and boat rescues at night with minimal battery drain.' -accentBrush $bRed -badgeText 'CRITICAL LIFELINE'
DrawCard -g $s6.Graphics -x 610 -y 375 -w 1240 -h 160 -title '72-Hour Family Go-Bag Preparedness Checklist' -body 'Interactive survival checklist tracking essential rations, water, prescription medications, and waterproof document storage. Saved locally in browser IndexedDB.' -accentBrush $bEmerald -badgeText 'FAMILY PREPAREDNESS'
DrawCard -g $s6.Graphics -x 610 -y 555 -w 1240 -h 160 -title 'Ayuda QR Identity Pass' -body 'Personalized offline digital QR pass that verifies household identity at evacuation relief distribution centers, stopping duplicate claims without paper manifests.' -accentBrush $bAmber -badgeText 'RELIEF ACCESS'
DrawCard -g $s6.Graphics -x 610 -y 735 -w 1240 -h 160 -title '4 Instant Distress Action Cards' -body 'Single-tap emergency reporting for Trapped in Flood, Medical Emergency, Fire, or Rescue Needed. Submits sub-second records locally even when disconnected.' -accentBrush $bBlue -badgeText 'RAPID REPORTING'

DrawSubtitles -g $s6.Graphics -voiceText 'For residents, Resilia is an accessible personal lifeline: complete a seventy-two hour family Go-Bag checklist, flash an emergency S.O.S. strobe, check shelter capacity, or submit one-tap distress calls offline.'
$s6.Bitmap.Save((Join-Path $outputDir 'scene_06.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s6.Graphics.Dispose(); $s6.Bitmap.Dispose()
Write-Output 'Scene 6 rendered.'

# ==============================================================================
# SCENE 7: Account Role 2 - First Responder Interface
# ==============================================================================
$s7 = SetupCanvas
DrawHeader -g $s7.Graphics -sceneNum 7 -tagText 'AUTHENTIC ROLE INTERFACE' -statusText 'ROLE 2: FIRST RESPONDER'
$s7.Graphics.DrawString('First Responder: Rapid Field Cockpit', $fTitle, $bWhite, 70, 100)
$s7.Graphics.DrawString('Action-Oriented Cockpit for High-Priority Rescues and Triage', $fSubtitle, $bAmber, 70, 145)

DrawPhoneMockup -g $s7.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_responder.jpg') -x 70 -y 195 -w 500 -h 700 -roleName 'First Responder'

DrawCard -g $s7.Graphics -x 610 -y 195 -w 1240 -h 160 -title 'Active Mission Cockpit // Priority P94/100 Water Rescue' -body 'Dispatches water rescue teams to highest-vulnerability households first (bedridden senior and infant trapped in floodwater) with live 6-minute ETA and status controls.' -accentBrush $bRed -badgeText 'HIGH PRIORITY DISPATCH'
DrawCard -g $s7.Graphics -x 610 -y 375 -w 1240 -h 160 -title 'S.T.A.R.T. Field Casualty Triage Tool' -body 'Rapid Simple Triage and Rapid Treatment assessment (Green/Yellow/Red/Black) generates client-side QR wristband codes for immediate shelter clinic routing.' -accentBrush $bEmerald -badgeText 'MASS CASUALTY TRIAGE'
DrawCard -g $s7.Graphics -x 610 -y 555 -w 1240 -h 160 -title 'Offline Dispatch Queue and Radio Net Integration' -body 'Field dispatches and incident reports execute locally without cellular connectivity, synchronizing automatically across VHF radio mesh or upon station uplink.' -accentBrush $bAmber -badgeText 'TACTICAL RESILIENCE'
DrawCard -g $s7.Graphics -x 610 -y 735 -w 1240 -h 160 -title 'Real-Time Weather and Flood Advisory Briefing' -body 'Provides verified PAGASA TCWS Signal #3 bulletins, Marikina River water gauge trends, and electrical hazards to keep rescue teams safe.' -accentBrush $bBlue -badgeText 'SITUATIONAL AWARENESS'

DrawSubtitles -g $s7.Graphics -voiceText 'First responders receive an action-focused rescue cockpit. Priority dispatches sort households by vulnerability, backed by S.T.A.R.T. mass-casualty triage wristbands and offline incident logging.'
$s7.Bitmap.Save((Join-Path $outputDir 'scene_07.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s7.Graphics.Dispose(); $s7.Bitmap.Dispose()
Write-Output 'Scene 7 rendered.'

# ==============================================================================
# SCENE 8: Account Role 3 - Emergency Coordinator Interface
# ==============================================================================
$s8 = SetupCanvas
DrawHeader -g $s8.Graphics -sceneNum 8 -tagText 'AUTHENTIC ROLE INTERFACE' -statusText 'ROLE 3: EMERGENCY COORDINATOR'
$s8.Graphics.DrawString('Coordinator Command: Ground Truth and Governance', $fTitle, $bWhite, 70, 100)
$s8.Graphics.DrawString('Situational Truth, Live Telemetry and Human-in-the-Loop Gatekeeper', $fSubtitle, $bEmerald, 70, 145)

DrawPhoneMockup -g $s8.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_coordinator.jpg') -x 70 -y 195 -w 500 -h 700 -roleName 'Emergency Coordinator'

DrawCard -g $s8.Graphics -x 610 -y 195 -w 1240 -h 160 -title 'Live River Telemetry - 16.2m Alarm Level 2' -body 'Continuous water gauge monitoring triggers automated alert notifications when floodwaters cross pre-emptive evacuation thresholds in Marikina River.' -accentBrush $bAmber -badgeText 'HYDROLOGICAL TELEMETRY'
DrawCard -g $s8.Graphics -x 610 -y 375 -w 1240 -h 160 -title 'Command Center KPIs and Shelter Capacity' -body 'Live operational tracking: 42 citizens rescued, 850/1,000 shelter occupancy at Malanday Elementary School, and 3 active amphibious boat deployments.' -accentBrush $bEmerald -badgeText 'COMMAND METRICS'
DrawCard -g $s8.Graphics -x 610 -y 555 -w 1240 -h 160 -title 'AI Needs Agent Proposal Gatekeeper' -body 'AI algorithms analyze reports and propose optimal rescue routing, but consequential dispatches require explicit human Coordinator approval (Approve or Decline).' -accentBrush $bRed -badgeText 'HUMAN-IN-THE-LOOP GATE'
DrawCard -g $s8.Graphics -x 610 -y 735 -w 1240 -h 160 -title 'Ayuda Relief Ledger and Ground Truth Engine' -body 'Real-time warehouse balance monitoring prevents relief pack stock overdrafts. Immutable audit logs track every verification rationale and relief distribution.' -accentBrush $bBlue -badgeText 'FRAUD-PROOF AUDIT'

DrawSubtitles -g $s8.Graphics -voiceText 'Municipal coordinators maintain complete situational truth: live Marikina river telemetry, shelter headcounts, fraud-proof relief ledgers, and an approval gate for proposed rescue operations.'
$s8.Bitmap.Save((Join-Path $outputDir 'scene_08.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s8.Graphics.Dispose(); $s8.Bitmap.Dispose()
Write-Output 'Scene 8 rendered.'

# ==============================================================================
# SCENE 9: Implemented Community Resilience Modules
# ==============================================================================
$s9 = SetupCanvas
DrawHeader -g $s9.Graphics -sceneNum 9 -tagText 'COMMUNITY MODULES' -statusText 'OPERATIONAL PROTOCOLS IN ACTION'
$s9.Graphics.DrawString('Seven Built Community Resilience Modules', $fTitle, $bWhite, 70, 100)
$s9.Graphics.DrawString('Specialized Disaster Protocols Designed for Philippine Ground Realities', $fSubtitle, $bEmerald, 70, 145)

DrawFramedImage -g $s9.Graphics -imagePath (Join-Path $imagesDir 'feature_start_triage.jpg') -x 70 -y 195 -w 860 -h 480 -caption 'S.T.A.R.T. Field Casualty Triage // Color-Coded QR Wristbands in Evacuation Center'
DrawFramedImage -g $s9.Graphics -imagePath (Join-Path $imagesDir 'evacuation_relief_ayuda.jpg') -x 980 -y 195 -w 870 -h 480 -caption 'Ayuda QR Code Scanning // 24-Hour Cooldown Ledger Eliminates Hoarding'

DrawCard -g $s9.Graphics -x 70 -y 695 -w 560 -h 200 -title 'Family Reunification Bulletin' -body 'Privacy-preserving shelter board with fuzzy name matching and masked contact numbers to reconnect separated relatives.' -accentBrush $bEmerald -badgeText 'REUNIFICATION'
DrawCard -g $s9.Graphics -x 660 -y 695 -w 560 -h 200 -title '72h Leptospirosis Watch' -body 'Automatic prophylaxis countdown timer and DOH water boiling safety protocols for floodwater-wading evacuees.' -accentBrush $bAmber -badgeText 'DISEASE PREVENTION'
DrawCard -g $s9.Graphics -x 1250 -y 695 -w 600 -h 200 -title 'Special Needs Shelter Matrix' -body 'Live occupancy for wheelchair ramps, infant nursing corners, dialysis/oxygen power, and pet-friendly zones.' -accentBrush $bBlue -badgeText 'SPECIAL NEEDS INCLUSION'

DrawSubtitles -g $s9.Graphics -voiceText 'Specialized community modules address Philippine ground realities: color-coded triage wristbands, a twenty-four hour Q.R. relief cooldown ledger, shelter reunification boards, and leptospirosis health alerts.'
$s9.Bitmap.Save((Join-Path $outputDir 'scene_09.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s9.Graphics.Dispose(); $s9.Bitmap.Dispose()
Write-Output 'Scene 9 rendered.'

# ==============================================================================
# SCENE 10: Responsible AI & Anti-Hallucination Standards
# ==============================================================================
$s10 = SetupCanvas
DrawHeader -g $s10.Graphics -sceneNum 10 -tagText 'RESPONSIBLE AI' -statusText 'ANTI-HALLUCINATION STANDARDS'
$s10.Graphics.DrawString('Responsible AI When Lives Are at Stake', $fTitle, $bWhite, 70, 100)
$s10.Graphics.DrawString('Mandatory Evidence Grounding, Clear Disclosures and Strict Governance', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s10.Graphics -x 70 -y 195 -w 860 -h 160 -title 'Principle 1 // Mandatory Evidence Citations' -body 'Every AI recommendation cites verified records (e.g., sh_malanday_elem). If evidence cannot be retrieved, the system states it does not know.' -accentBrush $bEmerald -badgeText 'ANTI-HALLUCINATION'
DrawCard -g $s10.Graphics -x 70 -y 375 -w 860 -h 160 -title 'Principle 2 // Explicit Disconnection Disclosure' -body 'When offline, Resilia prominently labels queries as Local Grounded Retrieval Active, never deceiving the user into believing cloud AI is running.' -accentBrush $bAmber -badgeText 'TRANSPARENT STATUS'
DrawCard -g $s10.Graphics -x 70 -y 555 -w 860 -h 160 -title 'Principle 3 // Human-in-the-Loop Governance' -body 'AI algorithms optimize recommendations, but high-consequence dispatches strictly require approval by an authorized Coordinator.' -accentBrush $bRed -badgeText 'HUMAN GATEKEEPER'
DrawCard -g $s10.Graphics -x 70 -y 735 -w 860 -h 160 -title 'Principle 4 // Role-Based Access Control [RBAC]' -body 'Residents report hazards; Responders triage and execute; only Coordinators verify official broadcasts and allocate municipal resources.' -accentBrush $bBlue -badgeText 'STRICT BOUNDARIES'

DrawFramedImage -g $s10.Graphics -imagePath (Join-Path $imagesDir 'feature_beacon_sos.jpg') -x 980 -y 195 -w 870 -h 700 -caption 'Emergency Beacon and Anti-Hallucination Verification Safety'
DrawSubtitles -g $s10.Graphics -voiceText 'In disasters, false information costs lives. Resilia strictly enforces anti-hallucination guardrails: every recommendation cites verified local data, and high-consequence dispatches require human authorization.'
$s10.Bitmap.Save((Join-Path $outputDir 'scene_10.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s10.Graphics.Dispose(); $s10.Bitmap.Dispose()
Write-Output 'Scene 10 rendered.'

# ==============================================================================
# SCENE 11: Technical Feasibility & Rigorous Verification
# ==============================================================================
$s11 = SetupCanvas
DrawHeader -g $s11.Graphics -sceneNum 11 -tagText 'ENGINEERING RIGOR' -statusText 'AUTOMATED TEST SUITE VALIDATION'
$s11.Graphics.DrawString('Validated Working Prototype', $fTitle, $bWhite, 70, 100)
$s11.Graphics.DrawString('244 Automated Test Assertions Passing Across 5 Test Suites', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s11.Graphics -x 70 -y 195 -w 860 -h 340 -title 'Modern Full-Stack Architecture' -body 'Built with React 19, TypeScript, Vite, Tailwind CSS, Express, and Google GenAI SDK. Service Worker precaches all core application assets for instant offline execution.' -accentBrush $bBlue -badgeText 'FULL-STACK RIGOR'
DrawCard -g $s11.Graphics -x 70 -y 555 -w 860 -h 340 -title 'Edge Micro-Server Deployable - $35 Raspberry Pi' -body 'The entire Resilia coordination stack can run directly inside citizen mobile browsers or on a low-power 35-dollar Raspberry Pi node deployed at local barangay evacuation shelters.' -accentBrush $bEmerald -badgeText 'EDGE DEPLOYMENT'

FillRoundedRect -g $s11.Graphics -brush $bCard -x 980 -y 195 -w 870 -h 700 -radius 12
DrawRoundedRect -g $s11.Graphics -pen $pBorder -x 980 -y 195 -w 870 -h 700 -radius 12
FillRoundedRect -g $s11.Graphics -brush $bEmerald -x 980 -y 195 -w 870 -h 4 -radius 2

$s11.Graphics.DrawString('244 AUTOMATED TEST ASSERTIONS PASSING', $fCardTitle, $bWhite, 1010, 220)
$s11.Graphics.DrawString('Five automated test suites verify offline persistence, disaster advisories, triage, and video integrity.', $fCardBody, $bMuted, 1010, 250)

DrawCard -g $s11.Graphics -x 1010 -y 280 -w 810 -h 125 -title 'tests/disasterAdvisoriesAndGoBag.test.ts' -body 'Validates 72h Go-Bag item checklists, PAGASA flood warnings, and medical advisory offline persistence.' -accentBrush $bEmerald -badgeText '45 ASSERTIONS PASSED'
DrawCard -g $s11.Graphics -x 1010 -y 420 -w 810 -h 125 -title 'tests/resilienceFeatures.test.ts' -body 'Validates START triage color sorting, ayuda 24h QR cooldown, and missing kin search algorithms.' -accentBrush $bEmerald -badgeText '62 ASSERTIONS PASSED'
DrawCard -g $s11.Graphics -x 1010 -y 560 -w 810 -h 125 -title 'residentIcons, deckValidation & demoVideoValidation' -body 'Validates UI accessibility, role navigation, 1080p MP4 container, and dual-engine fallback.' -accentBrush $bBlue -badgeText '137 ASSERTIONS PASSED'

FillRoundedRect -g $s11.Graphics -brush $bEmeraldBg -x 1010 -y 705 -w 810 -h 165 -radius 8
DrawRoundedRect -g $s11.Graphics -pen $pEmerald -x 1010 -y 705 -w 810 -h 165 -radius 8
$s11.Graphics.DrawString('SOFTWARE SIMULATION EVALUATION', $fCardTitle, $bEmerald, 1030, 720)
$evalText = 'Resilia is evaluated as a functional working prototype on simulated Marikina River hydrologic models. While not yet deployed in live disaster operations, our 244 automated test assertions confirm predictable deterministic execution, local offline persistence, and synchronized queue recovery under simulated conditions.'
$eRect = New-Object System.Drawing.RectangleF(1030, 750, 770, 110)
$s11.Graphics.DrawString($evalText, $fCardBody, $bWhite, $eRect)

DrawSubtitles -g $s11.Graphics -voiceText 'Resilia is a functional working prototype evaluated across 244 automated test assertions. While not yet deployed in live disasters, simulation verifies deterministic arithmetic, local storage, and sync queues.'
$s11.Bitmap.Save((Join-Path $outputDir 'scene_11.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s11.Graphics.Dispose(); $s11.Bitmap.Dispose()
Write-Output 'Scene 11 rendered.'

# ==============================================================================
# SCENE 12: Scalability Roadmap & Keeping the Lifeline Open
# ==============================================================================
$s12 = SetupCanvas
DrawHeader -g $s12.Graphics -sceneNum 12 -tagText 'CONCLUSION AND ROADMAP' -statusText 'KEEPING THE LIFELINE OPEN'
$s12.Graphics.DrawString('Keeping the Lifeline Open', $fTitle, $bWhite, 70, 100)
$s12.Graphics.DrawString('When Networks Fail and Communication Breaks Down... Resilia Keeps the Lifeline Open', $fSubtitle, $bEmerald, 70, 145)

DrawCard -g $s12.Graphics -x 70 -y 195 -w 860 -h 160 -title 'Three-Tier Scalable Architecture' -body 'Tier 1: Citizen PWA on mobile phones - Tier 2: Low-cost Barangay Hall Wi-Fi Mesh Node - Tier 3: Macro City Disaster Operations Command on Cloud Run.' -accentBrush $bEmerald -badgeText 'THREE-TIER SCALING'
DrawCard -g $s12.Graphics -x 70 -y 375 -w 860 -h 160 -title 'Zero Cloud Cost at the Edge' -body 'Because edge nodes process transactions locally, bandwidth consumption is minimized and operational costs remain near zero during crises.' -accentBrush $bBlue -badgeText 'LOW BANDWIDTH / LOW COST'
DrawCard -g $s12.Graphics -x 70 -y 555 -w 860 -h 160 -title 'Rollout Roadmap' -body 'Phase 1: Barangay Tumana and Malanday pilot evaluation - Phase 2: 17 Metro Manila local government disaster units - Phase 3: Nationwide expansion to 42,000+ barangays.' -accentBrush $bAmber -badgeText 'GROWTH ROADMAP'
DrawCard -g $s12.Graphics -x 70 -y 735 -w 860 -h 160 -title 'Live Prototype Demo' -body 'Experience the interactive prototype: toggle Simulate Offline to test the dual-engine fallback, START triage, and relief distribution ledger.' -accentBrush $bEmerald -badgeText 'INTERACTIVE PROTOTYPE'

DrawFramedImage -g $s12.Graphics -imagePath (Join-Path $imagesDir 'feature_bayanihan_aid.jpg') -x 980 -y 195 -w 870 -h 700 -caption 'Bayanihan Mutual Aid // Community Solidarity in Evacuation Centers'
DrawSubtitles -g $s12.Graphics -voiceText 'From mobile browsers to thirty-five dollar edge servers and Google Cloud Run, Resilia scales across Philippine barangays. Disasters are inevitable, but being cut off is not. Resilia keeps the lifeline open.'
$s12.Bitmap.Save((Join-Path $outputDir 'scene_12.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$s12.Graphics.Dispose(); $s12.Bitmap.Dispose()
Write-Output 'Scene 12 rendered.'

Write-Output 'ALL 12 SCENE SLIDES SUCCESSFULLY GENERATED!'
