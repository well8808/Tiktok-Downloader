$ErrorActionPreference = "Stop"
$BinDir = Join-Path $PSScriptRoot "..\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Path $BinDir | Out-Null }

$YtDlp = Join-Path $BinDir "yt-dlp.exe"
$Ffmpeg = Join-Path $BinDir "ffmpeg.exe"
$Ffprobe = Join-Path $BinDir "ffprobe.exe"

# 1. yt-dlp
if (-not (Test-Path $YtDlp)) {
  Write-Host "Baixando yt-dlp..."
  try {
    Invoke-WebRequest -UseBasicParsing `
      -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" `
      -OutFile $YtDlp
    Write-Host "yt-dlp instalado."
  } catch {
    Write-Host "Falha no download primário, tentando fallback..."
    Invoke-WebRequest -UseBasicParsing `
      -Uri "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.exe" `
      -OutFile $YtDlp
    Write-Host "yt-dlp instalado via nightly."
  }
} else {
  Write-Host "yt-dlp ja existe."
}

# 2. ffmpeg + ffprobe (essentials build)
if (-not (Test-Path $Ffmpeg) -or -not (Test-Path $Ffprobe)) {
  Write-Host "Baixando ffmpeg..."
  $ZipPath = Join-Path $env:TEMP "ffmpeg.zip"
  $UrlsToTry = @(
    "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
    "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
  )
  $Downloaded = $false
  foreach ($Url in $UrlsToTry) {
    try {
      Write-Host "Tentando $Url"
      Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $ZipPath
      $Downloaded = $true
      break
    } catch {
      Write-Host "Falhou: $($_.Exception.Message)"
    }
  }
  if (-not $Downloaded) {
    throw "Nao foi possivel baixar o ffmpeg em nenhuma fonte."
  }
  $ExtractDir = Join-Path $env:TEMP "ffmpeg-extract"
  if (Test-Path $ExtractDir) { Remove-Item -Recurse -Force $ExtractDir }
  Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
  $FfmpegBin = Get-ChildItem -Path $ExtractDir -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
  $FfprobeBin = Get-ChildItem -Path $ExtractDir -Recurse -Filter "ffprobe.exe" | Select-Object -First 1
  if (-not $FfmpegBin -or -not $FfprobeBin) {
    throw "Binarios ffmpeg/ffprobe nao encontrados no zip baixado."
  }
  Copy-Item $FfmpegBin.FullName $Ffmpeg
  Copy-Item $FfprobeBin.FullName $Ffprobe
  Remove-Item $ZipPath -Force
  Remove-Item -Recurse -Force $ExtractDir
  Write-Host "ffmpeg + ffprobe instalados."
} else {
  Write-Host "ffmpeg ja existe."
}

Write-Host "Bootstrap completo."
