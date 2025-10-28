Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Bhoomi Setu Full Stack Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting services in order:" -ForegroundColor Yellow
Write-Host "1. Hardhat Blockchain (Port 8545)" -ForegroundColor Yellow
Write-Host "2. Smart Contract Deployment" -ForegroundColor Yellow
Write-Host "3. Backend Server (Port 3003)" -ForegroundColor Yellow
Write-Host "4. Frontend Server (Port 3001)" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/4] Starting Hardhat Blockchain..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd contracts; npm run dev" -WindowStyle Normal

Write-Host "[2/4] Waiting 10 seconds for blockchain to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "[2/4] Deploying Smart Contracts..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd contracts; npm run deploy:local; Read-Host 'Press Enter to close'" -WindowStyle Normal

Write-Host "[3/4] Waiting 5 seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[3/4] Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

Write-Host "[4/4] Waiting 5 seconds for backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[4/4] Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "Blockchain: http://localhost:8545" -ForegroundColor Green
Write-Host "Backend:    http://localhost:3003" -ForegroundColor Green
Write-Host "Frontend:   http://localhost:3001" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")