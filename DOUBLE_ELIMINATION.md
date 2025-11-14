# 🏆 Double Elimination Tournament System

De app ondersteunt nu volledig **Double Elimination** toernooien voor 8 spelers, exact zoals in jouw voorbeeld!

## 📋 Toernooi Structuur

### Winners Bracket
- **Round 1**: 4 matches (8 spelers)
  - Match 1: Seed 1 vs Seed 8
  - Match 2: Seed 4 vs Seed 5
  - Match 3: Seed 2 vs Seed 7
  - Match 4: Seed 3 vs Seed 6
  
- **Round 2**: 2 matches (winnaars van Round 1)
- **Winners Final**: 1 match

### Losers Bracket  
- **Round 1**: 2 matches (verliezers van Winners R1)
- **Round 2**: 2 matches (winnaars LB R1 vs verliezers Winners R2)
- **Round 3**: 1 match (winnaars LB R2)
- **Losers Final**: 1 match (winnaar LB R3 vs verliezer Winners Final)

### Grand Final
- Winnaar Winners Bracket vs Winnaar Losers Bracket

## 🎮 Hoe Het Werkt

### 1. Toernooi Aanmaken
1. Ga naar `/admin`
2. Klik op "Nieuw Toernooi"
3. Selecteer **"Double Elimination (8 spelers)"**
4. Vul **exact 8 spelers** in met seeding:
   - Seed #1: Beste speler
   - Seed #2: Op één na beste
   - ...
   - Seed #8: Slechtste speler
5. Configureer match format (BO3/BO5/BO7) en start score (301/501/701)
6. Klik "Toernooi Aanmaken"

### 2. Toernooi Starten
1. Klik op "▶️ Start" bij het toernooi
2. Het systeem genereert automatisch:
   - Alle 14 matches (7 Winners, 6 Losers, 1 Grand Final)
   - Correcte bracket connecties
   - Eerste match wordt automatisch actief

### 3. Matches Spelen
1. Ga naar `/match`
2. Voer passcode in
3. Selecteer de actieve match
4. Voer scores in zoals normaal

### 4. Automatische Bracket Progressie
Wanneer een match is gewonnen:
- ✅ **Winnaar** wordt automatisch geplaatst in de volgende match
- 🔄 **Verliezer** gaat naar de Losers Bracket (als vanuit Winners Bracket)
- 🎯 Volgende match wordt automatisch actief (als beide spelers bekend zijn)

### 5. Live Dashboard
- Ga naar `/dashboard`
- Zie de volledige bracket visualisatie
- Winners Bracket (groen)
- Losers Bracket (oranje)
- Live matches met groene border
- Real-time updates elke 2 seconden

## 🎨 Bracket Visualisatie

De bracket wordt mooi weergegeven met:
- **Kleuren**:
  - 🟢 Groene border = Actieve match
  - ✅ Groene achtergrond = Winnaar
  - 🔴 "LIVE" indicator
  - TBD = Nog onbekende speler

- **Layout**:
  - Horizontaal scrollbaar
  - Per ronde gegroepeerd
  - Duidelijke labels (Round 1, Round 2, Finals)
  - Match cards met speler namen en scores

## 📊 Database Structuur

Elke match heeft nu:
```typescript
{
  bracket: 'winners' | 'losers'  // Welke bracket
  round: number                   // Ronde nummer
  position: number                // Positie in ronde
  player1Id: string | null        // Kan null zijn (TBD)
  player2Id: string | null        // Kan null zijn (TBD)
  winnerNextMatchId: string       // Waar winnaar naartoe gaat
  loserNextMatchId: string        // Waar verliezer naartoe gaat
  winnerSlot: 'player1' | 'player2'  // Welke slot
  loserSlot: 'player1' | 'player2'   // Welke slot
}
```

## ⚙️ Technische Details

### Bracket Generatie
De bracket wordt gegenereerd in `/lib/bracket.ts`:
- Standard double elimination format
- Correcte seeding (1 vs 8, 2 vs 7, etc.)
- Alle match connecties vooraf gedefinieerd

### Match Completion Flow
1. Match wordt gewonnen → `status = 'completed'`, `winnerId` wordt ingesteld
2. API endpoint `/api/matches/[id]/complete` wordt getriggerd
3. Winnaar wordt geplaatst in `winnerNextMatchId` op `winnerSlot`
4. Verliezer wordt geplaatst in `loserNextMatchId` op `loserSlot` (indien van toepassing)
5. Volgende match(es) worden automatisch actief als beide spelers bekend zijn

### Real-time Updates
- Dashboard pollt elke 2 seconden
- Match invoer pagina pollt elke 3 seconden
- Geen WebSockets nodig (eenvoudiger deployment)

## 🔧 Admin Features

### Toernooi Beheer
- Zie alle toernooien (setup/active/completed)
- Start double elimination toernooi
- Verwijder toernooien
- Spelers lijst met seeding

### Validatie
- ✅ Exact 8 spelers vereist voor double elimination
- ✅ Alle speler namen moeten ingevuld zijn
- ✅ Automatische seeding op basis van invoer volgorde

## 📱 Optimaal Gebruik

### Voor Organisatoren
1. **Setup**: Gebruik desktop/laptop voor toernooi aanmaken
2. **Live Tracking**: Dashboard op TV/groot scherm
3. **Score Entry**: iPad bij de dartboard met referee

### Voor Publiek
- Dashboard is publiekelijk toegankelijk
- Geen inlog nodig
- Real-time scores
- Volledige bracket overzicht

## 🎯 Voorbeelden

### Voorbeeld Seeding
```
Seed #1: Jan (Beste speler)
Seed #2: Piet
Seed #3: Klaas
Seed #4: Henk
Seed #5: Willem
Seed #6: Joris
Seed #7: Kornee
Seed #8: Thijs (Slechtste speler)
```

### Winners Bracket Round 1 Matches
```
Match 1: Jan (1) vs Thijs (8)
Match 2: Henk (4) vs Willem (5)
Match 3: Piet (2) vs Kornee (7)
Match 4: Klaas (3) vs Joris (6)
```

## 🚀 Deployment

Alles werkt out-of-the-box met:
- ✅ SQLite (lokaal/development)
- ✅ PostgreSQL (productie/Easypanel)
- ✅ Docker deployment
- ✅ Easypanel auto-deploy

## 🆘 Troubleshooting

### "Need exactly 8 players"
➡️ Double elimination vereist precies 8 spelers. Voeg of verwijder spelers.

### "Match not ready"
➡️ Wacht tot beide spelers bekend zijn (na vorige matches voltooid zijn).

### Bracket niet zichtbaar
➡️ Check dat toernooi type "double-elimination" is en status "active".

### Verkeerde speler in volgende match
➡️ Dit kan gebeuren bij manual testing. Verwijder en herstart toernooi.

## 🎓 Tips

1. **Goede Seeding**: Zorg voor eerlijke seeding - beste vs slechtste in eerste ronde
2. **Match Volgorde**: Matches worden automatisch actief, maar je kan ook handmatig andere matches selecteren in de match pagina
3. **Real-time**: Dashboard heeft 2 seconden delay voor updates
4. **Grand Final**: Kan theoretisch 2x gespeeld worden als losers bracket winnaar de eerste wint (optioneel feature voor toekomstige versie)

---

🎯 **Veel plezier met je Double Elimination Darts Tournament!**

