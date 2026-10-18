Add-Type -AssemblyName System.Drawing

$cleanBasePath = "$PSScriptRoot\resilia_cellphone_clean_base.jpg"
$base = [System.Drawing.Bitmap]::FromFile($cleanBasePath)

# Scale base 2x to 2752 x 1536
$scale = 2
$bigW = $base.Width * $scale
$bigH = $base.Height * $scale
$bigBmp = New-Object System.Drawing.Bitmap($bigW, $bigH)
$bg = [System.Drawing.Graphics]::FromImage($bigBmp)
$bg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$bg.DrawImage($base, 0, 0, $bigW, $bigH)
$bg.Dispose()
$base.Dispose()

Write-Host "Upscaled base to $bigW x $bigH"
$bigBmp.Dispose()
