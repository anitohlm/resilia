# Resilia Architecture Diagram Generator
# Generates a crisp, ultra-high-resolution (2500 x 1100 px) architecture diagram image
# Exactly matching PPTX DrawingML 8,000,000 x 3,520,000 EMU aspect ratio (2.2727:1) with 0.00% distortion.
# Strictly NO emojis anywhere in the diagram.

Add-Type -AssemblyName System.Drawing

$outputPath = "c:\Users\hmanito\antigravity\Resilia\public\images\architecture_diagram.png"
$distOutputPath = "c:\Users\hmanito\antigravity\Resilia\dist\images\architecture_diagram.png"
$brainOutputPath = "C:\Users\hmanito\.gemini\antigravity\brain\8aa4f092-c6fe-4e28-90e0-f2e837135681\architecture_diagram.png"

$width = 2500
$height = 1100

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Helper for rounded rectangles
function FillRoundedRectangle($graphics, $brush, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $r = [System.Drawing.RectangleF]::new($rect.X, $rect.Y, $rect.Width, $rect.Height)

    $path.AddArc($r.X, $r.Y, $d, $d, 180, 90)
    $path.AddArc($r.Right - $d, $r.Y, $d, $d, 270, 90)
    $path.AddArc($r.Right - $d, $r.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($r.X, $r.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $graphics.FillPath($brush, $path)
    $path.Dispose()
}

function DrawRoundedRectangle($graphics, $pen, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $r = [System.Drawing.RectangleF]::new($rect.X, $rect.Y, $rect.Width, $rect.Height)

    $path.AddArc($r.X, $r.Y, $d, $d, 180, 90)
    $path.AddArc($r.Right - $d, $r.Y, $d, $d, 270, 90)
    $path.AddArc($r.Right - $d, $r.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($r.X, $r.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $graphics.DrawPath($pen, $path)
    $path.Dispose()
}

function DrawArrow($graphics, $pen, $brush, $x1, $y1, $x2, $y2, $arrowSize) {
    $graphics.DrawLine($pen, $x1, $y1, $x2, $y2)
    $angle = [Math]::Atan2(($y2 - $y1), ($x2 - $x1))
    $p1 = [System.Drawing.PointF]::new($x2, $y2)
    $p2 = [System.Drawing.PointF]::new(
        ($x2 - $arrowSize * [Math]::Cos($angle - [Math]::PI / 6)),
        ($y2 - $arrowSize * [Math]::Sin($angle - [Math]::PI / 6))
    )
    $p3 = [System.Drawing.PointF]::new(
        ($x2 - $arrowSize * [Math]::Cos($angle + [Math]::PI / 6)),
        ($y2 - $arrowSize * [Math]::Sin($angle + [Math]::PI / 6))
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddLine($p1, $p2)
    $path.AddLine($p2, $p3)
    $path.CloseFigure()
    $graphics.FillPath($brush, $path)
    $path.Dispose()
}

function DrawWrappedText($graphics, $text, $font, $brush, $x, $y, $w, $h) {
    $rect = [System.Drawing.RectangleF]::new($x, $y, $w, $h)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Near
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Near
    $sf.Trimming = [System.Drawing.StringTrimming]::Word
    $graphics.DrawString($text, $font, $brush, $rect, $sf)
    $sf.Dispose()
}

# Colors
$cBg = [System.Drawing.Color]::FromArgb(248, 250, 252) # Slate 50
$cCardBg = [System.Drawing.Color]::White
$cBorder = [System.Drawing.Color]::FromArgb(226, 232, 240) # Slate 200
$cBorderDark = [System.Drawing.Color]::FromArgb(203, 213, 225) # Slate 300

# Tier 1: Edge Resilience Colors (Emerald)
$cEdgeBg = [System.Drawing.Color]::FromArgb(240, 253, 244) # Emerald 50
$cEdgeBorder = [System.Drawing.Color]::FromArgb(167, 243, 208) # Emerald 200
$cEdgePrimary = [System.Drawing.Color]::FromArgb(5, 150, 105) # Emerald 600
$cEdgeDark = [System.Drawing.Color]::FromArgb(6, 95, 70) # Emerald 800

# Tier 2: Sync Bridge Colors (Amber)
$cSyncBg = [System.Drawing.Color]::FromArgb(254, 243, 199) # Amber 100/50
$cSyncBorder = [System.Drawing.Color]::FromArgb(253, 230, 138) # Amber 200
$cSyncPrimary = [System.Drawing.Color]::FromArgb(217, 119, 6) # Amber 600
$cSyncDark = [System.Drawing.Color]::FromArgb(146, 64, 14) # Amber 800

# Tier 3: Cloud Intelligence Colors (Blue)
$cCloudBg = [System.Drawing.Color]::FromArgb(239, 246, 255) # Blue 50
$cCloudBorder = [System.Drawing.Color]::FromArgb(191, 219, 254) # Blue 200
$cCloudPrimary = [System.Drawing.Color]::FromArgb(37, 99, 235) # Blue 600
$cCloudDark = [System.Drawing.Color]::FromArgb(30, 58, 138) # Blue 900

# AI Agent Panel Colors (Indigo / Violet)
$cAgentBg = [System.Drawing.Color]::FromArgb(238, 242, 255) # Indigo 50
$cAgentBorder = [System.Drawing.Color]::FromArgb(199, 210, 254) # Indigo 200
$cAgentPrimary = [System.Drawing.Color]::FromArgb(79, 70, 229) # Indigo 600
$cAgentDark = [System.Drawing.Color]::FromArgb(49, 46, 129) # Indigo 900

# Text Colors
$cTextMain = [System.Drawing.Color]::FromArgb(15, 23, 42) # Slate 900
$cTextMuted = [System.Drawing.Color]::FromArgb(51, 65, 85) # Slate 700
$cTextSub = [System.Drawing.Color]::FromArgb(100, 116, 139) # Slate 500

# Fonts
$fontFamily = 'Segoe UI'
$fSuperTitle = New-Object System.Drawing.Font($fontFamily, 20, [System.Drawing.FontStyle]::Bold)
$fSuperSub = New-Object System.Drawing.Font($fontFamily, 11.5, [System.Drawing.FontStyle]::Regular)
$fTierHeader = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
$fTierSub = New-Object System.Drawing.Font($fontFamily, 9.5, [System.Drawing.FontStyle]::Bold)
$fCardTitle = New-Object System.Drawing.Font($fontFamily, 10.5, [System.Drawing.FontStyle]::Bold)
$fCardBody = New-Object System.Drawing.Font($fontFamily, 8.8, [System.Drawing.FontStyle]::Regular)
$fBadge = New-Object System.Drawing.Font($fontFamily, 8.5, [System.Drawing.FontStyle]::Bold)
$fAgentHeader = New-Object System.Drawing.Font($fontFamily, 12, [System.Drawing.FontStyle]::Bold)
$fAgentTitle = New-Object System.Drawing.Font($fontFamily, 9.5, [System.Drawing.FontStyle]::Bold)
$fAgentRole = New-Object System.Drawing.Font($fontFamily, 8, [System.Drawing.FontStyle]::Bold)
$fAgentBody = New-Object System.Drawing.Font($fontFamily, 8, [System.Drawing.FontStyle]::Regular)
$fFooter = New-Object System.Drawing.Font($fontFamily, 9, [System.Drawing.FontStyle]::Bold)
$fFooterBody = New-Object System.Drawing.Font($fontFamily, 8.5, [System.Drawing.FontStyle]::Regular)
$fChannelLabel = New-Object System.Drawing.Font($fontFamily, 7.5, [System.Drawing.FontStyle]::Bold)

# Brushes
$bBg = New-Object System.Drawing.SolidBrush($cBg)
$bWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$bTextMain = New-Object System.Drawing.SolidBrush($cTextMain)
$bTextMuted = New-Object System.Drawing.SolidBrush($cTextMuted)
$bTextSub = New-Object System.Drawing.SolidBrush($cTextSub)

$bEdgeBg = New-Object System.Drawing.SolidBrush($cEdgeBg)
$bEdgePrimary = New-Object System.Drawing.SolidBrush($cEdgePrimary)
$bEdgeDark = New-Object System.Drawing.SolidBrush($cEdgeDark)

$bSyncBg = New-Object System.Drawing.SolidBrush($cSyncBg)
$bSyncPrimary = New-Object System.Drawing.SolidBrush($cSyncPrimary)
$bSyncDark = New-Object System.Drawing.SolidBrush($cSyncDark)

$bCloudBg = New-Object System.Drawing.SolidBrush($cCloudBg)
$bCloudPrimary = New-Object System.Drawing.SolidBrush($cCloudPrimary)
$bCloudDark = New-Object System.Drawing.SolidBrush($cCloudDark)

$bAgentBg = New-Object System.Drawing.SolidBrush($cAgentBg)
$bAgentPrimary = New-Object System.Drawing.SolidBrush($cAgentPrimary)
$bAgentDark = New-Object System.Drawing.SolidBrush($cAgentDark)

# Pens
$pBorder = New-Object System.Drawing.Pen($cBorder, 1.5)
$pBorderDark = New-Object System.Drawing.Pen($cBorderDark, 1.5)
$pEdgeBorder = New-Object System.Drawing.Pen($cEdgeBorder, 1.5)
$pSyncBorder = New-Object System.Drawing.Pen($cSyncBorder, 1.5)
$pCloudBorder = New-Object System.Drawing.Pen($cCloudBorder, 1.5)
$pAgentBorder = New-Object System.Drawing.Pen($cAgentBorder, 1.5)

$pEdgePrimary = New-Object System.Drawing.Pen($cEdgePrimary, 2.5)
$pSyncPrimary = New-Object System.Drawing.Pen($cSyncPrimary, 2.5)
$pCloudPrimary = New-Object System.Drawing.Pen($cCloudPrimary, 2.5)

# Clear Canvas
$g.Clear($cBg)

# Outer Border Frame
$outerRect = New-Object System.Drawing.Rectangle(15, 12, ($width - 30), ($height - 24))
FillRoundedRectangle $g $bWhite $outerRect 12
DrawRoundedRectangle $g $pBorderDark $outerRect 12

# ==========================================
# 1. HEADER SECTION (Y: 22 to 86)
# ==========================================
$headerRect = New-Object System.Drawing.Rectangle(28, 22, ($width - 56), 66)
FillRoundedRectangle $g $bBg $headerRect 8
DrawRoundedRectangle $g $pBorder $headerRect 8

$g.DrawString("RESILIA SYSTEM ARCHITECTURE", $fSuperTitle, $bTextMain, 44, 28)
$g.DrawString("Hybrid Dual-Engine Framework: Google Cloud Platform Macro Intelligence + Zero-Dependency Offline Edge Runtime", $fSuperSub, $bTextSub, 46, 58)

# Header Badges (Right Aligned)
$badge1Rect = New-Object System.Drawing.Rectangle(($width - 700), 34, 205, 38)
FillRoundedRectangle $g $bEdgeBg $badge1Rect 6
DrawRoundedRectangle $g $pEdgeBorder $badge1Rect 6
$sfCtr = New-Object System.Drawing.StringFormat
$sfCtr.Alignment = [System.Drawing.StringAlignment]::Center
$sfCtr.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("LOCAL CACHE FALLBACK", $fBadge, $bEdgeDark, [System.Drawing.RectangleF]::new($badge1Rect.X, $badge1Rect.Y, $badge1Rect.Width, $badge1Rect.Height), $sfCtr)

$badge2Rect = New-Object System.Drawing.Rectangle(($width - 485), 34, 215, 38)
FillRoundedRectangle $g $bAgentBg $badge2Rect 6
DrawRoundedRectangle $g $pAgentBorder $badge2Rect 6
$g.DrawString("7 MODULAR AI AGENTS", $fBadge, $bAgentDark, [System.Drawing.RectangleF]::new($badge2Rect.X, $badge2Rect.Y, $badge2Rect.Width, $badge2Rect.Height), $sfCtr)

$badge3Rect = New-Object System.Drawing.Rectangle(($width - 260), 34, 225, 38)
FillRoundedRectangle $g $bCloudBg $badge3Rect 6
DrawRoundedRectangle $g $pCloudBorder $badge3Rect 6
$g.DrawString("GOOGLE CLOUD POWERED", $fBadge, $bCloudDark, [System.Drawing.RectangleF]::new($badge3Rect.X, $badge3Rect.Y, $badge3Rect.Width, $badge3Rect.Height), $sfCtr)

# ==========================================
# 2. THREE-TIER CORE ARCHITECTURE (Y: 96 to 680)
# ==========================================
$colY = 96
$colH = 585

# Column widths & positions with generous channel gaps for labeled flow arrows
$c1X = 28
$c1W = 745

$gap1 = 90
$c2X = $c1X + $c1W + $gap1 # 863
$c2W = 715

$gap2 = 90
$c3X = $c2X + $c2W + $gap2 # 1668 -> 1727
$c3W = ($width - 28 - $c3X) # 745

# --- COLUMN 1: TIER 1 - RESILIENT EDGE RUNTIME (Left) ---
$c1Rect = New-Object System.Drawing.Rectangle($c1X, $colY, $c1W, $colH)
FillRoundedRectangle $g $bEdgeBg $c1Rect 10
DrawRoundedRectangle $g $pEdgeBorder $c1Rect 10

$g.DrawString("TIER 1: RESILIENT EDGE RUNTIME", $fTierHeader, $bEdgeDark, ($c1X + 18), ($colY + 12))
$g.DrawString("Client PWA, Local Storage & Mesh LAN (Zero Cloud Dependency)", $fTierSub, $bEdgePrimary, ($c1X + 18), ($colY + 34))

# Tier 1 Cards (4 boxes)
$cardBoxH = 120
$cardBoxY0 = $colY + 56
$cardBoxGap = 10

# Edge Box 1: Tri-Role Mobile PWA
$e1Rect = New-Object System.Drawing.Rectangle(($c1X + 12), $cardBoxY0, ($c1W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $e1Rect 8
DrawRoundedRectangle $g $pBorder $e1Rect 8
$g.DrawString("Tri-Role Mobile Web PWA (Offline App Shell)", $fCardTitle, $bTextMain, ($c1X + 20), ($cardBoxY0 + 8))
$e1Body = "- Workbox Service Worker: Pre-cached core UI assets for offline launch`n" +
          "- Resident Portal: One-tap SOS beacon, OLED Morse strobe, Go-Bag checklists, shelters`n" +
          "- Responder Console: Prioritized rescue queue (0-100 triage score), START tags, QR tracking`n" +
          "- Coordinator Ops: Live GIS hazard map, relief inventory ledger, manual approval gate"
DrawWrappedText $g $e1Body $fCardBody $bTextMuted ($c1X + 20) ($cardBoxY0 + 28) ($c1W - 40) 86

# Edge Box 2: Local Deterministic AI Engine
$cardBoxY1 = $cardBoxY0 + $cardBoxH + $cardBoxGap
$e2Rect = New-Object System.Drawing.Rectangle(($c1X + 12), $cardBoxY1, ($c1W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $e2Rect 8
DrawRoundedRectangle $g $pBorder $e2Rect 8
$g.DrawString("Local Deterministic AI Engine (Sub-15ms Latency)", $fCardTitle, $bTextMain, ($c1X + 20), ($cardBoxY1 + 8))
$e2Body = "- Autonomous edge execution: runs without active internet or cellular backhaul`n" +
          "- Vulnerability prioritization: transparent arithmetic weighting seniors, infants, mobility`n" +
          "- Water Safety & Leptospirosis monitor: 72-hour prophylaxis countdown & boiling guide`n" +
          "- Strict Anti-Hallucination bounds: hardcoded NDRRMC and DOH disaster SOPs"
DrawWrappedText $g $e2Body $fCardBody $bTextMuted ($c1X + 20) ($cardBoxY1 + 28) ($c1W - 40) 86

# Edge Box 3: Client IndexedDB Multi-Store
$cardBoxY2 = $cardBoxY1 + $cardBoxH + $cardBoxGap
$e3Rect = New-Object System.Drawing.Rectangle(($c1X + 12), $cardBoxY2, ($c1W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $e3Rect 8
DrawRoundedRectangle $g $pBorder $e3Rect 8
$g.DrawString("Client IndexedDB Multi-Store (15 Versioned ACID Stores)", $fCardTitle, $bTextMain, ($c1X + 20), ($cardBoxY2 + 8))
$e3Body = "- Sub-15ms write latency: zero UI lag or blocking spinners during complete blackouts`n" +
          "- 15 Structured stores: incidents, assistance_requests, missions, shelters, inventory, ayuda...`n" +
          "- Cryptographic integrity: Web Crypto API SHA-256 hashing for tamper-evident data`n" +
          "- Write-ahead persistence: all mutations succeed locally and queue into durable journal"
DrawWrappedText $g $e3Body $fCardBody $bTextMuted ($c1X + 20) ($cardBoxY2 + 28) ($c1W - 40) 86

# Edge Box 4: Local Mesh Micro-Server ($35 Hardware Option)
$cardBoxY3 = $cardBoxY2 + $cardBoxH + $cardBoxGap
$e4Rect = New-Object System.Drawing.Rectangle(($c1X + 12), $cardBoxY3, ($c1W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $e4Rect 8
DrawRoundedRectangle $g $pBorder $e4Rect 8
$g.DrawString('Local Mesh Micro-Server (Frugal $35 Hardware Option)', $fCardTitle, $bTextMain, ($c1X + 20), ($cardBoxY3 + 8))
$e4Body = "- Low-cost Raspberry Pi 4/5 or recycled laptop acting as community shelter hotspot`n" +
          "- Node.js / Express local daemon hosting peer sync without telecom infrastructure`n" +
          "- Compatible with LoRa / BLE radio packet broadcast for river valley telemetry`n" +
          "- Auto-uplink: forwards queued payloads when satellite (Starlink) or 4G restores"
DrawWrappedText $g $e4Body $fCardBody $bTextMuted ($c1X + 20) ($cardBoxY3 + 28) ($c1W - 40) 86


# --- COLUMN 2: TIER 2 - NETWORK BOUNDARY & SYNCHRONIZATION BRIDGE (Center) ---
$c2Rect = New-Object System.Drawing.Rectangle($c2X, $colY, $c2W, $colH)
FillRoundedRectangle $g $bSyncBg $c2Rect 10
DrawRoundedRectangle $g $pSyncBorder $c2Rect 10

$g.DrawString("TIER 2: NETWORK BOUNDARY & SYNCHRONIZATION BRIDGE", $fTierHeader, $bSyncDark, ($c2X + 18), ($colY + 12))
$g.DrawString("Bi-Directional Reconnection, Health Probing & Conflict Resolution", $fTierSub, $bSyncPrimary, ($c2X + 18), ($colY + 34))

# Sync Box 1: Idempotent Outbox Transaction Log
$s1Rect = New-Object System.Drawing.Rectangle(($c2X + 12), $cardBoxY0, ($c2W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $s1Rect 8
DrawRoundedRectangle $g $pBorder $s1Rect 8
$g.DrawString("Idempotent Outbox Transaction Log", $fCardTitle, $bTextMain, ($c2X + 20), ($cardBoxY0 + 8))
$s1Body = "- UUIDv4 Unique Event Tagging: every offline change recorded with monotonic timestamps`n" +
          "- Guaranteed Exactly-Once Delivery: eliminates duplicate submissions on spotty reconnects`n" +
          "- Persistent write-ahead outbox survives device reboots and browser restarts`n" +
          "- Atomic queue batching: compresses and bundles multi-item field reports for rapid uplink"
DrawWrappedText $g $s1Body $fCardBody $bTextMuted ($c2X + 20) ($cardBoxY0 + 28) ($c2W - 40) 86

# Sync Box 2: Deterministic Conflict Reconciliation
$s2Rect = New-Object System.Drawing.Rectangle(($c2X + 12), $cardBoxY1, ($c2W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $s2Rect 8
DrawRoundedRectangle $g $pBorder $s2Rect 8
$g.DrawString("Deterministic Conflict-Free State Reconciliation", $fCardTitle, $bTextMain, ($c2X + 20), ($cardBoxY1 + 8))
$s2Body = "- SHA-256 state hashing: detects concurrent edits across dispersed field teams cleanly`n" +
          "- Hybrid resolution: automatic deterministic last-write-wins + manual escalation for safety`n" +
          "- Zero-Overdraft Ayuda Ledger: 24-hour cooldown timer prevents double-claiming in shelters`n" +
          "- Tamper-evident audit trail: logs responder IDs, coordinator decisions, and verification"
DrawWrappedText $g $s2Body $fCardBody $bTextMuted ($c2X + 20) ($cardBoxY1 + 28) ($c2W - 40) 86

# Sync Box 3: Adaptive Reconnection Prober
$s3Rect = New-Object System.Drawing.Rectangle(($c2X + 12), $cardBoxY2, ($c2W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $s3Rect 8
DrawRoundedRectangle $g $pBorder $s3Rect 8
$g.DrawString("Adaptive Reconnection Prober & Heartbeat Monitor", $fCardTitle, $bTextMain, ($c2X + 20), ($cardBoxY2 + 8))
$s3Body = "- True endpoint verification: probes /api/v1/health rather than naive browser online flag`n" +
          "- Exponential backoff with random jitter: protects recovering towers from thundering herds`n" +
          "- Instant outbox replay: automatically flushes pending queues the moment signal locks`n" +
          "- Seamless multi-path routing: dynamically switches between Cloud Run API and local mesh"
DrawWrappedText $g $s3Body $fCardBody $bTextMuted ($c2X + 20) ($cardBoxY2 + 28) ($c2W - 40) 86

# Sync Box 4: Bi-Directional Flow Directions
$s4Rect = New-Object System.Drawing.Rectangle(($c2X + 12), $cardBoxY3, ($c2W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $s4Rect 8
DrawRoundedRectangle $g $pBorder $s4Rect 8
$g.DrawString("Bi-Directional Telemetry & Data Flow Channels", $fCardTitle, $bTextMain, ($c2X + 20), ($cardBoxY3 + 8))
$s4Body = "[UPLINK CHANNEL: EDGE TO CLOUD]`n" +
          "- Citizen SOS pings, GPS pins, START triage classifications, scanned Ayuda distribution`n" +
          "[DOWNLINK CHANNEL: CLOUD TO EDGE]`n" +
          "- Marikina River water levels (Alarm 3 at 18m), Gemini situation briefs, dispatch orders`n" +
          "- Compressed delta transmission: minimal bandwidth payload optimized for 2G / EDGE networks"
DrawWrappedText $g $s4Body $fCardBody $bTextMuted ($c2X + 20) ($cardBoxY3 + 28) ($c2W - 40) 86


# --- COLUMN 3: TIER 3 - GOOGLE CLOUD PLATFORM (Right) ---
$c3Rect = New-Object System.Drawing.Rectangle($c3X, $colY, $c3W, $colH)
FillRoundedRectangle $g $bCloudBg $c3Rect 10
DrawRoundedRectangle $g $pCloudBorder $c3Rect 10

$g.DrawString("TIER 3: GOOGLE CLOUD PLATFORM", $fTierHeader, $bCloudDark, ($c3X + 18), ($colY + 12))
$g.DrawString("Macro Intelligence, Serverless Scale & Multi-Agency Command", $fTierSub, $bCloudPrimary, ($c3X + 18), ($colY + 34))

# Cloud Box 1: Google Gemini 3.8 Flash
$c1bRect = New-Object System.Drawing.Rectangle(($c3X + 12), $cardBoxY0, ($c3W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $c1bRect 8
DrawRoundedRectangle $g $pBorder $c1bRect 8
$g.DrawString("Google Gemini 3.8 Flash (@google/genai)", $fCardTitle, $bTextMain, ($c3X + 20), ($cardBoxY0 + 8))
$c1bBody = "- Spatial Incident Clustering: groups hundreds of incoming SOS pings to isolate flood pockets`n" +
           "- Cross-Sector Situation Briefs: synthesizes plain-language executive updates for DRRMO`n" +
           "- River Sensor Corroboration: correlates telemetry surge curves with resident flood reports`n" +
           "- Strict Schema Enforcement: structured JSON dispatches with zero hallucination risk"
DrawWrappedText $g $c1bBody $fCardBody $bTextMuted ($c3X + 20) ($cardBoxY0 + 28) ($c3W - 40) 86

# Cloud Box 2: Google Cloud Run Serverless Services
$c2bRect = New-Object System.Drawing.Rectangle(($c3X + 12), $cardBoxY1, ($c3W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $c2bRect 8
DrawRoundedRectangle $g $pBorder $c2bRect 8
$g.DrawString("Google Cloud Run (Containerized Microservices)", $fCardTitle, $bTextMain, ($c3X + 20), ($cardBoxY1 + 8))
$c2bBody = "- Serverless architecture: auto-scales from 0 to 1,000+ instances during sudden supertyphoons`n" +
           "- Ultra-frugal cost profile: scales to zero between events ($0 idle cost, under $50 in disaster)`n" +
           "- High-throughput sync ingestion: absorbs packet storms when cellular coverage restores`n" +
           "- Dockerized Node.js 22 LTS API: secure, immutable, containerized REST service (/api/v1/*)"
DrawWrappedText $g $c2bBody $fCardBody $bTextMuted ($c3X + 20) ($cardBoxY1 + 28) ($c3W - 40) 86

# Cloud Box 3: Google Cloud Firestore
$c3bRect = New-Object System.Drawing.Rectangle(($c3X + 12), $cardBoxY2, ($c3W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $c3bRect 8
DrawRoundedRectangle $g $pBorder $c3bRect 8
$g.DrawString("Google Cloud Firestore (Transactional Datastore)", $fCardTitle, $bTextMain, ($c3X + 20), ($cardBoxY2 + 8))
$c3bBody = "- Multi-region high availability: disaster-resilient datastore with live synchronization`n" +
           "- Granular Security Rules: role-based access control protecting citizen safety records`n" +
           "- City-Wide Authoritative Ledger: master state for relief inventories and missing kin`n" +
           "- Post-Disaster Historical Archive: invaluable analytics for government Build Back Better audits"
DrawWrappedText $g $c3bBody $fCardBody $bTextMuted ($c3X + 20) ($cardBoxY2 + 28) ($c3W - 40) 86

# Cloud Box 4: Google Maps Platform
$c4bRect = New-Object System.Drawing.Rectangle(($c3X + 12), $cardBoxY3, ($c3W - 24), $cardBoxH)
FillRoundedRectangle $g $bWhite $c4bRect 8
DrawRoundedRectangle $g $pBorder $c4bRect 8
$g.DrawString("Google Maps Platform & Geospatial Services", $fCardTitle, $bTextMain, ($c3X + 20), ($cardBoxY3 + 8))
$c4bBody = "- Safe Evacuation Routing: dynamic routing steering responders around submerged streets`n" +
           "- Flood Hazard Heatmaps: visualizes water depth contours across Marikina River basin`n" +
           "- Safe Zone Elevation Analysis: pinpoints high-ground evacuation centers away from riverbanks`n" +
           "- Offline Vector Tile Cache: provides pre-cached GIS map tiles to offline field responders"
DrawWrappedText $g $c4bBody $fCardBody $bTextMuted ($c3X + 20) ($cardBoxY3 + 28) ($c3W - 40) 86


# ==========================================
# FLOW ARROWS & LABELED CHANNEL BADGES CONNECTING TIERS
# ==========================================
# Between Tier 1 and Tier 2 (gap: $c1X + $c1W = 773 to $c2X = 863)
$g1Left = $c1X + $c1W
$g1Right = $c2X
$g1Mid = ($g1Left + $g1Right) / 2

# Uplink arrow (Tier 1 -> Tier 2) at Y = 230
DrawArrow $g $pSyncPrimary $bSyncPrimary ($g1Left + 6) 230 ($g1Right - 6) 230 8
$pill1Rect = New-Object System.Drawing.Rectangle(($g1Mid - 38), 208, 76, 18)
FillRoundedRectangle $g $bWhite $pill1Rect 4
DrawRoundedRectangle $g $pSyncBorder $pill1Rect 4
$g.DrawString("UPLINK", $fChannelLabel, $bSyncDark, [System.Drawing.RectangleF]::new($pill1Rect.X, $pill1Rect.Y, $pill1Rect.Width, $pill1Rect.Height), $sfCtr)

# Downlink arrow (Tier 2 -> Tier 1) at Y = 460
DrawArrow $g $pEdgePrimary $bEdgePrimary ($g1Right - 6) 460 ($g1Left + 6) 460 8
$pill2Rect = New-Object System.Drawing.Rectangle(($g1Mid - 42), 468, 84, 18)
FillRoundedRectangle $g $bWhite $pill2Rect 4
DrawRoundedRectangle $g $pEdgeBorder $pill2Rect 4
$g.DrawString("DOWNLINK", $fChannelLabel, $bEdgeDark, [System.Drawing.RectangleF]::new($pill2Rect.X, $pill2Rect.Y, $pill2Rect.Width, $pill2Rect.Height), $sfCtr)

# Between Tier 2 and Tier 3 (gap: $c2X + $c2W = 1578 to $c3X = 1668)
$g2Left = $c2X + $c2W
$g2Right = $c3X
$g2Mid = ($g2Left + $g2Right) / 2

# Cloud Ingest arrow (Tier 2 -> Tier 3) at Y = 230
DrawArrow $g $pCloudPrimary $bCloudPrimary ($g2Left + 6) 230 ($g2Right - 6) 230 8
$pill3Rect = New-Object System.Drawing.Rectangle(($g2Mid - 38), 208, 76, 18)
FillRoundedRectangle $g $bWhite $pill3Rect 4
DrawRoundedRectangle $g $pCloudBorder $pill3Rect 4
$g.DrawString("INGEST", $fChannelLabel, $bCloudDark, [System.Drawing.RectangleF]::new($pill3Rect.X, $pill3Rect.Y, $pill3Rect.Width, $pill3Rect.Height), $sfCtr)

# Cloud State arrow (Tier 3 -> Tier 2) at Y = 460
DrawArrow $g $pSyncPrimary $bSyncPrimary ($g2Right - 6) 460 ($g2Left + 6) 460 8
$pill4Rect = New-Object System.Drawing.Rectangle(($g2Mid - 42), 468, 84, 18)
FillRoundedRectangle $g $bWhite $pill4Rect 4
DrawRoundedRectangle $g $pSyncBorder $pill4Rect 4
$g.DrawString("TELEMETRY", $fChannelLabel, $bSyncDark, [System.Drawing.RectangleF]::new($pill4Rect.X, $pill4Rect.Y, $pill4Rect.Width, $pill4Rect.Height), $sfCtr)


# ==========================================
# 3. THE SEVEN MODULAR AI AGENTS PANEL (Y: 695 to 1025)
# ==========================================
$agY = 695
$agH = 330
$agRect = New-Object System.Drawing.Rectangle(28, $agY, ($width - 56), $agH)
FillRoundedRectangle $g $bAgentBg $agRect 10
DrawRoundedRectangle $g $pAgentBorder $agRect 10

$g.DrawString("THE SEVEN MODULAR AI AGENTS -- DUAL-ENGINE COORDINATION LAYER", $fAgentHeader, $bAgentDark, 44, ($agY + 10))
$g.DrawString("Deterministic rule execution on edge devices during disconnection, elevating to Google Gemini 3.8 Flash in cloud", $fTierSub, $bAgentPrimary, 44, ($agY + 30))

# 7 Agent Cards Grid
$agentW = 334
$agentH = 265
$agentStartX = 40
$agentGap = 16

$agents = @(
    @{
        num = "1";
        name = "Orchestrator Agent";
        role = "Intent & Safety Boundary Gate";
        bullets = @(
            "- Classifies citizen, responder, and coordinator requests",
            "- Binds model prompts strictly to verified database records",
            "- Human-In-The-Loop gate on consequential dispatches",
            "- Routes queries between local rules and cloud Gemini"
        )
    },
    @{
        num = "2";
        name = "Information Agent";
        role = "Dual-Engine Citizen Q&A";
        bullets = @(
            "- Answers questions on shelters, relief water, medical clinics",
            "- Cloud: Gemini 3.8 Flash for rich natural-language synthesis",
            "- Edge: Grounded IndexedDB deterministic query matching",
            "- Strictly cites explicit evidence record IDs (zero guessing)"
        )
    },
    @{
        num = "3";
        name = "Situation Agent";
        role = "Hazard & Flood Telemetry";
        bullets = @(
            "- Clusters incoming reports by barangay sector & coordinates",
            "- Tracks flood depths, road submersion, electrical hazards",
            "- Eliminates duplicate reports from neighboring residents",
            "- Correlates citizen hazard reports with river water levels"
        )
    },
    @{
        num = "4";
        name = "Resource Agent";
        role = "Deterministic Inventory Ledger";
        bullets = @(
            "- Tracks stocks for potable water, food packs, boats, fuel",
            "- Executes deterministic supply burn-rate projections",
            "- Enforces strict non-negative inventory allocation rule",
            "- Monitors shelter capacity thresholds and resupply triggers"
        )
    },
    @{
        num = "5";
        name = "Needs & Coordination";
        role = "Triage Scoring & Dispatch";
        bullets = @(
            "- Structures and validates household assistance requests",
            "- Calculates transparent vulnerability score (0-100 scale)",
            "- Prioritizes bedridden seniors, infants, and wheelchair users",
            "- Proposes optimized rescue missions matching specialized assets"
        )
    },
    @{
        num = "6";
        name = "Verification Agent";
        role = "Cross-Validation & Audit";
        bullets = @(
            "- Cross-references multi-source reports across timestamps",
            "- Flags contradictory hazard statements (passable vs blocked)",
            "- Immutably preserves original citizen reports without edits",
            "- Records coordinator verification rationale in audit journal"
        )
    },
    @{
        num = "7";
        name = "Sync Agent";
        role = "Idempotent Queue & Reconnect";
        bullets = @(
            "- Actively probes backend health (/api/v1/health)",
            "- Manages durable IndexedDB pending-event queue with UUIDs",
            "- Executes exponential backoff and jitter on reconnections",
            "- Flags concurrent record edit conflicts for human adjudication"
        )
    }
)

for ($i = 0; $i -lt $agents.Count; $i++) {
    $ag = $agents[$i]
    $ax = $agentStartX + $i * ($agentW + $agentGap)
    $ay = $agY + 52

    $aCardRect = New-Object System.Drawing.Rectangle($ax, $ay, $agentW, $agentH)
    FillRoundedRectangle $g $bWhite $aCardRect 8
    DrawRoundedRectangle $g $pBorder $aCardRect 8

    # Agent Number Pill
    $pillRect = New-Object System.Drawing.Rectangle(($ax + 10), ($ay + 10), 22, 22)
    FillRoundedRectangle $g $bAgentBg $pillRect 4
    DrawRoundedRectangle $g $pAgentBorder $pillRect 4
    $g.DrawString($ag.num, $fBadge, $bAgentDark, [System.Drawing.RectangleF]::new($pillRect.X, $pillRect.Y, $pillRect.Width, $pillRect.Height), $sfCtr)

    # Agent Title & Role
    $g.DrawString($ag.name, $fAgentTitle, $bTextMain, ($ax + 36), ($ay + 8))
    $g.DrawString($ag.role, $fAgentRole, $bAgentPrimary, ($ax + 36), ($ay + 24))

    # Divider line
    $g.DrawLine($pBorder, ($ax + 10), ($ay + 42), ($ax + $agentW - 10), ($ay + 42))

    # Bullets
    $bulletText = $ag.bullets -join "`n`n"
    DrawWrappedText $g $bulletText $fAgentBody $bTextMuted ($ax + 10) ($ay + 48) ($agentW - 20) 210
}


# ==========================================
# 4. BOTTOM ENGINEERING VERIFICATION & SLA BAR (Y: 1035 to 1088)
# ==========================================
$botRect = New-Object System.Drawing.Rectangle(28, 1035, ($width - 56), 52)
FillRoundedRectangle $g $bBg $botRect 8
DrawRoundedRectangle $g $pBorderDark $botRect 8

$g.DrawString("ENGINEERING VERIFICATION & RESILIENCE BASELINE:", $fFooter, $bTextMain, 44, 1043)
$botText = "244+ Documented System Assertions  |  Sub-15ms Local IndexedDB Write Latency  |  Zero Cloud Dependency for Core Citizen Safety  |  Tested Against Marikina River Telemetry (Typhoon Ondoy / Ulysses Baselines, Alarm Level 3 at 18m)  |  Aligned with UN SDGs 11 & 13"
$g.DrawString($botText, $fFooterBody, $bTextMuted, 44, 1063)

# Save High Resolution Image
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully generated architecture diagram image: $outputPath"

if (-not (Test-Path "c:\Users\hmanito\antigravity\Resilia\dist\images")) {
    New-Item -ItemType Directory -Path "c:\Users\hmanito\antigravity\Resilia\dist\images" -Force | Out-Null
}
Copy-Item $outputPath $distOutputPath -Force
Write-Host "Copied to dist: $distOutputPath"

$sfCtr.Dispose()
$g.Dispose()
$bmp.Dispose()
