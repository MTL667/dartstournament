# 🚀 Deployment Guide voor Easypanel

## Snelle Start

### 1. Repository naar GitHub pushen

```bash
git init
git add .
git commit -m "Initial commit - Darts Tournament App"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Easypanel Setup

1. **Log in op Easypanel**
   - Ga naar je Easypanel dashboard

2. **Nieuw Project Aanmaken**
   - Klik op "Create Project"
   - Geef het project een naam (bijv. "darts-tournament")

3. **GitHub Connectie**
   - Selecteer "GitHub" als source
   - Kies je repository
   - Selecteer de `main` branch

4. **Configuratie**
   Easypanel detecteert automatisch het `Dockerfile`.
   
   **Environment Variabelen instellen:**
   ```
   DATABASE_URL=file:/app/prisma/dev.db
   MATCH_PASSCODE=1234
   NODE_ENV=production
   ```

5. **Volume voor Database (Optioneel maar aanbevolen)**
   - Voeg een volume toe:
     - Name: `darts-db`
     - Mount path: `/app/prisma`
   
   Dit zorgt ervoor dat je database data behouden blijft tussen deployments.

6. **Deploy**
   - Klik op "Deploy"
   - Wacht tot de build is voltooid (kan 2-5 minuten duren)

### 3. Eerste Gebruik

Na deployment:
1. Ga naar je app URL (bijv. `https://darts-tournament.yourdomain.com`)
2. Navigeer naar `/admin`
3. Maak je eerste toernooi aan
4. Start het toernooi
5. Ga naar `/match` om scores in te voeren (passcode: 1234 of je aangepaste waarde)
6. Bekijk live matches op `/dashboard`

## 🔧 Advanced Configuratie

### PostgreSQL gebruiken (voor productie)

Als je liever PostgreSQL wilt gebruiken in plaats van SQLite:

1. **Easypanel PostgreSQL Service**
   - Maak een PostgreSQL service aan in Easypanel
   - Kopieer de connection string

2. **Update Environment Variabele**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **Update Prisma Schema**
   In `prisma/schema.prisma`, wijzig:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Redeploy**
   - Push naar GitHub
   - Easypanel deployed automatisch opnieuw

### Custom Passcode

Verander de `MATCH_PASSCODE` environment variabele naar je gewenste waarde.

### Auto-Deploy

De app is geconfigureerd om automatisch te deployen bij elke push naar de `main` branch.

## 🐳 Lokaal Docker Testen

Test de Docker container lokaal voordat je deployed:

```bash
# Build
docker build -t darts-tournament .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/app/prisma/dev.db" \
  -e MATCH_PASSCODE="1234" \
  darts-tournament
```

Open http://localhost:3000

## 📊 Health Checks

De app draait op port 3000 en reageert op alle endpoints. Je kunt een health check configureren op:
- Path: `/`
- Port: 3000
- Interval: 30s

## 🔄 Updates

Om de app te updaten:
1. Maak je wijzigingen lokaal
2. Test lokaal met `npm run dev`
3. Commit en push naar GitHub
4. Easypanel deployed automatisch

## ⚠️ Troubleshooting

### Build faalt
- Check de logs in Easypanel
- Verifieer dat alle environment variabelen correct zijn ingesteld

### Database errors
- Zorg ervoor dat het volume correct is geconfigureerd
- Check dat DATABASE_URL correct is

### Passcode werkt niet
- Verifieer de MATCH_PASSCODE environment variabele
- Herstart de container na wijzigingen

## 📱 Gebruik Tips

- **Dashboard**: Fullscreen op een TV/monitor voor publieke weergave
- **Match Invoer**: iPad in landscape mode werkt het beste
- **Admin Panel**: Desktop browser aanbevolen

## 🔒 Beveiliging

Voor productie gebruik:
1. Wijzig de default passcode (1234)
2. Gebruik HTTPS (Easypanel biedt dit automatisch)
3. Configureer een sterke database password (als je PostgreSQL gebruikt)
4. Overweeg extra authenticatie voor het admin panel

## 💾 Backups

### SQLite
- Het volume `/app/prisma` bevat je database
- Easypanel kan automatische backups van volumes maken
- Download `dev.db` regelmatig als extra backup

### PostgreSQL
- Gebruik de Easypanel backup features voor PostgreSQL
- Of stel externe backups in met pg_dump

## 📈 Monitoring

Monitor je app via:
- Easypanel dashboard (CPU, Memory, Logs)
- Custom logging naar je logging service
- Health check endpoints

## 🎯 Performance Tips

Voor betere performance bij veel concurrent gebruik:
1. Upgrade naar PostgreSQL
2. Verhoog container resources in Easypanel
3. Enable Redis caching (optioneel, requires code changes)
4. Gebruik een CDN voor static assets

## 🆘 Support

Bij problemen:
1. Check de Easypanel logs
2. Verifieer environment variabelen
3. Test lokaal met Docker
4. Check de GitHub Issues

