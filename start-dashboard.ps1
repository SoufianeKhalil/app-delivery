# Script PowerShell pour démarrer le dashboard
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Démarrage du Dashboard Web" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon dossier
if (-not (Test-Path "dashboard\package.json")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier dashboard
Set-Location dashboard

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

Write-Host "Démarrage du dashboard..." -ForegroundColor Green
Write-Host "Le dashboard sera accessible sur http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
npm run dev

