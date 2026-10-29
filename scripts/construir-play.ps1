# Arma el paquete para PLAY STORE (npm run play): un .aab firmado con tu llave.
#   - SUBE SOLO la versión (android/version.properties): el VERSION_CODE +1 en cada publicación (Play Store
#     solo entrega la actualización a los jugadores si es mayor que el anterior) y el VERSION_NAME el de
#     package.json ("version"). Si quieres que diga otra versión, cambia "version" en package.json antes.
#   - Copia el juego a Android (npm run sync) y compila en modo release.
#   - El paquete queda en la raíz: TrollNight-<versión>-<código>.aab (súbelo en Play Console).
# Necesita la llave: npm run llave (una sola vez).

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$props = Join-Path $raiz 'android\keystore.properties'
if (-not (Test-Path $props)) { throw 'Falta la llave de firma. Créala una vez con: npm run llave' }

function Primero($rutas) { foreach ($r in $rutas) { if ($r -and (Test-Path $r)) { return $r } }; return $null }
function Carpeta($donde, $filtro = '*') {
    if (-not (Test-Path $donde)) { return $null }
    return (Get-ChildItem $donde -Filter $filtro | Where-Object { $_.PSIsContainer } | Select-Object -First 1).FullName
}
$jdk = Primero @((Carpeta 'C:\Program Files\Microsoft' 'jdk-21*'), (Carpeta 'D:\Android\jdk'), 'C:\Program Files\Android\Android Studio\jbr')
$sdk = Primero @("$env:LOCALAPPDATA\Android\Sdk", 'D:\Android\sdk')
if (-not $jdk) { throw 'No se encontró Java 21 (instálalo con: winget install Microsoft.OpenJDK.21)' }
if (-not $sdk) { throw 'No se encontró el Android SDK' }
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
if (Test-Path 'D:\Android') { $env:GRADLE_USER_HOME = 'D:\Android\gradle' }
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# ---- la versión: +1 al código, el nombre de package.json ----
$archivoVersion = Join-Path $raiz 'android\version.properties'
$texto = Get-Content $archivoVersion -Raw
$codigo = [int]([regex]::Match($texto, 'VERSION_CODE=(\d+)').Groups[1].Value) + 1
$nombre = (Get-Content (Join-Path $raiz 'package.json') -Raw | ConvertFrom-Json).version
$texto = [regex]::Replace($texto, 'VERSION_CODE=\d+', "VERSION_CODE=$codigo")
$texto = [regex]::Replace($texto, 'VERSION_NAME=.*', "VERSION_NAME=$nombre")
Set-Content -Path $archivoVersion -Value $texto.TrimEnd() -Encoding ascii
Write-Host "Versión: $nombre (código $codigo)" -ForegroundColor Cyan

Set-Location $raiz
npm.cmd run sync
if ($LASTEXITCODE -ne 0) { throw 'Falló copiar el juego a Android' }

Set-Location "$raiz\android"
.\gradlew.bat bundleRelease --no-daemon
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del paquete para Play Store' }

$salida = Join-Path $raiz "TrollNight-$nombre-$codigo.aab"
Copy-Item "$raiz\android\app\build\outputs\bundle\release\app-release.aab" $salida -Force
Write-Host "Listo: $salida" -ForegroundColor Green
Write-Host 'Súbelo en Play Console > tu app > Prueba / Producción > Crear versión.'
