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

$screenW = 798
$screenH = 1737
$cleanBasePath = "$PSScriptRoot\resilia_cellphone_clean_base.jpg"
if (-not (Test-Path $cleanBasePath)) {
    throw "Clean base image not found at $cleanBasePath"
}

# Display coordinates inside phone screen on 1376x768 base
$dispX = 804
$dispY = 86
$dispW = 266
$dispH = 579
$cornerRad = 24

# Common fonts
$fontName = 'Segoe UI'
$fTime = New-Object System.Drawing.Font($fontName, 19, [System.Drawing.FontStyle]::Bold)
$fBrand = New-Object System.Drawing.Font($fontName, 22, [System.Drawing.FontStyle]::Bold)
$fPill = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)
$fGreeting = New-Object System.Drawing.Font($fontName, 24, [System.Drawing.FontStyle]::Bold)
$fGreetSub = New-Object System.Drawing.Font($fontName, 14, [System.Drawing.FontStyle]::Regular)
$fAlertTag = New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)
$fAlertTitle = New-Object System.Drawing.Font($fontName, 19, [System.Drawing.FontStyle]::Bold)
$fAlertSub = New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Regular)
$fCardTitle = New-Object System.Drawing.Font($fontName, 16.5, [System.Drawing.FontStyle]::Bold)
$fCardSub = New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)
$fSectionHeader = New-Object System.Drawing.Font($fontName, 13.5, [System.Drawing.FontStyle]::Bold)
$fToolTitle = New-Object System.Drawing.Font($fontName, 14.5, [System.Drawing.FontStyle]::Bold)
$fToolSub = New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)
$fShelterTitle = New-Object System.Drawing.Font($fontName, 16, [System.Drawing.FontStyle]::Bold)
$fShelterSub = New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)
$fBadge = New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Bold)
$fNav = New-Object System.Drawing.Font($fontName, 13.5, [System.Drawing.FontStyle]::Bold)

# Common brushes & pens
$bDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$bMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$bWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$bForest = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 95, 70))
$bEmerald = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5, 150, 105))
$bEmeraldDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(4, 120, 87))
$bRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 29, 72))
$bRedDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(159, 18, 57))
$bBlue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))
$bAmber = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6))
$pBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 2)
$pAlert = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(253, 164, 175), 2.2)

function Draw-StatusBar($g) {
    $g.DrawString('9:41', $fTime, $bDark, 44, 14)
    $g.FillRectangle($bDark, 680, 26, 4, 12)
    $g.FillRectangle($bDark, 688, 22, 4, 16)
    $g.FillRectangle($bDark, 696, 18, 4, 20)
    $g.FillRectangle($bDark, 704, 14, 4, 24)
    $pWifi = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(15, 23, 42), 2.8)
    $g.DrawArc($pWifi, 718, 16, 22, 18, 200, 140)
    $g.DrawArc($pWifi, 722, 21, 14, 14, 200, 140)
    $g.FillEllipse($bDark, 727, 31, 4, 4)
    $g.DrawRectangle($pWifi, 748, 18, 30, 17)
    $g.FillRectangle($bDark, 751, 21, 20, 11)
    $g.FillRectangle($bDark, 779, 23, 3, 7)
}

function Draw-BottomNav($g, $tabs, $activeTabName) {
    $navY = $screenH - 130
    $navH = 130
    $g.FillRectangle($bWhite, 0, $navY, $screenW, $navH)
    $g.DrawLine($pBorder, 0, $navY, $screenW, $navY)

    $tabCount = $tabs.Count
    $tabW = $screenW / $tabCount

    for ($i = 0; $i -lt $tabCount; $i++) {
        $tab = $tabs[$i]
        $isActive = ($tab.Name -eq $activeTabName)
        $cx = $i * $tabW + ($tabW / 2)

        $tc = if ($isActive) { [System.Drawing.Color]::FromArgb(5, 150, 105) } else { [System.Drawing.Color]::FromArgb(148, 163, 184) }
        $tb = New-Object System.Drawing.SolidBrush($tc)
        $tp = New-Object System.Drawing.Pen($tc, 2.6)

        if ($tab.Icon -eq 'home') {
            $g.DrawLines($tp, @(
                [System.Drawing.PointF]::new($cx - 12, $navY + 36),
                [System.Drawing.PointF]::new($cx, $navY + 22),
                [System.Drawing.PointF]::new($cx + 12, $navY + 36)
            ))
            $g.DrawRectangle($tp, $cx - 9, $navY + 34, 18, 14)
        } elseif ($tab.Icon -eq 'map') {
            $g.DrawEllipse($tp, $cx - 10, $navY + 22, 20, 20)
            $g.DrawLines($tp, @(
                [System.Drawing.PointF]::new($cx - 6, $navY + 32),
                [System.Drawing.PointF]::new($cx, $navY + 25),
                [System.Drawing.PointF]::new($cx + 6, $navY + 32)
            ))
        } elseif ($tab.Icon -eq 'truck') {
            $g.DrawRectangle($tp, $cx - 12, $navY + 24, 16, 14)
            $g.DrawLine($tp, $cx + 4, $navY + 30, $cx + 11, $navY + 30)
            $g.DrawLine($tp, $cx + 11, $navY + 30, $cx + 11, $navY + 38)
            $g.DrawEllipse($tp, $cx - 9, $navY + 37, 6, 6)
            $g.DrawEllipse($tp, $cx + 5, $navY + 37, 6, 6)
        } elseif ($tab.Icon -eq 'help') {
            $g.DrawEllipse($tp, $cx - 11, $navY + 22, 22, 22)
            $g.DrawEllipse($tp, $cx - 5, $navY + 28, 10, 10)
        } elseif ($tab.Icon -eq 'reports' -or $tab.Icon -eq 'send') {
            $sendPts = @(
                [System.Drawing.PointF]::new($cx - 10, $navY + 38),
                [System.Drawing.PointF]::new($cx + 11, $navY + 24),
                [System.Drawing.PointF]::new($cx - 2, $navY + 44)
            )
            $g.DrawPolygon($tp, $sendPts)
        } elseif ($tab.Icon -eq 'ledger' -or $tab.Icon -eq 'clipboard') {
            $g.DrawRectangle($tp, $cx - 9, $navY + 22, 18, 22)
            $g.DrawLine($tp, $cx - 5, $navY + 29, $cx + 5, $navY + 29)
            $g.DrawLine($tp, $cx - 5, $navY + 34, $cx + 5, $navY + 34)
        } elseif ($tab.Icon -eq 'updates') {
            $g.DrawArc($tp, $cx - 11, $navY + 20, 22, 18, 180, 180)
            $g.DrawLine($tp, $cx - 12, $navY + 38, $cx + 12, $navY + 38)
        } else {
            $g.DrawRectangle($tp, $cx - 10, $navY + 22, 8, 8)
            $g.DrawRectangle($tp, $cx + 2, $navY + 22, 8, 8)
            $g.DrawRectangle($tp, $cx - 10, $navY + 34, 8, 8)
            $g.DrawRectangle($tp, $cx + 2, $navY + 34, 8, 8)
        }

        if ($tab.Badge) {
            $g.FillEllipse($bRed, $cx + 10, $navY + 16, 20, 20)
            $fBadgeTiny = New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)
            $g.DrawString($tab.Badge, $fBadgeTiny, $bWhite, $cx + 15, $navY + 18)
        }

        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $g.DrawString($tab.Name, $fNav, $tb, $cx, $navY + 58, $sf)
    }

    $homeBarPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW/2 - 70, $screenH - 12, 140, 5)) 2.5
    $g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 15, 23, 42))), $homeBarPath)
}

function Save-CompositedPhone($uiBmp, $destFile, [switch]$CropPhoneOnly) {
    $photoBmp = [System.Drawing.Bitmap]::FromFile($cleanBasePath)
    $scale = 2
    $bigW = $photoBmp.Width * $scale
    $bigH = $photoBmp.Height * $scale
    $bigBmp = New-Object System.Drawing.Bitmap($bigW, $bigH)
    $compG = [System.Drawing.Graphics]::FromImage($bigBmp)
    $compG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $compG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $compG.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $compG.DrawImage($photoBmp, 0, 0, $bigW, $bigH)
    $photoBmp.Dispose()

    $sDispX = $dispX * $scale
    $sDispY = $dispY * $scale
    $sDispW = $dispW * $scale
    $sDispH = $dispH * $scale
    $sCornerRad = $cornerRad * $scale

    $screenClipPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($sDispX, $sDispY, $sDispW, $sDispH)) $sCornerRad
    $compG.SetClip($screenClipPath)
    $compG.DrawImage($uiBmp, [System.Drawing.RectangleF]::new($sDispX, $sDispY, $sDispW, $sDispH))
    $compG.ResetClip()
    $compG.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

    if ($CropPhoneOnly) {
        $cropX = 1480
        $cropY = 60
        $cropW = 788
        $cropH = 1380

        $croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH)
        $cg = [System.Drawing.Graphics]::FromImage($croppedBmp)
        $cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $cg.DrawImage($bigBmp, [System.Drawing.Rectangle]::new(0, 0, $cropW, $cropH), [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
        $cg.Dispose()

        $tempOut = "$destFile.tmp.jpg"
        $croppedBmp.Save($tempOut, $codec, $encoderParams)
        $croppedBmp.Dispose()
        $bigBmp.Dispose()
        Move-Item -Path $tempOut -Destination $destFile -Force
        Write-Host "Generated cropped phone mockup: $destFile ($cropW x $cropH)"
    } else {
        $landscapeBmp = New-Object System.Drawing.Bitmap(1376, 768)
        $lg = [System.Drawing.Graphics]::FromImage($landscapeBmp)
        $lg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $lg.DrawImage($bigBmp, 0, 0, 1376, 768)
        $lg.Dispose()
        $bigBmp.Dispose()

        $tempOut = "$destFile.tmp.jpg"
        $landscapeBmp.Save($tempOut, $codec, $encoderParams)
        $landscapeBmp.Dispose()
        Move-Item -Path $tempOut -Destination $destFile -Force
        Write-Host "Generated full scene photo: $destFile (1376 x 768)"
    }
}

# Shield icon points helper
$shieldPts = @(
    [System.Drawing.PointF]::new(60, 68),
    [System.Drawing.PointF]::new(72, 73),
    [System.Drawing.PointF]::new(72, 86),
    [System.Drawing.PointF]::new(60, 98),
    [System.Drawing.PointF]::new(48, 86),
    [System.Drawing.PointF]::new(48, 73)
)
$pEmeraldCheck = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.6)

# ==============================================================================
# 1. RENDER RESIDENT UI (ResidentHome.tsx & ResidentApp.tsx)
# ==============================================================================
Write-Host "Rendering Resident Account UI..."
$resBmp = New-Object System.Drawing.Bitmap($screenW, $screenH)
$g = [System.Drawing.Graphics]::FromImage($resBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
$g.FillRectangle($bgBrush, 0, 0, $screenW, $screenH)
Draw-StatusBar $g

# Header
$headerY = 50; $headerH = 88
$g.FillRectangle($bWhite, 0, $headerY, $screenW, $headerH)
$g.DrawLine($pBorder, 0, $headerY + $headerH, $screenW, $headerY + $headerH)

$g.FillEllipse($bForest, 36, 68, 48, 48)
$g.FillPolygon($bWhite, $shieldPts)
$g.DrawLines($pEmeraldCheck, @([System.Drawing.PointF]::new(53, 83), [System.Drawing.PointF]::new(58, 88), [System.Drawing.PointF]::new(67, 78)))
$g.DrawString('Resilia', $fBrand, $bForest, 96, 74)

$resTag = Create-RoundedPath ([System.Drawing.RectangleF]::new(190, 78, 85, 26)) 6
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $resTag)
$g.DrawString('RESIDENT', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bEmerald, 198, 83)

$pillPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(480, 72, 135, 38)) 19
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $pillPath)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(167, 243, 208), 1.8)), $pillPath)
$g.FillEllipse($bEmerald, 494, 85, 11, 11)
$g.DrawString('Connected', $fPill, $bForest, 512, 82)

$sparkX = 636; $sparkY = 68
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $sparkX, $sparkY, 44, 44)
$sparkPts = @(
    [System.Drawing.PointF]::new($sparkX + 22, $sparkY + 10),
    [System.Drawing.PointF]::new($sparkX + 25, $sparkY + 19),
    [System.Drawing.PointF]::new($sparkX + 34, $sparkY + 22),
    [System.Drawing.PointF]::new($sparkX + 25, $sparkY + 25),
    [System.Drawing.PointF]::new($sparkX + 22, $sparkY + 34),
    [System.Drawing.PointF]::new($sparkX + 19, $sparkY + 25),
    [System.Drawing.PointF]::new($sparkX + 10, $sparkY + 22),
    [System.Drawing.PointF]::new($sparkX + 19, $sparkY + 19)
)
$g.FillPolygon($bEmerald, $sparkPts)

$bellX = 698; $bellY = 68
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $bellX, $bellY, 44, 44)
$pBell = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 2.2)
$g.DrawArc($pBell, $bellX + 13, $bellY + 11, 18, 16, 180, 180)
$g.DrawLine($pBell, $bellX + 11, $bellY + 27, $bellX + 33, $bellY + 27)
$g.FillEllipse($bRed, $bellX + 26, $bellY, 18, 18)
$g.DrawString('1', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bWhite, $bellX + 31, $bellY + 2)

# Greeting
$contentY = 152
$g.DrawString('Hello, how can we help you?', $fGreeting, $bDark, 36, $contentY)
$g.DrawString('Resilia helps you stay safe, find nearby supplies, and ask for help.', $fGreetSub, $bMuted, 36, $contentY + 38)

# Alert
$alertY = $contentY + 74; $alertW = $screenW - 72; $alertH = 150
$alertPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $alertY, $alertW, $alertH)) 16
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 242))), $alertPath)
$g.DrawPath($pAlert, $alertPath)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 54, $alertY + 18, 44, 44)
$pWarn = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(225, 29, 72), 2.6)
$warnPts = @([System.Drawing.PointF]::new(76, $alertY + 26), [System.Drawing.PointF]::new(91, $alertY + 52), [System.Drawing.PointF]::new(61, $alertY + 52))
$g.DrawPolygon($pWarn, $warnPts)
$g.DrawLine($pWarn, 76, $alertY + 35, 76, $alertY + 44)
$g.FillEllipse($bRed, 74.5, $alertY + 47, 3, 3)

$tag1 = Create-RoundedPath ([System.Drawing.RectangleF]::new(115, $alertY + 18, 160, 24)) 5
$g.FillPath($bRed, $tag1)
$g.DrawString('EMERGENCY ALERT', $fAlertTag, $bWhite, 122, $alertY + 22)
$tag2 = Create-RoundedPath ([System.Drawing.RectangleF]::new(285, $alertY + 18, 85, 24)) 5
$g.FillPath($bDark, $tag2)
$g.DrawString('Signal #3', $fAlertTag, $bWhite, 293, $alertY + 22)
$g.DrawString('River 16.2m', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), $bRedDark, 380, $alertY + 23)
$g.DrawString('Alert Level 2: Alarm Warning', $fAlertTitle, $bRedDark, 115, $alertY + 48)
$g.DrawString('Marikina River 16.2m - Evacuate low-lying river areas immediately.', $fAlertSub, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 18, 60))), 115, $alertY + 80)

# Quick Actions (2x2 Grid)
$qaY = $alertY + $alertH + 16; $qaW = ($screenW - 72 - 16) / 2; $qaH = 145

function Draw-ActionCardLocal($x, $y, $w, $h, $title, $sub, $iconBg, $iconColor, $type) {
    $cardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 15
    $g.FillPath($bWhite, $cardPath)
    $g.DrawPath($pBorder, $cardPath)

    $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconBg)), $x + 16, $y + 14, 42, 42)
    $pI = New-Object System.Drawing.Pen($iconColor, 2.2)

    $cx = $x + 16 + 21
    $cy = $y + 14 + 21
    if ($type -eq "get_help") {
        # Lifebuoy ring with straps and center heart (ResidentIcons.tsx GetHelpIcon)
        $g.DrawEllipse($pI, $cx - 12, $cy - 12, 24, 24)
        $g.DrawEllipse($pI, $cx - 5, $cy - 5, 10, 10)
        $g.DrawLine($pI, $cx, $cy - 12, $cx, $cy - 5)
        $g.DrawLine($pI, $cx, $cy + 5, $cx, $cy + 12)
        $g.DrawLine($pI, $cx - 12, $cy, $cx - 5, $cy)
        $g.DrawLine($pI, $cx + 5, $cy, $cx + 12, $cy)
        $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconColor)), $cx - 2, $cy - 2, 4, 4)
    } elseif ($type -eq "find_place") {
        # Safe sanctuary haven house with open archway (ResidentIcons.tsx FindSafePlaceIcon)
        $g.DrawLines($pI, @(
            [System.Drawing.PointF]::new($cx - 13, $cy + 2),
            [System.Drawing.PointF]::new($cx, $cy - 11),
            [System.Drawing.PointF]::new($cx + 13, $cy + 2)
        ))
        $g.DrawRectangle($pI, $cx - 9, $cy + 2, 18, 10)
        $g.DrawArc($pI, $cx - 4, $cy + 3, 8, 9, 180, 180)
    } elseif ($type -eq "report") {
        # Street hazard warning cone with alert flare (ResidentIcons.tsx ReportProblemIcon)
        $conePts = @(
            [System.Drawing.PointF]::new($cx, $cy - 11),
            [System.Drawing.PointF]::new($cx + 11, $cy + 11),
            [System.Drawing.PointF]::new($cx - 11, $cy + 11)
        )
        $g.DrawPolygon($pI, $conePts)
        $g.DrawLine($pI, $cx - 5, $cy + 2, $cx + 5, $cy + 2)
        $g.DrawLine($pI, $cx - 8, $cy + 7, $cx + 8, $cy + 7)
    } elseif ($type -eq "mark_safe") {
        # Person with checkmark seal (ResidentIcons.tsx MarkSafeIcon)
        $g.DrawEllipse($pI, $cx - 7, $cy - 9, 9, 9)
        $g.DrawArc($pI, $cx - 13, $cy + 2, 13, 10, 180, 180)
        $g.DrawEllipse($pI, $cx + 1, $cy, 11, 11)
        $pCheck = New-Object System.Drawing.Pen($iconColor, 1.8)
        $g.DrawLines($pCheck, @(
            [System.Drawing.PointF]::new($cx + 3, $cy + 5),
            [System.Drawing.PointF]::new($cx + 6, $cy + 8),
            [System.Drawing.PointF]::new($cx + 10, $cy + 3)
        ))
    }

    $g.DrawString($title, $fCardTitle, $bDark, $x + 16, $y + 68)
    $g.DrawString($sub, $fCardSub, $bMuted, [System.Drawing.RectangleF]::new($x + 16, $y + 96, $w - 32, 42))
}

Draw-ActionCardLocal 36 $qaY $qaW $qaH 'GET HELP' 'Request rescue, food, clean water, or evacuation' ([System.Drawing.Color]::FromArgb(255, 241, 242)) ([System.Drawing.Color]::FromArgb(225, 29, 72)) "get_help"
Draw-ActionCardLocal (36 + $qaW + 16) $qaY $qaW $qaH 'FIND A SAFE PLACE' 'Find evacuation centers, water points, and resources' ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105)) "find_place"

$qaY2 = $qaY + $qaH + 12
Draw-ActionCardLocal 36 $qaY2 $qaW $qaH 'REPORT A PROBLEM' 'Street flooding, blocked roads, or infrastructure' ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(217, 119, 6)) "report"
Draw-ActionCardLocal (36 + $qaW + 16) $qaY2 $qaW $qaH 'MARK ME SAFE' 'Check in your family safety status with coordinators' ([System.Drawing.Color]::FromArgb(204, 251, 241)) ([System.Drawing.Color]::FromArgb(13, 148, 136)) "mark_safe"

# SOS Survival Beacon Banner
$beaconY = $qaY2 + $qaH + 16; $beaconW = $screenW - 72; $beaconH = 84
$beaconPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $beaconY, $beaconW, $beaconH)) 16
$bGradBeacon = New-Object System.Drawing.Drawing2D.LinearGradientBrush([System.Drawing.PointF]::new(36, $beaconY), [System.Drawing.PointF]::new(36 + $beaconW, $beaconY), [System.Drawing.Color]::FromArgb(136, 19, 55), [System.Drawing.Color]::FromArgb(153, 27, 27))
$g.FillPath($bGradBeacon, $beaconPath)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(244, 63, 94), 2)), $beaconPath)

# Pulsating radio beacon circular badge + icon
$beaconIconX = 52; $beaconIconY = $beaconY + 18
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 244, 63, 94))), $beaconIconX, $beaconIconY, 48, 48)
$pRadio = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.3)
$g.DrawArc($pRadio, $beaconIconX + 14, $beaconIconY + 13, 20, 20, 210, 120)
$g.DrawArc($pRadio, $beaconIconX + 19, $beaconIconY + 18, 10, 10, 210, 120)
$g.FillEllipse($bWhite, $beaconIconX + 22, $beaconIconY + 27, 4, 4)

$g.DrawString('SOS SURVIVAL BEACON', (New-Object System.Drawing.Font($fontName, 16.5, [System.Drawing.FontStyle]::Bold)), $bWhite, 115, $beaconY + 16)
$offBadgePath = Create-RoundedPath ([System.Drawing.RectangleF]::new(385, $beaconY + 16, 66, 22)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 244, 63, 94))), $offBadgePath)
$g.DrawString('OFFLINE', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 392, $beaconY + 19)
$g.DrawString('High-intensity screen strobe & acoustic SOS horn to signal rescue boats', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 115, $beaconY + 44)
$launchPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 155, $beaconY + 20, 100, 42)) 12
$g.FillPath($bWhite, $launchPath)
$g.DrawString('LAUNCH', (New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)), $bRedDark, $screenW - 139, $beaconY + 31)

# Go-Bag
$gobagY = $beaconY + $beaconH + 16; $gobagH = 100
$gobagPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $gobagY, $screenW - 72, $gobagH)) 16
$g.FillPath($bWhite, $gobagPath)
$g.DrawPath($pBorder, $gobagPath)

$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), 52, $gobagY + 16, 48, 48)
$pBag = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.3)
$g.DrawArc($pBag, 70, $gobagY + 23, 12, 10, 180, 180)
$g.DrawRectangle($pBag, 62, $gobagY + 29, 28, 24)
$g.DrawLine($pBag, 62, $gobagY + 36, 90, $gobagY + 36)
$g.DrawRectangle($pBag, 69, $gobagY + 40, 14, 10)
$pCross = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 1.8)
$g.DrawLine($pCross, 76, $gobagY + 42, 76, $gobagY + 48)
$g.DrawLine($pCross, 73, $gobagY + 45, 79, $gobagY + 45)

$g.DrawString('72-Hour Evacuation Go-Bag', (New-Object System.Drawing.Font($fontName, 16, [System.Drawing.FontStyle]::Bold)), $bDark, 115, $gobagY + 16)
$g.DrawString('3 of 12 critical items ready - Drinking water, non-perishables, flashlight', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), $bMuted, 115, $gobagY + 44)
$barBg = Create-RoundedPath ([System.Drawing.RectangleF]::new(115, $gobagY + 70, $screenW - 220, 10)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))), $barBg)
$barFg = Create-RoundedPath ([System.Drawing.RectangleF]::new(115, $gobagY + 70, ($screenW - 220) * 0.25, 10)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6))), $barFg)
$g.DrawString('25%', $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(217, 119, 6))), $screenW - 90, $gobagY + 66)

# Community Relief
$resilienceY = $gobagY + $gobagH + 16
$g.DrawString('COMMUNITY RELIEF & RESILIENCE', $fSectionHeader, $bMuted, 36, $resilienceY)
$toolY = $resilienceY + 24; $toolGap = 12; $toolW = ($screenW - 72 - $toolGap * 3) / 4; $toolH = 128

function Draw-ToolCardLocal($x, $y, $w, $h, $title, $sub, $iconBg, $iconColor, $type) {
    $cardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 14
    $g.FillPath($bWhite, $cardPath)
    $g.DrawPath($pBorder, $cardPath)

    $g.FillEllipse((New-Object System.Drawing.SolidBrush($iconBg)), $x + 14, $y + 12, 38, 38)
    $pI = New-Object System.Drawing.Pen($iconColor, 2.2)

    $cx = $x + 14 + 19
    $cy = $y + 12 + 19
    if ($type -eq "qr") {
        # QR Code glyph (Ayuda Pass)
        $g.DrawRectangle($pI, $cx - 9, $cy - 9, 18, 18)
        $bI = New-Object System.Drawing.SolidBrush($iconColor)
        $g.FillRectangle($bI, $cx - 6, $cy - 6, 4, 4)
        $g.FillRectangle($bI, $cx + 2, $cy - 6, 4, 4)
        $g.FillRectangle($bI, $cx - 6, $cy + 2, 4, 4)
    } elseif ($type -eq "users") {
        # People / family glyph (Missing Kin)
        $g.DrawEllipse($pI, $cx - 6, $cy - 8, 8, 8)
        $g.DrawArc($pI, $cx - 11, $cy + 2, 12, 9, 180, 180)
        $g.DrawEllipse($pI, $cx + 1, $cy - 6, 7, 7)
        $g.DrawArc($pI, $cx - 1, $cy + 4, 12, 7, 180, 180)
    } elseif ($type -eq "bayanihan") {
        # Heart mutual aid / hands (Bayanihan Aid)
        $g.DrawArc($pI, $cx - 9, $cy - 8, 9, 9, 140, 200)
        $g.DrawArc($pI, $cx, $cy - 8, 9, 9, 200, 200)
        $g.DrawLines($pI, @(
            [System.Drawing.PointF]::new($cx - 9, $cy - 1),
            [System.Drawing.PointF]::new($cx, $cy + 8),
            [System.Drawing.PointF]::new($cx + 9, $cy - 1)
        ))
    } elseif ($type -eq "outbreak") {
        # Biohazard / droplet (Outbreak Watch)
        $dropPts = @(
            [System.Drawing.PointF]::new($cx, $cy - 10),
            [System.Drawing.PointF]::new($cx + 7, $cy + 1),
            [System.Drawing.PointF]::new($cx + 4, $cy + 8),
            [System.Drawing.PointF]::new($cx - 4, $cy + 8),
            [System.Drawing.PointF]::new($cx - 7, $cy + 1)
        )
        $g.DrawPolygon($pI, $dropPts)
    }

    $g.DrawString($title, $fToolTitle, $bDark, $x + 12, $y + 62)
    $g.DrawString($sub, $fToolSub, $bMuted, $x + 12, $y + 90)
}
Draw-ToolCardLocal 36 $toolY $toolW $toolH 'Ayuda Pass' 'QR claim card' ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105)) 'qr'
Draw-ToolCardLocal (36 + $toolW + $toolGap) $toolY $toolW $toolH 'Missing Kin' 'Find relatives' ([System.Drawing.Color]::FromArgb(224, 231, 255)) ([System.Drawing.Color]::FromArgb(79, 70, 229)) 'users'
Draw-ToolCardLocal (36 + ($toolW + $toolGap)*2) $toolY $toolW $toolH 'Bayanihan Aid' 'Skills & tools' ([System.Drawing.Color]::FromArgb(243, 232, 255)) ([System.Drawing.Color]::FromArgb(147, 51, 234)) 'bayanihan'
Draw-ToolCardLocal (36 + ($toolW + $toolGap)*3) $toolY $toolW $toolH 'Outbreak Watch' 'Leptospirosis' ([System.Drawing.Color]::FromArgb(204, 251, 241)) ([System.Drawing.Color]::FromArgb(13, 148, 136)) 'outbreak'

# Nearby Evacuation Shelters (2 cards)
$shelterSecY = $toolY + $toolH + 16
$g.DrawString('NEARBY EVACUATION SHELTERS', $fSectionHeader, $bMuted, 36, $shelterSecY)
$g.DrawString('See all (6) >', (New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 130, $shelterSecY)

# Shelter 1
$shelterCardY = $shelterSecY + 24; $shelterCardH = 98
$shelterPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $shelterCardY, $screenW - 72, $shelterCardH)) 16
$g.FillPath($bWhite, $shelterPath)
$g.DrawPath($pBorder, $shelterPath)

# Circular badge & shelter icon
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), 52, $shelterCardY + 16, 48, 48)
$pShelter = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(5, 150, 105), 2.2)
$g.DrawLines($pShelter, @(
    [System.Drawing.PointF]::new(62, $shelterCardY + 40),
    [System.Drawing.PointF]::new(76, $shelterCardY + 26),
    [System.Drawing.PointF]::new(90, $shelterCardY + 40),
    [System.Drawing.PointF]::new(90, $shelterCardY + 52),
    [System.Drawing.PointF]::new(62, $shelterCardY + 52),
    [System.Drawing.PointF]::new(62, $shelterCardY + 40)
))
$g.DrawRectangle($pShelter, 72, $shelterCardY + 40, 8, 12)

$g.DrawString('Malanday Elementary School', $fShelterTitle, $bDark, 115, $shelterCardY + 14)
$g.DrawString('Evacuation Center - 450m away - 850 / 1,000 Capacity (85%)', $fShelterSub, $bMuted, 115, $shelterCardY + 42)
$g.DrawString('Food, clean water, medical aid, and charging station ready', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)), $bForest, 115, $shelterCardY + 66)
$openBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 105, $shelterCardY + 14, 52, 22)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $openBadge)
$g.DrawString('OPEN', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 96, $shelterCardY + 18)

# Shelter 2
$s2Y = $shelterCardY + $shelterCardH + 12; $s2H = 98
$s2Path = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $s2Y, $screenW - 72, $s2H)) 16
$g.FillPath($bWhite, $s2Path)
$g.DrawPath($pBorder, $s2Path)

# Circular badge & shelter icon
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), 52, $s2Y + 16, 48, 48)
$g.DrawLines($pShelter, @(
    [System.Drawing.PointF]::new(62, $s2Y + 40),
    [System.Drawing.PointF]::new(76, $s2Y + 26),
    [System.Drawing.PointF]::new(90, $s2Y + 40),
    [System.Drawing.PointF]::new(90, $s2Y + 52),
    [System.Drawing.PointF]::new(62, $s2Y + 52),
    [System.Drawing.PointF]::new(62, $s2Y + 40)
))
$g.DrawRectangle($pShelter, 72, $s2Y + 40, 8, 12)

$g.DrawString('Sto. Nino Parish Community Gym', $fShelterTitle, $bDark, 115, $s2Y + 14)
$g.DrawString('Secondary Shelter - 750m away - 320 / 500 Capacity (64%)', $fShelterSub, $bMuted, 115, $s2Y + 42)
$g.DrawString('Designated PWD ramp access, infant care zone & solar power', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)), $bForest, 115, $s2Y + 66)
$openBadge2 = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 105, $s2Y + 14, 52, 22)) 5
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $openBadge2)
$g.DrawString('OPEN', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 96, $s2Y + 18)

# Health Prophylaxis Advisory
$hAdvY = $s2Y + $s2H + 12; $hAdvH = 82
$hAdvPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $hAdvY, $screenW - 72, $hAdvH)) 14
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 253, 250))), $hAdvPath)
$g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(153, 246, 228), 1.8)), $hAdvPath)
$g.DrawString('DOH ADVISORY: 72H LEPTOSPIROSIS WINDOW', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 148, 136))), 55, $hAdvY + 14)
$g.DrawString('Waded in floodwaters? Free Doxycycline prophylaxis available at Malanday Health Center within 72h.', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)), $bDark, 55, $hAdvY + 38)

# Offline Mesh Status Bar
$mStatY = $hAdvY + $hAdvH + 12; $mStatH = 72
$mStatPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $mStatY, $screenW - 72, $mStatH)) 14
$g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $mStatPath)
$g.DrawPath($pBorder, $mStatPath)
$g.DrawString('BARANGAY RESILIENCE MESH: LOCAL PEERS CONNECTED', (New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))), 55, $mStatY + 14)
$g.DrawString('Local node: Malanday Elem. School Pi-4 - 14 neighborhood peers in range - Local neighborhood cache', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bMuted, 55, $mStatY + 36)

# Resident Bottom Navigation
$resTabs = @(
    @{ Name = 'Home'; Icon = 'home' },
    @{ Name = 'Map'; Icon = 'map' },
    @{ Name = 'Get Help'; Icon = 'help' },
    @{ Name = 'Updates'; Icon = 'updates' },
    @{ Name = 'More'; Icon = 'more' }
)
Draw-BottomNav $g $resTabs 'Home'

$g.Dispose()

# Save Resident as centered phone mockup AND wide landscape hero image
Save-CompositedPhone $resBmp "$PSScriptRoot\..\public\images\resilia_phone_resident.jpg" -CropPhoneOnly
Save-CompositedPhone $resBmp "$PSScriptRoot\..\public\images\resilia_app_cellphone.jpg"

# ==============================================================================
# 2. RENDER RESPONDER UI (ResponderHome.tsx & ResponderApp.tsx)
# ==============================================================================
Write-Host "Rendering Responder Account UI..."
$respBmp = New-Object System.Drawing.Bitmap($screenW, $screenH)
$g2 = [System.Drawing.Graphics]::FromImage($respBmp)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Responder Light slate background (#F5F7F6)
$g2.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 247, 246))), 0, 0, $screenW, $screenH)
Draw-StatusBar $g2

# Responder Top Header
$g2.FillRectangle($bWhite, 0, $headerY, $screenW, $headerH)
$g2.DrawLine($pBorder, 0, $headerY + $headerH, $screenW, $headerY + $headerH)

$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 36, 68, 48, 48)
$g2.FillPolygon($bWhite, $shieldPts)
$g2.DrawLines($pEmeraldCheck, @([System.Drawing.PointF]::new(53, 83), [System.Drawing.PointF]::new(58, 88), [System.Drawing.PointF]::new(67, 78)))

$g2.DrawString('RESILIA', (New-Object System.Drawing.Font($fontName, 20, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 96, 68)
$respTag = Create-RoundedPath ([System.Drawing.RectangleF]::new(186, 70, 58, 22)) 5
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(219, 234, 254))), $respTag)
$g2.DrawString('FIELD', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 58, 138))), 196, 74)
$g2.DrawString('Officer Mark Santos - Sector 2', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), $bMuted, 96, 96)

$pillRespPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(485, 72, 135, 38)) 19
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $pillRespPath)
$g2.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(252, 211, 77), 1.8)), $pillRespPath)
$g2.FillEllipse($bAmber, 498, 85, 11, 11)
$g2.DrawString('Local Storage', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(146, 64, 14))), 516, 83)

$radioX = 640; $radioY = 68
$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $radioX, $radioY, 44, 44)
$pRadio2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(21, 59, 50), 2.2)
$g2.DrawRectangle($pRadio2, $radioX + 15, $radioY + 16, 14, 18)
$g2.DrawLine($pRadio2, $radioX + 22, $radioY + 9, $radioX + 22, $radioY + 16)

$syncX = 704; $syncY = 68
$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $syncX, $syncY, 44, 44)
$pSync = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(217, 119, 6), 2.2)
$g2.DrawArc($pSync, $syncX + 12, $syncY + 12, 18, 18, 45, 270)
$g2.FillEllipse($bAmber, $syncX + 26, $syncY, 18, 18)
$g2.DrawString('3', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bWhite, $syncX + 31, $syncY + 2)

# Incident Alert Banner
$rAlertY = $contentY; $rAlertW = $screenW - 72; $rAlertH = 135
$rAlertPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $rAlertY, $rAlertW, $rAlertH)) 16
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 242))), $rAlertPath)
$g2.DrawPath($pAlert, $rAlertPath)

$g2.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 54, $rAlertY + 16, 44, 44)
$g2.DrawPolygon($pWarn, @([System.Drawing.PointF]::new(76, $rAlertY + 24), [System.Drawing.PointF]::new(91, $rAlertY + 48), [System.Drawing.PointF]::new(61, $rAlertY + 48)))

$rTag1 = Create-RoundedPath ([System.Drawing.RectangleF]::new(115, $rAlertY + 16, 138, 24)) 5
$g2.FillPath($bRed, $rTag1)
$g2.DrawString('TCWS SIGNAL #3', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), $bWhite, 122, $rAlertY + 21)

$rTag2 = Create-RoundedPath ([System.Drawing.RectangleF]::new(260, $rAlertY + 16, 185, 24)) 5
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))), $rTag2)
$g2.DrawString('LANDFALL IMMINENT', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), $bWhite, 268, $rAlertY + 21)

$g2.DrawString('Typhoon Enteng - River Level 2 (16.2m)', $fAlertTitle, $bRedDark, 115, $rAlertY + 48)
$g2.DrawString('All Sector 2 water rescue teams on immediate standby. Low-lying areas submerged.', $fAlertSub, $bDark, 115, $rAlertY + 80)

# MY ACTIVE MISSION
$missionY = $rAlertY + $rAlertH + 16
$g2.DrawString('MY ACTIVE MISSION', $fSectionHeader, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 36, $missionY)

$mCardY = $missionY + 24; $mCardW = $screenW - 72; $mCardH = 250
$mCardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $mCardY, $mCardW, $mCardH)) 18
$g2.FillPath($bWhite, $mCardPath)
$g2.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), 2.2)), $mCardPath)

$accentStrip = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $mCardY, 12, $mCardH)) 6
$g2.FillPath($bEmerald, $accentStrip)

$enRouteBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(65, $mCardY + 18, 155, 26)) 6
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(209, 250, 229))), $enRouteBadge)
$g2.DrawString('EN ROUTE (6 MIN ETA)', (New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Bold)), $bEmeraldDark, 73, $mCardY + 23)

$prioBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(230, $mCardY + 18, 145, 26)) 6
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 226, 226))), $prioBadge)
$g2.DrawString('PRIORITY 94/100', (New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Bold)), $bRedDark, 239, $mCardY + 23)

$g2.DrawString('Evacuate Bedridden Senior & Infant', (New-Object System.Drawing.Font($fontName, 18, [System.Drawing.FontStyle]::Bold)), $bDark, 65, $mCardY + 54)
$g2.DrawString('Sector 2: 142 J.P. Rizal St., Brgy. Malanday', (New-Object System.Drawing.Font($fontName, 13, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))), 65, $mCardY + 84)
$g2.DrawString('Household: Maria Santos (78, Bedridden) & Baby Lucas (4 mos). Flood depth 1.8m.', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), $bMuted, 65, $mCardY + 112)
$g2.DrawString('Assigned: Rubber Boat Alpha-2 - Crew: 3 responders - Life vests equipped', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Bold)), $bEmeraldDark, 65, $mCardY + 140)

# Action Buttons
$btnArrival = Create-RoundedPath ([System.Drawing.RectangleF]::new(65, $mCardY + 178, 305, 48)) 12
$g2.FillPath($bEmerald, $btnArrival)
$g2.DrawString('ARRIVED AT SCENE', (New-Object System.Drawing.Font($fontName, 12.5, [System.Drawing.FontStyle]::Bold)), $bWhite, 120, $mCardY + 192)

$btnBackup = Create-RoundedPath ([System.Drawing.RectangleF]::new(385, $mCardY + 178, 240, 48)) 12
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 242, 242))), $btnBackup)
$g2.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(252, 165, 165), 1.8)), $btnBackup)
$g2.DrawString('REQUEST BACKUP', (New-Object System.Drawing.Font($fontName, 12.5, [System.Drawing.FontStyle]::Bold)), $bRedDark, 425, $mCardY + 192)

# QUICK FIELD ACTIONS
$cockpitY = $mCardY + $mCardH + 16
$g2.DrawString('QUICK FIELD ACTIONS', $fSectionHeader, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 36, $cockpitY)

$rToolY = $cockpitY + 24
$rToolW = ($screenW - 72 - $toolGap * 3) / 4
$rToolH = 132

function Draw-RespCockpitCardLocal($x, $y, $w, $h, $title, $sub, $badge, $iconBg, $iconColor, $type) {
    $cardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 14
    $g2.FillPath($bWhite, $cardPath)
    $g2.DrawPath($pBorder, $cardPath)

    $g2.FillEllipse((New-Object System.Drawing.SolidBrush($iconBg)), $x + 14, $y + 12, 38, 38)
    $pI = New-Object System.Drawing.Pen($iconColor, 2.2)

    $cx = $x + 14 + 19
    $cy = $y + 12 + 19
    if ($type -eq "triage") {
        # Medical cross inside START Triage
        $pCross = New-Object System.Drawing.Pen($iconColor, 2.8)
        $g2.DrawLine($pCross, $cx, $cy - 8, $cx, $cy + 8)
        $g2.DrawLine($pCross, $cx - 8, $cy, $cx + 8, $cy)
    } elseif ($type -eq "gobag") {
        # Responder gear pack with check
        $g2.DrawArc($pI, $cx - 5, $cy - 9, 10, 7, 180, 180)
        $g2.DrawRectangle($pI, $cx - 9, $cy - 4, 18, 14)
        $g2.DrawLine($pI, $cx - 9, $cy + 1, $cx + 9, $cy + 1)
        $pCheck = New-Object System.Drawing.Pen($iconColor, 1.8)
        $g2.DrawLines($pCheck, @(
            [System.Drawing.PointF]::new($cx - 4, $cy + 6),
            [System.Drawing.PointF]::new($cx - 1, $cy + 9),
            [System.Drawing.PointF]::new($cx + 4, $cy + 4)
        ))
    } elseif ($type -eq "report") {
        # Clipboard / Field report document
        $g2.DrawRectangle($pI, $cx - 8, $cy - 9, 16, 18)
        $g2.DrawLine($pI, $cx - 4, $cy - 4, $cx + 4, $cy - 4)
        $g2.DrawLine($pI, $cx - 4, $cy, $cx + 4, $cy)
        $g2.DrawLine($pI, $cx - 4, $cy + 4, $cx + 1, $cy + 4)
    } elseif ($type -eq "radio") {
        # VHF Handheld Radio Walkie-talkie
        $g2.DrawRectangle($pI, $cx - 7, $cy - 4, 14, 15)
        $g2.DrawLine($pI, $cx - 3, $cy - 11, $cx - 3, $cy - 4)
        $g2.DrawEllipse($pI, $cx - 4, $cy, 8, 8)
        $g2.FillEllipse((New-Object System.Drawing.SolidBrush($iconColor)), $cx - 1.5, $cy + 2.5, 3, 3)
    }

    $g2.DrawString($title, $fToolTitle, $bDark, $x + 12, $y + 58)
    $g2.DrawString($sub, $fToolSub, $bMuted, $x + 12, $y + 84)
    if ($badge) {
        $bPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x + 10, $y + 104, $w - 20, 18)) 4
        $g2.FillPath((New-Object System.Drawing.SolidBrush($iconBg)), $bPath)
        $g2.DrawString($badge, (New-Object System.Drawing.Font($fontName, 8.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($iconColor)), $x + 14, $y + 107)
    }
}

Draw-RespCockpitCardLocal 36 $rToolY $rToolW $rToolH 'START Triage' 'Casualty tags' 'QR BANDS' ([System.Drawing.Color]::FromArgb(254, 226, 226)) ([System.Drawing.Color]::FromArgb(220, 38, 38)) 'triage'
Draw-RespCockpitCardLocal (36 + $rToolW + $toolGap) $rToolY $rToolW $rToolH 'Go-Bag Check' 'Gear readiness' '12/12 READY' ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(217, 119, 6)) 'gobag'
Draw-RespCockpitCardLocal (36 + ($rToolW + $toolGap)*2) $rToolY $rToolW $rToolH 'Field Report' 'Depth & roads' 'OFFLINE QUEUE' ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105)) 'report'
Draw-RespCockpitCardLocal (36 + ($rToolW + $toolGap)*3) $rToolY $rToolW $rToolH 'Radio Net' 'VHF Channel 3' 'BDRRMC NET' ([System.Drawing.Color]::FromArgb(219, 234, 254)) ([System.Drawing.Color]::FromArgb(37, 99, 235)) 'radio'

# PENDING DISPATCH QUEUE (2 items)
$qSecY = $rToolY + $rToolH + 16
$g2.DrawString('PENDING DISPATCH QUEUE - 2 Nearby', $fSectionHeader, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 36, $qSecY)

# Queue 1
$qCardY = $qSecY + 24; $qCardH = 92
$qCardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $qCardY, $screenW - 72, $qCardH)) 16
$g2.FillPath($bWhite, $qCardPath)
$g2.DrawPath($pBorder, $qCardPath)
$g2.DrawString('Stranded Family on Roof (4 pax)', (New-Object System.Drawing.Font($fontName, 15.5, [System.Drawing.FontStyle]::Bold)), $bDark, 55, $qCardY + 14)
$g2.DrawString('88 E. Santos St., Tumana - Priority 88/100 - Awaiting secondary boat', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), $bMuted, 55, $qCardY + 42)
$p2Badge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 145, $qCardY + 14, 85, 24)) 5
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $p2Badge)
$g2.DrawString('PRIORITY 2', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), $screenW - 138, $qCardY + 18)

# Queue 2
$q2Y = $qCardY + $qCardH + 10; $q2H = 92
$q2Path = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $q2Y, $screenW - 72, $q2H)) 16
$g2.FillPath($bWhite, $q2Path)
$g2.DrawPath($pBorder, $q2Path)
$g2.DrawString('Oxygen Concentrator Power Depleted', (New-Object System.Drawing.Font($fontName, 15.5, [System.Drawing.FontStyle]::Bold)), $bDark, 55, $q2Y + 14)
$g2.DrawString('12 Riverside Dr., Malanday - Priority 85/100 - Generator team notified', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), $bMuted, 55, $q2Y + 42)
$p3Badge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 145, $q2Y + 14, 85, 24)) 5
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 226, 226))), $p3Badge)
$g2.DrawString('PRIORITY 3', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), $bRedDark, $screenW - 138, $q2Y + 18)

# START Field Triage 4-Color Summary
$trSecY = $q2Y + $q2H + 16
$g2.DrawString('S.T.A.R.T. FIELD CASUALTY TRIAGE ROSTER', $fSectionHeader, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 36, $trSecY)

$trY = $trSecY + 24; $trW = ($screenW - 72 - 24) / 4; $trH = 88

function Draw-TriageCountBox($x, $y, $w, $h, $num, $lbl, $bgCol, $numCol) {
    $tBox = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 14
    $g2.FillPath((New-Object System.Drawing.SolidBrush($bgCol)), $tBox)
    $g2.DrawPath((New-Object System.Drawing.Pen($numCol, 1.8)), $tBox)
    $g2.DrawString($num, (New-Object System.Drawing.Font($fontName, 22, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($numCol)), $x + 14, $y + 12)
    $g2.DrawString($lbl, (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bDark, $x + 12, $y + 50)
}
Draw-TriageCountBox 36 $trY $trW $trH '4' 'RED (Immediate)' ([System.Drawing.Color]::FromArgb(254, 226, 226)) ([System.Drawing.Color]::FromArgb(220, 38, 38))
Draw-TriageCountBox (36 + $trW + 8) $trY $trW $trH '12' 'YELLOW (Delayed)' ([System.Drawing.Color]::FromArgb(254, 243, 199)) ([System.Drawing.Color]::FromArgb(217, 119, 6))
Draw-TriageCountBox (36 + ($trW + 8)*2) $trY $trW $trH '26' 'GREEN (Minor)' ([System.Drawing.Color]::FromArgb(236, 253, 245)) ([System.Drawing.Color]::FromArgb(5, 150, 105))
Draw-TriageCountBox (36 + ($trW + 8)*3) $trY $trW $trH '0' 'BLACK (Morgue)' ([System.Drawing.Color]::FromArgb(241, 245, 249)) ([System.Drawing.Color]::FromArgb(15, 23, 42))

# Rescue Flotilla Status
$flotY = $trY + $trH + 14; $flotH = 80
$flotPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $flotY, $screenW - 72, $flotH)) 14
$g2.FillPath($bWhite, $flotPath)
$g2.DrawPath($pBorder, $flotPath)
$g2.DrawString('SECTOR 2 RESCUE FLOTILLA (8 RUBBER BOATS ACTIVE)', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 59, 50))), 55, $flotY + 14)
$g2.DrawString('Alpha-1: On scene (Tumana) - Alpha-2: En route (Malanday) - Alpha-3: Returning with 6 evacuees', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)), $bMuted, 55, $flotY + 38)

# Radio Net Banner
$bCommsY = $flotY + $flotH + 10; $bCommsH = 75
$bCommsPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $bCommsY, $screenW - 72, $bCommsH)) 14
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 249, 255))), $bCommsPath)
$g2.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(186, 230, 253), 1.8)), $bCommsPath)
$g2.DrawString('BDRRMC VHF RADIO NET | CHANNEL 3 ACTIVE', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), $bBlue, 55, $bCommsY + 12)
$g2.DrawString('8 Rubber Boats logged in Sector 2 mesh - Standby for water depth markers at Malanday Bridge.', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Regular)), $bDark, 55, $bCommsY + 34)

# QR Intake Scanner Card
$scY = $bCommsY + $bCommsH + 10; $scH = 82
$scPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $scY, $screenW - 72, $scH)) 14
$g2.FillPath($bWhite, $scPath)
$g2.DrawPath($pBorder, $scPath)
$g2.DrawString('S.T.A.R.T. QR WRISTBAND SCANNER', (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Bold)), $bDark, 55, $scY + 12)
$scBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 165, $scY + 10, 105, 22)) 5
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $scBadge)
$g2.DrawString('SCANNER ACTIVE', (New-Object System.Drawing.Font($fontName, 9, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 156, $scY + 14)
$g2.DrawString('Attach colored triage QR wristbands - Instant victim intake logged to offline IndexedDB store.', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bMuted, 55, $scY + 38)

# Offline Sync Queue Telemetry
$sqY = $scY + $scH + 10; $sqH = 75
$sqPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $sqY, $screenW - 72, $sqH)) 14
$g2.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $sqPath)
$g2.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(252, 211, 77), 1.8)), $sqPath)
$g2.DrawString('DURABLE OFFLINE SYNC QUEUE: 3 TRANSACTIONS BUFFERED', (New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), 55, $sqY + 12)
$g2.DrawString('Auto-replicates victim triage tags and incident notes to EOC server once mesh link handshakes.', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bDark, 55, $sqY + 34)

# Responder Bottom Navigation
$respTabs = @(
    @{ Name = 'Home'; Icon = 'home' },
    @{ Name = 'Missions'; Icon = 'truck'; Badge = '3' },
    @{ Name = 'Map'; Icon = 'map' },
    @{ Name = 'Reports'; Icon = 'send' },
    @{ Name = 'More'; Icon = 'more' }
)
Draw-BottomNav $g2 $respTabs 'Home'

$g2.Dispose()
Save-CompositedPhone $respBmp "$PSScriptRoot\..\public\images\resilia_phone_responder.jpg" -CropPhoneOnly

# ==============================================================================
# 3. RENDER COORDINATOR UI (CoordinatorDashboardScreen.tsx)
# ==============================================================================
Write-Host "Rendering Coordinator Account UI..."
$coordBmp = New-Object System.Drawing.Bitmap($screenW, $screenH)
$g3 = [System.Drawing.Graphics]::FromImage($coordBmp)
$g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g3.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Coordinator Executive command background (#F1F5F9)
$g3.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), 0, 0, $screenW, $screenH)
Draw-StatusBar $g3

# Coordinator Top Header
$g3.FillRectangle($bWhite, 0, $headerY, $screenW, $headerH)
$g3.DrawLine($pBorder, 0, $headerY + $headerH, $screenW, $headerY + $headerH)

$g3.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))), 36, 68, 48, 48)
$g3.FillPolygon($bWhite, $shieldPts)
$g3.DrawLines((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2.6)), @([System.Drawing.PointF]::new(53, 83), [System.Drawing.PointF]::new(58, 88), [System.Drawing.PointF]::new(67, 78)))

$g3.DrawString('RESILIA', (New-Object System.Drawing.Font($fontName, 20, [System.Drawing.FontStyle]::Bold)), $bDark, 96, 68)
$cTag = Create-RoundedPath ([System.Drawing.RectangleF]::new(186, 70, 105, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $cTag)
$g3.DrawString('COORDINATOR', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), 194, 74)
$g3.DrawString('Elena Ramos - Marikina EOC', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), $bMuted, 96, 96)

$pillCoordPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(490, 72, 140, 38)) 19
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $pillCoordPath)
$g3.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(167, 243, 208), 1.8)), $pillCoordPath)
$g3.FillEllipse($bEmerald, 504, 85, 11, 11)
$g3.DrawString('Grounded AI', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), $bForest, 522, 83)

$sirenX = 698; $sirenY = 68
$g3.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 226, 226))), $sirenX, $sirenY, 44, 44)
$pSiren = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 38, 38), 2.2)
$g3.DrawArc($pSiren, $sirenX + 13, $sirenY + 15, 18, 16, 180, 180)
$g3.DrawLine($pSiren, $sirenX + 11, $sirenY + 31, $sirenX + 33, $sirenY + 31)

# Operational Status Telemetry Banner
$cAlertY = $contentY; $cAlertW = $screenW - 72; $cAlertH = 105
$cAlertPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $cAlertY, $cAlertW, $cAlertH)) 16
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))), $cAlertPath)
$g3.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 2)), $cAlertPath)

$g3.DrawString('MARIKINA RIVER TELEMETRY: 16.2m (ALARM LEVEL 2)', (New-Object System.Drawing.Font($fontName, 15, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))), 55, $cAlertY + 16)
$g3.DrawString('Forced Evacuations Active - Tumana and Malanday Low-Lying Sectors Submerged', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))), 55, $cAlertY + 44)
$g3.DrawString('CDRRMO Hotline 161 Active - 8 BDRRMC Patrol Boats Operating Under Mesh', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))), 55, $cAlertY + 70)

# 3 KPI Metric Cards
$kpiY = $cAlertY + $cAlertH + 16
$kpiW = ($screenW - 72 - 24) / 3
$kpiH = 110

function Draw-KpiBoxLocal($x, $y, $w, $h, $num, $lbl, $sub, $numClr) {
    $boxPath = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 15
    $g3.FillPath($bWhite, $boxPath)
    $g3.DrawPath($pBorder, $boxPath)
    $g3.DrawString($num, (New-Object System.Drawing.Font($fontName, 23, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($numClr)), $x + 14, $y + 12)
    $g3.DrawString($lbl, (New-Object System.Drawing.Font($fontName, 11.5, [System.Drawing.FontStyle]::Bold)), $bDark, $x + 14, $y + 50)
    $g3.DrawString($sub, (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Regular)), $bMuted, $x + 14, $y + 74)
}

Draw-KpiBoxLocal 36 $kpiY $kpiW $kpiH '42 Rescued' 'Active Evacuations' 'Sub-second logged' ([System.Drawing.Color]::FromArgb(5, 150, 105))
Draw-KpiBoxLocal (36 + $kpiW + 12) $kpiY $kpiW $kpiH '850 / 1000' 'Malanday (85%)' '150 slots left' ([System.Drawing.Color]::FromArgb(217, 119, 6))
Draw-KpiBoxLocal (36 + ($kpiW + 12)*2) $kpiY $kpiW $kpiH '3 Pending' 'AI Rescue Proposals' 'Requires sign-off' ([System.Drawing.Color]::FromArgb(225, 29, 72))

# AI Human Gatekeeper Dispatch Proposal
$aiSecY = $kpiY + $kpiH + 16
$g3.DrawString('AI DISPATCH PROPOSAL (HUMAN GATEKEEPER GATED)', $fSectionHeader, $bDark, 36, $aiSecY)

$aiCardY = $aiSecY + 24; $aiCardW = $screenW - 72; $aiCardH = 250
$aiCardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $aiCardY, $aiCardW, $aiCardH)) 18
$g3.FillPath($bWhite, $aiCardPath)
$g3.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2.2)), $aiCardPath)

$cAccentStrip = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $aiCardY, 12, $aiCardH)) 6
$g3.FillPath($bBlue, $cAccentStrip)

$aiAgentBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(65, $aiCardY + 18, 205, 26)) 6
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 246, 255))), $aiAgentBadge)
$g3.DrawString('NEEDS AGENT #5 PROPOSAL', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bBlue, 73, $aiCardY + 23)

$cPrioBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(280, $aiCardY + 18, 145, 26)) 6
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 226, 226))), $cPrioBadge)
$g3.DrawString('PRIORITY 94/100', (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), $bRedDark, 289, $aiCardY + 23)

$g3.DrawString('Dispatch Rubber Boat Alpha-2 to 142 J.P. Rizal', (New-Object System.Drawing.Font($fontName, 18, [System.Drawing.FontStyle]::Bold)), $bDark, 65, $aiCardY + 54)
$g3.DrawString('Evacuees: Bedridden senior (78) & infant (4 mos) - Flood depth 1.8m rising', (New-Object System.Drawing.Font($fontName, 12.5, [System.Drawing.FontStyle]::Regular)), $bMuted, 65, $aiCardY + 86)
$g3.DrawString('AI Rationale: Vulnerability score calculated mathematically from resident PWD + infant flags. Proximity matching routes nearest team (6 min ETA).', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))), [System.Drawing.RectangleF]::new(65, $aiCardY + 114, $aiCardW - 60, 50))

# Human Authorization Gate Buttons
$btnApprove = Create-RoundedPath ([System.Drawing.RectangleF]::new(65, $aiCardY + 178, 305, 48)) 12
$g3.FillPath($bEmerald, $btnApprove)
$g3.DrawString('AUTHORIZE & DISPATCH TEAM', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), $bWhite, 95, $aiCardY + 192)

$btnReject = Create-RoundedPath ([System.Drawing.RectangleF]::new(385, $aiCardY + 178, 200, 48)) 12
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))), $btnReject)
$g3.DrawPath($pBorder, $btnReject)
$g3.DrawString('REJECT / EDIT', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), $bDark, 428, $aiCardY + 192)

# Verification & Ayuda Split (Row of 2 cards)
$splitY = $aiCardY + $aiCardH + 16
$g3.DrawString('OPERATIONAL TRUTH & RELIEF LEDGERS', $fSectionHeader, $bDark, 36, $splitY)

$splitCardY = $splitY + 24
$splitW = ($screenW - 72 - 16) / 2
$splitH = 138

# Verification Card
$vCardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $splitCardY, $splitW, $splitH)) 16
$g3.FillPath($bWhite, $vCardPath)
$g3.DrawPath($pBorder, $vCardPath)
$g3.DrawString('Incident Truth Engine', $fCardTitle, $bDark, 52, $splitCardY + 14)
$g3.DrawString('3 Citizen flood reports corroborated at J.P. Rizal (1.8m). Spatial bounding verified.', $fCardSub, $bMuted, [System.Drawing.RectangleF]::new(52, $splitCardY + 42, $splitW - 32, 46))
$vBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(52, $splitCardY + 98, 150, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $vBadge)
$g3.DrawString('VERIFIED HAZARD', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), $bEmerald, 58, $splitCardY + 102)

# Ayuda Ledger Card
$aCardPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36 + $splitW + 16, $splitCardY, $splitW, $splitH)) 16
$g3.FillPath($bWhite, $aCardPath)
$g3.DrawPath($pBorder, $aCardPath)
$g3.DrawString('Ayuda Relief Ledger', $fCardTitle, $bDark, 52 + $splitW + 16, $splitCardY + 14)
$g3.DrawString('412 Family food packs scanned. 24h QR cooldown active. Zero overdraft balance.', $fCardSub, $bMuted, [System.Drawing.RectangleF]::new(52 + $splitW + 16, $splitCardY + 42, $splitW - 32, 46))
$aBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new(52 + $splitW + 16, $splitCardY + 98, 165, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $aBadge)
$g3.DrawString('0 OVERDRAFT STRICT', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), 58 + $splitW + 16, $splitCardY + 102)

# Sector Deployment Telemetry
$secDepY = $splitCardY + $splitH + 16
$g3.DrawString('BARANGAY SECTOR DEPLOYMENT & ASSETS', $fSectionHeader, $bDark, 36, $secDepY)

$sDepCardY = $secDepY + 24
$sDepW = ($screenW - 72 - 24) / 3
$sDepH = 92

function Draw-SectorBox($x, $y, $w, $h, $secName, $status, $assets, $statusCol) {
    $sBox = Create-RoundedPath ([System.Drawing.RectangleF]::new($x, $y, $w, $h)) 14
    $g3.FillPath($bWhite, $sBox)
    $g3.DrawPath($pBorder, $sBox)
    $g3.DrawString($secName, (New-Object System.Drawing.Font($fontName, 12.5, [System.Drawing.FontStyle]::Bold)), $bDark, $x + 12, $y + 12)
    $g3.DrawString($status, (New-Object System.Drawing.Font($fontName, 10, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($statusCol)), $x + 12, $y + 36)
    $g3.DrawString($assets, (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Regular)), $bMuted, $x + 12, $y + 58)
}

Draw-SectorBox 36 $sDepCardY $sDepW $sDepH 'Sector 1 (Tumana)' 'CRITICAL (3 Boats)' '18 Citizens evacuated' ([System.Drawing.Color]::FromArgb(220, 38, 38))
Draw-SectorBox (36 + $sDepW + 12) $sDepCardY $sDepW $sDepH 'Sector 2 (Malanday)' 'LEVEL 2 (4 Boats)' '24 Citizens evacuated' ([System.Drawing.Color]::FromArgb(217, 119, 6))
Draw-SectorBox (36 + ($sDepW + 12)*2) $sDepCardY $sDepW $sDepH 'Sector 3 (Concepcion)' 'STANDBY (1 Boat)' 'Telemetry monitoring' ([System.Drawing.Color]::FromArgb(5, 150, 105))

# Evacuation Shelter Logistics (2 cards)
$shLogSecY = $sDepCardY + $sDepH + 16
$g3.DrawString('EVACUATION SHELTER CAPACITY & LOGISTICS', $fSectionHeader, $bDark, 36, $shLogSecY)

# Shelter Log 1
$shLog1Y = $shLogSecY + 24; $shLog1H = 88
$shLog1Path = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $shLog1Y, $screenW - 72, $shLog1H)) 15
$g3.FillPath($bWhite, $shLog1Path)
$g3.DrawPath($pBorder, $shLog1Path)
$g3.DrawString('Malanday Elementary School', $fShelterTitle, $bDark, 55, $shLog1Y + 12)
$sh1Badge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 165, $shLog1Y + 12, 105, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $sh1Badge)
$g3.DrawString('85% OCCUPIED', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), $screenW - 156, $shLog1Y + 16)
$g3.DrawString('850 / 1,000 evacuees - Food packs: 1,200 units - Clean drinking water: 4,000L available', $fShelterSub, $bMuted, 55, $shLog1Y + 40)
$g3.DrawString('Priority medical triage active - Dialysis generator operational', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bForest, 55, $shLog1Y + 62)

# Shelter Log 2
$shLog2Y = $shLog1Y + $shLog1H + 10; $shLog2H = 88
$shLog2Path = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $shLog2Y, $screenW - 72, $shLog2H)) 15
$g3.FillPath($bWhite, $shLog2Path)
$g3.DrawPath($pBorder, $shLog2Path)
$g3.DrawString('Sto. Nino Parish Community Gym', $fShelterTitle, $bDark, 55, $shLog2Y + 12)
$sh2Badge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 165, $shLog2Y + 12, 105, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $sh2Badge)
$g3.DrawString('64% OCCUPIED', (New-Object System.Drawing.Font($fontName, 9.5, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 156, $shLog2Y + 16)
$g3.DrawString('320 / 500 evacuees - Food packs: 650 units - Clean drinking water: 2,500L available', $fShelterSub, $bMuted, 55, $shLog2Y + 40)
$g3.DrawString('PWD ramp access clear - Infant feeding station operational', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bForest, 55, $shLog2Y + 62)

# Citizen Corroboration Engine
$cCorrY = $shLog2Y + $shLog2H + 12; $cCorrH = 92
$cCorrPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $cCorrY, $screenW - 72, $cCorrH)) 15
$g3.FillPath($bWhite, $cCorrPath)
$g3.DrawPath($pBorder, $cCorrPath)
$g3.DrawString('CITIZEN REPORT CORROBORATION ENGINE (CLUSTER #14)', (New-Object System.Drawing.Font($fontName, 12, [System.Drawing.FontStyle]::Bold)), $bDark, 55, $cCorrY + 14)
$corrBadge = Create-RoundedPath ([System.Drawing.RectangleF]::new($screenW - 175, $cCorrY + 12, 115, 22)) 5
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 253, 245))), $corrBadge)
$g3.DrawString('HIGH CONFIDENCE', (New-Object System.Drawing.Font($fontName, 9, [System.Drawing.FontStyle]::Bold)), $bEmerald, $screenW - 168, $cCorrY + 16)
$g3.DrawString('7 Citizen flood reports merged at Malanday Crossing - Average depth: 1.82m', $fCardSub, $bMuted, 55, $cCorrY + 40)
$g3.DrawString('Grounded AI: Cross-checked against local telemetry & shelter records', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Regular)), $bForest, 55, $cCorrY + 64)

# Coordinator Bottom Banner
$cAuditY = $cCorrY + $cCorrH + 12; $cAuditH = 78
$cAuditPath = Create-RoundedPath ([System.Drawing.RectangleF]::new(36, $cAuditY, $screenW - 72, $cAuditH)) 14
$g3.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 243, 199))), $cAuditPath)
$g3.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(252, 211, 77), 1.8)), $cAuditPath)
$g3.DrawString('STRICT ROLE-BASED ACCESS CONTROL (RBAC) AUDIT LOG', (New-Object System.Drawing.Font($fontName, 11, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 83, 9))), 55, $cAuditY + 12)
$cAuditRect = [System.Drawing.RectangleF]::new(55, $cAuditY + 34, $screenW - 110, 38)
$g3.DrawString("All 14 municipal dispatches cryptographically authorized by Commander Ramos.`nCitizen access: Read-only.", (New-Object System.Drawing.Font($fontName, 10.5, [System.Drawing.FontStyle]::Regular)), $bDark, $cAuditRect)

# Coordinator Bottom Navigation (5 tabs)
$coordTabs = @(
    @{ Name = 'Overview'; Icon = 'home' },
    @{ Name = 'Map'; Icon = 'map' },
    @{ Name = 'Incidents'; Icon = 'reports' },
    @{ Name = 'Missions'; Icon = 'truck'; Badge = '3' },
    @{ Name = 'Ledger'; Icon = 'ledger' }
)
Draw-BottomNav $g3 $coordTabs 'Overview'

$g3.Dispose()
Save-CompositedPhone $coordBmp "$PSScriptRoot\..\public\images\resilia_phone_coordinator.jpg" -CropPhoneOnly

# Sync to dist/images if dist directory exists
$distImgDir = "$PSScriptRoot\..\dist\images"
if (Test-Path $distImgDir) {
    Copy-Item "$PSScriptRoot\..\public\images\resilia_phone_resident.jpg" $distImgDir -Force
    Copy-Item "$PSScriptRoot\..\public\images\resilia_phone_responder.jpg" $distImgDir -Force
    Copy-Item "$PSScriptRoot\..\public\images\resilia_phone_coordinator.jpg" $distImgDir -Force
    Copy-Item "$PSScriptRoot\..\public\images\resilia_app_cellphone.jpg" $distImgDir -Force
}

Write-Host "All phone mockups rendered and saved successfully!"
