# Skybound · StudyQuest

3D-leergame voor Niek (havo 2) en Floor (havo 3): drie zwevende eilanden, een gedoofd baken en onderweg oefenen met Duits, geschiedenis en Nederlands.

- Live: https://studyquest-dativ-maze.vercel.app
- Alles staat in `src/`: gewone HTML, CSS en JavaScript met three.js, zonder buildstap.
- `vercel.json` laat Vercel `src/` serveren.

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
| `checks/route.html` | Automatische routetest |
