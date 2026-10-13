# Compila el APK de Android (npm run apk).
# Usa Java y el Android SDK instalados en D:\Android (no en C:, que tiene poco espacio).
# El APK queda en la raíz del proyecto: MonhabellAventura.apk

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

$env:JAVA_HOME = (Get-ChildItem 'D:\Android\jdk' -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME = 'D:\Android\sdk'
$env:ANDROID_SDK_ROOT = 'D:\Android\sdk'
$env:GRADLE_USER_HOME = 'D:\Android\gradle'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Set-Location $raiz
npm run sync
if ($LASTEXITCODE -ne 0) { throw 'Falló copiar el juego a Android' }

Set-Location "$raiz\android"
.\gradlew.bat assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del APK' }

Copy-Item "$raiz\android\app\build\outputs\apk\debug\app-debug.apk" "$raiz\MonhabellAventura.apk" -Force
Write-Host "Listo: $raiz\MonhabellAventura.apk"
