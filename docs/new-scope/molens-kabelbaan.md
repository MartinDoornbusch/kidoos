# Nieuwe scope — molens en kabelbaan

**Alleen nog niet eerder geaudite mechanische bouwwerken; geen wijzigingen in PR #1–#11.**

## Feitelijke aanleiding
- `src/world.js` bouwt de drie molens via `mill()` met geometrische torenschil en daken. `farmRotor`/rotors gebruiken bestaande updateanimatie.
- Kabelbaan heeft stations, kabels, hangende gondel, interieur en bewegingslogica in dezelfde wereldmodule.
- Voor huizen en ruïne bestaat al een eigen audit: **niet herhalen**.

## Opdracht voor Claude
1. Maak drie vergelijkingsbeelden van de bestaande molens (Windhaven, Bloesemvallei, Molenhoeve) en twee van stations/gondel, overdag/avond.
2. Beoordeel per molen alleen dak, gevel, raam/luik, wieken, as, balkon en schaal; behoud rotor-, constructie- en missiegedrag (molenherstel).
3. Kabelbaan: verbeter alleen fysiek geloofwaardige kabelophanging, wielen/aandrijvingen, stationsfundering en cabine; behoud rit, bediening, brugroute en camera.
4. Gebruik waar mogelijk bestaande CC0/CC BY-materialen/assetbibliotheek; nieuwe 3D-download alleen na A/B en license.txt-verificatie.
5. Toon identieke voor/na-camerastandpunten en meet mobiele frametime.

**Niet in scope:** de negen NPC-woonhuizen (PR #9), hersteltoren (PR #3), materiaalprops (PR #6).