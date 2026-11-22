# StudyQuest SKYBOUND — audit van huizen en gebouwschillen
**Datum:** 22 november 2026 • **Status:** code- en beeldonderzoek, geen 3D-aanpassingen of deploy.
**Gecontroleerd:** `main` commit `03a0d10a68a9a81d81e9ecc05e4445ad33ecf08b`, `visuals-1.7`, `src/world.js`, `src/village.js`, `src/game.js`, `src/models.js`, `src/models/`, `src/art/credits.txt`; de door gebruiker aangeleverde foto van Dennenhoek.

## Executive conclusie (niet verdoezelen)
1. **Negen NPC-gebouwen met speelbaar interieur: alle negen hebben een procedureel opgebouwde buitenkant.** Sommige geveldetails zijn al echte geïmporteerde onderdelen (Sketchfab-raam, wandlamp), maar **nul van de negen** gebruiken op dit moment een volledig geïmporteerd high-quality huis als hun daadwerkelijke interacteerbare buitenkant.
2. **Precies één volledig geïmporteerd woningmodel:** `sf_house.mdl` — "Medieval house" van **DoniTodorov**, Sketchfab CC BY 4.0, zoals vastgelegd in `src/art/credits.txt`; één `scanProp('sf_house',...)` in `src/world.js:748–750` bij **(-71,9) op Dennenhoek**. Een goed uitziend **decoratief huis** met een grove `solids` footprint, **niet geregistreerd in `villageHomes` en geen gekoppelde interactieve kamer**.
3. **Het simple huis op de foto rechts is zeer waarschijnlijk Gerrits echte houtvesterij:** `hut(-60,-2.4,5,2)` op `world.js:742` met bezoekersingang bij **(-60,-.22)** (`village.js`). Links waarschijnlijk `sf_house`, achterin in de richting van de nieuwe wachttorenruïne `RX=-54,RZ=-10.5`. Dit past sterk bij de foto en relatieve posities, maar is nog niet met 3D-objectselectie gevalideerd.
4. **Grootste architecturale inconsistentie:** juist op één speelplek staat een hoogwaardige onbetreedbare woning naast een eenvoudige wel-betreedbare hut. **Vervang de eenvoudige hut niet blind zonder het huis-/ingangs-/collisionconcept te herstellen.**

## 1. Exacte inventaris van 9 speelbare NPC-gebouwen

Interieurafhandeling: `world.js:1132–1332` maakt per `villageHomes` een aparte 3D-kamer buiten de spelwereld; `game.js:161,419–427` herkent nabijheid van `room.house.x,z` en teleporteert de speler. De positie in `village.js` is in de huidige procedurele buitenkant afgestemd op een ingangspositie aan de voorgevel. Die coördinaten zijn **een contract**, niet alleen decoratie.

| # | NPC / gebouw | Omgeving | Gebouw-aanroep in `world.js` | Interactiepunt `village.js` x,z | Klasse | Prioriteit | Gewenste vervanger |
|---|---|---|---|---|---|---|---|
| H01 | **Linde — Kaartenhuis** | Windhaven | `hut(-10,5,5,0)`, regel 706 | **(-10,7.18)** | `hut()` / proceduraal | **P0** | Authentiek cartografenhuis: compacte vakwerkgevel, dakpannen, schuine balken, zichtbare kaart-/uithangborddetails; geen vaste fantasiegeometrie |
| H02 | **Bram — Timmerwerkplaats** | Windhaven | `workshop(-15,-3,4,false)`, regel 706 | **(-15.88,-1.24)** | `workshop(false)` / proceduraal | **P1** | Houten ambachtswerkplaats, luifel, afdak, houtrekken, zaagdetails; bestaande zagerijprops herkenbaar houden |
| H03 | **Mara — Smederij** | Windhaven | `workshop(11,7,4.7,true)`, regel 706 | **(9.97,9.05)** | `workshop(true)` / proceduraal | **P1** | Robuuste stenen smederij, rookkanaal, ijzerwerk, overtuigende deur-/raamuitsparingen; warme gloed uit smidsvuur |
| H04 | **Wies — Handelspost** | Windhaven | `tradingPost(13,-6.36)` → `hut(...5.2,2)`, regel 708 | **(13,-4.12)** | `tradingPost()` / schil procedurale hut | **P0** | Herkenbaar koopmanshuis met vaste marktluifel, houten bord, rekken en betaalbare marktkramen; niet alleen kale cottage |
| H05 | **Tomas — Veldhuis** | Bloesemvallei | `hut(12,-60,5,1)`, regel 707 | **(12,-57.84)** | `hut()` / proceduraal | **P1** | Tuinmanshuis: lichtere natuursteen/vakwerk, veranda, kruidenrekken, planters, houten kozijnen |
| H06 | **Meneer Van Dalen — Landhuis** | Bloesemvallei | `manor(-13,-52.94)`, regel 708 | **(-13,-49.74)** | `manor()` / proceduraal | **P1** | Uniek 2-laags landhuis: uitkragende verdieping, zijvleugel, entreeportaal, passende ramen; galerij/bibliotheek kan bereikbaar blijven |
| H07 | **Gerrit — Houtvesterij** | Dennenhoek | `hut(-60,-2.4,5,2)`, regel 742 | **(-60,-.22)** | `hut()` / proceduraal | **P0 — eerste aanpak** | Verbind de bestaande DoniTodorov `sf_house` met de werkelijke houtvesterij óf plaats een passend high-quality huis op Gerrits huidige plot; voorkom dat het huidige decorhuis plus oude hut als twee concurrerende woningen blijven |
| H08 | **Anke — Boerderij** | Molenhoeve | `hut(-50,-67,6,1)`, regel 875 | **(-50,-64.39)** | `hut()` / proceduraal | **P1** | Grotere boerderij: onregelmatige dakranden, stenen plint, houten schuurdeuren, erf; behoud werking molen/put/moestuin |
| H09 | **Joost — Steenhouwerij** | Steengroeve | `workshop(47,-84,4.4,true)`, regel 929 | **(46.03,-82.05)** | `workshop(true)` / proceduraal | **P1** | Stenen werkloods met zadeldak, blokken/kranen en steenhouwgereedschap; niet dezelfde look als Mara's smederij |

**Exacte aantallen:** `hut()` is de basis voor **vijf** van de negen speelgebouwen (Linde, Tomas, Wies indirect, Gerrit, Anke); `workshop()` voor **drie** (Bram, Mara, Joost); `manor()` voor **één** (Van Dalen). `sf_house` wordt **éénmaal apart** gebruikt op Dennenhoek en hoort niet bij de negen gekoppelde interieurs.

## 2. Niet-interactieve gebouwen / wereldarchitectuur

| ID | Bouwtype | Code / aantal | Technologie | Oordeel |
|---|---|---|---|---|
| D01 | `sf_house` van DoniTodorov | `world.js:748–750`, **1** in Dennenhoek | Volledig Sketchfab 3D-model, CC BY, grof solid/collider | **A-kwaliteit als referentie**; eerst integreerbare ingang/collision voor NPC-gebruik bepalen |
| D02 | `cottage()` — verre eilanden | `world.js:972–990`, **18 getekende huisjes**: 8 op kleine eilanden; 10 op extra eilanden (7 locaties, op 3 van die locaties een tweede) | Eenvoudige procedurale vakwerkvormen | P2; behouden als LOD voor ver weg, alleen verbeteren als ze op spelerafstand komen |
| D03 | Molens | `world.js:416,706–707,874`: **3** molens in Windhaven/Bloesemvallei/Molenhoeve | Eigen geometrie, lopende wieken | P2; aparte mechanische architectuurronde, niet automatisch met huisassets vervangen |
| D04 | Wachttorenruïne | `world.js:739–869`, Dennenhoek | Eigen opbouw in 5 fasen met kwaliteitsstenen, sf-steiger en ladder | **Bestaande kwaliteit behouden**; geen nieuw full-ruin-model nodig |
| D05 | Observatorium, baken, rotonde | `world.js:939–1058` | Gespecialiseerde procedurale bouwwerken, geen woonhuizen | Buiten huizenvervangbatch, afzonderlijke architectuur-QA |
| D06 | Kabelbaanstations | `world.js:654–704` | Mechanische gebouwen/constructies | Buiten scope |

## 3. Hoe kan een procedureel gebouw ondanks details er goedkoop uitzien?

De `hut()`-schil bestaat uit `BoxGeometry`, platte gables en twee dakplaten (`world.js:287–305`). De symmetrische gevel met ramen links/rechts en herhaalde dakhelling wordt met kleurvarianten hergebruikt. `workshop()` gebruikt rechte volumes en `manor()` meer geometrie, maar blijft codegeneratie.

**Wél al echte details op die schillen:**
- `sf_window.mdl` als gevelraam bij `windowAt()` (`world.js:240–250`);
- `sf_lantern.mdl` als voordeurwandlamp bij `wallLantern()` (`world.js:399–402`);
- overige Poly Haven-texturen voor steen, hout en dak;
- tonnen/tuinbanken als scan waar beschikbaar.

Dus niet alles ‘low-quality’. De **vorm, detaillering en herhaling van de hoofdschil** is het probleem, niet dat iedere texture of lantaarn ontbreekt.

## 4. Foto van de gebruiker: het cruciale referentiegebied

In het aangeleverde schermbeeld:
- links: steengevel met oud vakwerk en rood dak, passend bij de losse `sf_house` op **(-71,9)**;
- rechts: zeer symmetrische gepleisterde 1-laagse vakwerkcottage met zwart rooster en rode dakpannen, passend bij Gerrits `hut(-60,-2.4)`;
- richting achterzijde: grote metselwerk-/ruïneconstructies uit de level-3-omgeving.

De eerdere identificatie van links als `workshop()` was **niet overtuigend en waarschijnlijk onjuist**; broncoördinaten en modeltype wijzen veel sterker op `sf_house`.

**Architectuurbesluit nodig:** Maak één duidelijke, hoogwaardige **betreedbare** houtvesterij. Voorkom dat de speler tussen twee identiek geprogrammeerde ‘huizen van Gerrit’ moet kiezen. Behoud toegang tot `villageHomes['gerrit']` en dezelfde NPC-quest.

## 5. Aanbevolen vervangstrategie (niet blind modellen importeren)

### S0: laag-risico demonstratie — Gerrit op Dennenhoek
1. Foto + huidige bronlocaties A/B.
2. Kies doel: **A)** verplaats echte `sf_house`-schil naar de actieve `hut`-locatie, verwijder/of herbestem oude decorlocatie; **of B)** maak bestaande `sf_house` locatie de officiële Gerrit-locatie en update `villageHomes`, paden, NPC-gesprekken, map markeringen, collision en `visitHouse` return. **A is veiliger**, omdat de bestaande ingang/coördinaten/staat behouden kunnen blijven; alleen als de specifieke deuropening goed kan worden uitgelijnd.
3. Meet de deurpositie van het geïmporteerde 3D-model (mesh center, yaw, bbox, eenduidige ingang) voordat de huidige hut wordt verwijderd. De DoniTodorov-deur is mogelijk deel van één GLB/MDL-mesh — niet aannemen dat die vanzelf openzwaait.
4. Laat binnenkamers op `world.js:1132+` voorlopig intact en gebruik een visueel kloppende entree door de bestaande `game.js:161/419` enter-trigger.
5. Nieuwe solide footprint pas na meten; oude collider verwijderen om onzichtbare muren te voorkomen; pad, houtstapel, ladder en wachttoren niet blokkeren.
6. Eén voor-/na-screenshot in exacte camerahoek als oorspronkelijke foto; test open deur, NPC, quest en exit.

### S1: eerste indruk — Windhaven (vier gebouwen)
- Linde: **cartografenhuis** (2e gevelvorm of dakvariant).
- Wies: **handelswoning** met unieke winkelpui / overkapping.
- Bram: **houtwerkplaats** met afdak, oud gereedschap, plankopslag.
- Mara: **steen-/smeedwerkplaats**, rookkanaal en gevel die **niet identiek is** aan Joost.

### S2: overige speelhuizen
- Tomas: veldhuis, kruidenrekken, plantbakken;
- Anke: grotere boerderij met correct erf;
- Joost: steengroeveloods, andere steen/techniek;
- Van Dalen: uniek 2-etages landhuis met bibliotheek, galerij en zijvleugel.

### S3: verre dorpen
- De **18 verre cottages** gebruiken desnoods één geoptimaliseerde 2–3-voudige gevelvariant met LOD/instancing; eerst beoordelen vanaf de huidige speelroutes.
- Ze hoeven niet even duur te zijn als de negen betreedbare hoofdgebouwen.

## 6. Ontbrekende complete assettypes voor volgende gericht onderzoek

**Geen nieuwe downloads tijdens deze audit**, maar de **zes onderscheidbare kwaliteitsfamilies** die daadwerkelijk nodig zijn:
1. Compact middeleeuws vakwerk-/cartografenhuis (Linde + Tomas met variatie);
2. Houten **carpenter workshop** met houtopslag (Bram);
3. **Stone smithy** met schoorsteen, boogdeur, smidsvuur (Mara; Joost gebruiken als andere variant met kalksteen);
4. **Medieval trading post / merchant house** met overkapping en passende interactieve deur (Wies);
5. **Farmhouse** met aan-/bijgebouwde schuur en lage steenplint (Anke);
6. **Manor house** (2 verdiepingen, zijvleugel/uitkraging, raamritme, entree) voor Van Dalen.

**Niet eisen:** negen verschillende downloads. 4–6 zorgvuldig ontworpen/modulaire source-modellen met 2–3 kwalitatieve varianten voldoen vaak beter, zolang herkenbaarheid en silhouet op hoofdcamera duidelijk verschillen. Het bestaande `sf_house` dient als absolute kwaliteitsbenchmark, niet als blind te clonen gebouw op elke locatie.

## 7. Functioneel integratiecontract voor Claude

**Vast te houden bij elk nieuw exterieur:**
- `villageHomes` 9 IDs + `place`, `name`, `join`, `bend`, `k`, `shop`, `manor`, `stone` en questgegevens;
- **bestaande entree-ankerpunten:** `game.js:161` gebruikt `dist(room.house)<1.8` en `visitHouse` koppelt buiten aan aparte binnenkamer; behoud die punten, of wijzig **alle** afhankelijke systemen gecoördineerd;
- behoud 9 interieurkamers, Npc-animatie en paden `world.js:1132–1384`; landhuis heeft eigen verdieping, trap en bibliotheek.
- Gevel hoeft in deze fase nog niet seamless betreedbaar in de werkelijk zelfde mesh te zijn: teleporterende kamer is al een bewust ontwerp. **Maar** als een visuele voordeur gesloten blijft terwijl 'binnenlopen' gebeurt, hoort er een geloofwaardige deuranimatie/entree bij.
- Match schaal: huidige `hut` ca. 5m breed (Anke 6m), werkplaatsen ca. 4–4.7m, Van Dalen 8.5m + zijvleugel. Niet uniform strekken of alle drie naar dezelfde breedte forceren.
- Match coördinaten/collision nauwkeurig, wegvrijheid, molenwieken, resterende houtstapels en berghellingen.
- Hergebruik geïmporteerde `sf_window` en `sf_lantern` alleen waar fysiek en stilistisch passend. Een compleet huismodel met ramen heeft meestal geen dubbele losse raamkozijnen nodig.
- Vereis texturen 1K max voor kleine herhalingen, bij unieke grote voorgevels eventueel 2K na test. Material reuse/instancing en mobile FPS; hero-huis doelorde 8–20k triangles afhankelijk zichtbaarheid, maar alleen na echte benchmarks.
- Controleer **license.txt in gedownloade glTF**, geen Sketchfab Standard in publieke repo; CC BY attribution en de bestaande `credits.txt` blijven accuraat.
- A/B per huis, identieke camera en daglicht: silhouette, wandtextuur, dak, deur, zichtvenster, NPC, betreden/verlaten en multiplayer-geschiktheid (geen dubbele triggers) testen.
- Werk op geïsoleerde branch, niet parallel `src/world.js` overschrijven, **geen automatische merge/deploy**.

## 8. Wat wel en niet is uitgevoerd

**Wel:** broncode-audit, indeling 9 speelhuizen/1 geïmporteerd decorhuis/18 verre cottages, screenshotherinterpretatie, vervangprioriteit en uitvoeringsspecificatie.  
**Niet:** in-browser WebGL-control, echte FPS-meting, .mdl-rendering A/B, extra externe modellen downloaden, broncode wijzigen, livegang.

**Voorgesteld eerstvolgend resultaat:** **één** demonstratie waarbij Gerrits hut verdwenen is en `sf_house` als volwaardig visueel gekoppelde houtvesterij functioneert. Pas daarna alle Windhaven-huizen van een kwaliteitsbibliotheek voorzien.
