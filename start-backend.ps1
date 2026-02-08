# Script PowerShell pour démarrer le backend
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Démarrage du Backend" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon dossier
if (-not (Test-Path "backend\package.json")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier backend
Set-Location backend

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Vérifier si .env existe
if (-not (Test-Path ".env")) {
    Write-Host "ATTENTION: Le fichier .env n'existe pas!" -ForegroundColor Red
    Write-Host "Créez un fichier .env dans le dossier backend avec vos paramètres." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemple de contenu:" -ForegroundColor Yellow
    Write-Host "PORT=3000"
    Write-Host "DB_HOST=localhost"
    Write-Host "DB_USER=root"
    Write-Host "DB_PASSWORD=votre_mot_de_passe"
    Write-Host "DB_NAME=delivery_app"
    Write-Host "JWT_SECRET=votre_secret_jwt"
    Write-Host ""
    exit 1
}

# Créer les dossiers uploads si nécessaire
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    New-Item -ItemType Directory -Path "uploads\profiles" | Out-Null
    New-Item -ItemType Directory -Path "uploads\merchants" | Out-Null
    New-Item -ItemType Directory -Path "uploads\products" | Out-Null
    Write-Host "Dossiers uploads créés" -ForegroundColor Green
}

Write-Host "Démarrage du serveur backend..." -ForegroundColor Green
Write-Host "Le serveur sera accessible sur http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
npm run dev

