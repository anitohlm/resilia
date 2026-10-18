Add-Type -AssemblyName System.Drawing

function Inspect-Region($imagePath, $xStart, $xEnd, $yStart, $yEnd) {
    $bmp = [System.Drawing.Bitmap]::FromFile($imagePath)
    Write-Host "Inspecting $imagePath..."
    for ($y = $yStart; $y -le $yEnd; $y += 20) {
        $blackStarts = -1
        $blackEnds = -1
        for ($x = $xStart; $x -le $xEnd; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.R -lt 15 -and $p.G -lt 15 -and $p.B -lt 15) {
                if ($blackStarts -eq -1) { $blackStarts = $x }
                $blackEnds = $x
            }
        }
        if ($blackStarts -ne -1) {
            Write-Host "Y=$y : Black X=[$blackStarts, $blackEnds] (W=$($blackEnds - $blackStarts))"
        }
    }
    $bmp.Dispose()
}

Write-Host "=== RESIDENT PHONE ==="
Inspect-Region "C:\Users\hmanito\.gemini\antigravity\brain\66d54b7b-9fe2-4f92-91e1-259dcfdbc027\phone_resident_base_1792245750567.jpg" 550 780 260 660

Write-Host "`n=== COORDINATOR PHONE ==="
Inspect-Region "C:\Users\hmanito\.gemini\antigravity\brain\66d54b7b-9fe2-4f92-91e1-259dcfdbc027\phone_coordinator_base_1792245726583.jpg" 830 1000 280 630
