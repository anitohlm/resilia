Add-Type -AssemblyName System.Drawing
$b1 = [System.Drawing.Bitmap]::FromFile("C:\Users\hmanito\.gemini\antigravity\brain\66d54b7b-9fe2-4f92-91e1-259dcfdbc027\phone_resident_base_1792245750567.jpg")
Write-Host "Resident base size: $($b1.Width) x $($b1.Height)"
$b1.Dispose()

$b2 = [System.Drawing.Bitmap]::FromFile("C:\Users\hmanito\.gemini\antigravity\brain\66d54b7b-9fe2-4f92-91e1-259dcfdbc027\phone_coordinator_base_1792245726583.jpg")
Write-Host "Coordinator base size: $($b2.Width) x $($b2.Height)"
$b2.Dispose()
