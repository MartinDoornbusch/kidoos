# Skybound · StudyQuest

3D-leergame voor Niek (havo 2) en Floor (havo 3): een archipel van zwevende eilanden in zes levels, van een gedoofd baken tot een tuin boven de wolken, en onderweg oefenen met geschiedenis en Nederlands (Duits als losse trainer).

- Live: https://studyquest-dativ-maze.vercel.app
- Alles staat in `src/`: gewone HTML, CSS en JavaScript met three.js, zonder buildstap.
- `vercel.json` laat Vercel `src/` serveren.

## Inloggen (vanaf 1.26)

Het spel staat achter een inlogscherm (`src/login.html`). `middleware.js` laat een verzoek alleen door met een geldige,
ondertekende inlogcookie; zonder cookie ga je naar het inlogscherm en krijgen API-aanroepen 401.

- **Ouder** logt in met de ouderpincode en stelt daarna op het inlogscherm de codes van Niek en Floor in (4 tot 8 cijfers).
- **Ouderpincode (vanaf 1.26.1)** staat alleen op de server, als gezouten scrypt-hash in `auth/parent.json`. Wie nog met de
  oude pincode inlogt, moet eerst een nieuwe kiezen (6 tot 8 cijfers); daarna werkt de oude niet meer. Wijzigen kan
  altijd via "Pincode wijzigen" op het inlogscherm, met de huidige pincode erbij.
- **Beheer** (`?beheer`) en het ouderoverzicht openen alleen op een apparaat dat als Ouder is ingelogd; de server
  controleert dat via de cookie (`/api/whoami`). Er staat geen pincode of hash meer in het spel.
- **Ouderoverzicht:** elk apparaat waarop iemand is ingelogd stuurt de oefentijd vanzelf mee; koppelen is niet meer nodig.
  Een kind kan alleen zijn eigen voortgang versturen.
- **Niek** en **Floor** loggen in met hun eigen code en spelen alleen als zichzelf.
- Codes staan alleen als gezouten scrypt-hash in de Blob-opslag (`auth/codes.json`); na 8 foute pogingen binnen 15 minuten
  is die naam even geblokkeerd.
- De cookie is 400 dagen geldig en wordt ondertekend met een sleutel die is afgeleid van `BLOB_READ_WRITE_TOKEN`.
- Test: `node tests/auth.test.mjs` (in-memory opslag, raakt de echte opslag niet).

## Levels

| Level | Waar | Wat |
|---|---|---|
| 1 | Windhaven, Bloesemvallei, Sterrenwacht | Havenbrug, bergbrug, sterrenbaken |
| 2 | Molenhoeve, Steengroeve, Valkenrots | Molen, kraan, signaalvuur |
| 3 | Dennenhoek | De vergeten wachttoren (5 fases) |
| 4 | Bouwkavel naar keuze | Eigen vakwerkhuis ontwerpen, bouwen en inrichten |
| 5 | Valkenrots → Wolkenkruin | Luchtschip De Hemelvaarder herstellen en vliegen; windvonken, runenkring |
| 6 | Wolkenkruin | De Wolkentuin: bron, terrassen, waterloop, kas, waterval; daarna dagelijks wolkenbessen |

Testen zonder alles uit te spelen: open het spel met `?beheer`, log in met de ouderpincode en gebruik de knoppen
"L5 klaar", "L6 gestart" enzovoort, en de eilandknop "Wolkenkruin".

## Lokaal draaien

```
cd src && python3 -m http.server 8080
```

Open daarna http://localhost:8080.

## Structuur

| Bestand | Inhoud |
|---|---|
| `index.html`, `style.css` | Startscherm, HUD en panelen |
| `game.js` | Spelregels, besturing, missies, opslag (localStorage) |
| `world.js` | 3D-wereld: eilanden, gebouwen, camera |
| `scenery.js`, `pilot.js` | Personages en animatie |
| `learning.js`, `history.js`, `nederlands.js` | Vragenbanken Duits, geschiedenis, Nederlands |
| `woorden.html`, `trainer.js` | Losse woordentrainer |
| `crafts.js` | Handgebouwde props: steenkar, telescoop, luchtschipdok, kas, waterloop |
| `checks/*.test.js` | Unit-tests voor bouwprojecten, campagne en huisplanner (`node src/checks/<bestand>`) |

## Tests

`npm test` draait alles achter elkaar:

- `tests/auth.test.mjs`: inloggen, codes, ouderpincode, overzicht en synchronisatie (in-memory opslag).
- `src/checks/*.test.js`: bouwprojecten, campagne en huisplanner.
- `tests/game/run.mjs`: het spel zelf in headless Chromium. `progress` speelt de hele campagne van level 1 tot en met 6
  via dezelfde knoppen en vraagschermen als een speler; `physics` lopen, draaien, camera en botsingen; `ui` vakken,
  beheer alleen voor de ouder, gereedschapsbalk en atlas; `phone` staand telefoonbeeld; `flight` windvonken en runenkring.
  Nodig: `npm i --no-save playwright && npx playwright install chromium` (of `PLAYWRIGHT_PATH`). Eén scenario:
  `node tests/game/run.mjs progress`.
