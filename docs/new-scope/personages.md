# Nieuwe scope — uiterlijk van NPC's en personages

**Geen duplicaat van PR #4 (rugzak), PR #7 (zweefvlieger), PR #14 (gesprekken/opdrachten).**

## Huidige stand
- `src/rig.js` gebruikt gerigde **Rocketbox**-modellen en materialen; `src/scenery.js` gebruikt onder andere de spelers `floor` en `niek`. `src/walkers.js` bevat voorbijgangers; NPC's in `world.js` hebben geanimeerde lichamen.
- De gebruiker vraagt expliciet om **geloofwaardige, normale personages** bij de Nederlandse/Europese historische sfeer: bijvoorbeeld blond haar voor vrouwelijke NPC's en lichtbruin haar voor mannen; geen ruimtepaklook.

## Opdracht voor Claude
1. Kijk in de echte game naar Niek, Floor, de negen bewoners en voorbijgangers: gezicht, proportie, haar, kleding, materiaal, licht, hoofdpositie en voeten-contact.
2. Verbeter de modellijst/toewijzing waar mogelijk met reeds gelicentieerde Rocketbox-varianten; volwassen versus kinderen duidelijk onderscheiden en personages natuurlijke leeftijds-/rolkleding geven.
3. Zorg voor geloofwaardige, niet-identieke kapsels, subtiele animatie van ademhaling, kijken, lopen, praten en werkhoudingen.
4. Behoud identiteit, quest-trigger, dialoog, colliders en bestaande rugzak-/gereedschap-gehechtheid. Maak close-up voor/na overdag en avond.
5. Downloads van nieuwe 3D-personen alleen na rigcompatibiliteits-, performance- en licentiecontrole.

**Niet in scope:** AI-interviewlogica, lesstof, rugzak of zweefvlieger; die zijn elders gedocumenteerd.