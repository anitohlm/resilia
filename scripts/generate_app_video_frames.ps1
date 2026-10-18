# Resilia App Walkthrough Frame Renderer (1920x1080) - Clean Here-Strings
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
$cBg = [System.Drawing.Color]::FromArgb(9, 10, 14)
$cNavBg = [System.Drawing.Color]::FromArgb(16, 17, 23)
$cCardBg = [System.Drawing.Color]::FromArgb(20, 22, 29)
$cCardInner = [System.Drawing.Color]::FromArgb(26, 28, 38)
$cCardBorder = [System.Drawing.Color]::FromArgb(40, 44, 56)
$cEmerald = [System.Drawing.Color]::FromArgb(16, 185, 129)
$cEmeraldBg = [System.Drawing.Color]::FromArgb(15, 45, 35)
$cAmber = [System.Drawing.Color]::FromArgb(245, 158, 11)
$cAmberBg = [System.Drawing.Color]::FromArgb(45, 32, 12)
$cRed = [System.Drawing.Color]::FromArgb(239, 68, 68)
$cRedBg = [System.Drawing.Color]::FromArgb(48, 18, 20)
$cBlue = [System.Drawing.Color]::FromArgb(59, 130, 246)
$cBlueBg = [System.Drawing.Color]::FromArgb(18, 35, 60)
$cWhite = [System.Drawing.Color]::FromArgb(248, 250, 252)
$cMuted = [System.Drawing.Color]::FromArgb(156, 163, 175)
$cSubMuted = [System.Drawing.Color]::FromArgb(209, 213, 219)

# Brushes
$bBg = New-Object System.Drawing.SolidBrush($cBg)
$bNavBg = New-Object System.Drawing.SolidBrush($cNavBg)
$bCard = New-Object System.Drawing.SolidBrush($cCardBg)
$bCardInner = New-Object System.Drawing.SolidBrush($cCardInner)
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
$bSubBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(12, 13, 17))

# Pens
$pBorder = New-Object System.Drawing.Pen($cCardBorder, 1.5)
$pEmerald = New-Object System.Drawing.Pen($cEmerald, 2)
$pAmber = New-Object System.Drawing.Pen($cAmber, 2)
$pRed = New-Object System.Drawing.Pen($cRed, 2)
$pBlue = New-Object System.Drawing.Pen($cBlue, 2)
$pNavLine = New-Object System.Drawing.Pen($cCardBorder, 2)

# Fonts
$fBrand = New-Object System.Drawing.Font('Arial', 20, [System.Drawing.FontStyle]::Bold)
$fBadge = New-Object System.Drawing.Font('Arial', 10.5, [System.Drawing.FontStyle]::Bold)
$fScreenTitle = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold)
$fScreenSub = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Regular)
$fCardTitle = New-Object System.Drawing.Font('Arial', 14.5, [System.Drawing.FontStyle]::Bold)
$fCardBody = New-Object System.Drawing.Font('Arial', 12.5, [System.Drawing.FontStyle]::Regular)
$fSubTitle = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$fSubText = New-Object System.Drawing.Font('Arial', 13.5, [System.Drawing.FontStyle]::Regular)
$fCaption = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
$fButton = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Bold)

function SetupCanvas {
    $bmp = New-Object System.Drawing.Bitmap 1920, 1080
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.FillRectangle($bBg, 0, 0, 1920, 1080)
    return @{ Bitmap = $bmp; Graphics = $g }
}

function DrawAppHeader {
    param($g, [string]$activeRole, [string]$networkStatus, [string]$activeTab, [int]$sceneNum)
    $g.FillRectangle($bNavBg, 0, 0, 1920, 68)
    $g.DrawLine($pNavLine, 0, 68, 1920, 68)

    FillRoundedRect -g $g -brush $bEmerald -x 40 -y 14 -w 40 -h 40 -radius 8
    $fLogo = New-Object System.Drawing.Font('Arial', 22, [System.Drawing.FontStyle]::Bold)
    $bBlack = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $g.DrawString('R', $fLogo, $bBlack, 51, 16)
    $fLogo.Dispose(); $bBlack.Dispose()

    $g.DrawString('RESILIA', $fBrand, $bWhite, 92, 18)

    FillRoundedRect -g $g -brush $bCardInner -x 220 -y 19 -w 270 -h 30 -radius 6
    DrawRoundedRect -g $g -pen $pBorder -x 220 -y 19 -w 270 -h 30 -radius 6
    $g.DrawString('Sector 4 // Marikina River Basin', $fBadge, $bMuted, 235, 25)

    FillRoundedRect -g $g -brush $bAmberBg -x 510 -y 19 -w 420 -h 30 -radius 6
    DrawRoundedRect -g $g -pen $pAmber -x 510 -y 19 -w 420 -h 30 -radius 6
    $g.DrawString('WATER LEVEL: 16.2m - ALARM 2 [PRE-EMPTIVE]', $fBadge, $bAmber, 525, 25)

    if ($networkStatus -eq 'OFFLINE') {
        FillRoundedRect -g $g -brush $bRedBg -x 1220 -y 19 -w 210 -h 30 -radius 6
        DrawRoundedRect -g $g -pen $pRed -x 1220 -y 19 -w 210 -h 30 -radius 6
        $g.DrawString('OFFLINE // LOCAL DB', $fBadge, $bRed, 1240, 25)
    } else {
        FillRoundedRect -g $g -brush $bEmeraldBg -x 1220 -y 19 -w 210 -h 30 -radius 6
        DrawRoundedRect -g $g -pen $pEmerald -x 1220 -y 19 -w 210 -h 30 -radius 6
        $g.DrawString('ONLINE // CLOUD AI', $fBadge, $bEmerald, 1240, 25)
    }

    FillRoundedRect -g $g -brush $bCardInner -x 1450 -y 17 -w 250 -h 34 -radius 6
    DrawRoundedRect -g $g -pen $pEmerald -x 1450 -y 17 -w 250 -h 34 -radius 6
    $roleText = 'ROLE: ' + $activeRole + '  [v]'
    $g.DrawString($roleText, $fBadge, $bWhite, 1465, 25)

    $scText = ('APP DEMO {0:D2}/12' -f $sceneNum)
    $g.DrawString($scText, $fBadge, $bAmber, 1720, 25)
}

function DrawAppAlertBanner {
    param($g, [string]$bannerText, [string]$badgeText, $bgBrush, $pen, $textBrush)
    FillRoundedRect -g $g -brush $bgBrush -x 40 -y 82 -w 1840 -h 42 -radius 8
    DrawRoundedRect -g $g -pen $pen -x 40 -y 82 -w 1840 -h 42 -radius 8

    $bw = [int]($g.MeasureString($badgeText, $fBadge).Width + 16)
    FillRoundedRect -g $g -brush $bNavBg -x 55 -y 90 -w $bw -h 26 -radius 4
    $g.DrawString($badgeText, $fBadge, $textBrush, 63, 94)

    $g.DrawString($bannerText, $fCardTitle, $bWhite, (75 + $bw), 93)
}

function DrawSubtitles {
    param($g, [string]$voiceText)
    $h = 130
    $y = 925
    FillRoundedRect -g $g -brush $bSubBg -x 40 -y $y -w 1840 -h $h -radius 12
    DrawRoundedRect -g $g -pen $pEmerald -x 40 -y $y -w 1840 -h $h -radius 12

    $g.DrawString('LIVE APPLICATION DEMO // COMPASSIONATE VOICEOVER', $fSubTitle, $bAmber, 65, ($y + 12))

    $textRect = New-Object System.Drawing.RectangleF(65, ($y + 36), 1790, 80)
    $sf = New-Object System.Drawing.StringFormat
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Near
    $g.DrawString($voiceText, $fSubText, $bWhite, $textRect, $sf)
    $sf.Dispose()
}

function DrawAppCard {
    param($g, [int]$x, [int]$y, [int]$w, [int]$h, [string]$title, [string]$body, $accentBrush, [string]$badgeText = '')
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 10
    DrawRoundedRect -g $g -pen $pBorder -x $x -y $y -w $w -h $h -radius 10

    if ($accentBrush -ne $null) {
        FillRoundedRect -g $g -brush $accentBrush -x $x -y $y -w $w -h 4 -radius 2
    }

    $curY = $y + 14
    if ($badgeText -ne '') {
        $bw = [int]($g.MeasureString($badgeText, $fBadge).Width + 14)
        FillRoundedRect -g $g -brush $bCardInner -x ($x + 18) -y $curY -w $bw -h 22 -radius 4
        $g.DrawString($badgeText, $fBadge, $bAmber, ($x + 25), ($curY + 3))
        $curY += 28
    }

    $g.DrawString($title, $fCardTitle, $bWhite, ($x + 18), $curY)
    $curY += 26

    $bodyRect = New-Object System.Drawing.RectangleF(($x + 18), $curY, ($w - 36), ($h - ($curY - $y) - 10))
    $sf = New-Object System.Drawing.StringFormat
    $g.DrawString($body, $fCardBody, $bSubMuted, $bodyRect, $sf)
    $sf.Dispose()
}

function DrawFramedPhone {
    param($g, [string]$imagePath, [int]$x, [int]$y, [int]$w, [int]$h, [string]$screenLabel)
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 24
    DrawRoundedRect -g $g -pen $pEmerald -x $x -y $y -w $w -h $h -radius 24

    if (Test-Path $imagePath) {
        $img = [System.Drawing.Image]::FromFile($imagePath)
        $pad = 10
        $g.DrawImage($img, ($x + $pad), ($y + $pad), ($w - $pad*2), ($h - $pad*2 - 36))
        $img.Dispose()
    }

    $lblY = $y + $h - 34
    $lblBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(14, 15, 20))
    $g.FillRectangle($lblBrush, ($x + 4), $lblY, ($w - 8), 30)
    $lblBrush.Dispose()
    $fullLabel = 'APP SCREEN: ' + $screenLabel
    $g.DrawString($fullLabel, $fCaption, $bEmerald, ($x + 18), ($lblY + 6))
}

function DrawAppWorkspacePanel {
    param($g, [string]$imagePath, [int]$x, [int]$y, [int]$w, [int]$h, [string]$panelTitle)
    FillRoundedRect -g $g -brush $bCard -x $x -y $y -w $w -h $h -radius 12
    DrawRoundedRect -g $g -pen $pBorder -x $x -y $y -w $w -h $h -radius 12

    if (Test-Path $imagePath) {
        $img = [System.Drawing.Image]::FromFile($imagePath)
        $pad = 10
        $g.DrawImage($img, ($x + $pad), ($y + $pad), ($w - $pad*2), ($h - $pad*2 - 40))
        $img.Dispose()
    }

    $barY = $y + $h - 36
    $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(14, 15, 20))
    $g.FillRectangle($barBrush, ($x + 2), $barY, ($w - 4), 34)
    $barBrush.Dispose()
    $fullTitle = 'LIVE WORKSPACE: ' + $panelTitle
    $g.DrawString($fullTitle, $fCaption, $bAmber, ($x + 16), ($barY + 8))
}

Write-Output 'Rendering 12 Live App Demonstration Frames...'

# FRAME 1: Live App Overview & Resident Dashboard
$f1 = SetupCanvas
DrawAppHeader -g $f1.Graphics -activeRole 'RESIDENT [CITIZEN]' -networkStatus 'ONLINE' -activeTab 'HOME' -sceneNum 1
DrawAppAlertBanner -g $f1.Graphics -bannerText 'PAGASA TCWS SIGNAL #3 // MARIKINA RIVER WATER LEVEL AT 16.2m - PRE-EMPTIVE EVACUATION ADVISORY' -badgeText 'ACTIVE WARNING' -bgBrush $bAmberBg -pen $pAmber -textBrush $bAmber

DrawFramedPhone -g $f1.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_resident.jpg') -x 40 -y 140 -w 500 -h 765 -screenLabel 'Resident Mobile Interface'

DrawAppCard -g $f1.Graphics -x 570 -y 140 -w 1310 -h 175 -title 'Household Safety and Go-Bag Status [Sector 4-B Malanday]' -body 'Interactive status panel showing household safety declaration (All 3 family members marked safe). Go-Bag readiness verified with water, rations, prescription medicines, and power bank tracked in local storage.' -accentBrush $bEmerald -badgeText 'HOUSEHOLD SAFETY'

DrawAppCard -g $f1.Graphics -x 570 -y 335 -w 1310 -h 175 -title 'Community Evacuation Shelter: Malanday Elementary School' -body 'Real-time shelter capacity: 850 / 1,000 evacuees (85% occupied). Facility features active: wheelchair access ramps, infant nursing area, continuous power for dialysis/oxygen, and pet accommodation.' -accentBrush $bBlue -badgeText 'VERIFIED SHELTER STATUS'

DrawAppCard -g $f1.Graphics -x 570 -y 530 -w 1310 -h 175 -title 'Dual-Engine Disaster Intelligence [Cloud Gemini + Edge Storage]' -body 'When online, the app utilizes Google Gemini for natural-language multi-lingual disaster assistance. When cellular connectivity fails, the app executes completely offline from 15 local IndexedDB database stores.' -accentBrush $bAmber -badgeText 'RESILIENT ARCHITECTURE'

DrawAppCard -g $f1.Graphics -x 570 -y 725 -w 1310 -h 180 -title 'Simulated Marikina River Basin Evaluation' -body 'Evaluated using realistic hydrological simulation data modeled after Typhoon Ondoy and Ulysses river crests. Transparently developed as an operational software prototype to validate network resilience.' -accentBrush $bEmerald -badgeText 'PROTOTYPE EVALUATION'

DrawSubtitles -g $f1.Graphics -voiceText 'Welcome to Resilia, an AI-assisted community disaster platform built for severe network disruptions. Evaluated on simulated flood baselines in the Marikina River basin, Resilia provides specialized interfaces across three roles: Residents, Responders, and Municipal Coordinators.'
$f1.Bitmap.Save((Join-Path $outputDir 'scene_01.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f1.Graphics.Dispose(); $f1.Bitmap.Dispose()
Write-Output 'App Frame 1 rendered.'

# FRAME 2: Resident App - Emergency SOS Beacon & 72-Hour Family Go-Bag
$f2 = SetupCanvas
DrawAppHeader -g $f2.Graphics -activeRole 'RESIDENT [CITIZEN]' -networkStatus 'ONLINE' -activeTab 'HOME' -sceneNum 2
DrawAppAlertBanner -g $f2.Graphics -bannerText 'RESIDENT LIFELINE: FIND ME BEACON BROADCASTER AND 72-HOUR SURVIVAL CHECKLIST' -badgeText 'LIFE SAFETY' -bgBrush $bRedBg -pen $pRed -textBrush $bRed

DrawAppWorkspacePanel -g $f2.Graphics -imagePath (Join-Path $imagesDir 'feature_beacon_sos.jpg') -x 40 -y 140 -w 880 -h 765 -panelTitle 'Find Me OLED Morse Strobe and GPS Broadcaster'

DrawAppCard -g $f2.Graphics -x 950 -y 140 -w 930 -h 240 -title 'Find Me SOS Optical Strobe and Coordinate Broadcaster' -body 'High-contrast dark-mode strobe designed for nocturnal rooftop rescue operations during blackouts. Pulses standardized optical Morse SOS to signal rescue helicopters and amphibious boats with minimal battery consumption. Broadcasts exact coordinates: 14.6507 N, 121.1029 E.' -accentBrush $bRed -badgeText 'OPTICAL EMERGENCY SIGNAL'

DrawAppCard -g $f2.Graphics -x 950 -y 400 -w 930 -h 240 -title 'Interactive 72-Hour Family Go-Bag Survival Checklist' -body 'Enables households to audit preparedness before floodwaters crest. Pre-configured with essential disaster items: 3 Gallons Potable Water, Non-Perishable Ready-to-Eat Food, First Aid Kit with Prescription Medicines, Waterproof Document Pouch, Flashlight and Batteries, and 20,000mAh Power Bank.' -accentBrush $bEmerald -badgeText 'SURVIVAL CHECKLIST'

DrawAppCard -g $f2.Graphics -x 950 -y 660 -w 930 -h 245 -title 'Persistent Offline Availability' -body 'Checklist state and emergency beacon configurations are stored directly in browser IndexedDB (resilia_local_db). The checklist remains locally accessible and editable even when cellular signals and Wi-Fi networks completely collapse.' -accentBrush $bAmber -badgeText 'LOCAL PERSISTENCE'

DrawSubtitles -g $f2.Graphics -voiceText 'For residents, Resilia begins with preparedness and survival. Citizens can trigger the high-contrast Find Me emergency beacon, pulsing Morse code S.O.S. with GPS coordinates. The interactive 72-hour family Go-Bag checklist ensures households are ready, stored persistently offline.'
$f2.Bitmap.Save((Join-Path $outputDir 'scene_02.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f2.Graphics.Dispose(); $f2.Bitmap.Dispose()
Write-Output 'App Frame 2 rendered.'

# FRAME 3: Resident App - 1-Tap Distress Requests & Ayuda Pass
$f3 = SetupCanvas
DrawAppHeader -g $f3.Graphics -activeRole 'RESIDENT [CITIZEN]' -networkStatus 'ONLINE' -activeTab 'ASSISTANCE' -sceneNum 3
DrawAppAlertBanner -g $f3.Graphics -bannerText 'ONE-TAP DISTRESS REPORTING AND FRAUD-PROOF DIGITAL AYUDA PASS' -badgeText 'CITIZEN ASSISTANCE' -bgBrush $bBlueBg -pen $pBlue -textBrush $bBlue

DrawFramedPhone -g $f3.Graphics -imagePath (Join-Path $imagesDir 'resilia_app_cellphone.jpg') -x 40 -y 140 -w 500 -h 765 -screenLabel 'Resident Mobile App'

DrawAppCard -g $f3.Graphics -x 570 -y 140 -w 1310 -h 240 -title '4 Instant Distress Action Cards' -body 'Single-tap distress dispatch interface providing immediate assistance requests: [ Trapped in Floodwaters ], [ Medical Emergency / Injury ], [ Fire Hazard ], and [ Need Evacuation Rescue ]. Eliminates cumbersome text entry during life-threatening panic situations.' -accentBrush $bRed -badgeText 'ONE-TAP DISTRESS'

DrawAppCard -g $f3.Graphics -x 570 -y 400 -w 1310 -h 240 -title 'Vulnerability Scoring Intake' -body 'Captures critical demographic indicators: Elderly / Bedridden Seniors, Infants under 1 year, Dialysis Patients, and Wheelchair Users. The Needs and Coordination Agent mathematically weighs these variables to elevate vulnerable citizens above able-bodied queues.' -accentBrush $bAmber -badgeText 'EQUITABLE TRIAGE'

DrawAppCard -g $f3.Graphics -x 570 -y 660 -w 1310 -h 245 -title 'Digital Ayuda Pass [Offline QR Identity]' -body 'Each household is issued a cryptographic offline QR pass. When presenting at relief food distribution centers, aid workers scan the pass with automated 24-hour duplicate protection, eliminating paper rosters and preventing relief aid hoarding.' -accentBrush $bEmerald -badgeText 'RELIEF AID ACCESS'

DrawSubtitles -g $f3.Graphics -voiceText 'When floodwaters rise, residents submit one-tap distress calls for rescue or medical aid. The app captures household vulnerabilities, such as bedridden seniors or infants, ensuring equitable prioritization. Families also receive a digital Ayuda pass with an offline Q.R. identity.'
$f3.Bitmap.Save((Join-Path $outputDir 'scene_03.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f3.Graphics.Dispose(); $f3.Bitmap.Dispose()
Write-Output 'App Frame 3 rendered.'

# FRAME 4: Seamless Role Switching - Transitioning to First Responder
$f4 = SetupCanvas
DrawAppHeader -g $f4.Graphics -activeRole 'SWITCHING ROLE...' -networkStatus 'ONLINE' -activeTab 'ROLES' -sceneNum 4
DrawAppAlertBanner -g $f4.Graphics -bannerText 'STRICT ROLE-BASED ACCESS CONTROL [RBAC] // TRANSITIONING TO EMERGENCY RESPONDER COCKPIT' -badgeText 'ROLE GOVERNANCE' -bgBrush $bEmeraldBg -pen $pEmerald -textBrush $bEmerald

FillRoundedRect -g $f4.Graphics -brush $bCard -x 360 -y 160 -w 1200 -h 730 -radius 16
DrawRoundedRect -g $f4.Graphics -pen $pEmerald -x 360 -y 160 -w 1200 -h 730 -radius 16

$f4.Graphics.DrawString('SELECT USER ROLE AND OPERATIONAL INTERFACE', $fScreenTitle, $bWhite, 400, 195)
$f4.Graphics.DrawString('Resilia enforces strict RBAC: users only see and interact with tools authorized for their role.', $fScreenSub, $bMuted, 400, 235)

FillRoundedRect -g $f4.Graphics -brush $bCardInner -x 400 -y 280 -w 1120 -h 130 -radius 10
DrawRoundedRect -g $f4.Graphics -pen $pBorder -x 400 -y 280 -w 1120 -h 130 -radius 10
$f4.Graphics.DrawString('Resident Citizen [Komunidad]', $fCardTitle, $bWhite, 430, 305)
$f4.Graphics.DrawString('Report local hazards, complete family Go-Bag checklist, signal SOS beacon, and claim relief food packs.', $fCardBody, $bSubMuted, 430, 335)
FillRoundedRect -g $f4.Graphics -brush $bNavBg -x 1350 -y 320 -w 130 -h 34 -radius 6
$f4.Graphics.DrawString('PREVIOUS', $fBadge, $bMuted, 1375, 330)

FillRoundedRect -g $f4.Graphics -brush $bEmeraldBg -x 400 -y 430 -w 1120 -h 150 -radius 10
DrawRoundedRect -g $f4.Graphics -pen $pEmerald -x 400 -y 430 -w 1120 -h 150 -radius 10
$f4.Graphics.DrawString('Emergency Responder [Rescue 161 Unit #2]  <- SELECTED', $fCardTitle, $bEmerald, 430, 455)
$f4.Graphics.DrawString('Tactical field cockpit: accept priority dispatches, execute START mass casualty triage, view live ETAs, and buffer field reports across radio net.', $fCardBody, $bWhite, 430, 488)
FillRoundedRect -g $f4.Graphics -brush $bEmerald -x 1340 -y 475 -w 145 -h 40 -radius 6
$bBlk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
$f4.Graphics.DrawString('SWITCH ROLE', $fButton, $bBlk, 1358, 486)
$bBlk.Dispose()

FillRoundedRect -g $f4.Graphics -brush $bCardInner -x 400 -y 600 -w 1120 -h 130 -radius 10
DrawRoundedRect -g $f4.Graphics -pen $pBorder -x 400 -y 600 -w 1120 -h 130 -radius 10
$f4.Graphics.DrawString('Disaster Coordinator [CDRRMO Incident Command]', $fCardTitle, $bWhite, 430, 625)
$f4.Graphics.DrawString('Command operations: live river telemetry, shelter capacity gauges, AI proposal approval gate, and relief ledger.', $fCardBody, $bSubMuted, 430, 655)
FillRoundedRect -g $f4.Graphics -brush $bNavBg -x 1350 -y 640 -w 130 -h 34 -radius 6
$f4.Graphics.DrawString('SELECT', $fBadge, $bMuted, 1385, 650)

$f4.Graphics.DrawString('Role separation strictly enforced: Residents report, Responders execute, Coordinators authorize.', $fCaption, $bAmber, 400, 840)

DrawSubtitles -g $f4.Graphics -voiceText 'Resilia enforces strict role-based access control. Switching roles in the app header, field personnel access the First Responder cockpit—a tactical mobile interface designed for search and rescue teams operating in hazardous, low-bandwidth flood zones.'
$f4.Bitmap.Save((Join-Path $outputDir 'scene_04.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f4.Graphics.Dispose(); $f4.Bitmap.Dispose()
Write-Output 'App Frame 4 rendered.'

# FRAME 5: First Responder - Active Mission Cockpit & Priority P94 Rescue
$f5 = SetupCanvas
DrawAppHeader -g $f5.Graphics -activeRole 'FIRST RESPONDER [RESCUE 161]' -networkStatus 'ONLINE' -activeTab 'MISSIONS' -sceneNum 5
DrawAppAlertBanner -g $f5.Graphics -bannerText 'ACTIVE MISSION COCKPIT // PRIORITY P94/100 WATER RESCUE DISPATCH - TUMANA SECTOR 4' -badgeText 'URGENT DISPATCH' -bgBrush $bRedBg -pen $pRed -textBrush $bRed

DrawFramedPhone -g $f5.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_responder.jpg') -x 40 -y 140 -w 500 -h 765 -screenLabel 'Responder Mission Cockpit'

DrawAppCard -g $f5.Graphics -x 570 -y 140 -w 1310 -h 240 -title 'Priority P94/100 Water Rescue Dispatch [High Vulnerability Household]' -body 'Target Location: 42 Riverside Drive, Barangay Tumana. Assigned Team: Amphibious Rescue Boat #2. Casualty Roster: Trapped elderly citizen (78yo, bedridden, oxygen-dependent) and infant (8 months). Flood Depth: 1.6m rising rapidly.' -accentBrush $bRed -badgeText 'PRIORITY P94/100'

DrawAppCard -g $f5.Graphics -x 570 -y 400 -w 1310 -h 240 -title 'Tactical Navigation HUD and Live 6-Minute ETA Countdown' -body 'Calculates optimal watercraft approach avoiding submerged electrical transformers and high-velocity river currents along Tumana Riverbanks. Live ETA: 06:14 remaining. Distance: 450 meters. Status actions: [ En Route ], [ On Scene ], [ Patients Secured ].' -accentBrush $bAmber -badgeText 'NAVIGATION HUD'

DrawAppCard -g $f5.Graphics -x 570 -y 660 -w 1310 -h 245 -title 'Offline-Tolerant Field Dispatch Queue' -body 'When radio or cellular connectivity drops, responder status updates and patient vital signs are queued with cryptographic UUIDs in local IndexedDB. All field reports automatically synchronize across VHF packet radio or upon base return.' -accentBrush $bEmerald -badgeText 'OFFLINE QUEUE'

DrawSubtitles -g $f5.Graphics -voiceText 'Responders see active dispatches ranked by mathematical vulnerability. High-risk households—like this priority water rescue of a bedridden senior and infant—are dispatched first, complete with real-time ETA countdowns and turn-by-turn navigation.'
$f5.Bitmap.Save((Join-Path $outputDir 'scene_05.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f5.Graphics.Dispose(); $f5.Bitmap.Dispose()
Write-Output 'App Frame 5 rendered.'

# FRAME 6: First Responder - S.T.A.R.T. Mass Casualty Field Triage
$f6 = SetupCanvas
DrawAppHeader -g $f6.Graphics -activeRole 'FIRST RESPONDER [RESCUE 161]' -networkStatus 'ONLINE' -activeTab 'TRIAGE' -sceneNum 6
DrawAppAlertBanner -g $f6.Graphics -bannerText 'MASS CASUALTY PROTOCOL: SIMPLE TRIAGE AND RAPID TREATMENT [S.T.A.R.T.] AND QR WRISTBANDS' -badgeText 'FIELD TRIAGE' -bgBrush $bAmberBg -pen $pAmber -textBrush $bAmber

DrawAppWorkspacePanel -g $f6.Graphics -imagePath (Join-Path $imagesDir 'feature_start_triage.jpg') -x 40 -y 140 -w 880 -h 765 -panelTitle 'START Triage Wristband System in Shelter Staging Area'

DrawAppCard -g $f6.Graphics -x 950 -y 140 -w 930 -h 240 -title 'Simple Triage and Rapid Treatment [S.T.A.R.T.] Protocol' -body 'Standardized rapid casualty assessment for mass casualty flood evacuations: Step 1 (Can patient walk?), Step 2 (Respiration rate > 30/min?), Step 3 (Capillary refill > 2 sec?), Step 4 (Follows simple commands?). Generates immediate priority classification.' -accentBrush $bRed -badgeText 'ALGORITHMIC TRIAGE'

DrawAppCard -g $f6.Graphics -x 950 -y 400 -w 930 -h 240 -title '4 Standardized Color-Coded Triage Categories' -body 'IMMEDIATE [RED] - Life-threatening injuries needing instant stabilization. DELAYED [YELLOW] - Serious injuries requiring clinical treatment. MINOR [GREEN] - Walking wounded evacuees. EXPECTANT [BLACK] - Deceased or non-salvageable casualties.' -accentBrush $bAmber -badgeText 'COLOR CLASSIFICATION'

DrawAppCard -g $f6.Graphics -x 950 -y 660 -w 930 -h 245 -title 'Client-Rendered QR Casualty Wristbands' -body 'Generates scannable QR wristband codes offline on the responder device. Evacuation shelter clinic intake nurses scan the wristband to instantly retrieve field vital signs, triage notes, and medical urgency without lost paper charts.' -accentBrush $bEmerald -badgeText 'QR WRISTBAND SYSTEM'

DrawSubtitles -g $f6.Graphics -voiceText 'In mass casualty events, responders use our built-in S.T.A.R.T. field triage tool. The app categorizes casualties into color-coded priorities and generates client-side Q.R. wristbands that synchronize directly with evacuation clinics.'
$f6.Bitmap.Save((Join-Path $outputDir 'scene_06.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f6.Graphics.Dispose(); $f6.Bitmap.Dispose()
Write-Output 'App Frame 6 rendered.'

# FRAME 7: Emergency Coordinator - Command Operations Center
$f7 = SetupCanvas
DrawAppHeader -g $f7.Graphics -activeRole 'DISASTER COORDINATOR' -networkStatus 'ONLINE' -activeTab 'COMMAND' -sceneNum 7
DrawAppAlertBanner -g $f7.Graphics -bannerText 'MARIKINA DISASTER OPERATIONS CENTER // LIVE RIVER TELEMETRY AND MULTI-BARANGAY KPIS' -badgeText 'INCIDENT COMMAND' -bgBrush $bEmeraldBg -pen $pEmerald -textBrush $bEmerald

DrawFramedPhone -g $f7.Graphics -imagePath (Join-Path $imagesDir 'resilia_phone_coordinator.jpg') -x 40 -y 140 -w 500 -h 765 -screenLabel 'Coordinator Command Cockpit'

DrawAppCard -g $f7.Graphics -x 570 -y 140 -w 1310 -h 240 -title 'Live Marikina River Telemetry [16.2m Alarm Level 2]' -body 'Continuous hydrological sensor feed tracks Marikina River water gauge level at 16.2 meters, exceeding Alarm Level 2 (Pre-emptive Evacuation threshold). Automatically broadcasts preparation advisories to 40,000+ residents in low-lying barangays.' -accentBrush $bAmber -badgeText 'HYDROLOGICAL SENSORS'

DrawAppCard -g $f7.Graphics -x 570 -y 400 -w 1310 -h 240 -title 'Operational Command KPIs and Real-Time Capacity' -body 'Real-time operational dashboard displays 42 Citizens Rescued, 3 Active Amphibious Boat Missions, and 850/1,000 Shelter Capacity at Malanday Elementary School. Provides city disaster chiefs with complete ground visibility.' -accentBrush $bEmerald -badgeText 'COMMAND KPIS'

DrawAppCard -g $f7.Graphics -x 570 -y 660 -w 1310 -h 245 -title 'Incident Truth Engine and Corroboration' -body 'Corroborates conflicting citizen hazard reports. Multiple flood reports along J.P. Rizal St are clustered by the Situation Agent to confirm road submersion, preventing rescue vehicles from entering impassable torrents.' -accentBrush $bBlue -badgeText 'TRUTH ENGINE'

DrawSubtitles -g $f7.Graphics -voiceText 'Switching to the Coordinator role opens the command operations center. Municipal coordinators gain live situational truth: real-time telemetry monitors the Marikina River gauge crossing Alarm Level 2, while interactive meters track shelter capacities.'
$f7.Bitmap.Save((Join-Path $outputDir 'scene_07.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f7.Graphics.Dispose(); $f7.Bitmap.Dispose()
Write-Output 'App Frame 7 rendered.'

# FRAME 8: Coordinator Command - AI Proposal Gatekeeper (Principle 5)
$f8 = SetupCanvas
DrawAppHeader -g $f8.Graphics -activeRole 'DISASTER COORDINATOR' -networkStatus 'ONLINE' -activeTab 'APPROVALS' -sceneNum 8
DrawAppAlertBanner -g $f8.Graphics -bannerText 'PRODUCT PRINCIPLE 5 SAFEGUARD: MANDATORY HUMAN COORDINATOR AUTHORIZATION GATE' -badgeText 'AI GOVERNANCE' -bgBrush $bRedBg -pen $pRed -textBrush $bRed

FillRoundedRect -g $f8.Graphics -brush $bCard -x 40 -y 140 -w 1840 -h 765 -radius 12
DrawRoundedRect -g $f8.Graphics -pen $pBorder -x 40 -y 140 -w 1840 -h 765 -radius 12
FillRoundedRect -g $f8.Graphics -brush $bRed -x 40 -y 140 -w 1840 -h 4 -radius 2

$f8.Graphics.DrawString('WORKSPACE #5: FIELD MISSIONS AND AI DISPATCH PROPOSALS', $fScreenTitle, $bWhite, 75, 175)
$f8.Graphics.DrawString('Autonomous AI dispatches are strictly forbidden by architectural design. Human approval is required.', $fScreenSub, $bMuted, 75, 215)

FillRoundedRect -g $f8.Graphics -brush $bCardInner -x 75 -y 260 -w 1770 -h 340 -radius 10
DrawRoundedRect -g $f8.Graphics -pen $pAmber -x 75 -y 260 -w 1770 -h 340 -radius 10

$f8.Graphics.DrawString('AI NEEDS AGENT #5 PROPOSAL: WATER RESCUE DISPATCH', $fCardTitle, $bAmber, 105, 285)

$propDetails = @"
Proposed Mission: Deploy Amphibious Boat Unit #3 to 14 Tumana Street for 4 trapped residents.
Household Vulnerability: Bedridden senior (78yo) on supplemental oxygen + 8-month infant.
Recommended Ingress Route: Via J.P. Rizal St (verified passable for drafts under 1.8m).
Recommended Shelter Destination: Malanday Elementary School (Ramps, Oxygen Power, Infant Care available).
Confidence Score: 94.2% based on clustered incident corroboration [inc_tumana_0428, inc_tumana_0431].
"@

$pRect = New-Object System.Drawing.RectangleF(105, 320, 1710, 150)
$f8.Graphics.DrawString($propDetails, $fCardBody, $bWhite, $pRect)

FillRoundedRect -g $f8.Graphics -brush $bEmerald -x 105 -y 485 -w 340 -h 54 -radius 8
$bBlk = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
$f8.Graphics.DrawString('[APPROVE AND DISPATCH TEAM]', $fButton, $bBlk, 135, 502)

FillRoundedRect -g $f8.Graphics -brush $bRedBg -x 470 -y 485 -w 320 -h 54 -radius 8
DrawRoundedRect -g $f8.Graphics -pen $pRed -x 470 -y 485 -w 320 -h 54 -radius 8
$f8.Graphics.DrawString('[DECLINE AND RE-ROUTE]', $fButton, $bRed, 515, 502)
$bBlk.Dispose()

FillRoundedRect -g $f8.Graphics -brush $bNavBg -x 75 -y 625 -w 1770 -h 240 -radius 10
DrawRoundedRect -g $f8.Graphics -pen $pBorder -x 75 -y 625 -w 1770 -h 240 -radius 10
$f8.Graphics.DrawString('IMMUTABLE AUDIT TRAIL // COORDINATOR AUTHORIZATION LOG', $fCardTitle, $bWhite, 105, 645)

$auditLog = @"
2026-10-17 21:38:02 UTC - [DISPATCH APPROVED] Coordinator Director Santos approved Mission #M-2026-089.
2026-10-17 21:38:02 UTC - Cryptographic Signature: ed25519:7a8f90b2... logged with UUID 9d4f-4a11.
2026-10-17 21:38:03 UTC - Resource Agent deducted Boat #3 from ready reserve (2 remaining in standby).
2026-10-17 21:38:04 UTC - Encrypted dispatch telemetry routed to Responder Unit #2 offline queue.
"@

$aRect = New-Object System.Drawing.RectangleF(105, 680, 1710, 160)
$f8.Graphics.DrawString($auditLog, $fCardBody, $bSubMuted, $aRect)

DrawSubtitles -g $f8.Graphics -voiceText 'Here, Resilia demonstrates responsible A.I. governance. While AI agents suggest optimal rescue dispatches, strict Product Principle 5 ensures that no autonomous action is taken without explicit approval from an authorized human coordinator.'
$f8.Bitmap.Save((Join-Path $outputDir 'scene_08.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f8.Graphics.Dispose(); $f8.Bitmap.Dispose()
Write-Output 'App Frame 8 rendered.'

# FRAME 9: Coordinator Command - Ayuda QR Relief Inventory Ledger
$f9 = SetupCanvas
DrawAppHeader -g $f9.Graphics -activeRole 'DISASTER COORDINATOR' -networkStatus 'ONLINE' -activeTab 'RESOURCES' -sceneNum 9
DrawAppAlertBanner -g $f9.Graphics -bannerText 'RELIEF LOGISTICS: FRAUD-PROOF AYUDA QR LEDGER AND 24-HOUR COOLDOWN ENFORCEMENT' -badgeText 'RELIEF AUDIT' -bgBrush $bEmeraldBg -pen $pEmerald -textBrush $bEmerald

DrawAppWorkspacePanel -g $f9.Graphics -imagePath (Join-Path $imagesDir 'evacuation_relief_ayuda.jpg') -x 40 -y 140 -w 880 -h 765 -panelTitle 'Ayuda QR Scanning at Evacuation Center Warehouse'

DrawAppCard -g $f9.Graphics -x 950 -y 140 -w 930 -h 240 -title 'Zero-Overdraft Inventory Arithmetic' -body 'Warehouse stock tracking: 1,240 / 2,000 Food Relief Packs Available. The Resource Agent enforces strict mathematical bounds—preventing relief distribution allocations from ever exceeding physically verified stock, even during concurrent offline scans.' -accentBrush $bEmerald -badgeText 'ZERO OVERDRAFT'

DrawAppCard -g $f9.Graphics -x 950 -y 400 -w 930 -h 240 -title 'Tamper-Proof 24-Hour QR Cooldown Lock' -body 'When resident QR pass HH-TUMANA-0428 is scanned, a relief transaction is recorded with millisecond timestamp. The system locks the household ID for 24 hours. Attempted duplicate claims are immediately flagged and rejected with full audit rationale.' -accentBrush $bAmber -badgeText 'ANTI-HOARDING LOCK'

DrawAppCard -g $f9.Graphics -x 950 -y 660 -w 930 -h 245 -title 'Complete Disconnection Resilience' -body 'The entire Ayuda ledger runs locally in client IndexedDB. Volunteer aid workers can scan hundreds of QR wristbands and ration cards in deep basement shelters without cellular signal, synchronizing transparently once connectivity returns.' -accentBrush $bBlue -badgeText 'OFFLINE SCANNING'

DrawSubtitles -g $f9.Graphics -voiceText 'Relief aid distribution is protected by our fraud-proof Ayuda ledger. Scanning a resident''s Q.R. pass deducts warehouse inventory in real time with zero-overdraft validation checks. An automated 24-hour cooldown prevents duplicate claims across distribution centers.'
$f9.Bitmap.Save((Join-Path $outputDir 'scene_09.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f9.Graphics.Dispose(); $f9.Bitmap.Dispose()
Write-Output 'App Frame 9 rendered.'

# FRAME 10: Network Resilience - Simulating Complete Network Loss
$f10 = SetupCanvas
DrawAppHeader -g $f10.Graphics -activeRole 'DISASTER COORDINATOR' -networkStatus 'OFFLINE' -activeTab 'OFFLINE DEMO' -sceneNum 10
DrawAppAlertBanner -g $f10.Graphics -bannerText 'NETWORK STATUS: SIMULATED OFFLINE // TRANSITIONED TO DETERMINISTIC LOCAL EDGE DURABILITY' -badgeText 'NETWORK LOSS' -bgBrush $bRedBg -pen $pRed -textBrush $bRed

DrawAppWorkspacePanel -g $f10.Graphics -imagePath (Join-Path $imagesDir 'emergency_command_mesh.jpg') -x 40 -y 140 -w 880 -h 765 -panelTitle 'Local Mesh Node and Raspberry Pi Micro-Server Deployment'

DrawAppCard -g $f10.Graphics -x 950 -y 140 -w 930 -h 240 -title 'Seamless Disconnection Transition' -body 'Clicking [ Simulate Offline ] in the header disconnects the cloud uplink. Unlike cloud-only disaster apps that stall on blank loading spinners, Resilia transitions seamlessly to deterministic edge mode with ZERO lost state.' -accentBrush $bRed -badgeText 'ZERO CRASH / ZERO LOSS'

DrawAppCard -g $f10.Graphics -x 950 -y 400 -w 930 -h 240 -title '15 Versioned Client IndexedDB Stores' -body 'The edge runtime maintains 15 operational stores: incidents, shelters, assistance requests, field missions, resources, audit logs, and pending sync queues. Sub-second local write latency (under 200ms) without waiting for network round-trips.' -accentBrush $bEmerald -badgeText '15 LOCAL STORES'

DrawAppCard -g $f10.Graphics -x 950 -y 660 -w 930 -h 245 -title 'Idempotent UUID Reconnection Synchronization' -body 'All offline actions are stored in an append-only event queue stamped with random UUIDs. When cellular or satellite connection restores, events synchronize upstream with exponential backoff and zero duplication.' -accentBrush $bAmber -badgeText 'IDEMPOTENT SYNC'

DrawSubtitles -g $f10.Graphics -voiceText 'Now watch what happens when connectivity fails. Toggling Simulate Offline transitions the app to local edge durability. All 15 IndexedDB stores remain operational. Citizen reports and triage records save locally with sub-second latency, queued safely for synchronization.'
$f10.Bitmap.Save((Join-Path $outputDir 'scene_10.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f10.Graphics.Dispose(); $f10.Bitmap.Dispose()
Write-Output 'App Frame 10 rendered.'

# FRAME 11: Ask Resilia AI - Grounded Evidence Citations
$f11 = SetupCanvas
DrawAppHeader -g $f11.Graphics -activeRole 'RESIDENT CITIZEN' -networkStatus 'ONLINE' -activeTab 'ASK RESILIA' -sceneNum 11
DrawAppAlertBanner -g $f11.Graphics -bannerText 'ASK RESILIA AI ASSISTANT // STRICT ANTI-HALLUCINATION EVIDENCE CITATION PROTOCOL' -badgeText 'TRUSTWORTHY AI' -bgBrush $bBlueBg -pen $pBlue -textBrush $bBlue

FillRoundedRect -g $f11.Graphics -brush $bCard -x 40 -y 140 -w 1840 -h 765 -radius 12
DrawRoundedRect -g $f11.Graphics -pen $pBorder -x 40 -y 140 -w 1840 -h 765 -radius 12
FillRoundedRect -g $f11.Graphics -brush $bBlue -x 40 -y 140 -w 1840 -h 4 -radius 2

$f11.Graphics.DrawString('WORKSPACE: ASK RESILIA EMERGENCY AI ASSISTANT', $fScreenTitle, $bWhite, 75, 175)
$f11.Graphics.DrawString('Dual-engine assistant citing verified disaster records; hallucination of impassable routes strictly blocked.', $fScreenSub, $bMuted, 75, 215)

FillRoundedRect -g $f11.Graphics -brush $bCardInner -x 75 -y 260 -w 1200 -h 100 -radius 10
DrawRoundedRect -g $f11.Graphics -pen $pBorder -x 75 -y 260 -w 1200 -h 100 -radius 10
$f11.Graphics.DrawString('CITIZEN QUERY [Resident Maria S.]:', $fBadge, $bAmber, 105, 275)
$f11.Graphics.DrawString('Is Malanday Elementary School accepting evacuees and are wheelchair ramps available for my mother?', $fCardTitle, $bWhite, 105, 305)

FillRoundedRect -g $f11.Graphics -brush $bEmeraldBg -x 75 -y 385 -w 1770 -h 340 -radius 10
DrawRoundedRect -g $f11.Graphics -pen $pEmerald -x 75 -y 385 -w 1770 -h 340 -radius 10
$f11.Graphics.DrawString('RESILIA AI RESPONSE // VERIFIED GROUND TRUTH', $fCardTitle, $bEmerald, 105, 410)

$aiResponse = @"
Yes, Malanday Elementary School is currently OPEN and operating as an active community shelter.
- Current Occupancy: 850 / 1,000 citizens (150 spaces remaining).
- Accessibility: Dedicated wheelchair access ramps are verified at Entrance B.
- Medical Support: Infant nursing area and continuous emergency power for oxygen/dialysis are operational.
- Safe Approach Route: Approach via Col. Cruz St. Do NOT use Riverside Drive due to 1.6m water inundation.
"@

$rRect = New-Object System.Drawing.RectangleF(105, 445, 1710, 160)
$f11.Graphics.DrawString($aiResponse, $fCardBody, $bWhite, $rRect)

FillRoundedRect -g $f11.Graphics -brush $bNavBg -x 105 -y 620 -w 1710 -h 80 -radius 8
DrawRoundedRect -g $f11.Graphics -pen $pBorder -x 105 -y 620 -w 1710 -h 80 -radius 8
$f11.Graphics.DrawString('MANDATORY GROUNDED EVIDENCE CITATIONS:', $fBadge, $bAmber, 125, 632)
$citations = 'Record IDs: [sh_malanday_elem] (Shelter Matrix) - [kn_marikina_river_levels] (PAGASA Telemetry) - [haz_riverside_flood] (Road Inundation Cluster)'
$f11.Graphics.DrawString($citations, $fCardBody, $bWhite, 125, 658)

FillRoundedRect -g $f11.Graphics -brush $bNavBg -x 75 -y 750 -w 1770 -h 60 -radius 8
DrawRoundedRect -g $f11.Graphics -pen $pBorder -x 75 -y 750 -w 1770 -h 60 -radius 8
$f11.Graphics.DrawString('Ask a question in English or Tagalog (e.g., Saan may available na oxygen?)...', $fCardBody, $bMuted, 105, 768)

DrawSubtitles -g $f11.Graphics -voiceText 'In the Ask Resilia assistant, anti-hallucination guardrails are mandatory. Every response cites verified stored records and local guidelines. If information cannot be verified locally, the system clearly discloses its boundaries rather than inventing dangerous misinformation.'
$f11.Bitmap.Save((Join-Path $outputDir 'scene_11.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f11.Graphics.Dispose(); $f11.Bitmap.Dispose()
Write-Output 'App Frame 11 rendered.'

# FRAME 12: Community Resilience Modules & Validated Prototype
$f12 = SetupCanvas
DrawAppHeader -g $f12.Graphics -activeRole 'RESILIA PLATFORM' -networkStatus 'ONLINE' -activeTab 'RESILIENCE' -sceneNum 12
DrawAppAlertBanner -g $f12.Graphics -bannerText '7 SPECIALIZED COMMUNITY MODULES AND RIGOROUS AUTOMATED VERIFICATION' -badgeText 'OPERATIONAL REALITY' -bgBrush $bEmeraldBg -pen $pEmerald -textBrush $bEmerald

DrawAppWorkspacePanel -g $f12.Graphics -imagePath (Join-Path $imagesDir 'feature_bayanihan_aid.jpg') -x 40 -y 140 -w 880 -h 765 -panelTitle 'Bayanihan Mutual Aid Board and Community Power Sharing'

DrawAppCard -g $f12.Graphics -x 950 -y 140 -w 930 -h 175 -title '72-Hour Leptospirosis Prophylaxis Watch' -body 'Automated countdown timer tracking evacuees exposed to Marikina floodwaters. Recommends DOH-certified Doxycycline prophylaxis protocols and rolling water boil standards to prevent post-flood disease outbreaks.' -accentBrush $bAmber -badgeText 'DISEASE PREVENTION'

DrawAppCard -g $f12.Graphics -x 950 -y 335 -w 930 -h 175 -title 'Privacy-Preserving Missing Kin Reunification' -body 'Shelter bulletin board enabling families separated during flood chaos to reconnect. Features fuzzy phonetic search and masked contact numbers to safeguard citizen privacy while speeding reunification.' -accentBrush $bBlue -badgeText 'FAMILY REUNIFICATION'

DrawAppCard -g $f12.Graphics -x 950 -y 530 -w 930 -h 175 -title 'Bayanihan Community Mutual Aid Board' -body 'Peer-to-peer neighborhood sharing: residents with generator power share device charging, solar lamps, and dry clothing with stranded families, fostering grassroots community resilience.' -accentBrush $bEmerald -badgeText 'MUTUAL AID'

DrawAppCard -g $f12.Graphics -x 950 -y 725 -w 930 -h 180 -title '193 Automated Test Assertions Passing' -body 'Validated working prototype: 193 unit and integration test assertions verify inventory arithmetic, triage algorithms, and sync queues under simulated network loss. Evaluated on simulated baselines; not tested in actual disasters.' -accentBrush $bEmerald -badgeText 'RIGOROUS VERIFICATION'

DrawSubtitles -g $f12.Graphics -voiceText 'Resilia integrates seven community resilience modules - from Leptospirosis prevention timers to family reunification. Evaluated through 193 automated tests in software simulation, Resilia demonstrates how AI assistance and edge resilience keep community lifelines open when networks fail.'
$f12.Bitmap.Save((Join-Path $outputDir 'scene_12.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$f12.Graphics.Dispose(); $f12.Bitmap.Dispose()
Write-Output 'App Frame 12 rendered.'

Write-Output 'ALL 12 LIVE APP DEMO FRAMES SUCCESSFULLY GENERATED!'
