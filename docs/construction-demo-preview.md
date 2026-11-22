# StudyQuest — Zelfstandige bouwproef

**Status:** proefversie op de aparte branch `feature/construction-projects-chatgpt`. Geen wijziging aan productie of `main`.

## Openen

- De previewpagina staat op `/checks/construction-demo.html`.
- Lokaal: `cd src && python3 -m http.server 8080`, vervolgens `http://localhost:8080/checks/construction-demo.html`.
- Vercel bouwt automatisch een preview voor de branch. De preview-URL kan Vercel Authentication vereisen; **deze pagina is geen productie-uitrol**.

## Wat kun je testen?

**Wachttoren:** vijf fasen, puin opruimen, muren herstellen, loopplatform, dak, uitkijkpost, NPC-verhaallijn in het zijpaneel. 7 hout, 9 steen, 9 planken en 7 goede demoantwoorden. Eenmalige beloning: 12 munten en kaart/unlock-flags.

**Vakwerkhuis:** één bouwkavel, vijf fasen en ontwerpopties voor gevel, hout, dakvorm, dakmateriaal, vloer, deurzijde en rotatie. De kavel kan vóór de fundering in 1m-stappen worden verschoven; buiten de toegestane kavel wordt plaatsing geweigerd. Na de fundering liggen locatie en rotatie vast. Na voltooiing kun je zes soorten meubels plaatsen, verplaatsen en opbergen.

**Bediening:** sleep met muis of vinger op de 3D-preview om te draaien, gebruik scroll om te zoomen. Klik `Verzamel testmaterialen` om materiaal te krijgen; beantwoord de voorbeeldvragen en rond vervolgens elke bouwfase af.

## Technische grenzen — heel belangrijk

- **De 3D-modellen in deze preview zijn tijdelijke primitieve vormen om de bouwlogica te testen**, geen goedgekeurde definitieve game-assets. Claude vervangt dit later door realistische modellen.
- De voorbeeldvragen zijn generiek en staan **los van de geïmporteerde leerstof** voor Niek en Floor. De echte vragenbanken moeten bij integratie worden aangesloten.
- De kavelgrenzen worden via `HouseDesigner.checkSite` gecontroleerd. In deze afgeschermde preview gebruikt `worldCheck` een stub die `true` teruggeeft. **De preview controleert dus niet de daadwerkelijke collision en NPC-routes van StudyQuest.** Claude moet in de echte wereld een geldige `worldCheck` implementeren.
- Er is **geen player-walking, echte fysieke collision, bouwanimatie, interactief interieur of multiplayer** in deze preview. Wel is er een draaibare 3D-voorstelling en de complete progressie- en inventarisflow.
- De pagina schrijft uitsluitend naar de afzonderlijke `localStorage`-sleutel `studyquest.construction.preview.v1`. Bestaande `skybound`-spelergegevens, `s.builds` en leervoortgang worden niet gewijzigd.
- Vercel-preview wordt automatisch gebouwd door de bestaande projectinstelling zodra een push op de branch plaatsvindt. Er wordt **niet** naar de production-target uitgerold.

## Tests

```sh
node src/checks/construction-projects.test.js
node src/checks/construction-campaign.test.js
node src/checks/house-planner.test.js
node src/checks/construction-demo.test.js
```

De drie eerdere tests en de complete demo-interactiestroom zijn met een geïsoleerde JavaScript-harness uitgevoerd en geslaagd. De nieuwe `construction-demo.test.js` is een blijvende Node-VM-versie van de demo-interactietest. Voer deze in een echte Node-runtime ook uit; de WebGL-visuals moeten daarnaast handmatig in een browser worden beoordeeld.

## Overdracht aan Claude

1. Vergelijk eerst `main`, `visuals-1.7`, `assets-extern` en de lokale niet-gepushte code.
2. Bekijk de demo als *functionele referentie*, niet als visuele definitieve game.
3. Integreer `ConstructionProjects`, `ConstructionStory`, `ConstructionCampaign`, `HouseDesigner` en `HousePlanner` op een gezamenlijke integratiebranch.
4. Implementeer veilige bouwplaatsen met echte world collision, een eerste restauratieruïne, toegankelijke huizen en goede 3D-modellen per bouwfase.
5. Gebruik de echte profielgebonden schoolopgaven; geen dubbele score of misbruik van foutieve vragen.
6. Verifieer oude savebestanden en `s.builds`, voer tests uit, maak vergelijkbare screenshots en meet FPS/draw calls/triangles.
7. Laat de gebruiker de uiteindelijke geïntegreerde versie beoordelen voordat iets naar `main` gaat.

**Niet** het bestaande `world.js`, `game.js` of de visuals van Claude vervangen door de eenvoudige renderfunctie uit `construction-demo.js`.
