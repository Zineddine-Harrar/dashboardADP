# Script d'ingestion de tous les fichiers Excel de novembre
Write-Host "🚀 Démarrage de l'ingestion des données de novembre..." -ForegroundColor Green

$files = Get-ChildItem -Path ".\data\input\novembre\*.xlsx" | Sort-Object Name
$total = $files.Count
$current = 0

Write-Host "📁 Trouvé $total fichiers à ingérer`n" -ForegroundColor Cyan

foreach ($file in $files) {
    $current++
    $percent = [math]::Round(($current / $total) * 100)
    
    Write-Host "[$current/$total] ($percent%) Ingestion de: $($file.Name)" -ForegroundColor Yellow
    
    try {
        npm run ingest -- ".\data\input\novembre\$($file.Name)" 2>&1 | Out-Null
        Write-Host "  ✅ Succès!`n" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Erreur: $_`n" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Ingestion terminée! $total fichiers traités." -ForegroundColor Green
Write-Host "📊 Vous pouvez maintenant voir l'évolution sur le dashboard!`n" -ForegroundColor Cyan
