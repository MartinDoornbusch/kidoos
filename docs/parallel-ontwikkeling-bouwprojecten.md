# StudyQuest — Afzonderlijk bouw- en restauratiesysteem

**Status (22 november 2026):** werkende en lokaal geteste, maar **nog niet in de 3D-game geïntegreerde** bouwlogica. Concept-PR #1. **Niet live.**

## Waarom gescheiden ontwikkelen?

Claude beheert de 3D-wereld, assets, materialen, animaties, collision en de integratie in `game.js` / `world.js`. ChatGPT beheert hier uitsluitend een losstaande, toetsbare bouwlogica en ontwerpdocumentatie.

De branch `feature/construction-projects-chatgpt` is gestart vanaf `main`. De Claude-branches `assets-extern` en `visuals-1.7` bevatten onafhankelijk werk en zijn niet automatisch in deze branch opgenomen. Kies samen een integratiebranch en review eerst de diff; **merge deze PR niet blind.**

## Nieuw op deze branch

| Bestand | Functie |
|---|---|
| `src/construction-projects.js` | Bouwtekeningen, resourcebudget, stappen, niet-muterende bouwtransacties |
| `src/construction-story.js` | NPC-verhaal, concrete doelen, 3D-reveal/hide-instructies en beloningen per bouwfase |
| `src/construction-campaign.js` | Projecten toevoegen, unieke correcte antwoorden registreren, fasen afronden, persistente status en eenmalige beloningen |
| `src/checks/construction-projects.test.js` | Budget-, fase- en immutabilitytests |
| `src/checks/construction-campaign.test.js` | Save/load, dubbele antwoorden, materiaaltekort, voltooiing en beloningen |

Tests uitgevoerd in Node v22 op de lokale, overeenkomende modules:

```sh
node src/checks/construction-projects.test.js
node src/checks/construction-campaign.test.js
```

Beide zijn geslaagd. Browserintegratie, Three.js-rendering en productieprestaties zijn **niet** getest.

## Eerste bouwavontuur: Het geheim van de vergeten wachttoren

De speler ontdekt via cartograaf Linde dat een verlaten uitkijktoren ooit de veilige route tussen eilanden aanwees. Restauratie kost samen **7 hout, 9 steen, 9 planken en 7 correcte antwoorden**. De speler gaat samen met bestaande NPC's aan het werk.

| Fase | NPC | Wat gebeurt er zichtbaar? | Materiaal | Goed beantwoorde vragen |
|---|---|---|---|---|
| 1. Schade onderzoeken | Linde | Schademarkeringen en herstelplan verschijnen | geen | 1 |
| 2. Puin ruimen | Gerrit | Puin verdwijnt en toegang wordt vrijgemaakt | geen | 1 |
| 3. Muren herstellen | Joost | Muren en vensteropeningen worden herbouwd | 6 steen, 2 hout | 2 |
| 4. Trap en verdiepingsvloer | Bram | Trap, vloer en leuningen worden beloopbaar | 3 hout, 4 planken | 1 |
| 5. Dak en uitkijkpost | Linde | Dak, lantaarn en archiefdeur verschijnen | 3 steen, 2 hout, 5 planken | 2 |

Een voltooide toren geeft 12 munten en drie **nog aan de game te koppelen** unlock-flags: `wachttoren_toegang`, `wachttoren_uitkijkpost`, `wachttoren_kaart`. De verborgen kaart kan later een nieuw verhaal of gebied starten. Er is nu **geen** automatisch geopend eiland.

**Belangrijk:** NPC-verhalen zijn voorbereid, maar de bestaande NPC's spreken deze dialogen nog niet uit. Claude moet voor elke fase passende hoogwaardige 3D-delen kiezen; de namen in `visuals.reveal` en `visuals.hide` zijn contractnamen, geen reeds bestaande meshes.

## Tweede bouwproject: Een eigen vakwerkhuis

Vijf fasen: fundering, dragende balken, muren/ramen, dak en interieur. Samen **10 hout, 9 steen, 9 planken en 6 correcte antwoorden**. De beloning is een `eigen_huis_inrichting`-flag voor latere interieurfuncties.

Niet verwarren met bestaand vrij bouwen: `s.builds` (blok, lantaarn, bloembak, bankje, vlag) blijft volledig behouden en ongewijzigd.

## Contract voor de integratie

De modules zijn gewone scripts; in Node zijn ze met `require` te gebruiken, in de game komen ze later **in deze volgorde** na de bestaande Three.js-/domeinmodules maar vóór `game.js`:

```html
<script src="construction-projects.js"></script>
<script src="construction-story.js"></script>
<script src="construction-campaign.js"></script>
```

Er is nu bewust **geen** wijziging aan `index.html`.

### 1. Nieuwe bouwplaats beginnen

De bestaande wereld controleert vóór het starten: kavel vrij, grondhoogte correct, geen NPC-route, geen brug, geen deur en geen bestaand project op deze plek. De logica toetst alleen unieke `plotId` en `id`, **niet** fysieke collision of verboden locaties.

```js
const r = ConstructionCampaign.start(s, {
  id: "wachttoren-01",
  blueprintId: "wachttoren_ruine",
  plotId: "wachttoren-kavel",
  x: approvedX,
  z: approvedZ
});
if (r.ok) { s = r.save; persist(); }
```

### 2. Bestaande vragenbanken gebruiken

De game stelt echte Nederlandse, Duitse of historische vragen uit de bestaande leerbanken, afgestemd op het gekozen profiel. Voor Floor alleen vakken en havo-3-leerstof gebruiken die al beschikbaar zijn. **Geen fictieve controle van het antwoord via een UI-knop.**

Pas wanneer de bestaande leercode een antwoord daadwerkelijk als juist heeft beoordeeld, registreert de game de beantwoording:

```js
const current = ConstructionCampaign.state(s, "wachttoren-01");
const stageId = current.progress.next.id;
// EVENT alleen vanuit vertrouwde callback na correcte beoordeling.
const r = ConstructionCampaign.answer(s, "wachttoren-01", {
  eventId: uniqueSubmissionId,
  questionId: actualQuestionId,
  stageId,
  subject: "Nederlands",
  correct: true,
  verified: true
});
if (r.ok) { s = r.save; persist(); }
```

Een eerder gebruikte event-ID of dezelfde vraag-ID telt binnen dezelfde fase niet dubbel. Een antwoord voor een verouderde fase wordt niet geaccepteerd. Dit is **client-side spelintegriteit**, geen cryptografisch fraudebestendige toetsing.

### 3. Bouwfase afronden

```js
const result = ConstructionCampaign.complete(s, "wachttoren-01");
if (result.ok) {
  s = result.save; persist();
  // Koppel result.visibleParts aan de 3D-wereld en collision.
  // result.stageStory.visuals beschrijft welke stukken verschijnen/verdwijnen.
}
```

Alle materiaaluitgaven en projectvoortgang komen uit één niet-muterende transactie. Onvoldoende materiaal of antwoorden verandert de save niet; beantwoorde vragen blijven bewaard totdat de fase echt wordt afgerond. Beloningen worden per voltooid project maar één keer uitgekeerd.

### 4. Opslag / migratie

Nieuw en additief:
- `s.constructionProjects`: projecten met locatie, blueprint, rotatie, `completed`.
- `s.constructionStudy`: per actief project fasegebonden unieke vraag- en event-ID's.
- `s.constructionUnlocks`: verkregen unlock-flags.

Een oud saveobject zonder deze keys wordt automatisch als lege collectie gelezen. Het bestaande `s.builds`, munten, voorraden, missies, oefenstatistieken en de profielen moeten intact blijven. Kopieer `result.save` **in zijn geheel** in dezelfde geheugenstatus en roep de bestaande `persist()` aan.

## Integratiegrenzen voor Claude

1. Niet rechtstreeks nieuwe scripts toevoegen aan `main` voordat de lopende branches zijn vergeleken.
2. Bestaande 3D-assets, converters, `00_Inbox` en licenties behouden.
3. Voor de wachttoren eerst één geschikte vrije/restauratieplek aanwijzen, geen exacte coördinaten raden.
4. Voor iedere fase zichtbaar andere modellen en correcte beloopbare collision tonen; nooit losse dozen als definitieve graphics.
5. Losse scripts gebruiken als contract, `game.js`, `world.js`, `collision.js` en `index.html` uitsluitend aanpassen tijdens de gezamenlijke integratiestap.
6. FPS, draw calls, triangle count en texturebudget na integratie opnieuw meten.
7. Niets rechtstreeks naar Vercel-productie uitrollen zonder akkoord.

## Wat hierna nog nodig is

Een echte 3D-bouwkavel, preview voor plaatsing, interactie bij de NPC's, bruikbare modeldelen per fase, collision, interieur, interactieve ruïnekaart en zichtbare bouwanimaties. Pas na deze integratie is de functie werkelijk speelbaar.

## Controle bij merge

- Oude en nieuwe savebestanden werken.
- Een foute vraag levert geen bouwkrediet op.
- Een dubbel ingestuurd goed antwoord telt niet dubbel.
- Tekort aan grondstoffen vernietigt geen vragenvoortgang.
- Iedere afgeronde fase consumeert het correcte materiaal één keer.
- De toren levert slechts één keer de beloning.
- Niek en Floor krijgen passend niveau en geen ontbrekende vakken.
- Nieuwe en oude gebouwen blijven beloopbaar, zonder doorschieten door muren.
- Voldoende FPS op zowel desktop als mobiele browser.
