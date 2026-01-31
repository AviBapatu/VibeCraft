$ROOT_DIR = Get-Location
$PORTS = @(4000, 5000, 5173, 5174)

Write-Host "======================================"
Write-Host "Cleaning up existing processes"
Write-Host "======================================"

foreach ($PORT in $PORTS) {
    $PIDS = netstat -ano | Select-String ":$($PORT)\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique

    if ($PIDS.Count -gt 0) {
        Write-Host "Killing PID(s) on port ${PORT}: $PIDS"
        foreach ($PID in $PIDS) {
            taskkill /PID $PID /F 2>$null
        }
    } else {
        Write-Host "Port ${PORT} is free"
    }
}

Write-Host ""
Write-Host "======================================"
Write-Host "Launching system in 4 terminals"
Write-Host "======================================"

# ---------------- ATTACK BACKEND ----------------
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$ROOT_DIR\attack-backend'; npm install; npm start"

Start-Sleep -Seconds 1

# ---------------- MONITORING BACKEND ----------------
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$ROOT_DIR\monitoring-backend'; `
 if (!(Test-Path venv)) { python -m venv venv }; `
 .\venv\Scripts\Activate.ps1; `
 pip install --upgrade pip; `
 pip install -r requirements.txt; `
 uvicorn main:app --host 0.0.0.0 --port 5000 --reload"

Start-Sleep -Seconds 1

# ---------------- MONITORING UI ----------------
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$ROOT_DIR\monitoring-ui'; npm install; npm run dev -- --port 5173"

Start-Sleep -Seconds 1

# ---------------- SIMULATOR UI ----------------
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"cd '$ROOT_DIR\simulator-ui'; npm install; npm run dev -- --port 5174"

Write-Host ""
Write-Host "======================================"
Write-Host "SYSTEM STARTED SUCCESSFULLY"
Write-Host "======================================"
Write-Host ""
Write-Host "Simulator UI   -> http://localhost:5174"
Write-Host "Monitoring UI  -> http://localhost:5173"
Write-Host "Monitoring API -> http://localhost:5000/health"
Write-Host "Attack Backend -> http://localhost:4000"
Write-Host ""