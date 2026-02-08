# Script PowerShell pour démarrer l'application mobile
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Démarrage de l'Application Mobile" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon dossier
if (-not (Test-Path "mobile\package.json")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier mobile
Set-Location mobile

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

Write-Host "Démarrage de l'application mobile..." -ForegroundColor Green
Write-Host "Expo DevTools s'ouvrira dans votre navigateur" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Assurez-vous d'avoir configuré l'URL de l'API dans:" -ForegroundColor Yellow
Write-Host "  mobile\src\utils\api.js" -ForegroundColor Yellow
Write-Host ""

# Démarrer Expo
npm start

