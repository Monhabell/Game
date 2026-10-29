# Crea la LLAVE DE FIRMA de Troll Night para Play Store (npm run llave). Se hace UNA SOLA VEZ.
#   - Crea android/troll-night-subida.jks (la llave) y android/keystore.properties (sus claves).
#   - Ninguno de los dos va a git (.gitignore).
#   - GUARDA UNA COPIA de los dos archivos y de la clave en un lugar seguro (Google Drive, un USB…):
#     si se pierden, Google tiene que reiniciar la llave (es posible con "firma de apps de Google Play",
#     pero lleva días). Nunca la compartas con nadie.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$llave = Join-Path $raiz 'android\troll-night-subida.jks'
$props = Join-Path $raiz 'android\keystore.properties'

if (Test-Path $llave) {
    Write-Host "Ya existe la llave: $llave" -ForegroundColor Yellow
    Write-Host 'No se crea otra (la de Play Store tiene que ser siempre la misma).'
    exit 0
}

# keytool viene con Java (el mismo que usa npm run apk)
function Primero($rutas) { foreach ($r in $rutas) { if ($r -and (Test-Path $r)) { return $r } }; return $null }
function Carpeta($donde, $filtro = '*') {
    if (-not (Test-Path $donde)) { return $null }
    return (Get-ChildItem $donde -Filter $filtro | Where-Object { $_.PSIsContainer } | Select-Object -First 1).FullName
}
$jdk = Primero @((Carpeta 'C:\Program Files\Microsoft' 'jdk-21*'), (Carpeta 'D:\Android\jdk'), 'C:\Program Files\Android\Android Studio\jbr')
if (-not $jdk) { throw 'No se encontró Java 21 (instálalo con: winget install Microsoft.OpenJDK.21)' }
$keytool = Join-Path $jdk 'bin\keytool.exe'

Write-Host ''
Write-Host '=== Llave de firma de Troll Night ===' -ForegroundColor Cyan
Write-Host 'Elige una clave de al menos 8 caracteres y ANÓTALA en un lugar seguro.'
$clave = Read-Host 'Clave de la llave' -AsSecureString
$repite = Read-Host 'Repite la clave' -AsSecureString
$c1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($clave))
$c2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($repite))
if ($c1 -ne $c2) { throw 'Las claves no coinciden' }
if ($c1.Length -lt 8) { throw 'La clave tiene que tener al menos 8 caracteres' }
$nombre = Read-Host 'Tu nombre (como desarrollador)'

& $keytool -genkeypair -v -keystore $llave -alias trollnight -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $c1 -keypass $c1 -dname "CN=$nombre, O=Troll Night, C=CO"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la llave' }

@"
# Claves de la llave de firma (scripts/crear-llave.ps1). NO subir a git ni compartir.
storeFile=troll-night-subida.jks
storePassword=$c1
keyAlias=trollnight
keyPassword=$c1
"@ | Set-Content -Path $props -Encoding ascii

Write-Host ''
Write-Host "Listo: $llave" -ForegroundColor Green
Write-Host 'IMPORTANTE: guarda una copia de troll-night-subida.jks y keystore.properties (carpeta android) fuera de esta PC.' -ForegroundColor Yellow
