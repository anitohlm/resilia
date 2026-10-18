Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\resilia_cellphone_clean_base.jpg")

# Test cropping a phone-centric box:
# Screen is at X: 804, Y: 86, W: 266, H: 579
# Phone bezel extends around it.
# Let's see what the image looks like around the screen:
# Left bezel: ~780, Right bezel: ~1090.
# Top bezel: ~60, Bottom bezel: ~680.
# Hand holding the phone: around the sides and bottom.
Write-Host "Screen center: X=$($dispX + $dispW/2), Y=$($dispY + $dispH/2)"

$img.Dispose()
