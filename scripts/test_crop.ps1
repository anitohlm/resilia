Add-Type -AssemblyName System.Drawing

$base = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\resilia_cellphone_clean_base.jpg")
Write-Host "Base: $($base.Width) x $($base.Height)"

# Crop around the phone:
# Phone screen: X=804, Y=86, W=266, H=579
# Center of screen is X=937, Y=375
# Let's crop a box centered on the phone:
# e.g., X from 740 to 1134 (width 394), Y from 30 to 720 (height 690)
$cropX = 740
$cropY = 30
$cropW = 394
$cropH = 690

$cropped = New-Object System.Drawing.Bitmap($cropW, $cropH)
$cg = [System.Drawing.Graphics]::FromImage($cropped)
$cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cg.DrawImage($base, [System.Drawing.Rectangle]::new(0, 0, $cropW, $cropH), [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$cg.Dispose()

$cropped.Save("$PSScriptRoot\phone_cropped_sample.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$cropped.Dispose()
$base.Dispose()
Write-Host "Saved phone_cropped_sample.jpg"
