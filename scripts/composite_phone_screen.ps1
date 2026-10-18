Add-Type -AssemblyName System.Drawing

function Create-RoundedPath($rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $r = [System.Drawing.RectangleF]::new($rect.X, $rect.Y, $rect.Width, $rect.Height)

    $path.AddArc($r.X, $r.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($r.Right - $diameter, $r.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($r.Right - $diameter, $r.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($r.X, $r.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

# ==============================================================================
# 1. RENDER COMPLETE MOBILE UI (Authentic ResidentHome.tsx & ResidentApp.tsx)
# ==============================================================================
$screenW = 798
$screenH = 1737
$uiBmp = New-Object System.Drawing.Bitmap($screenW, $screenH)
$g = [System.Drawing.Graphics]::FromImage($uiBmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Clean off-white background matching React Resident app (bg-rs-bg #f8fafc)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
$g.FillRectangle($bgBrush, 0, 0, $screenW, $screenH)

# Font families
$fontName = "Segoe UI"
$fTime = New-Object System.Drawing.Font($fontName, 19, [System.Drawing.FontStyle]::Bold)
$fBrand = New-Object System.Drawing.Font($fontName, 24, [System.Drawing.FontStyle]::Bold)
$fSubBrand = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Regular)
$fPill = New-Object System.Drawing.Font($fontName, 15, [System.Drawing.FontStyle]::Bold)
$fGreeting = New-Object System.Drawing.Font($fontName, 28, [System.Drawing.FontStyle]::Bold)
$fGreetSub = New-Object System.Drawing.Font($fontName, 15, [System.Drawing.FontStyle]::Regular)
$fAlertTag = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)
$fAlertTitle = New-Object System.Drawing.Font($fontName, 21, [System.Drawing.FontStyle]::Bold)
$fAlertSub = New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Regular)
$fCardTitle = New-Object System.Drawing.Font($fontName, 18, [System.Drawing.FontStyle]::Bold)
$fCardSub = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Regular)
$fSectionHeader = New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Bold)
$fToolTitle = New-Object System.Drawing.Font($fontName, 16, [System.Drawing.FontStyle]::Bold)
$fToolSub = New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)
$fShelterTitle = New-Object System.Drawing.Font($fontName, 18, [System.Drawing.FontStyle]::Bold)
$fShelterSub = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Regular)
$fBadge = New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)
$fNav = New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Bold)

# Brushes & Pens
$bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$bMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$bWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$bForest = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 95, 70))
$bEmerald = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5, 150, 105))
$bRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 29, 72))
$bRedDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(159, 18, 57))
$pBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 2)
$pAlert = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(253, 164, 175), 2.5)

# --- 1. Status Bar ---
$g.DrawString("9:41", $fTime, $bDark, 44, 14)
# Cellular signal bars
$g.FillRectangle($bDark, 680, 26, 4, 12)
$g.FillRectangle($bDark, 688, 22, 4, 16)
$g.FillRectangle($bDark, 696, 18, 4, 20)
$g.FillRectangle($bDark, 704, 14, 4, 24)
# Wifi icon
$pWifi = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(15, 23, 42), 2.8)
$g.DrawArc($pWifi, 718, 16, 22, 18, 200, 140)
$g.DrawArc($pWifi, 722, 21, 14, 14, 200, 140)
$g.FillEllipse($bDark, 727, 31, 4, 4)
# Battery icon
$g.DrawRectangle($pWifi, 748, 18, 30, 17)
$g.FillRectangle($bDark, 751, 21, 20, 11)
$g.FillRectangle($bDark, 779, 23, 3, 7)

# --- 2. Compact Header (ResidentApp.tsx lines 126-165) ---
$headerY = 50
$headerH = 85
$g.FillRectangle($bWhite, 0, $headerY, $screenW, $headerH)
$g.DrawLine($pBorder, 0, $headerY + $headerH, $screenW, $headerY + $headerH)

# Shield Logo
$g.FillEllipse($bForest, 36, $headerY + 16, 52, 52)
$shieldPts = @(
    [System.Drawing.PointF]::new(62, $headerY + 25),
    [System.Drawing.PointF]::new(75, $headerY + 30),
    [System.Drawing.PointF]::new(75, $headerY + 44),
    [System.Drawing.PointF]::new(62, $headerY + 57),
    [System.Drawing.PointF]::new(49, $headerY + 44),
    [System.Drawing.PointF]::new(49, $headerY + 30)
)
$g.FillPolygon($bWhite, $shieldPts)
$pEmerald2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.8)
$g.DrawLines($pEmerald2, @(
    [System.Drawing.PointF]::new(55, $headerY + 41),
    [System.Drawing.PointF]::new(60, $headerY + 47),
    [System.Drawing.PointF]::new(69, $headerY + 36)
))

$g.DrawString("Resilia", $fBrand, $bForest, 100, $headerY + 24)

# Connected Status Pill (ConnectionPill)
$pillX = 470; $pillY = $headerY + 20; $pillW = 145; $pillH = 44
$pillPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($pillX, $pillY, $pillW, $pillH)) 22
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $pillPath)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(167, 243, 208), 2)), $pillPath)
$g.FillEllipse($bEmerald, $pillX + 15, $pillY + 15, 13, 13)
$g.DrawString("Connected", $fPill, $bForest, $pillX + 35, $pillY + 11)

# Ask Resilia AI Sparkle button (ResidentApp.tsx lines 143-150: AskResiliaIcon 4-point sparkle)
$sparkX = 632; $sparkY = $headerY + 18
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $sparkX, $sparkY, 46, 46)
$sparkPts = @(
    [System.Drawing.PointF]::new($sparkX + 23, $sparkY + 11),
    [System.Drawing.PointF]::new($sparkX + 26, $sparkY + 20),
    [System.Drawing.PointF]::new($sparkX + 35, $sparkY + 23),
    [System.Drawing.PointF]::new($sparkX + 26, $sparkY + 26),
    [System.Drawing.PointF]::new($sparkX + 23, $sparkY + 35),
    [System.Drawing.PointF]::new($sparkX + 20, $sparkY + 26),
    [System.Drawing.PointF]::new($sparkX + 11, $sparkY + 23),
    [System.Drawing.PointF]::new($sparkX + 20, $sparkY + 20)
)
$g.FillPolygon($bEmerald, $sparkPts)

# Updates Bell Button with badge count
$bellX = 694; $bellY = $headerY + 18
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $bellX, $bellY, 46, 46)
$pBell = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 2.5)
$g.DrawArc($pBell, $bellX + 14, $bellY + 12, 18, 17, 180, 180)
$g.DrawLine($pBell, $bellX + 12, $bellY + 29, $bellX + 34, $bellY + 29)
$g.FillEllipse($bRed, $bellX + 28, $bellY, 19, 19)
$fBadgeSmall = New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Bold)
$g.DrawString("1", $fBadgeSmall, $bWhite, $bellX + 33, $bellY + 2)

# --- 3. Greeting Section (ResidentHome.tsx lines 91-98) ---
$contentY = 155
$g.DrawString("Hello, how can we help you?", $fGreeting, $bDark, 36, $contentY)
$g.DrawString("Resilia helps you stay safe, find nearby supplies, and ask for help.", $fGreetSub, $bMuted, 36, $contentY + 44)

# --- 4. Emergency Alert Card (ResidentHome.tsx lines 101-110, ResidentAlerts.tsx) ---
$alertY = $contentY + 84
$alertW = $screenW - 72
$alertH = 168
$alertPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $alertY, $alertW, $alertH)) 20
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 242))), $alertPath)
$g.DrawPath($pAlert, $alertPath)

# Warning Icon
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 56, $alertY + 22, 50, 50)
$pWarn = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(225, 29, 72), 3)
$warnPts = @(
    [System.Drawing.PointF]::new(81, $alertY + 30),
    [System.Drawing.PointF]::new(98, $alertY + 60),
    [System.Drawing.PointF]::new(64, $alertY + 60)
)
$g.DrawPolygon($pWarn, $warnPts)
$g.DrawLine($pWarn, 81, $alertY + 41, 81, $alertY + 50)
$g.FillEllipse($bRed, 79.5, $alertY + 54, 3, 3)

# Badges inside Alert
$tag1 = Create-RoundedPath ([System.Drawing.RectangleF]::new(124, $alertY + 20, 168, 28)) 7
$g.FillPath($bRed, $tag1)
$g.DrawString("EMERGENCY ALERT", $fAlertTag, $bWhite, 134, $alertY + 24)

$tag2 = Create-RoundedPath ([System.Drawing.RectangleF]::new(300, $alertY + 20, 85, 28)) 7
$g.FillPath($bDark, $tag2)
$g.DrawString("Signal #3", $fAlertTag, $bWhite, 310, $alertY + 24)

$fAlertStat = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)
$g.DrawString("River 16.2m", $fAlertStat, $bRedDark, 396, $alertY + 25)

$g.DrawString("Alert Level 2: Alarm Warning", $fAlertTitle, $bRedDark, 124, $alertY + 56)
$bulletChar = [char]0x2022
$g.DrawString("Marikina River 16.2m $bulletChar Evacuate low-lying river areas immediately.", $fAlertSub, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 18, 60))), 124, $alertY + 92)

# --- 5. Four Primary Quick Actions (ResidentHome.tsx lines 122-215) ---
$qaY = $alertY + $alertH + 20
$qaW = ($screenW - 72 - 16) / 2
$qaH = 170

function Draw-ActionCard($x, $y, $w, $h, $title, $sub, $iconBg, $iconColor, $type) {
    $cardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 18
    $g.FillPath($bWhite, $cardPath)
    $g.DrawPath($pBorder, $cardPath)

    $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconBg)), $x + 20, $y + 20, 48, 48)
    $pI = New-Object System.Drawing.Pen($iconColor, 2.5)

    $cx = $x + 44
    $cy = $y + 44
    if ($type -eq "get_help") {
        # Lifebuoy ring with straps and center heart (ResidentIcons.tsx GetHelpIcon)
        $g.DrawEllipse($pI, $cx - 13, $cy - 13, 26, 26)
        $g.DrawEllipse($pI, $cx - 6, $cy - 6, 12, 12)
        $g.DrawLine($pI, $cx, $cy - 13, $cx, $cy - 6)
        $g.DrawLine($pI, $cx, $cy + 6, $cx, $cy + 13)
        $g.DrawLine($pI, $cx - 13, $cy, $cx - 6, $cy)
        $g.DrawLine($pI, $cx + 6, $cy, $cx + 13, $cy)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconColor)), $cx - 2.5, $cy - 2.5, 5, 5)
    } elseif ($type -eq "find_place") {
        # Safe sanctuary haven house with open archway (ResidentIcons.tsx FindSafePlaceIcon)
        $g.DrawLines($pI, @(
            [System.Drawing.PointF]::new($cx - 14, $cy + 2),
            [System.Drawing.PointF]::new($cx, $cy - 12),
            [System.Drawing.PointF]::new($cx + 14, $cy + 2)
        ))
        $g.DrawRectangle($pI, $cx - 10, $cy + 2, 20, 11)
        $g.DrawArc($pI, $cx - 4, $cy + 4, 8, 9, 180, 180)
    } elseif ($type -eq "report") {
        # Street hazard warning cone with alert flare (ResidentIcons.tsx ReportProblemIcon)
        $conePts = @(
            [System.Drawing.PointF]::new($cx, $cy - 12),
            [System.Drawing.PointF]::new($cx + 12, $cy + 12),
            [System.Drawing.PointF]::new($cx - 12, $cy + 12)
        )
        $g.DrawPolygon($pI, $conePts)
        $g.DrawLine($pI, $cx - 5, $cy + 2, $cx + 5, $cy + 2)
        $g.DrawLine($pI, $cx - 8, $cy + 8, $cx + 8, $cy + 8)
    } elseif ($type -eq "mark_safe") {
        # Person with checkmark seal (ResidentIcons.tsx MarkSafeIcon)
        $g.DrawEllipse($pI, $cx - 8, $cy - 10, 10, 10)
        $g.DrawArc($pI, $cx - 14, $cy + 2, 14, 11, 180, 180)
        $g.DrawEllipse($pI, $cx + 1, $cy + 1, 11, 11)
        $pCheck = New-Object System.Drawing.Pen($iconColor, 2)
        $g.DrawLines($pCheck, @(
            [System.Drawing.PointF]::new($cx + 3, $cy + 6),
            [System.Drawing.PointF]::new($cx + 6, $cy + 9),
            [System.Drawing.PointF]::new($cx + 10, $cy + 4)
        ))
    }

    $g.DrawString($title, $fCardTitle, $bDark, $x + 20, $y + 82)
    $g.DrawString($sub, $fCardSub, $bMuted, [System.Drawing.RectangleF]::new($x + 20, $y + 114, $w - 40, 50))
}

# Row 1
Draw-ActionCard 36 $qaY $qaW $qaH "GET HELP" "Request rescue, food, clean water, or evacuation assistance" ([System.Drawing.Color]::FromArgb(255, 241, 242)) ([System.Drawing.Color]::FromArgb(225, 29, 72)) "get_help"
Draw-ActionCard (36 + $qaW + 16) $qaY $qaW $qaH "FIND A SAFE PLACE" "Find evacuation centers, water distribution points, and resources" ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105)) "find_place"

# Row 2
$qaY2 = $qaY + $qaH + 16
Draw-ActionCard 36 $qaY2 $qaW $qaH "REPORT A PROBLEM" "Street flooding, blocked roads, or infrastructure damage" ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(217, 119, 6)) "report"
Draw-ActionCard (36 + $qaW + 16) $qaY2 $qaW $qaH "MARK ME SAFE" "Check in your family safety status with community coordinators" ([System.Drawing.Color]::FromArgb(204, 251, 241)) ([System.Drawing.Color]::FromArgb(13, 148, 136)) "mark_safe"

# --- 6. SOS Survival Beacon Banner (ResidentHome.tsx lines 218-244) ---
$beaconY = $qaY2 + $qaH + 18
$beaconW = $screenW - 72
$beaconH = 88
$beaconPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $beaconY, $beaconW, $beaconH)) 18
$bGradBeacon = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.PointF]::new(36, $beaconY),
    [System.Drawing.PointF]::new(36 + $beaconW, $beaconY),
    [System.Drawing.Color]::FromArgb(136, 19, 55),
    [System.Drawing.Color]::FromArgb(153, 27, 27)
)
$g.FillPath($bGradBeacon, $beaconPath)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(244, 63, 94), 2)), $beaconPath)

# Pulsating radio beacon icon
$beaconIconX = 54; $beaconIconY = $beaconY + 18
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 244, 63, 94))), $beaconIconX, $beaconIconY, 52, 52)
$pRadio = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.5)
$g.DrawArc($pRadio, $beaconIconX + 16, $beaconIconY + 14, 20, 20, 210, 120)
$g.DrawArc($pRadio, $beaconIconX + 21, $beaconIconY + 19, 10, 10, 210, 120)
$g.FillEllipse($bWhite, $beaconIconX + 24, $beaconIconY + 28, 4, 4)

# Beacon Text
$fBeaconTitle = New-Object System.Drawing.Font($fontName, 18, [System.Drawing.FontStyle]::Bold)
$fBeaconSub = New-Object System.Drawing.Font($fontName, 12.5, [System.Drawing.FontStyle]::Regular)
$g.DrawString("SOS SURVIVAL BEACON", $fBeaconTitle, $bWhite, 120, $beaconY + 18)

# Offline badge
$offBadgePath = Create-RoundedPath ([System.Drawing.RectangleF]::new(410, $beaconY + 18, 68, 24)) 6
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 244, 63, 94))), $offBadgePath)
$fOff = New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("OFFLINE", $fOff, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 417, $beaconY + 22)

$g.DrawString("High-intensity screen strobe & acoustic SOS horn to signal rescue boats", $fBeaconSub, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 120, $beaconY + 48)

# LAUNCH Button
$launchPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 165, $beaconY + 22, 110, 44)) 14
$g.FillPath($bWhite, $launchPath)
$fLaunch = New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Bold)
$g.DrawString("LAUNCH", $fLaunch, $bRedDark, $screenW - 146, $beaconY + 33)

# --- 7. Emergency Go-Bag Checklist Card (ResidentHome.tsx lines 246-250: BEFORE Community Relief!) ---
$gobagY = $beaconY + $beaconH + 18
$gobagH = 110
$gobagPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $gobagY, $screenW - 72, $gobagH)) 18
$g.FillPath($bWhite, $gobagPath)
$g.DrawPath($pBorder, $gobagPath)

$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), 56, $gobagY + 20, 50, 50)
$pBag = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.5)
# Authentic GoBagIcon (survival backpack with carry handle & first-aid pocket)
$g.DrawArc($pBag, 75, $gobagY + 28, 12, 10, 180, 180)
$g.DrawRectangle($pBag, 67, $gobagY + 34, 28, 26)
$g.DrawLine($pBag, 67, $gobagY + 42, 95, $gobagY + 42)
$g.DrawRectangle($pBag, 74, $gobagY + 46, 14, 10)
$pCross = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 1.8)
$g.DrawLine($pCross, 81, $gobagY + 48, 81, $gobagY + 54)
$g.DrawLine($pCross, 78, $gobagY + 51, 84, $gobagY + 51)

$fGoTitle = New-Object System.Drawing.Font($fontName, 17, [System.Drawing.FontStyle]::Bold)
$fGoSub = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Regular)
$g.DrawString("72-Hour Evacuation Go-Bag", $fGoTitle, $bDark, 120, $gobagY + 20)
$g.DrawString("3 of 12 critical items ready $bulletChar Drinking water, non-perishables, flashlight", $fGoSub, $bMuted, 120, $gobagY + 50)

# Progress Bar
$barBg = Create-RoundedPath ([System.Drawing.RectangleF]::new(120, $gobagY + 78, $screenW - 220, 10)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))), $barBg)
$barFg = Create-RoundedPath ([System.Drawing.RectangleF]::new(120, $gobagY + 78, ($screenW - 220) * 0.25, 10)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6))), $barFg)

$g.DrawString("25%", $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6))), $screenW - 90, $gobagY + 74)

# --- 8. Community Relief & Resilience (ResidentHome.tsx lines 252-322: AFTER Go-Bag!) ---
$resilienceY = $gobagY + $gobagH + 18
$g.DrawString("COMMUNITY RELIEF & RESILIENCE", $fSectionHeader, $bMuted, 36, $resilienceY)

$toolY = $resilienceY + 26
$toolGap = 12
$toolW = ($screenW - 72 - $toolGap * 3) / 4
$toolH = 138

function Draw-ToolCard($x, $y, $w, $h, $title, $sub, $iconBg, $iconColor, $type) {
    $cardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 16
    $g.FillPath($bWhite, $cardPath)
    $g.DrawPath($pBorder, $cardPath)

    $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconBg)), $x + 16, $y + 14, 40, 40)
    $pI = New-Object System.Drawing.Pen($iconColor, 2.5)

    $cx = $x + 36
    $cy = $y + 34
    if ($type -eq "qr") {
        $g.DrawRectangle($pI, $cx - 10, $cy - 10, 20, 20)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($iconColor)), $cx - 6, $cy - 6, 5, 5)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($iconColor)), $cx + 1, $cy - 6, 5, 5)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($iconColor)), $cx - 6, $cy + 1, 5, 5)
    } elseif ($type -eq "users") {
        $g.DrawEllipse($pI, $cx - 7, $cy - 8, 9, 9)
        $g.DrawArc($pI, $cx - 12, $cy + 3, 13, 9, 180, 180)
        $g.DrawEllipse($pI, $cx + 1, $cy - 6, 8, 8)
        $g.DrawArc($pI, $cx - 2, $cy + 5, 13, 7, 180, 180)
    } elseif ($type -eq "bayanihan") {
        # Hands shaking / heart mutual aid
        $g.DrawArc($pI, $cx - 10, $cy - 9, 10, 10, 140, 200)
        $g.DrawArc($pI, $cx, $cy - 9, 10, 10, 200, 200)
        $g.DrawLines($pI, @(
            [System.Drawing.PointF]::new($cx - 10, $cy - 2),
            [System.Drawing.PointF]::new($cx, $cy + 9),
            [System.Drawing.PointF]::new($cx + 10, $cy - 2)
        ))
    } elseif ($type -eq "outbreak") {
        # Water droplets (disease outbreak)
        $dropPts = @(
            [System.Drawing.PointF]::new($cx, $cy - 11),
            [System.Drawing.PointF]::new($cx + 8, $cy + 2),
            [System.Drawing.PointF]::new($cx + 5, $cy + 9),
            [System.Drawing.PointF]::new($cx - 5, $cy + 9),
            [System.Drawing.PointF]::new($cx - 8, $cy + 2)
        )
        $g.DrawPolygon($pI, $dropPts)
    }

    $g.DrawString($title, $fToolTitle, $bDark, $x + 14, $y + 70)
    $g.DrawString($sub, $fToolSub, $bMuted, $x + 14, $y + 100)
}

# 4 Tools exactly matching ResidentHome.tsx lines 257-321:
# 1. Ayuda Pass / QR claim card
# 2. Missing Kin / Find relatives
# 3. Bayanihan Aid / Skills & tools
# 4. Outbreak Watch / Leptospirosis
Draw-ToolCard 36 $toolY $toolW $toolH "Ayuda Pass" "QR claim card" ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105)) "qr"
Draw-ToolCard (36 + $toolW + $toolGap) $toolY $toolW $toolH "Missing Kin" "Find relatives" ([System.Drawing.Color]::FromArgb(224, 231, 255)) ([System.Drawing.Color]::FromArgb(79, 70, 229)) "users"
Draw-ToolCard (36 + ($toolW + $toolGap)*2) $toolY $toolW $toolH "Bayanihan Aid" "Skills & tools" ([System.Drawing.Color]::FromArgb(243, 232, 255)) ([System.Drawing.Color]::FromArgb(147, 51, 234)) "bayanihan"
Draw-ToolCard (36 + ($toolW + $toolGap)*3) $toolY $toolW $toolH "Outbreak Watch" "Leptospirosis" ([System.Drawing.Color]::FromArgb(204, 251, 241)) ([System.Drawing.Color]::FromArgb(13, 148, 136)) "outbreak"

# --- 9. Nearby Help (Shelters) Section (ResidentHome.tsx lines 324-360) ---
$shelterSecY = $toolY + $toolH + 18
$g.DrawString("NEARBY HELP", $fSectionHeader, $bMuted, 36, $shelterSecY)
$fLink = New-Object System.Drawing.Font($fontName, 13.5, [System.Drawing.FontStyle]::Bold)
$g.DrawString("See all (6) >", $fLink, $bEmerald, $screenW - 135, $shelterSecY)

$shelterCardY = $shelterSecY + 26
$shelterCardH = 120
$shelterPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $shelterCardY, $screenW - 72, $shelterCardH)) 18
$g.FillPath($bWhite, $shelterPath)
$g.DrawPath($pBorder, $shelterPath)

# Shelter building icon circle
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), 56, $shelterCardY + 20, 52, 52)
$pShelter = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.5)
$g.DrawLines($pShelter, @(
    [System.Drawing.PointF]::new(68, $shelterCardY + 50),
    [System.Drawing.PointF]::new(82, $shelterCardY + 34),
    [System.Drawing.PointF]::new(96, $shelterCardY + 50),
    [System.Drawing.PointF]::new(96, $shelterCardY + 62),
    [System.Drawing.PointF]::new(68, $shelterCardY + 62),
    [System.Drawing.PointF]::new(68, $shelterCardY + 50)
))
$g.DrawRectangle($pShelter, 78, $shelterCardY + 48, 8, 14)

# Shelter Info
$g.DrawString("Malanday Elementary School", $fShelterTitle, $bDark, 122, $shelterCardY + 18)

# Open Badge
$openBadgePath = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 150, $shelterCardY + 18, 70, 28)) 7
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 252, 231))), $openBadgePath)
$g.DrawString("OPEN", $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 128, 61))), $screenW - 136, $shelterCardY + 23)

$g.DrawString("Evacuation Center $bulletChar 450m away $bulletChar 850 / 1,000 Capacity", $fShelterSub, $bMuted, 122, $shelterCardY + 52)
$g.DrawString("Food, clean water, medical aid, and charging station ready", $fShelterSub, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))), 122, $shelterCardY + 80)

# --- 10. Bottom Navigation Bar (ResidentApp.tsx lines 236-279) ---
$navH = 120
$navY = $screenH - $navH
$g.FillRectangle($bWhite, 0, $navY, $screenW, $navH)
$g.DrawLine($pBorder, 0, $navY, $screenW, $navY)

$navTabs = @(
    @{ Name="Home"; Icon="home"; Active=$true; IsHelp=$false },
    @{ Name="Map"; Icon="map"; Active=$false; IsHelp=$false },
    @{ Name="Get Help"; Icon="help"; Active=$false; IsHelp=$true },
    @{ Name="Updates"; Icon="updates"; Active=$false; IsHelp=$false },
    @{ Name="More"; Icon="more"; Active=$false; IsHelp=$false }
)

$navMargin = 20
$navUsableW = $screenW - ($navMargin * 2)
$tabW = $navUsableW / 5

for ($i = 0; $i -lt 5; $i++) {
    $tab = $navTabs[$i]
    $tx = $navMargin + ($i * $tabW)
    $cx = $tx + $tabW / 2

    if ($tab.Active) {
        # Active top indicator line (ResidentApp.tsx line 256: absolute top-0 inset-x-4 h-[3px] rounded-b-full bg-rs-primary)
        $topBarPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($tx + 16, $navY, $tabW - 32, 5)) 2.5
        $g.FillPath($bEmerald, $topBarPath)

        # Active circular icon background (bg-rs-tint)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $cx - 22, $navY + 12, 44, 44)

        $tb = $bEmerald
        $tp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.5)
    } elseif ($tab.IsHelp) {
        # Get Help pill button (ResidentApp.tsx line 261: bg-rs-tint text-rs-primary w-10 h-8 rounded-full)
        $helpPillPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($cx - 26, $navY + 14, 52, 40)) 20
        $g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $helpPillPath)

        $tb = $bMuted
        $tp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.5)
    } else {
        $tb = $bMuted
        $tp = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, 116, 139), 2.5)
    }

    # Render Nav Icons
    if ($tab.Icon -eq "home") {
        # ResidentNavHomeIcon
        $g.DrawLines($tp, @(
            [System.Drawing.PointF]::new($cx - 14, $navY + 28),
            [System.Drawing.PointF]::new($cx, $navY + 16),
            [System.Drawing.PointF]::new($cx + 14, $navY + 28),
            [System.Drawing.PointF]::new($cx + 14, $navY + 44),
            [System.Drawing.PointF]::new($cx - 14, $navY + 44),
            [System.Drawing.PointF]::new($cx - 14, $navY + 28)
        ))
        $g.DrawRectangle($tp, $cx - 4, $navY + 34, 8, 10)
    } elseif ($tab.Icon -eq "map") {
        # ResidentNavMapIcon (folded map with center pin)
        $g.DrawPolygon($tp, @(
            [System.Drawing.PointF]::new($cx - 14, $navY + 20),
            [System.Drawing.PointF]::new($cx - 5, $navY + 16),
            [System.Drawing.PointF]::new($cx + 5, $navY + 20),
            [System.Drawing.PointF]::new($cx + 14, $navY + 16),
            [System.Drawing.PointF]::new($cx + 14, $navY + 40),
            [System.Drawing.PointF]::new($cx + 5, $navY + 44),
            [System.Drawing.PointF]::new($cx - 5, $navY + 40),
            [System.Drawing.PointF]::new($cx - 14, $navY + 44)
        ))
        $g.FillEllipse($tb, $cx - 2, $navY + 28, 4, 4)
    } elseif ($tab.Icon -eq "help") {
        # GetHelpIcon (lifebuoy ring with reflective bands)
        $g.DrawEllipse($tp, $cx - 13, $navY + 21, 26, 26)
        $g.DrawEllipse($tp, $cx - 6, $navY + 28, 12, 12)
        $g.DrawLine($tp, $cx, $navY + 21, $cx, $navY + 28)
        $g.DrawLine($tp, $cx, $navY + 40, $cx, $navY + 47)
        $g.DrawLine($tp, $cx - 13, $navY + 34, $cx - 6, $navY + 34)
        $g.DrawLine($tp, $cx + 6, $navY + 34, $cx + 13, $navY + 34)
    } elseif ($tab.Icon -eq "updates") {
        # ResidentNavUpdatesIcon (bell with top wave)
        $g.DrawArc($tp, $cx - 11, $navY + 20, 22, 18, 180, 180)
        $g.DrawLine($tp, $cx - 12, $navY + 38, $cx + 12, $navY + 38)
        $g.DrawLine($tp, $cx - 4, $navY + 42, $cx + 4, $navY + 42)
    } elseif ($tab.Icon -eq "more") {
        # ResidentNavMoreIcon (4 rounded rectangles)
        $g.DrawRectangle($tp, $cx - 11, $navY + 20, 9, 9)
        $g.DrawRectangle($tp, $cx + 2, $navY + 20, 9, 9)
        $g.DrawRectangle($tp, $cx - 11, $navY + 33, 9, 9)
        $g.DrawRectangle($tp, $cx + 2, $navY + 33, 9, 9)
    }

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($tab.Name, $fNav, $tb, $cx, $navY + 60, $sf)
}

# Subtle Home Indicator Bar (centered rounded pill)
$homeBarPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW/2 - 70, $screenH - 12, 140, 5)) 2.5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 15, 23, 42))), $homeBarPath)

$g.Dispose()

# Save rendered UI
$uiPath = Join-Path $PSScriptRoot "rendered_ui.png"
$uiBmp.Save($uiPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Rendered authentic UI generated at $uiPath"

# ==============================================================================
# 2. LOAD CLEAN BASE IMAGE AND COMPOSITE STRICTLY INSIDE SCREEN
# ==============================================================================
$cleanBasePath = "$PSScriptRoot\resilia_cellphone_clean_base.jpg"
if (-not (Test-Path $cleanBasePath)) {
    throw "Clean base image not found at $cleanBasePath"
}

# Always clone from the clean uncorrupted base image!
$photoBmp = [System.Drawing.Bitmap]::FromFile($cleanBasePath)

# Exact display screen bounds on the clean base phone:
# Left: 804, Right: 1070, Top: 86, Bottom: 665
# Corner radius: 24
$dispX = 804
$dispY = 86
$dispW = 266
$dispH = 579
$cornerRad = 24

$compG = [System.Drawing.Graphics]::FromImage($photoBmp)
$compG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$compG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$compG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$screenClipPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($dispX, $dispY, $dispW, $dispH)) $cornerRad
$compG.SetClip($screenClipPath)

# Draw transformed UI strictly inside display clip
$compG.DrawImage($uiBmp, [System.Drawing.RectangleF]::new($dispX, $dispY, $dispW, $dispH))

$compG.ResetClip()
$compG.Dispose()
$uiBmp.Dispose()

# ==============================================================================
# 3. SAVE FINAL COMPOSITED JPEG AT FULL QUALITY
# ==============================================================================
$outputPath = "$PSScriptRoot\..\public\images\resilia_app_cellphone.jpg"
$tempOut = "$PSScriptRoot\..\public\images\resilia_app_cellphone_new.jpg"

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$photoBmp.Save($tempOut, $codec, $encoderParams)
$photoBmp.Dispose()

Move-Item -Path $tempOut -Destination $outputPath -Force
Write-Host "Composited image successfully written to $outputPath"

# Synchronize to dist/images if directory exists
$distPath = "$PSScriptRoot\..\dist\images\resilia_app_cellphone.jpg"
if (Test-Path "$PSScriptRoot\..\dist\images") {
    Copy-Item -Path $outputPath -Destination $distPath -Force
    Write-Host "Synchronized to $distPath"
}
