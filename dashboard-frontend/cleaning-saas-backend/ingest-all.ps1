# Script d'ingestion batch pour novembre
Write-Host "Ingestion des fichiers de novembre..." -ForegroundColor Green

$files = @(
    "01-11-2025.xlsx",
    "02-11-2025.xlsx",
    "03-11-2025.xlsx",
    "04-11-2025.xlsx",
    "05-11-2025.xlsx",
    "07-11-2025 (1).xlsx",
    "09-11-2025.xlsx",
    "10-11-2025.xlsx",
    "11-11-2025.xlsx",
    "13-11-2025.xlsx",
    "14-11-2025 .xlsx",
    "15-11-2025.xlsx",
    "16-11-2025.xlsx",
    "17-11-2025.xlsx",
    "18-11-2025.xlsx",
    "19-11-2025.xlsx",
    "20-11-2025 (1).xlsx",
    "21-11-2025.xlsx",
    "22-11-2025.xlsx",
    "23-11-2025.xlsx",
    "24-11-2025.xlsx",
    "25-11-2025 (4).xlsx",
    "26-11-2025.xlsx",
    "27-11-2025.xlsx",
    "28-11-2025.xlsx",
    "29-11-2025.xlsx",
    "30-11-2025.xlsx"
)

$count = 0
foreach ($file in $files) {
    $count++
    Write-Host "[$count/27] $file" -ForegroundColor Yellow
    npm run ingest -- "./data/input/novembre/$file"
}

Write-Host "`nTerminé!" -ForegroundColor Green
