# Script d'ingestion simplifié
Write-Host "Starting ingestion..."

$files = Get-ChildItem -Path ".\data\input\novembre\*.xlsx"
foreach ($file in $files) {
    Write-Host "Ingesting $($file.Name)"
    $filePath = ".\data\input\novembre\$($file.Name)"
    # Utilisation de cmd /c pour éviter les problèmes de parsing d'arguments npm/node par PowerShell
    cmd /c "npm run ingest -- `"$filePath`""
}

Write-Host "Done."
