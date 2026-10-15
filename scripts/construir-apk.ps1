# Compila el APK de Android (npm run apk).
# Busca Java 21 y el Android SDK donde estén instalados:
#   - en esta PC: JDK de Microsoft en C:\Program Files\Microsoft y el SDK en %LOCALAPPDATA%\Android\Sdk
#   - en la otra: todo en D:\Android (no en C:, que allí tiene poco espacio)
# El APK queda en la raíz del proyecto: TrollNight.apk

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

function Primero($rutas) { foreach ($r in $rutas) { if ($r -and (Test-Path $r)) { return $r } }; return $null }
# primera carpeta dentro de 'donde' (si 'donde' existe: en una PC sin disco D: no se busca ahí)
function Carpeta($donde, $filtro = '*') {
    if (-not (Test-Path $donde)) { return $null }
    return (Get-ChildItem $donde -Filter $filtro | Where-Object { $_.PSIsContainer } | Select-Object -First 1).FullName
}

$jdk = Primero @(
    (Carpeta 'C:\Program Files\Microsoft' 'jdk-21*'),
    (Carpeta 'D:\Android\jdk'),
    'C:\Program Files\Android\Android Studio\jbr'
)
$sdk = Primero @("$env:LOCALAPPDATA\Android\Sdk", 'D:\Android\sdk')
if (-not $jdk) { throw 'No se encontró Java 21 (instálalo con: winget install Microsoft.OpenJDK.21)' }
if (-not $sdk) { throw 'No se encontró el Android SDK' }

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
if (Test-Path 'D:\Android') { $env:GRADLE_USER_HOME = 'D:\Android\gradle' } # (en la otra PC, fuera de C:)
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Write-Host "Java: $jdk"
Write-Host "SDK:  $sdk"

Set-Location $raiz
npm.cmd run sync # (npm.cmd: en esta PC hay un archivo "npm" suelto en system32 que confunde a PowerShell)
if ($LASTEXITCODE -ne 0) { throw 'Falló copiar el juego a Android' }

Set-Location "$raiz\android"
.\gradlew.bat assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del APK' }

Copy-Item "$raiz\android\app\build\outputs\apk\debug\app-debug.apk" "$raiz\TrollNight.apk" -Force
Write-Host "Listo: $raiz\TrollNight.apk"
