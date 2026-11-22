# Nieuwe scope — NPC-opdrachten en betekenisvolle gesprekken

**Dit is nieuw productgedrag dat niet door PR #1–#11 wordt ontwikkeld.** Bestaande lesstof, bouwmissies en bewoners mogen niet verdwijnen.

## Huidig
- `src/game.js` verwerkt `interview()`, `projTalk()`, `askOne()` en de vakvragen uit `learning.js`, `history.js`, `nederlands.js`. De inhoud is vooraf geschreven en werkt al als controleerbare opdrachten.
- `api/` bevat alleen opslag/koppeling/overzicht-endpoints. Er is op `main` **geen afzonderlijke live AI-dialogue API**.

## Nieuwe eisen
1. Bewoners hebben eigen **korte avonturenraadsels en opgaven** die bij hun beroep en missie passen; gesprekken bestaan niet alleen uit vrijblijvende small talk of generieke multiplechoice.
2. Verhaalsituatie, feedback en hints zijn herkenbaar aan de omgeving (Mara smid, Linde kaarten, Gerrit hout, etc.), met duidelijk wat je moet doen, wat je verdient en waarom.
3. Vraagbeoordeling blijft **deterministisch** op basis van juiste antwoorden in de bestaande lesbanken; een taalmodel mag geen cijfers, credits of bouwmaterialen rechtstreeks toekennen.
4. Onderzoek AI alleen als **optionele tutor-laag** voor contextuele hints en uitleg, met server-side API keys, kostenlimieten, kindvriendelijke moderatie, geen persoonsgegevens in prompts, geen altijd-actieve microfoon.
5. Zonder AI-verbinding blijft het volledige spel met alle quests, hints en savegames speelbaar.
6. Per NPC test: correcte leerstof volgens profiel, foutantwoord, hint, herhaling, NPC-animatie, rewards en save/restore.

**Niet opnieuw ontwerpen:** bestaande Duitse hoofdstuk 7 / Geschiedenis / Nederlandsbanken en de bouwmissie-fasen uit PR #1.