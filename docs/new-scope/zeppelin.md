# Nieuwe scope — Zeppelin (luchtschip)

**Alleen nieuw onderwerp; niet opgenomen in PR #1–#11. Geen codewijziging.**

## Huidige implementatie
- `src/world.js` bouwt `airship()` zelf uit `LatheGeometry`, profielringen, cabine van `BoxGeometry`, motorgondels en propellers.
- Er vliegt één luchtschip over de archipel. Het bestaande gedrag (route/animaties/warme ramen/propellers) blijft intact.

## Opdracht voor Claude
1. Beoordeel eerst de huidige zeppelin vanuit de echte gamecamera tegen de stijl van het introscherm; geen stylized downgrade.
2. Test als **kandidaat**, niet automatisch als definitieve vervanger: [Vintage Airship — Evan16](https://sketchfab.com/3d-models/vintage-airship-23c78c2e28934d1491ff216a3eabf982). Controleer de originele download, aantallen driehoeken, beschikbare glTF-onderdelen en meegeleverde licentie.
3. Behoud een geloofwaardige ribbenstructuur, zeildoek/koper, houten gondel, draaiende motoren en avondverlichting; licht- en propellerankers mogen apart blijven.
4. Behoud de route/timing en zichtbaarheid; controleer beide profielen en camera, desktop/mobiel performance.
5. Lever voor/na-screenshots in de draaiende game. Voeg licentie/attributie toe indien geïmporteerd.

**Uitgesloten:** paden/bomen (PR #10), huizen (PR #9), vuurtoren (PR #11), zweefvlieger (PR #7).