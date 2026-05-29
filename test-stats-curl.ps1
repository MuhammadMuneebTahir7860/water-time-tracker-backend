$BASE = "http://localhost:5000"
$DEVICE = "curl-local-verify-$(Get-Random -Maximum 9999)"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  STATS API CURL VERIFICATION (LOCAL)" -ForegroundColor Cyan
Write-Host "  Server: $BASE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ── Step 1: Register device and get token ─────────────────────────────────────
Write-Host ""
Write-Host "[1/4] POST /v1/auth/device  (get JWT token)" -ForegroundColor Yellow

$loginBody = @{
    device_id        = $DEVICE
    platform         = "android"
    app_version      = "1.0.0"
    goalMl           = 2500
    reminders        = @(
        @{ startTime = "08:00"; endTime = "22:00"; intervalMinutes = 120; isCustom = $false; enabled = $true }
    )
} | ConvertTo-Json -Compress -Depth 5

$loginResp = Invoke-RestMethod `
    -Uri "$BASE/v1/auth/device" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$TOKEN = $loginResp.token
if (-not $TOKEN) {
    Write-Host "  ERROR: Could not get token." -ForegroundColor Red
    $loginResp | ConvertTo-Json -Depth 5
    exit 1
}
Write-Host "  Token acquired. Device: $DEVICE" -ForegroundColor Green
Write-Host "  Token prefix: $($TOKEN.Substring(0,40))..." -ForegroundColor DarkGray

$HEADERS = @{ Authorization = "Bearer $TOKEN" }
$TODAY = (Get-Date).ToString("yyyy-MM-dd")

# ── Step 2: Weekly stats ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] GET /v1/user/stats/weekly?date=$TODAY" -ForegroundColor Yellow
Write-Host "      Expected: Mon-Sun breakdown, average_goal_ml per day" -ForegroundColor DarkGray

$weekly = Invoke-RestMethod `
    -Uri "$BASE/v1/user/stats/weekly?date=$TODAY" `
    -Method GET `
    -Headers $HEADERS

if ($weekly.success) {
    Write-Host "  [PASS] success = true" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] success = false" -ForegroundColor Red
}

Write-Host "  week_start      : $($weekly.data.week_start)"
Write-Host "  week_end        : $($weekly.data.week_end)"
Write-Host "  average_intake  : $($weekly.data.average_intake_ml) ml"
Write-Host "  average_goal_ml : $($weekly.data.average_goal_ml) ml"
Write-Host "  completion_rate : $($weekly.data.completion_rate)%"
Write-Host "  daily_breakdown (7 days Mon-Sun):"
$dayCount = 0
foreach ($day in $weekly.data.daily_breakdown) {
    $dayCount++
    Write-Host ("    {0}  intake={1,5} ml  goal_ml={2} ml  completed={3}" -f `
        $day.date, $day.intake_ml, $day.goal_ml, $day.completed)
}
if ($dayCount -eq 7) {
    Write-Host "  [PASS] Exactly 7 days returned" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Expected 7 days, got $dayCount" -ForegroundColor Red
}

# Validate week starts on Monday
$weekStart = [DateTime]::Parse($weekly.data.week_start)
if ($weekStart.DayOfWeek -eq "Monday") {
    Write-Host "  [PASS] week_start is a Monday" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] week_start ($($weekStart.DayOfWeek)) is not Monday" -ForegroundColor Red
}

# ── Step 3: Monthly stats ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] GET /v1/user/stats/monthly?date=$TODAY" -ForegroundColor Yellow
Write-Host "      Expected: 4-week breakdown with avg_intake_ml, avg_goal_ml" -ForegroundColor DarkGray

$monthly = Invoke-RestMethod `
    -Uri "$BASE/v1/user/stats/monthly?date=$TODAY" `
    -Method GET `
    -Headers $HEADERS

if ($monthly.success) {
    Write-Host "  [PASS] success = true" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] success = false" -ForegroundColor Red
}

Write-Host "  month           : $($monthly.data.month)"
Write-Host "  average_intake  : $($monthly.data.average_intake_ml) ml"
Write-Host "  average_goal_ml : $($monthly.data.average_goal_ml) ml"
Write-Host "  completion_rate : $($monthly.data.completion_rate)%"
Write-Host "  weekly_breakdown (4 weeks):"
$weekCount = 0
foreach ($w in $monthly.data.weekly_breakdown) {
    $weekCount++
    Write-Host ("    Week {0}  [{1} -> {2}]  avg_intake={3,5} ml  avg_goal_ml={4} ml  completed={5}" -f `
        $w.week, $w.start_date, $w.end_date, $w.avg_intake_ml, $w.avg_goal_ml, $w.completed)
}
if ($weekCount -eq 4) {
    Write-Host "  [PASS] Exactly 4 weeks returned" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Expected 4 weeks, got $weekCount" -ForegroundColor Red
}

# ── Step 4: Yearly stats (last 6 months) ──────────────────────────────────────
Write-Host ""
Write-Host "[4/4] GET /v1/user/stats/yearly?date=$TODAY" -ForegroundColor Yellow
Write-Host "      Expected: last 6 months, each with avg_intake_ml, avg_goal_ml" -ForegroundColor DarkGray

$yearly = Invoke-RestMethod `
    -Uri "$BASE/v1/user/stats/yearly?date=$TODAY" `
    -Method GET `
    -Headers $HEADERS

if ($yearly.success) {
    Write-Host "  [PASS] success = true" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] success = false" -ForegroundColor Red
}

Write-Host "  range_start     : $($yearly.data.range_start)"
Write-Host "  range_end       : $($yearly.data.range_end)"
Write-Host "  average_intake  : $($yearly.data.average_intake_ml) ml"
Write-Host "  average_goal_ml : $($yearly.data.average_goal_ml) ml"
Write-Host "  completion_rate : $($yearly.data.completion_rate)%"
Write-Host "  monthly_breakdown (last 6 months):"
$monthCount = 0
foreach ($m in $yearly.data.monthly_breakdown) {
    $monthCount++
    Write-Host ("    {0}  avg_intake={1,5} ml  avg_goal_ml={2} ml  completed={3}" -f `
        $m.month, $m.avg_intake_ml, $m.avg_goal_ml, $m.completed)
}
if ($monthCount -eq 6) {
    Write-Host "  [PASS] Exactly 6 months returned" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Expected 6 months, got $monthCount" -ForegroundColor Red
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
