# Resilia Process Flow & Use-Case Diagram Generator
# Generates a crisp, ultra-high-resolution (2500 x 1100 px) diagram image
# Exactly matching PPTX DrawingML 8,000,000 x 3,520,000 EMU aspect ratio (2.2727:1) with 0.00% distortion.
# Strictly NO emojis anywhere in the diagram. Clean ASCII typography.

Add-Type -AssemblyName System.Drawing

$outputPath = "c:\Users\hmanito\antigravity\Resilia\public\images\process_flow_diagram.png"
$distOutputPath = "c:\Users\hmanito\antigravity\Resilia\dist\images\process_flow_diagram.png"

$width = 2500
$height = 1100

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

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

$cBg = [System.Drawing.Color]::FromArgb(248, 250, 252) # Slate 50
$cCardBg = [System.Drawing.Color]::White
$cBorder = [System.Drawing.Color]::FromArgb(226, 232, 240) # Slate 200
$cBorderDark = [System.Drawing.Color]::FromArgb(203, 213, 225) # Slate 300

$cTextMain = [System.Drawing.Color]::FromArgb(15, 23, 42) # Slate 900
$cTextMuted = [System.Drawing.Color]::FromArgb(51, 65, 85) # Slate 700
$cTextSub = [System.Drawing.Color]::FromArgb(100, 116, 139) # Slate 500

$fontFamily = 'Segoe UI'
$fSuperTitle = New-Object System.Drawing.Font($fontFamily, 20, [System.Drawing.FontStyle]::Bold)
$fSuperSub = New-Object System.Drawing.Font($fontFamily, 11.5, [System.Drawing.FontStyle]::Regular)
$fStageHeader = New-Object System.Drawing.Font($fontFamily, 13, [System.Drawing.FontStyle]::Bold)
$fStageActor = New-Object System.Drawing.Font($fontFamily, 9.5, [System.Drawing.FontStyle]::Bold)
$fSectionTitle = New-Object System.Drawing.Font($fontFamily, 9, [System.Drawing.FontStyle]::Bold)
$fCardBody = New-Object System.Drawing.Font($fontFamily, 8.2, [System.Drawing.FontStyle]::Regular)
$fBadge = New-Object System.Drawing.Font($fontFamily, 8.5, [System.Drawing.FontStyle]::Bold)
$fFooter = New-Object System.Drawing.Font($fontFamily, 9, [System.Drawing.FontStyle]::Bold)
$fFooterBody = New-Object System.Drawing.Font($fontFamily, 8.5, [System.Drawing.FontStyle]::Regular)
$fFlowLabel = New-Object System.Drawing.Font($fontFamily, 7.5, [System.Drawing.FontStyle]::Bold)

$bBg = New-Object System.Drawing.SolidBrush($cBg)
$bWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$bTextMain = New-Object System.Drawing.SolidBrush($cTextMain)
$bTextMuted = New-Object System.Drawing.SolidBrush($cTextMuted)
$bTextSub = New-Object System.Drawing.SolidBrush($cTextSub)

$pBorder = New-Object System.Drawing.Pen($cBorder, 1.5)
$pBorderDark = New-Object System.Drawing.Pen($cBorderDark, 1.5)

$sfCtr = New-Object System.Drawing.StringFormat
$sfCtr.Alignment = [System.Drawing.StringAlignment]::Center
$sfCtr.LineAlignment = [System.Drawing.StringAlignment]::Center

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

$g.DrawString("RESILIA END-TO-END EMERGENCY PROCESS FLOW & USE-CASE DIAGRAM", $fSuperTitle, $bTextMain, 44, 28)
$g.DrawString("Five-Stage Disaster Lifecycle: Citizen Ingestion -> AI Dual-Engine Triage -> Human Gatekeeper -> Field Action -> Shelter Aid & Sync", $fSuperSub, $bTextSub, 46, 58)

# Header Badges (Right Aligned)
$badge1Rect = New-Object System.Drawing.Rectangle(($width - 700), 34, 205, 38)
FillRoundedRectangle $g (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 246, 255))) $badge1Rect 6
DrawRoundedRectangle $g (New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(191, 219, 254), 1.5)) $badge1Rect 6
$g.DrawString("RESIDENT COCKPIT", $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 58, 138))), [System.Drawing.RectangleF]::new($badge1Rect.X, $badge1Rect.Y, $badge1Rect.Width, $badge1Rect.Height), $sfCtr)

$badge2Rect = New-Object System.Drawing.Rectangle(($width - 485), 34, 215, 38)
FillRoundedRectangle $g (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 243, 255))) $badge2Rect 6
DrawRoundedRectangle $g (New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(221, 214, 254), 1.5)) $badge2Rect 6
$g.DrawString("AI & HUMAN GATEWAY", $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(91, 33, 182))), [System.Drawing.RectangleF]::new($badge2Rect.X, $badge2Rect.Y, $badge2Rect.Width, $badge2Rect.Height), $sfCtr)

$badge3Rect = New-Object System.Drawing.Rectangle(($width - 260), 34, 225, 38)
FillRoundedRectangle $g (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 253, 244))) $badge3Rect 6
DrawRoundedRectangle $g (New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(167, 243, 208), 1.5)) $badge3Rect 6
$g.DrawString("FIELD & SHELTER OPS", $fBadge, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 95, 70))), [System.Drawing.RectangleF]::new($badge3Rect.X, $badge3Rect.Y, $badge3Rect.Width, $badge3Rect.Height), $sfCtr)

# ==========================================
# 2. FIVE DISASTER LIFECYCLE STAGES (Y: 96 to 1025)
# ==========================================
$colY = 96
$colH = 925

$cardW = 440
$flowGap = 60
$startX = 30

$stages = @(
    @{
        num = "STAGE 1"
        title = "Incident Ingestion"
        actor = "RESIDENT & SENSORS"
        color = [System.Drawing.Color]::FromArgb(37, 99, 235)
        bgColor = [System.Drawing.Color]::FromArgb(239, 246, 255)
        borderColor = [System.Drawing.Color]::FromArgb(191, 219, 254)
        sec1Title = "INPUT TELEMETRY & TRIGGERS"
        sec1Body = "- Citizen taps 1-touch SOS Beacon or optical Morse strobe`n" +
                   "- GPS coordinates & household medical needs captured locally`n" +
                   "- Simulated Marikina River gauge crosses Alarm 3 (18m)`n" +
                   "- Resident checks offline Go-Bag & nearest high ground"
        sec2Title = "LOCAL EDGE PROCESSING"
        sec2Body = "- Sub-15ms write commits to client IndexedDB store`n" +
                   "- Zero spinner latency: continues logging during network outages`n" +
                   "- SHA-256 hash generated for immutable audit trail`n" +
                   "- Payload queued in local write-ahead outbox"
        sec3Title = "OUTCOME & ARTIFACT"
        sec3Body = "- Cryptographic Outbox Record (UUIDv4)`n" +
                   "- Active SOS Beacon ping queued for mesh/uplink`n" +
                   "- Resident UI switches to survival instructions"
        sec4Title = "OFFLINE RESILIENCE SOP"
        sec4Body = "- Zero-drain OLED dark mode preserves battery up to 72 hours`n" +
                   "- Tagalog/English emergency first-aid guides pre-cached`n" +
                   "- P2P Wi-Fi/Bluetooth beacon broadcasts to passing rescue boats"
    },
    @{
        num = "STAGE 2"
        title = "Dual-Engine AI Triage"
        actor = "GEMINI + EDGE RULES"
        color = [System.Drawing.Color]::FromArgb(124, 58, 237)
        bgColor = [System.Drawing.Color]::FromArgb(245, 243, 255)
        borderColor = [System.Drawing.Color]::FromArgb(221, 214, 254)
        sec1Title = "ONLINE CLOUD INTELLIGENCE"
        sec1Body = "- Google Gemini 3.8 Flash clusters spatial SOS pings`n" +
                   "- Macro situation brief synthesized for DRRMO chiefs`n" +
                   "- Correlates river surge rates with citizen flood depths`n" +
                   "- Strict JSON schema output with anti-hallucination bounds"
        sec2Title = "OFFLINE DETERMINISTIC ENGINE"
        sec2Body = "- Transparent vulnerability scoring formula (0-100 scale)`n" +
                   "- Bedridden seniors (+30), infants (+25), mobility (+20)`n" +
                   "- Generates 94/100 urgent rescue priority candidate`n" +
                   "- Executes locally in sub-15ms if cloud backhaul severed"
        sec3Title = "OUTCOME & ARTIFACT"
        sec3Body = "- Prioritized Mission Candidate Payload`n" +
                   "- Triage score breakdown with citations`n" +
                   "- Candidate rescue route avoiding deep waters"
        sec4Title = "ANTI-HALLUCINATION BOUNDS"
        sec4Body = "- Strict grounding against NDRRMC/DOH standard disaster rules`n" +
                   "- Deterministic triage overrides probabilistic Gemini output`n" +
                   "- Cites exact database record IDs with cryptographic hashes"
    },
    @{
        num = "STAGE 3"
        title = "Human Authorization Gate"
        actor = "INCIDENT COMMANDER"
        color = [System.Drawing.Color]::FromArgb(217, 119, 6)
        bgColor = [System.Drawing.Color]::FromArgb(254, 243, 199)
        borderColor = [System.Drawing.Color]::FromArgb(253, 230, 138)
        sec1Title = "DECISION SUPPORT INSPECTION"
        sec1Body = "- Commander inspects AI evidence citations & telemetry`n" +
                   "- Verifies live river gauge (Alarm 3: 18.2m rising)`n" +
                   "- Reviews real-time boat squad inventory & fuel levels`n" +
                   "- Checks Tumana evacuation center capacity (82% full)"
        sec2Title = "HUMAN-IN-THE-LOOP SAFETY GATE"
        sec2Body = "- Mandatory officer approval before field squad dispatch`n" +
                   "- Prevents autonomous rogue AI decisions in life safety`n" +
                   "- Commander can override priority or assign extra boats`n" +
                   "- Digital signature committed to immutable audit journal"
        sec3Title = "OUTCOME & ARTIFACT"
        sec3Body = "- Official Signed Rescue Mission Dispatch`n" +
                   "- Designated Squad Alpha-2 assigned to coordinates`n" +
                   "- Audit event committed to sync ledger"
        sec4Title = "COMMAND GOVERNANCE"
        sec4Body = "- Dual-key authorization for high-risk water rescue operations`n" +
                   "- Auto-escalates if response time exceeds 15-minute SLA`n" +
                   "- Full audit trail recorded for post-disaster COA compliance"
    },
    @{
        num = "STAGE 4"
        title = "Field Responder Action"
        actor = "RESCUE SQUADS (BFP/PCG)"
        color = [System.Drawing.Color]::FromArgb(5, 150, 105)
        bgColor = [System.Drawing.Color]::FromArgb(240, 253, 244)
        borderColor = [System.Drawing.Color]::FromArgb(167, 243, 208)
        sec1Title = "OFFLINE MISSION RECEIPT"
        sec1Body = "- Rescue boat squad receives mission on ruggedized tablet`n" +
                   "- Offline vector map renders safe route around floods`n" +
                   "- Real-time hazard pins warn of live downed power lines`n" +
                   "- Target coordinates locked: 3 household members trapped"
        sec2Title = "START FIELD TRIAGE ON-SCENE"
        sec2Body = "- Responders locate residents using optical strobe beacon`n" +
                   "- Standard START Triage performed (Red / Yellow / Green)`n" +
                   "- Emergency medical stabilization administered on-site`n" +
                   "- Offline QR wristband issued linking citizen record"
        sec3Title = "OUTCOME & ARTIFACT"
        sec3Body = "- Evacuee Encrypted QR Wristband Pass`n" +
                   "- Field rescue status updated to COMPLETED`n" +
                   "- Transit started toward designated shelter"
        sec4Title = "TACTICAL FIELD TELEMETRY"
        sec4Body = "- Dynamic re-routing if roads submerge past 1.5m boat draft`n" +
                   "- Real-time battery and fuel burn tracking on responder tablet`n" +
                   "- Auto-syncs mission status on opportunistic mesh/cellular ping"
    },
    @{
        num = "STAGE 5"
        title = "Shelter Intake & Sync"
        actor = "SHELTER VOLUNTEERS"
        color = [System.Drawing.Color]::FromArgb(225, 29, 72)
        bgColor = [System.Drawing.Color]::FromArgb(255, 241, 242)
        borderColor = [System.Drawing.Color]::FromArgb(254, 205, 211)
        sec1Title = "SHELTER REGISTRATION & TRIAGE"
        sec1Body = "- Volunteer scans resident QR pass at intake checkpoint`n" +
                   "- Medical needs flagged: dialysis and infant formula`n" +
                   "- Missing Kin database queried for family reunification`n" +
                   "- Water Safety & Leptospirosis 72h countdown started"
        sec2Title = "TAMPER-RESISTANT AYUDA LEDGER"
        sec2Body = "- Relief pack allocation scanned and locked to citizen ID`n" +
                   "- 24-hour cooldown timer prevents duplicate aid claims`n" +
                   "- Zero overdraft: stock decrements locally in sub-15ms`n" +
                   "- Peer barter aid posted to Bayanihan community board"
        sec3Title = "OUTCOME & ARTIFACT"
        sec3Body = "- Reconciled Global City Master Ledger`n" +
                   "- Idempotent Sync replicates to Cloud Run / Firestore`n" +
                   "- Full recovery metrics archived for Build Back Better"
        sec4Title = "RECOVERY & RECONCILIATION"
        sec4Body = "- Multi-agency master sync (DSWD, LGU, Red Cross relief pools)`n" +
                   "- Automated deduplication prevents aid scalping and fraud`n" +
                   "- Anonymized statistical feeds export to Sendai framework portal"
    }
)

$handoffLabels = @("SOS TELEMETRY", "PRIORITY 94", "DISPATCH ORDER", "QR INTAKE")

for ($i = 0; $i -lt $stages.Count; $i++) {
    $st = $stages[$i]
    $cx = $startX + $i * ($cardW + $flowGap)

    $bStageBg = New-Object System.Drawing.SolidBrush($st.bgColor)
    $bStageColor = New-Object System.Drawing.SolidBrush($st.color)
    $pStageBorder = New-Object System.Drawing.Pen($st.borderColor, 1.5)

    $cardRect = New-Object System.Drawing.Rectangle($cx, $colY, $cardW, $colH)
    FillRoundedRectangle $g $bStageBg $cardRect 10
    DrawRoundedRectangle $g $pStageBorder $cardRect 10

    # Stage Badge Pill
    $badgeRect = New-Object System.Drawing.Rectangle(($cx + 14), ($colY + 12), 110, 28)
    FillRoundedRectangle $g $bStageColor $badgeRect 5
    $g.DrawString($st.num, $fBadge, $bWhite, [System.Drawing.RectangleF]::new($badgeRect.X, $badgeRect.Y, $badgeRect.Width, $badgeRect.Height), $sfCtr)

    # Stage Title & Actor
    $g.DrawString($st.title, $fStageHeader, $bTextMain, ($cx + 132), ($colY + 10))
    $g.DrawString($st.actor, $fStageActor, $bStageColor, ($cx + 132), ($colY + 28))

    # Inner 4 Boxes
    $boxH = 205
    $boxW = $cardW - 24
    $boxGap = 10
    $sY0 = $colY + 50

    # Box 1: Input / Triggers
    $b1Rect = New-Object System.Drawing.Rectangle(($cx + 12), $sY0, $boxW, $boxH)
    FillRoundedRectangle $g $bWhite $b1Rect 8
    DrawRoundedRectangle $g $pBorder $b1Rect 8
    $g.DrawString($st.sec1Title, $fSectionTitle, $bTextMain, ($cx + 18), ($sY0 + 8))
    $g.DrawLine($pBorder, ($cx + 18), ($sY0 + 26), ($cx + $boxW - 6), ($sY0 + 26))
    DrawWrappedText $g $st.sec1Body $fCardBody $bTextMuted ($cx + 18) ($sY0 + 32) ($boxW - 14) 165

    # Box 2: Core Processing / Rules
    $sY1 = $sY0 + $boxH + $boxGap
    $b2Rect = New-Object System.Drawing.Rectangle(($cx + 12), $sY1, $boxW, $boxH)
    FillRoundedRectangle $g $bWhite $b2Rect 8
    DrawRoundedRectangle $g $pBorder $b2Rect 8
    $g.DrawString($st.sec2Title, $fSectionTitle, $bTextMain, ($cx + 18), ($sY1 + 8))
    $g.DrawLine($pBorder, ($cx + 18), ($sY1 + 26), ($cx + $boxW - 6), ($sY1 + 26))
    DrawWrappedText $g $st.sec2Body $fCardBody $bTextMuted ($cx + 18) ($sY1 + 32) ($boxW - 14) 165

    # Box 3: Output Artifact
    $sY2 = $sY1 + $boxH + $boxGap
    $b3Rect = New-Object System.Drawing.Rectangle(($cx + 12), $sY2, $boxW, $boxH)
    FillRoundedRectangle $g $bWhite $b3Rect 8
    DrawRoundedRectangle $g $pBorder $b3Rect 8
    $g.DrawString($st.sec3Title, $fSectionTitle, $bStageColor, ($cx + 18), ($sY2 + 8))
    $g.DrawLine($pBorder, ($cx + 18), ($sY2 + 26), ($cx + $boxW - 6), ($sY2 + 26))
    DrawWrappedText $g $st.sec3Body $fCardBody $bTextMuted ($cx + 18) ($sY2 + 32) ($boxW - 14) 165

    # Box 4: Resilience & SOP
    $sY3 = $sY2 + $boxH + $boxGap
    $b4Rect = New-Object System.Drawing.Rectangle(($cx + 12), $sY3, $boxW, $boxH)
    FillRoundedRectangle $g $bWhite $b4Rect 8
    DrawRoundedRectangle $g $pBorder $b4Rect 8
    $g.DrawString($st.sec4Title, $fSectionTitle, $bTextSub, ($cx + 18), ($sY3 + 8))
    $g.DrawLine($pBorder, ($cx + 18), ($sY3 + 26), ($cx + $boxW - 6), ($sY3 + 26))
    DrawWrappedText $g $st.sec4Body $fCardBody $bTextMuted ($cx + 18) ($sY3 + 32) ($boxW - 14) 165

    # Draw Directional Flow Arrows between Stages
    if ($i -lt ($stages.Count - 1)) {
        $ax1 = $cx + $cardW + 4
        $ax2 = $cx + $cardW + $flowGap - 4
        $ay1 = $colY + ($colH / 2)

        $pFlow = New-Object System.Drawing.Pen($st.color, 2.5)
        $bFlow = New-Object System.Drawing.SolidBrush($st.color)
        DrawArrow $g $pFlow $bFlow $ax1 $ay1 $ax2 $ay1 8

        # Labeled Flow Badge in the gap
        $fPillW = 82
        $fPillH = 20
        $fPillX = (($ax1 + $ax2) / 2) - ($fPillW / 2)
        $fPillY = $ay1 - 26
        $fPillRect = New-Object System.Drawing.Rectangle($fPillX, $fPillY, $fPillW, $fPillH)
        FillRoundedRectangle $g $bWhite $fPillRect 4
        DrawRoundedRectangle $g $pStageBorder $fPillRect 4
        $lbl = $handoffLabels[$i]
        $g.DrawString($lbl, $fFlowLabel, $bStageColor, [System.Drawing.RectangleF]::new($fPillRect.X, $fPillRect.Y, $fPillRect.Width, $fPillRect.Height), $sfCtr)

        $pFlow.Dispose()
        $bFlow.Dispose()
    }

    $bStageBg.Dispose()
    $bStageColor.Dispose()
    $pStageBorder.Dispose()
}

# ==========================================
# 3. BOTTOM WORKFLOW & GOVERNANCE BAR (Y: 1035 to 1088)
# ==========================================
$botRect = New-Object System.Drawing.Rectangle(28, 1035, ($width - 56), 52)
FillRoundedRectangle $g $bBg $botRect 8
DrawRoundedRectangle $g $pBorderDark $botRect 8

$g.DrawString("OPERATIONAL GOVERNANCE & TRIPLE-ROLE DISASTER WORKFLOWS:", $fFooter, $bTextMain, 44, 1043)
$botText = "Residents (SOS Beacon & Offline Shelter Lookup)  ->  Coordinators (Dual-Engine AI Triage & Cryptographic Dispatch Gate)  ->  Responders (Offline Maps, START Triage & Shelter QR Aid)"
$g.DrawString($botText, $fFooterBody, $bTextMuted, 44, 1063)

# Save High Resolution Image
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully generated process flow diagram image: $outputPath"

if (-not (Test-Path "c:\Users\hmanito\antigravity\Resilia\dist\images")) {
    New-Item -ItemType Directory -Path "c:\Users\hmanito\antigravity\Resilia\dist\images" -Force | Out-Null
}
Copy-Item $outputPath $distOutputPath -Force
Write-Host "Copied to dist: $distOutputPath"

$sfCtr.Dispose()
$g.Dispose()
$bmp.Dispose()
