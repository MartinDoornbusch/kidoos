# StudyQuest — Parallelle ontwikkeling: huizen & ruïneherstel

**Status:** ontwerp + werkende, losstaande bouwprojectlogica. **Niet geïntegreerd in de game.**
**Branch:** `feature/construction-projects-chatgpt` — aangemaakt vanaf `main` (de echte integratiebasis moet voor merge opnieuw worden bepaald).

## Waarom dit aparte werk?
- `main` bevat reeds vrij bouwen via `s.builds`: bouwblok, lamp, bloembak, bankje, vlag.
- `game.js` bevat materialen `hout`, `steen`, `planken`, opgaven en voortgang.
- `world.js` heeft `construction()`, `sync()`, collision en bestaande huizen/interieurs.
- Claude werkt aan `assets-extern` en `visuals-1.7`. Die branches lopen uiteen ten opzichte van `main`.

**Niet parallel aan dezelfde bestanden werken.** Deze feature maakt nu alleen `src/construction-projects.js` en een eigen test. Geen wijziging aan `game.js`, `world.js`, `collision.js`, assets, HTML of Vercel.

## Wat is geïmplementeerd?
- Twee datagedreven bouwprojecten: **vakwerkhuis** (5 zichtbare fasen) en **oude wachttorenruïne** (5 fasen).
- Materiaalrecepten in bestaande eenheden: hout, steen en planken.
- Leerpoort per mijlpaal (1-2 goede antwoorden), **niet** elke losse plank of steen.
- Pure functie `advance(project, inventory, acceptedCorrectAnswers)` voor een transactie met minimale bijwerkingen: geen mutatie van input, geen opslag, rendering of netwerk.
- `progress()` levert `visibleParts` op die de 3D-wereld later kan tonen.
- `budget()` berekent totaalkosten.

Draai tests (geen dependency): `node src/checks/construction-projects.test.js`.

## Contract met Claude voor integratie
1. **Opslag**: voeg later `s.constructionProjects = []` toe aan de bestaande save; laat `s.builds` ongemoeid. Versioneer en migreer alleen additief.
2. **Plaatsing**: Claude levert geschikte vooraf gedefinieerde bouwkavels en collisioncheck via de bestaande wereld, inclusief afstand tot paden, NPC's, deuren en bruggen. Deze pure logica controleert bewust geen wereldcoördinaten of plotbezetting.
3. **Rendering**: Claude koppelt `visibleParts` aan een beperkt aantal realistische modeldelen. **Geen enorme losse blokken**, geen dynamisch 3D-mesh voor elk steentje; hergebruik modellen en materialen.
4. **Opdrachten**: gebruik de bestaande vraagbanken per profiel (Niek havo 2; Floor havo 3 voor onderwerpen die beschikbaar zijn). Injecteer alleen echt behaalde juiste antwoorden.
5. **Afhandeling**: na een succesvolle `advance` werk `inventory` en `project` atomair bij, sla op, synchroniseer visuals/collision. Een foute beantwoording verbruikt geen materiaal.
6. **Bouwen**: House: fundering → skelet → wanden → dak → interieur. Ruïne: onderzoeken → puin ruimen → muren → trappen/vloer → dak/uitkijkpost. Voorzie echte zichtbare tussenfasen en een toegankelijke eindruimte.
7. **Veiligheid**: bouwkavel moet geldig en vrij zijn; niet op NPC-route/brug of vlak bij mission objects. Check bij preview én commit.
8. **Performance**: herhaalde props 300–3.000 triangles, hero max 15k, 512–1K textures tenzij onderbouwde uitzondering. Meet totale wereldscene, draw calls, FPS en collision.
9. **Geen productie-deploy** zonder review. Integratie op Claude's actuele branch na conflictcontrole via PR.

## Buiten deze eerste module
- Vrij slepen/roteren van individuele muren, ramen, deuren en dakdelen.
- Huis inrichten met meubels, winkel/economie, eigenaarschap.
- Undo, sloop en restitutie.
- Ruïne geheimen, beloning, NPC-verhaallijn en voortgangsanimaties.
- Multiplayer en gedeelde bouwwerelden.

Bouw deze later bovenop het contract, niet door een tweede volledig bouwsysteem te maken.
