# StudyQuest — externe assetalternatieven, onderzoeksbatch 2
Datum: 22 november 2026. Onderzoek door ChatGPT; **geen assets gedownload of geïntegreerd**.
Voor Claude: dit is een shortlist ter visuele review, geen opdracht om alles te downloaden.

## Wat al besproken/afgewezen is
- Vorige Sketchfab-batch: Kigha wandlantaarn en DoniTodorov Medieval House zijn door gebruiker al aan Claude gegeven; **niet opnieuw vragen**.
- Daniel Vicente, *Modular Medieval Wall – Realistic* (67,7k totaal) en Toni García Vilche, *Ancient Ruins Pack* (115,8k totaal) zijn door Claude afgekeurd; **niet heropenen**.
- Claude's Poly Haven meubel-/tuin-/ruïne-/dakbatch niet opnieuw onderzoeken; check eerst lokale `00_Inbox` en `assets-extern`.
- `main` heeft procedurale bruggen met verschillende lengtes, hoogteverschillen en collision. Vast brugmodel mag dit niet breken.
- `feature/construction-projects-chatgpt` bevat zelfstandig logisch contract voor wachttorenrestauratie en eigen huis; nog geen zichtbare modellen.

## Kandidaten — direct controleerbare bronpagina's

| Groep | Kandidaten en bron | Auteur | License op bron | Triangles op bron | Gebruik | Verplichte check |
|---|---|---|---|---:|---|---|
| Brugmodules | [Wooden Bridge Modular Kit](https://sketchfab.com/3d-models/wooden-bridge-modular-kit-9caac4745ead4d41918bb22c969ea785) | Umar | CC BY | 14.600 totaal | Splits in planken, ligger, reling; herhaal passend op bestaande brugbanen | zijn individuele segmenten binnen 300–3.000 triangles en passen stukken op helling? |
| Ruïnemuur | [Photogrammetry low poly stone wall](https://sketchfab.com/3d-models/photogrammetry-low-poly-stone-wall-c5059ae65ef24fe3bcb87107b3aa63f9) | vicente betoret ferrero | CC BY | 2.300 | Een verweerd segment of steenmateriaal voor herstelbare muur | sfeer, schaduw, randverloop, voorkomen zichtbare scanherhaling |
| Huisbouw | [Modular Wooden Building Kit – Game Ready](https://sketchfab.com/3d-models/modular-wooden-building-kit-game-ready-09724f363c2a4947a6f2dc9669d971b7) | AspectStudios | CC BY | 500 totaal | Functionele gevelpanelen met deur/raamopening en vloer; eigen bouwmodule | is de vorm Europees genoeg? vervang vlakke afwerking met bestaande PBR |
| Wachttoren | [Watch tower](https://sketchfab.com/3d-models/watch-tower-042f327a0f4c4fc9bf458903666bb257) | _SeF_ | CC BY | 6.100 | Potentiële complete beloopbare eindtoren / technische referentie | visueel moet Europees middeleeuws zijn; geen moderne militaire toren |
| Kleine brug | [Old bridge](https://sketchfab.com/3d-models/old-bridge-293190e5169947c1a374a9ec850264d3) | NoodlePoodle | CC BY | 5.500 | Alleen kleine vaste dorpsbrug; bestaat uit 3 meshes | niet voor grote variabele eilandoverspanning; let op NoAI-label bron |
| Steendetails | [Stone Wall, Low Poly, Game Ready](https://sketchfab.com/3d-models/stone-wall-low-poly-game-ready-53b1128497e34d4b9766dcde10df230b) | kEam | CC BY | 11.600 hele set | Alternatieve muur, pilaar en trim voor ruïnestappen | per mesh budget; texture 4K terug naar 1K; alleen bij aantoonbare visuele winst |
| Straatlantaarn | [Medieval Lamp Post](https://sketchfab.com/3d-models/medieval-lamp-post-6373453ad79748b38784db0fcf25ea12) | The 8th noble lab | CC BY | 13.700 | **Uitsluitend referentiekandidaat**, niet herhaald zonder reductie | 4K photoscan naar 1K, model naar max. 3K, glass en light ontbreken |

Brongegevens zijn per Sketchfab-pagina gecheckt via zoekindex. De inhoudelijke 3D-viewer moet Claude opnieuw beoordelen met zijn actuele world screenshots vóór download; geen echte Sketchfab-bestanden zijn door ChatGPT geïnspecteerd.

## CC0 PBR alternatieven — geen extra geometrie
- [Planks009](https://ambientcg.com/view?id=Planks009), oud houten vloerplankenmateriaal — **interieurs**, vervangt daksteenachtige binnenvloer indien nog aanwezig.
- [Bricks095](https://ambientcg.com/view?id=Bricks095), verweerde middeleeuwse steenmuur — ruïnemuur / restauratie.
- [PavingStones141](https://ambientcg.com/view?id=PavingStones141), Europese ongelijke kasseien — dorpsstraten.
- [PavingStones151](https://ambientcg.com/view?id=PavingStones151), Europees boog-/waaiervormig straatpatroon — voor een plein als afwisseling.
Alle bovenstaande ambientCG-assets staan onder CC0; download alleen de 1K-PBR-set als de textuur nog niet lokaal bestaat.

## Afgewezen in dit onderzoek
- Pigcraft *Ancient Stone Gate Ruin – Moss Covered* en *Ruined Stone Bridge – Broken Arch*: elk circa **1,9 miljoen triangles** ondanks claim 'game-ready' — ver boven budget.
- Sereib *Medieval Stone Bridge*: 374.400 triangles — geen browservriendelijke modulaire vervanger.
- Orpind middeleeuwse torens: CC BY-NC-ND — niet geschikt.
- Glowbox 3D *Medieval Lamp Post*: 8.200 triangles, boven herhaalbudget en NoAI-label; alleen overwegen als uniciteit een echte meerwaarde heeft.
- Cianon *Ruined Tower*: 1.700 triangles maar visuele kwaliteit nog onbevestigd; niet op polygongetal alleen kiezen.
- 3DAssets.dev *Ember Quest timber bridge module*: 192 triangles maar retro/pixelstijl — strijdig met realistische richting.
- Sketchfab houten/platte low-poly packs zonder PBR die de huidige uitstraling niet aantoonbaar verbeteren.

## Beslisprocedure
1. Vergelijk per kandidaat 3D-preview naast **huidige** (niet alleen `main`) screenshots.
2. Benoem concrete vervanging en waarom huidig object achterblijft.
3. Controleer downloadbaarheid, licentievoorwaarden, eventuele NoAI en textureprovenance; in openbare repo alleen echte CC0/CC BY.
4. Meet per **mesh**, niet per volledige kit; doel herhaalde props 300–3.000 tris, hero max 15.000; 512–1K textures.
5. Kies eerst **één** ruïnemuur en **één** modulaire brug voor proefconversie. Voeg geen nieuw bouwkit toe als bestaande procedurale delen met nieuwe PBR-materialen beter zijn.
6. Na gebruikerakkoord downloaden via Chrome naar `00_Inbox`, dan conversie en screenshotvergelijking. Geen automatische deployment.

Praktisch: voor de **herstelbare toren** is een modulaire, gecontroleerde destructie-/restauratieopbouw beter dan een heel gebouw dat in één keer verschijnt. Houd de grafische opbouw en collision bij Claude, de quest- en save-logica in de ChatGPT branch.
