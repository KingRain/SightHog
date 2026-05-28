$ErrorActionPreference = "Stop"

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$IngestUrl = if ($env:INGEST_URL) { $env:INGEST_URL } else { "http://localhost:8080/v1/events" }
$DashboardUrl = if ($env:DASHBOARD_URL) { $env:DASHBOARD_URL } else { "http://localhost:3000" }
$SessionId = if ($env:SESSION_ID) { $env:SESSION_ID } else { [guid]::NewGuid().ToString() }
$NowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Host "==> SightHog pipeline e2e"
Write-Host "Session ID: $SessionId"

$payload = @{
  sessionId = $SessionId
  userId = "pipeline-e2e"
  url = "http://localhost:3001/checkout"
  timestamp = $NowMs
  events = @(
    @{ type = 2; timestamp = $NowMs; data = @{ node = @{ type = 0; childNodes = @() } } },
    @{ type = 3; timestamp = ($NowMs + 500); data = @{ source = 1 } }
  )
  interactions = @(
    @{ type = "pageview"; x = 0; y = 0; target = "window"; timestamp = $NowMs },
    @{ type = "click"; x = 120; y = 240; target = "button#checkout"; timestamp = ($NowMs + 500) }
  )
  telemetry = @(
    @{
      type = "console"
      subType = "log"
      message = "E2E test console log"
      timestamp = ($NowMs + 100)
      metadata = @{}
    },
    @{
      type = "network"
      subType = "fetch"
      message = "GET https://httpbin.org/get"
      timestamp = ($NowMs + 200)
      metadata = @{ status = 200; durationMs = 42; ok = $true }
    },
    @{
      type = "vitals"
      subType = "LCP"
      message = "LCP: 1200"
      timestamp = ($NowMs + 300)
      metadata = @{ value = 1200; rating = "good" }
    }
  )
} | ConvertTo-Json -Depth 6 -Compress

Write-Host "==> POST ingest"
Invoke-RestMethod -Method POST -Uri $IngestUrl -ContentType "application/json" -Body $payload | Out-Null

Write-Host "==> Wait for workers (35s)"
Start-Sleep -Seconds 35

Write-Host "==> Dashboard metrics"
$metrics = Invoke-RestMethod -Uri "$DashboardUrl/api/metrics"
if (-not ($metrics | Where-Object { $_.event_name -eq "pageview" })) {
  throw "metrics missing pageview: $($metrics | ConvertTo-Json -Compress)"
}

Write-Host "==> Dashboard sessions"
$sessions = Invoke-RestMethod -Uri "$DashboardUrl/api/sessions"
if (-not ($sessions | Where-Object { $_.id -eq $SessionId })) {
  throw "session not found: $($sessions | ConvertTo-Json -Compress)"
}

Write-Host "==> Dashboard replay"
$replay = Invoke-RestMethod -Uri "$DashboardUrl/api/session/$SessionId"
if (-not $replay.hasFullSnapshot) {
  throw "replay missing full snapshot: $($replay | ConvertTo-Json -Compress)"
}

Write-Host "==> Dashboard telemetry"
$telemetry = Invoke-RestMethod -Uri "$DashboardUrl/api/session/$SessionId/telemetry"
if (-not $telemetry.logs -or $telemetry.logs.Count -lt 1) {
  throw "telemetry logs missing: $($telemetry | ConvertTo-Json -Compress)"
}
$consoleLog = $telemetry.logs | Where-Object { $_.type -eq "console" -and $_.subType -eq "log" }
if (-not $consoleLog) {
  throw "telemetry missing console log: $($telemetry | ConvertTo-Json -Compress)"
}

Write-Host "PASS: ingest -> workers -> dashboard APIs (including telemetry_logs)"
