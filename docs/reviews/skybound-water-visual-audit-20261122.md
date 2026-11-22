# StudyQuest SKYBOUND — waterkwaliteit: rivieren, bronpoelen en watervallen
**22 november 2026 — concrete broncode-audit en implementatieplan.**
**Basis:** `main` bij start op `03a0d10a68a9a81d81e9ecc05e4445ad33ecf08b` (1.17.1), vergeleken met `visuals-1.7`. Geen nieuwe water-assets nodig voor de technische basis.
**Scope van deze PR:** twee bewezen UV-animatieproblemen gecorrigeerd; visuele waterrebuild **nog niet uitgevoerd**. De grote ombouw moet door Claude op een afzonderlijke grafische branch, met in-game QA.

## 1. Het probleem is architectonisch, niet uitsluitend een texture

| ID | Code | Waarneming uit de broncode | Risico voor de look | Correctie |
|---|---|---|---|---|
| W01 | `world.js:568–574, 608–620` | Windhaven-bergbeek staat als een **open mesh-ribbon** op `Math.max(mountainH(bank), mountainH(center)) + .07` | Geen ingegraven bedding, water hangt over de hellingen / abrupte kanten | Terrain onder beek afvlakken en ±0,4–0,9m insnijden; water onder de oever laten verdwijnen, zachte materiaalovergang |
| W02 | `world.js:638–650` | Op de vier verre berggebieden bestaat dezelfde ribbon, identiek door `HL.flow` shared material | Alle waterstromen zien er hetzelfde uit, ook bij andere hellingen | Geometrie per waterloop/helling; gedeelde shader, lokale stroom-/schuimmasker per segment |
| W03 | `world.js:609–617, 1455` | Eén map `cascade.png` in vijf keer `torrents`; animatielus verplaatst die **per stream** | Gedeelde UV-offset wordt vijfvoudig bijgewerkt, zodat stroming visueel te snel wordt | **GEREPAREERD in deze PR:** unieke `Texture` één keer per frame verschuiven |
| W04 | `world.js:648,650` | Bronpoelen gebruiken exact dezelfde watertextuurinstantie als bewegende beek | Poelen schuiven met het water mee in plaats van rustig te bewegen | **GEREPAREERD in deze PR:** afzonderlijke `Texture.clone()` voor bronpoelen, gedeelde bronpixels |
| W05 | `world.js:617–619,645–647` | Watervallen: slechts 2 `PlaneGeometry`-vlakken per val, met verschillende breedtes en opacities | Rechte kunststof-/gordijnvorm, geen rimpeling langs rotsen | Meerdere ongelijke verticaal gebogen ribbons met instabiele randen, schuimband aan lip en spetters onderaan |
| W06 | `world.js:499–526` | Waterfall shader gebruikt procedurele ruismaskers; één uniforme tint/transparantie | Gebrek aan diepte, dunne individuele stralen, doorschijnende rand / schaduw van nabijgelegen rots | Lagen: diep water (helder), dunne vallende stralen, wit schuim, splashes en nevel, gestuurde alpha |
| W07 | `world.js:647–651` | Bronpoelen zijn `CircleGeometry` met straal 1–1,1, zonder aansluiting op bedding | Zichtbaar ronde vlekken | Asymmetrische bronpoel uit triangulated shoreline geometry of wateroppervlak, stenen deels onder de rand |
| W08 | `world.js:570–574,625–645` | Snelheids- of schuimmaskers zijn niet geankerd op rotsen, stromen schuimen overal hetzelfde | Geen kolkend wit water bij stenen of stroomversnellingen | Foam bij rotsobstakels en bij grote vervalzones op basis van bekende rotsposities / helling |
| W09 | `world.js:725–727` | Losse generieke `waterfall()` gebruikt verticaal enkel vlak met vaste 1,6m breedte; in code ontbreekt een directe aanroep | Dode/ongebruikte fallbackfunctie en risico dat toekomstige dorpen dezelfde vlakke waterwand krijgen | Niet uitbreiden; eerst hergebruiken van nieuwe waterval-entity met juiste lip, spray en rotsankers |
| W10 | `world.js:525–527,1454` | Mist bestaat uit 3 sprites met sinusbeweging | Vlakke, repetitieve nevel voor klotsend water | Kleiner en dichter bij lip/impact, instanced druppels en lichte mist die in de wind waaiert |
| W11 | `world.js:609` | `MeshStandardMaterial` met `transparent`, `metalness:.1` en herhaalde cascade-texture, geen normal map | Hoog glanzend lichtblauw lint, geen echte stromingsrichting op bocht | Nieuwe lichte shader: zwei UV-fases, normal map optioneel; lage metalness, variërende troebelheid en ruwheid |
| W12 | `world.js:1455` | Scroll afhankelijk van de grootte van `torrents` i.p.v. per uniek materiaal | Framerate- en scene-afhankelijke snelheid | Tijdgestuurde schuiving eenmaal per unieke map per frame. In deze PR geïmplementeerd |

## 2. Actuele waterlocaties die Claude moet beoordelen

| Plek | Brondata | Toets |
|---|---|---|
| **Windhaven, oostelijk hoogland** | `brook` uit `(29.6,-7.6)` naar `(41.3,0.6)`; hoge val aan rand | 5–6 close-ups stroomopwaarts, bochten, val-lip, wolken |
| **Dennenhoek** | `P.brook=[[-75.2,5.4],…,[-82.3,16.5]]` | Water raakt grond langs helling; eindval ook werkelijk aan eilandrand |
| **Molenhoeve** | `[[-71.2,-71.8],…,[-75.1,-76]]` | Geen vlak blauwe lintrivier nabij molen; bronpoel moet geen ronde sticker zijn |
| **Steengroeve** | `[[56.6,-63.6],…,[57.9,-57.9]]` | Rotsachtig snelstromend water, klein spatwerk, donkere natte oevers |
| **Valkenrots** | `[[70.2,-130.4],…,[72.9,-116.6]]` | Bergstroom smaller en rustiger in rustige zones; versnelling bij steile randen |
| **Verre dorpseilandjes** | `waterfall(I,a,h)` nabij `world.js:725` | Eerst vaststellen of generator überhaupt aangeroepen wordt; niet handmatig nieuwe waterfalls toevoegen zonder doel |

## 3. Visueel doel: geloofwaardige bergbeek in een 3D-browsergame

### Rivierlichaam en bedding
1. Gebruik bestaande `brook`-paden, maar maak de middellijn glad via centripetale Catmull–Rom met consistente sampleafstand (ca. 0,2–0,35m). **Behoud begin/eindpunten** en omliggende gameplay, terreinseed en boomposities.
2. Bepaal bij ieder sample rivierbreedte op basis van waterafvoer (ca. 0,5–1,5 m) + lichte asymmetrie. Voeg ondiepe greppels naast de middenlijn toe, met rivierbodem zichtbaar onder het water: zand, kleine stenen en natte oevers.
3. **Wateroppervlak onder natuurlijke oeverrand**: voorkom dat de bankvertex boven het middelpunt het water tot boven het terrein duwt.
4. Geef riviermateriaal twee verschoven UV-fasen voor kleinere/natuurlijke golfbeweging, directionele beweging langs de bochten, lage reflectie, beperkt transparant waar ondiep en iets donkerder waar diep. Vermijd full-screen SSR/refraction op elke beek.
5. Rotsen staan ten dele in het water met **plaatselijke foam wakes** en downstream-streepjes. Schuim gebruikt een apart alpha-pattern of shader mask; niet een witte volledig dekkende overlay.

### Waterval
1. Water bereikt eerst een ondiepe **lip** met plaatselijk wit opschuimend water; de horizontale stroombaan eindigt vloeiend op die lip.
2. Vanaf de lip 4–8 **onregelmatig gebogen ribbons** met 6–12 verticale segmenten; elke ribbon heeft subtiele zijwaartse afwijking, doorzichtige randen en snelheidverschil, gedeelde material/shader voor weinig drawcalls.
3. Laat het water de eerste 1–2m de rotsvorm volgen voordat de stroming er los van komt. Plaats enkele schaduw-/rotsplaten (de reeds beschikbare Poly Haven/scanned rocks) achter de val, zodat het geen tweedimensionale gordijn is.
4. **Onderaan:** mist/spray, fijn spetterende schuimdeeltjes, en donkere natte rotsen; bij een eiland dat in de wolken eindigt is een duidelijke 'mist dissolution' acceptabel, maar voeg geen verzonnen bodemwater of zwembad toe.
5. Prioriteit aan geloofwaardig silhouet overdag, dan pas nacht/reflectie. Één waterval mag voor mobiel een vereenvoudigde variant hebben.

### Bronpoel / watercontact
- Geen uniforme `CircleGeometry` als zichtbare eindvorm.
- 2–3 asymmetrische oeversegmenten en stenen die deels in het water uitsteken; bronrimpelingen langzaam en radiaal, onafhankelijk van stroombaan.

## 4. Externe bronnen / downloads

**Eerste keuze: geen nieuwe 3D-modellen**. Het water moet renderen als onderdeel van het terrein en de dynamische stroming, niet als starre Sketchfab-waterval.

Bron voor alleen eventuele kleine alpha/roughness/foam-textuur:
- [ambientCG Foam001](https://ambientcg.com/view?id=Foam001) — **CC0**. Eerst beoordelen of foam-pattern visueel als *water* bruikbaar is; naam 'Foam' bewijst dit niet.
- [ambientCG Ground083](https://ambientcg.com/view?id=Ground083) — **CC0**, natte grond/sediment aan oevers; 1K PBR texture bij herhaling eventueel bruikbaar.
- [Poly Haven Crystal Falls HDRI](https://polyhaven.com/a/crystal_falls) — **CC0**; alleen referentie voor belichting, *geen* water-3D-object.
- [Three.js officiële texturemanual](https://threejs.org/manual/pages/textures.html) — aanbevelingen voor repeat/offset en gedeelde objecten.
- [Water2 op Three.js](https://threejs.org/examples/) — bewuste **niet-keuze** voor vijf smalle beken: spiegel/refraction-renderpasses zijn overkill, hogere performancekosten.
- [Threejs-water Rivers](https://askalice.github.io/threejs-worldgen/water/) en [River Demo](https://docs.plume3d.com/examples/river-demo/) — technische referentie voor flowmaps/foam en curva-ribbon; niet blind nieuwe runtime-library of herdistributie toevoegen.

**Geen assets downloaden voordat Claude de huidige situatie toont**: alle vereiste elementen zijn als lichte geometrie/shader te maken en bestaande rotsen kunnen hergebruikt worden.

## 5. Acceptatie en visuele bewijsvoering

1. Minimaal **vijf vaste camerastandpunten op Windhaven** plus **één op elk van de vier verre eilanden**, dag/schemer, huidige versus nieuwe build onder identieke instellingen.
2. Controleer water-uitloop: **geen zwevende rivieroever**, geen water door rotsen heen, geen rechte verticale gordijn, geen 'cut' op de rand.
3. Bron, waterlijn, waterval-lip en laagste zichtbaar einde moeten vloeiend aan elkaar aansluiten (of in wolk nevel oplossen).
4. Test dat rivier-materiaal maar één keer per frame animatie krijgt en de bronpoel onafhankelijk blijft (gerepareerd in deze PR, nog screenshot QA vereist).
5. Behoud collision van rotsen en oevers, grondniveau, paden, bruggen, savegameposities en spelontgrendeling.
6. Mobiel prioriteit: geen render-to-texture per beek; gedeelde 512–1k textures, beperkte transparantie overdraw, 1–2 draw calls per beek plus compacte impact-effecten; nauwkeurig meten op echte hardware.
7. **Geen nieuwe waterbron zonder duidelijke toevoer**; bronpoelen en beekjes logisch verbinden.
8. Nooit ''realistisch'' als gereed verklaren zonder screenshot/gezamenlijke review.

## 6. Al geïmplementeerde kleine correcties in deze PR
- `src/world.js`: `Set<Texture>` zorgt dat gedeelde scrollende watertextuur één update per frame krijgt. Flow van vijf beken vermenigvuldigt niet langer onbedoeld.
- `src/world.js`: bronpoelen ontvangen `flowMaterial.clone()` én `flowTexture.clone()`, waardoor de poel niet automatisch met de bewegende rivier meegesleept wordt. Het beeld blijft verder de oude stijl.
- **Nog niet geïmplementeerd**: rivierbedding, shader, rock foam wakes, 3D-watergordijn, splashspray en echte textureverbetering.

**Workflow:** deze branch hoeft niet te worden gemerged voordat Claude de visuele overhaul uitvoert. Laat Claude de twee eenvoudige bugfixes meenemen of cherry-picken zodat geen parallel conflict met `world.js` ontstaat; de hoofdimplementatie zit bij Claude.

