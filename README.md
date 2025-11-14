# 🎯 Darts Tournament App

Een moderne web applicatie voor het organiseren en volgen van darts toernooien, met **volledig Double Elimination** ondersteuning, gebouwd met Next.js 15.

## ✨ Features

- **📊 Live Dashboard**: Publieke weergave van live matches met real-time updates en bracket visualisatie
- **🎮 Match Invoer**: iPad-vriendelijke interface voor referees om scores in te voeren (met passcode beveiliging)
- **⚙️ Admin Panel**: Toernooi beheer, spelers toevoegen, en toernooi instellingen
- **🏆 Double Elimination**: Volledig geautomatiseerd double elimination systeem voor 8 spelers
- **🎯 Bracket Visualisatie**: Mooie, horizontaal scrollbare bracket met Winners en Losers brackets
- **⚡ Real-time**: Automatische updates zonder WebSockets (polling-based)

## 🎯 Double Elimination System

De app ondersteunt nu **volledig geautomatiseerde Double Elimination toernooien** voor 8 spelers:

### Toernooi Structuur
- **Winners Bracket**: 3 rondes (4→2→1 matches)
- **Losers Bracket**: 4 rondes met automatische plaatsing van verliezers
- **Grand Final**: Winnaar Winners vs Winnaar Losers
- **Automatische Progressie**: Winnaars en verliezers worden automatisch geplaatst in volgende matches

Zie [DOUBLE_ELIMINATION.md](./DOUBLE_ELIMINATION.md) voor gedetailleerde uitleg!

## 🚀 Tech Stack

- **Next.js 15** met App Router
- **TypeScript** voor type-safety
- **Tailwind CSS** voor styling
- **Prisma** met SQLite/PostgreSQL database
- **React** 19

## 📦 Installatie

### Lokaal Draaien

1. Clone de repository:
```bash
git clone <your-repo-url>
cd Dartstournament
```

2. Installeer dependencies:
```bash
npm install
```

3. Setup database:
```bash
npx prisma generate
npx prisma db push
```

4. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t darts-tournament .
```

### Run met Docker

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/app/prisma/dev.db" \
  -e MATCH_PASSCODE="1234" \
  darts-tournament
```

## ☁️ Easypanel Deployment

### Via GitHub

1. Push je code naar een GitHub repository
2. Log in op Easypanel
3. Klik op "Create Project"
4. Selecteer "GitHub" als source
5. Kies je repository
6. Easypanel detecteert automatisch het Dockerfile
7. Configureer environment variabelen:
   - `DATABASE_URL`: `file:/app/prisma/dev.db` (of PostgreSQL URL)
   - `MATCH_PASSCODE`: Jouw gewenste passcode
8. Deploy!

Zie [DEPLOYMENT.md](./DEPLOYMENT.md) voor gedetailleerde deployment instructies.

## 📱 Gebruik

### 1. Double Elimination Toernooi Aanmaken
1. Ga naar `/admin`
2. Klik op "Nieuw Toernooi"
3. Selecteer **"Double Elimination (8 spelers)"**
4. Vul **exact 8 spelers** in (met seeding #1-#8)
5. Configureer instellingen (BO3/BO5/BO7, start score 301/501/701)
6. Klik "Toernooi Aanmaken"
7. Klik "▶️ Start" om het toernooi te starten

### 2. Dashboard (Publiek)
- Ga naar `/dashboard`
- Bekijk live matches met groot scoreboard
- Zie volledige bracket visualisatie
  - Winners Bracket (groen)
  - Losers Bracket (oranje)
- Real-time updates elke 2 seconden

### 3. Match Invoer (Referee)
- Ga naar `/match`
- Voer passcode in (standaard: 1234)
- Selecteer een actieve match
- Voer scores in per dart throw
- Systeem detecteert automatisch:
  - Leg wins
  - Set wins
  - Match wins
  - Bust (score onder 0 of exact 1)
  - **Bracket progressie** (winnaar/verliezer naar volgende match)

## 🎯 Toernooi Formaten

- **Best of 3 (BO3)**: Eerste naar 2 sets
- **Best of 5 (BO5)**: Eerste naar 3 sets
- **Best of 7 (BO7)**: Eerste naar 4 sets

Elke set bestaat uit legs (configureerbaar).

## 🏆 Double Elimination Features

### Automatische Bracket Progressie
- ✅ Winnaar gaat automatisch naar volgende match in Winners Bracket
- 🔄 Verliezer gaat automatisch naar Losers Bracket
- 🎯 Volgende match wordt automatisch actief wanneer beide spelers bekend zijn
- 📊 Bracket visualisatie toont alle matches met status

### Seeding Systeem
```
Seed #1 vs Seed #8  →  Winners R1 M1
Seed #4 vs Seed #5  →  Winners R1 M2
Seed #2 vs Seed #7  →  Winners R1 M3
Seed #3 vs Seed #6  →  Winners R1 M4
```

### Bracket Visualisatie
- Horizontaal scrollbaar
- Per ronde gegroepeerd
- Duidelijke labels
- Live match indicators
- Winner highlighting
- TBD voor onbekende spelers

## 🔒 Beveiliging

- Match invoer pagina is beveiligd met passcode
- Alleen referees kunnen scores invoeren
- Dashboard is publiek toegankelijk
- Environment variabele voor passcode

## 🗄️ Database

De app gebruikt **SQLite** voor eenvoudige deployment. Voor productie gebruik kan je eenvoudig overschakelen naar **PostgreSQL**.

### Database Schema
- **Tournament**: Toernooi info + type (double-elimination/single-elimination)
- **Player**: Spelers met seeding
- **Match**: Matches met bracket info (winners/losers, round, position) en next match references
- **Set**: Sets binnen matches
- **Leg**: Legs binnen sets
- **Throw**: Individuele dart throws

## 📝 API Endpoints

### Tournaments
- `GET /api/tournaments` - Haal alle toernooien op
- `POST /api/tournaments` - Maak nieuw toernooi (met type en seeding)
- `GET /api/tournaments/[id]` - Haal specifiek toernooi op
- `PATCH /api/tournaments/[id]` - Update toernooi
- `DELETE /api/tournaments/[id]` - Verwijder toernooi
- `POST /api/tournaments/[id]/start` - Start toernooi (genereert bracket)

### Matches
- `GET /api/matches/[id]` - Haal match details op
- `POST /api/matches/[id]/throw` - Registreer dart throw
- `POST /api/matches/[id]/complete` - Complete match en progress bracket

### Auth
- `POST /api/auth/verify` - Verifieer passcode

## 🛠️ Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 📊 Project Structuur

```
Dartstournament/
├── app/
│   ├── admin/              # Admin panel met toernooi beheer
│   ├── dashboard/          # Live dashboard met bracket
│   ├── match/              # Match invoer interface
│   ├── api/
│   │   ├── tournaments/    # Tournament API routes
│   │   ├── matches/        # Match API routes
│   │   └── auth/           # Passcode verificatie
│   └── page.tsx            # Home pagina
├── components/
│   └── BracketView.tsx     # Bracket visualisatie component
├── lib/
│   ├── prisma.ts           # Prisma client
│   └── bracket.ts          # Double elimination logica
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── Dockerfile
├── README.md
├── DOUBLE_ELIMINATION.md   # Double elimination uitleg
└── DEPLOYMENT.md           # Deployment guide
```

## 🎨 Screenshots & Demo

### Admin Panel
- Toernooi aanmaken met 8 spelers en seeding
- Tournament type selectie
- Match format configuratie

### Dashboard
- Live matches met groot scoreboard
- Volledige bracket visualisatie
- Winners en Losers brackets
- Real-time updates

### Match Invoer
- Grote knoppen voor dart scores
- iPad-geoptimaliseerd
- Passcode beveiliging
- Automatische beurt wisseling

## 📄 License

MIT

## 🤝 Contributing

Pull requests zijn welkom!

## 🆘 Support

Voor problemen of vragen:
1. Check de documentatie in [DOUBLE_ELIMINATION.md](./DOUBLE_ELIMINATION.md)
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md) voor deployment issues
3. Open een GitHub Issue

---

🎯 **Veel plezier met je Double Elimination Darts Tournament!**
