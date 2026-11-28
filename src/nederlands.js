"use strict";
// [onderdeel, vraag, antwoord(en), uitleg, opdrachtregel]. Een lijst als antwoord is meerkeuze; het eerste item is goed.
const dutchBanks={"Niek":[
 ["Leesvaardigheid","“Door de regen werd het veld glad. Daardoor gleed de keeper uit.” Welk woord laat zien dat iets een gevolg is?","daardoor","Daardoor wijst naar wat de regen en het gladde veld tot gevolg hadden.","Typ dat ene woord uit de zin."],
 ["Leesvaardigheid","“Niek neemt een jas mee, want het gaat regenen.” Welk woord kondigt de reden aan?","want","Na want lees je waarom Niek een jas meeneemt.","Typ dat ene woord uit de zin."],
 ["Leesvaardigheid","“De nieuwe bibliotheek heeft studieplekken, een leeshoek en computers.” Waar gaat deze zin over?",["De nieuwe bibliotheek","Alleen de computers","De openingstijden"],"Het onderwerp van een tekst vertelt in een paar woorden waar het hele stuk over gaat.","Kies het beste antwoord."],
 ["Grammatica","“Na de pauze fietsen de leerlingen naar huis.” Wat is de persoonsvorm?","fietsen","Verander de tijd naar gisteren. Fietsen wordt fietsten, dus fietsen is de persoonsvorm.","Typ alleen de persoonsvorm: één woord uit de zin."],
 ["Grammatica","“In de tuin liggen twee ballen.” Wat is het onderwerp van deze zin?","twee ballen","Wat ligt er in de tuin? Twee ballen. Bij één bal wordt liggen ook ligt.","Typ het hele onderwerp, precies zoals het in de zin staat."],
 ["Spelling","“Morgen … mijn broer dertien.” Welke vorm van worden hoort op de puntjes?","wordt","Mijn broer is hij. In de tegenwoordige tijd schrijf je de stam word met een t.","Typ alleen het ontbrekende woord."],
 ["Spelling","“Hoe laat … jij naar huis?” Welke vorm van fietsen hoort op de puntjes?","fiets","Als jij direct achter de persoonsvorm staat, vervalt de extra t.","Typ alleen het ontbrekende woord."],
 ["Woordenschat","“De training is uitgesteld.” Wanneer vindt de training plaats?",["Op een later moment","Op het gewone tijdstip","Helemaal nooit meer"],"Uitstellen betekent verschuiven naar later.","Kies het beste antwoord."],
 ["Leesvaardigheid","“Sam leent mijn fiets. Hij brengt hem morgen terug.” Naar welk woord verwijst hem?","mijn fiets|de fiets|fiets","Hij is Sam. Hem verwijst naar het voorwerp dat Sam terugbrengt.","Typ het woord of de woordgroep uit de eerste zin."],
 ["Schrijven","Welke opening past het best bij een beleefde mail aan een docent die je niet kent?",["Beste meneer De Vries,","Hé, luister eens!","Yo docent,"],"Met een passende aanhef spreek je een onbekende docent beleefd aan.","Kies het beste antwoord."],
 ["Grammatica","“Floor bakte gisteren koekjes.” Wat is het lijdend voorwerp?","koekjes","Wat bakte Floor? Koekjes.","Typ het lijdend voorwerp, precies zoals het in de zin staat."],
 ["Leesvaardigheid","“Het zwembad gaat om negen uur open. Dat is veel te vroeg.” Welke zin is een mening?",["Dat is veel te vroeg.","Het zwembad gaat om negen uur open."],"Veel te vroeg is een oordeel. De openingstijd kun je controleren, dus dat is een feit.","Kies de zin die een mening geeft."],
 ["Spelling", "“Wanneer … de les?” Welke vorm van beginnen hoort op de puntjes?", "begint", "Het onderwerp is de les. Bij hij, zij of het schrijf je de stam begin met een t.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Gisteren … wij naar het strand.” Wat is de verleden tijd van fietsen?", "fietsten", "De stam fiets eindigt op een s. Die zit in ’t kofschip, dus -te. Meervoud: -ten.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Ik heb mijn huiswerk al …” Wat is het voltooid deelwoord van maken?", "gemaakt", "De stam maak eindigt op een k uit ’t kofschip, dus het voltooid deelwoord eindigt op een t.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Mijn moeder heeft de tafel …” Wat is het voltooid deelwoord van verven?", "geverfd", "De stam is verf, maar in het hele werkwoord staat een v. V zit niet in ’t kofschip, dus je schrijft een d.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Het … hout rookte nog na.” Welke vorm van verbranden hoort op de puntjes?", "verbrande", "Het voltooid deelwoord is verbrand. Voor een zelfstandig naamwoord krijgt het een e: het verbrande hout.", "Typ alleen het ontbrekende woord."],
 ["Grammatica", "“De hond van de buren blaft de hele nacht.” Wat is het onderwerp?", "de hond van de buren", "Wie blaft? De hond van de buren. Bij meervoud wordt blaft ook blaffen.", "Typ het hele onderwerp, precies zoals het in de zin staat."],
 ["Grammatica", "“Morgen bezoeken wij het museum.” Wat is de persoonsvorm?", "bezoeken", "Maak de zin vragend: bezoeken wij morgen het museum? Het werkwoord vooraan is de persoonsvorm.", "Typ alleen de persoonsvorm."],
 ["Grammatica", "“Mijn opa leest elke ochtend de krant.” Wat is het lijdend voorwerp?", "de krant", "Wat leest opa? De krant.", "Typ het lijdend voorwerp, precies zoals het in de zin staat."],
 ["Grammatica", "“Na school gaan we voetballen.” Wat is het werkwoordelijk gezegde?", "gaan voetballen", "Het werkwoordelijk gezegde bestaat uit alle werkwoorden in de zin: gaan en voetballen.", "Typ alle werkwoorden in de volgorde van de zin."],
 ["Grammatica", "“Sanne geeft haar broertje een cadeau.” Wat is het meewerkend voorwerp?", "haar broertje", "Aan wie geeft Sanne een cadeau? Aan haar broertje.", "Typ het meewerkend voorwerp, precies zoals het in de zin staat."],
 ["Leesvaardigheid", "“Eerst schil je de aardappels. Daarna kook je ze twintig minuten.” Welk verband geeft daarna aan?", ["Een chronologisch verband (volgorde in tijd)", "Een tegenstellend verband", "Een oorzakelijk verband"], "Eerst en daarna geven de volgorde in tijd aan.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Ik ga niet mee, want ik ben ziek.” Welk verband geeft want aan?", ["Een redengevend verband", "Een doel-middelverband", "Een voorwaardelijk verband"], "Na want volgt de reden waarom ik niet meega.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Daan heeft een hond en een kat. Bovendien heeft hij twee konijnen.” Welk verband geeft bovendien aan?", ["Een opsommend verband", "Een tegenstellend verband", "Een vergelijkend verband"], "Bovendien voegt nog iets toe aan het rijtje: er komt nog meer bij.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Lisa oefent elke dag. Daardoor speelt ze steeds beter piano.” Welk verband geeft daardoor aan?", ["Oorzaak en gevolg", "Doel en middel", "Tegenstelling"], "Het oefenen is de oorzaak, het betere pianospel het gevolg.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Amsterdam is de hoofdstad van Nederland. Het is de gezelligste stad van het land.” Welke zin is een mening?", ["Het is de gezelligste stad van het land.", "Amsterdam is de hoofdstad van Nederland."], "Gezellig is een oordeel. Dat Amsterdam de hoofdstad is, kun je opzoeken.", "Kies de zin die een mening geeft."],
 ["Woordenschat", "“Bij elke ruzie is mijn broer de pineut.” Wat betekent de pineut zijn?", ["Degene zijn die de schuld of het nadeel krijgt", "Degene zijn die altijd wint", "Degene zijn die altijd te laat komt"], "Wie de pineut is, draait ergens voor op terwijl het niet eerlijk voelt.", "Kies het beste antwoord."],
 ["Woordenschat", "“De burgemeester opende de nieuwe brug officieel.” Wat betekent officieel hier?", ["Volgens de regels en in het openbaar", "Per ongeluk", "In het geheim"], "Een officiële opening gebeurt volgens de afspraken en waar iedereen het kan zien.", "Kies het beste antwoord."],
 ["Spelling", "“… jij ook mee naar de film?” Welke vorm van gaan hoort op de puntjes?", "ga", "Staat jij direct achter de persoonsvorm, dan krijgt de stam geen t: ga jij.", "Typ alleen het ontbrekende woord."]
],"Floor":[
 ["Argumentatie","“De mediatheek moet langer openblijven, want veel leerlingen kunnen pas na de training studeren.” Wat is het standpunt?","de mediatheek moet langer openblijven|de mediatheek moet langer open blijven","Het standpunt staat vóór want. Na want volgt het argument dat het standpunt ondersteunt.","Typ het standpunt, precies zoals het in de zin staat."],
 ["Argumentatie","“Telefoons moeten in de kluis. Dat vindt onze hele klas, dus het is de beste oplossing.” Wat is de zwakke plek?",["De schrijver gebruikt populariteit als bewijs voor de kwaliteit.","De schrijver geeft een controleerbaar voorbeeld.","Het standpunt is nergens geformuleerd."],"Dat veel mensen iets vinden, bewijst nog niet dat het de beste oplossing is.","Kies het beste antwoord."],
 ["Leesvaardigheid","“Hoewel de kaartjes goedkoper werden, daalde het bezoekersaantal.” Welk verband drukt hoewel uit?",["Een toegevend verband (tegenstelling)","Een oorzakelijk verband","Een doel-middelverband","Een voorwaardelijk verband"],"Hoewel leidt een toegeving in. Je verwacht meer bezoekers bij een lagere prijs, maar het gebeurt niet.","Kies het beste antwoord."],
 ["Argumentatie","“Langere pauzes helpen leerlingen ontspannen.” Welke reactie is een tegenargument?",["De schooldag wordt dan langer, waardoor er minder vrije tijd overblijft.","Leerlingen komen daarna uitgeruster de les in.","De schrijver pleit voor langere pauzes."],"Het nadeel van een langere schooldag pleit tegen het voorstel.","Kies het beste antwoord."],
 ["Brongebruik","Je onderzoekt of leerlingen meer slapen als school later begint. Welke bron ondersteunt een algemene conclusie het best?",["Een onderzoek bij meerdere scholen met beschreven slaapmetingen","Eén leerling die vertelt dat ze fitter is","Een advertentie voor een slaap-app"],"Meerdere scholen en een beschreven meetmethode maken de uitkomst beter te beoordelen.","Kies het beste antwoord."],
 ["Grammatica","“Omdat de brug gesloten was, namen de fietsers de omweg.” Wat is de bijzin?","omdat de brug gesloten was","De bijzin begint met omdat en heeft de persoonsvorm was achteraan.","Typ de bijzin, precies zoals hij in de zin staat."],
 ["Grammatica","“De coach gaf de spelers na afloop een compliment.” Wat is het meewerkend voorwerp?","de spelers","Aan wie gaf de coach een compliment? Aan de spelers.","Typ het meewerkend voorwerp, precies zoals het in de zin staat."],
 ["Spelling","“De wedstrijd is gisteren …” Wat is het voltooid deelwoord van afgelasten?","afgelast","Afgelasten is scheidbaar: ze gelasten de wedstrijd af. Gelasten krijgt geen extra ge-, dus het voltooid deelwoord is afgelast.","Typ alleen het ontbrekende woord."],
 ["Spelling","“De docent … de verslagen gisteren.” Wat is de verleden tijd van beoordelen?","beoordeelde","De stam beoordeel eindigt op een l. Die hoort niet bij ’t kofschip, dus je schrijft -de.","Typ alleen het ontbrekende woord."],
 ["Formuleren","Welke zin maakt duidelijk dat Sara degene is die haast heeft?",["Omdat Sara haast had, stuurde ze Noor een bericht.","Sara stuurde Noor een bericht omdat ze haast had."],"In de tweede zin kan ze ook Noor zijn. Door Sara in de bijzin te noemen, is duidelijk wie haast had.","Kies het beste antwoord."],
 ["Leesvaardigheid","“De proef was klein. De uitkomst is daarom voorlopig. Een grotere proef moet uitwijzen of het effect blijft.” Welke hoofdgedachte past?",["De uitkomst vraagt om bevestiging in groter onderzoek.","Het effect is definitief bewezen.","Een grotere proef is al afgerond."],"De hoofdgedachte omvat zowel de beperking als de reden voor vervolgonderzoek.","Kies het beste antwoord."],
 ["Argumentatie","“Je zegt dat de kantine duur is, maar jij koopt zelf dure schoenen.” Waar gaat deze reactie mis?",["De reactie valt de spreker aan en bespreekt de kantineprijzen niet.","De reactie toont aan dat de kantine goedkoper is.","De reactie vergelijkt twee prijslijsten."],"De persoonlijke aanval weerlegt het argument over de kantineprijzen niet.","Kies het beste antwoord."],
 ["Spelling", "“Hij … de toets makkelijk.” Welke vorm van vinden hoort op de puntjes?", "vindt", "Hij + stam vind + t. Je hoort de t niet, maar je schrijft hem wel.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“… jij morgen ook opgehaald?” Welke vorm van worden hoort op de puntjes?", "word", "Staat jij direct achter de persoonsvorm, dan vervalt de t: word jij.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“… het pakket morgen bezorgd?” Welke vorm van worden hoort op de puntjes?", "wordt", "Het onderwerp is het pakket, dat is een hij-vorm. Stam word + t.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Vorig jaar … mijn tante naar Utrecht.” Wat is de verleden tijd van verhuizen?", "verhuisde", "De stam is verhuis, maar in het hele werkwoord staat een z. Z zit niet in ’t kofschip, dus je schrijft -de.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“De fiets is gisteren …” Wat is het voltooid deelwoord van repareren?", "gerepareerd", "De stam repareer eindigt op een r. Die zit niet in ’t kofschip, dus het voltooid deelwoord eindigt op een d.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Het … formulier ligt op tafel.” Welke vorm van beantwoorden hoort op de puntjes?", "beantwoorde", "Het voltooid deelwoord is beantwoord. Voor een zelfstandig naamwoord krijgt het een e: het beantwoorde formulier.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Gisteren … wij tien minuten op de trein.” Wat is de verleden tijd van wachten?", "wachtten", "De stam wacht eindigt op een t uit ’t kofschip. Stam + ten geeft wachtten, met twee keer t.", "Typ alleen het ontbrekende woord."],
 ["Spelling", "“Hij … niet op mijn vraag.” Wat is de verleden tijd van antwoorden?", "antwoordde", "De stam antwoord eindigt op een d. Die zit niet in ’t kofschip: stam + de geeft antwoordde.", "Typ alleen het ontbrekende woord."],
 ["Grammatica", "“Volgende week organiseert de leerlingenraad een sponsorloop.” Wat is het onderwerp?", "de leerlingenraad", "Wie organiseert? De leerlingenraad. Bij meervoud zou organiseert veranderen in organiseren.", "Typ het hele onderwerp, precies zoals het in de zin staat."],
 ["Grammatica", "“De leraar heeft de toetsen al nagekeken.” Wat is het werkwoordelijk gezegde?", "heeft nagekeken", "Het werkwoordelijk gezegde bestaat uit alle werkwoorden: heeft en nagekeken.", "Typ alle werkwoorden in de volgorde van de zin."],
 ["Grammatica", "“Mijn zus is sinds vorig jaar trainer.” Wat is het naamwoordelijk deel van het naamwoordelijk gezegde?", "trainer", "Is is hier een koppelwerkwoord. Trainer zegt iets over het onderwerp mijn zus. Sinds vorig jaar is een bijwoordelijke bepaling.", "Typ het naamwoordelijk deel."],
 ["Grammatica", "“Na de les gaf Floor haar vriendin het boek terug.” Wat is het lijdend voorwerp?", "het boek", "Wat gaf Floor terug? Het boek. Haar vriendin is het meewerkend voorwerp.", "Typ het lijdend voorwerp, precies zoals het in de zin staat."],
 ["Grammatica", "“In de pauze speelden de brugklassers buiten.” Welke woordgroep is een bijwoordelijke bepaling van tijd?", "in de pauze", "Wanneer speelden ze buiten? In de pauze.", "Typ de woordgroep, precies zoals hij in de zin staat."],
 ["Grammatica", "“Ik weet niet of de bus vandaag rijdt.” Wat is de persoonsvorm van de hoofdzin?", "weet", "De hoofdzin is Ik weet niet. Rijdt is de persoonsvorm van de bijzin die met of begint.", "Typ alleen de persoonsvorm."],
 ["Leesvaardigheid", "“Je mag pas mee op excursie als je het formulier hebt ingeleverd.” Welk verband geeft als hier aan?", ["Een voorwaardelijk verband", "Een oorzakelijk verband", "Een tegenstellend verband", "Een opsommend verband"], "Het inleveren van het formulier is de voorwaarde om mee te mogen.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Om beter te slapen, legt Floor haar telefoon buiten de slaapkamer.” Welk verband zie je hier?", ["Een doel-middelverband", "Een tegenstellend verband", "Een chronologisch verband"], "Om … te geeft het doel aan: beter slapen. De telefoon wegleggen is het middel.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Veel groenten groeien slecht in de schaduw. Neem bijvoorbeeld tomaten.” Welk verband geeft bijvoorbeeld aan?", ["Een toelichtend verband", "Een tegenstellend verband", "Een chronologisch verband"], "Met bijvoorbeeld licht de schrijver de bewering toe met een voorbeeld.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“Het regende hard. Toch ging de wedstrijd door.” Welk verband geeft toch aan?", ["Een tegenstellend verband", "Een oorzakelijk verband", "Een opsommend verband"], "Je verwacht dat de wedstrijd niet doorgaat, maar dat gebeurt wel. Toch geeft die tegenstelling aan.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "Een alinea begint met “Kortom, …”. Wat voor alinea is dit meestal?", ["Een slotalinea met een samenvatting of conclusie", "Een inleiding", "Een alinea met een tegenargument"], "Kortom kondigt een samenvatting of conclusie aan. Dat hoort meestal aan het eind van een tekst.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“De gemeente plaatst extra prullenbakken in het park. Ze hoopt dat er daardoor minder afval op straat ligt.” Naar wie of wat verwijst ze?", "de gemeente|gemeente", "Ze hoopt iets. Dat kan alleen de gemeente zijn, die de prullenbakken plaatst.", "Typ het woord of de woordgroep uit de eerste zin."],
 ["Leesvaardigheid", "“Lees deze folder en ontdek hoe jij thuis energie bespaart. Begin vandaag nog!” Wat is het belangrijkste tekstdoel?", ["Activeren: de lezer aanzetten om iets te doen", "Amuseren: de lezer vermaken", "Informeren zonder dat de lezer iets hoeft te doen"], "Begin vandaag nog! is een oproep. De schrijver wil dat de lezer in actie komt.", "Kies het beste antwoord."],
 ["Leesvaardigheid", "“De nieuwe sporthal heeft vier velden. Het is de mooiste hal van de provincie.” Welke zin is een feit?", ["De nieuwe sporthal heeft vier velden.", "Het is de mooiste hal van de provincie."], "Het aantal velden kun je tellen en controleren. Mooiste is een oordeel.", "Kies de zin die een feit geeft."],
 ["Woordenschat", "“Na lang twijfelen hakte Floor de knoop door.” Wat betekent de knoop doorhakken?", ["Een besluit nemen", "Iets kapotmaken", "Een ruzie beginnen"], "Wie de knoop doorhakt, stopt met twijfelen en beslist.", "Kies het beste antwoord."],
 ["Woordenschat", "“In de vakantie liep hij met zijn ziel onder zijn arm.” Wat betekent dat?", ["Hij verveelde zich en wist niet wat hij moest doen", "Hij was erg verdrietig om een verlies", "Hij had veel haast"], "Met je ziel onder je arm lopen betekent dat je niets te doen hebt en je verveelt.", "Kies het beste antwoord."],
 ["Woordenschat", "“De resultaten waren marginaal beter dan vorig jaar.” Wat betekent marginaal hier?", ["Heel weinig", "Heel veel", "Helemaal niet"], "Marginaal betekent dat het verschil heel klein is.", "Kies het beste antwoord."],
 ["Stijlfiguren", "“De wind fluisterde door de bomen.” Welk stijlfiguur is dit?", ["Personificatie", "Vergelijking", "Hyperbool"], "De wind krijgt een menselijke eigenschap: fluisteren. Dat heet personificatie.", "Kies het beste antwoord."],
 ["Stijlfiguren", "“Ik heb je al duizend keer gezegd dat je je jas moet ophangen.” Welk stijlfiguur is dit?", ["Hyperbool (overdrijving)", "Metafoor", "Personificatie"], "Duizend keer is bewust overdreven om iets te benadrukken.", "Kies het beste antwoord."],
 ["Stijlfiguren", "“Zijn handen waren zo koud als ijs.” Welk stijlfiguur is dit?", ["Vergelijking", "Metafoor", "Personificatie"], "Met zo … als worden twee dingen letterlijk met elkaar vergeleken.", "Kies het beste antwoord."],
 ["Stijlfiguren", "“Mijn kamer is een zwijnenstal.” Welk stijlfiguur is dit?", ["Metafoor", "Vergelijking", "Personificatie"], "De kamer wordt een zwijnenstal genoemd, zonder als of zoals. Dat is een metafoor.", "Kies het beste antwoord."],
 ["Argumentatie", "“Alle jongeren zitten de hele dag op hun telefoon. Mijn broer doet het ook.” Welke drogreden is dit?", ["Een overhaaste generalisatie", "Een persoonlijke aanval", "Een vals dilemma"], "Uit één voorbeeld wordt een conclusie over alle jongeren getrokken.", "Kies het beste antwoord."],
 ["Argumentatie", "“Of we verbieden alle telefoons op school, of de cijfers blijven dalen.” Welke drogreden is dit?", ["Een vals dilemma", "Een cirkelredenering", "Een persoonlijke aanval"], "Er worden maar twee mogelijkheden genoemd, terwijl er meer oplossingen zijn.", "Kies het beste antwoord."],
 ["Argumentatie", "“Dit is de beste app, want geen enkele app is beter.” Welke drogreden is dit?", ["Een cirkelredenering", "Een overhaaste generalisatie", "Een vals dilemma"], "Het argument zegt hetzelfde als het standpunt. Zo wordt niets bewezen.", "Kies het beste antwoord."],
 ["Argumentatie", "“Volgens mijn oom, die bakker is, is deze medicijnstudie onbetrouwbaar.” Welke drogreden is dit?", ["Een onterecht beroep op een autoriteit", "Een vals dilemma", "Een cirkelredenering"], "De oom is geen deskundige op het gebied van medicijnonderzoek. Zijn mening is daarom geen sterk bewijs.", "Kies het beste antwoord."],
 ["Formuleren", "“Hij reed op een witte schimmel door het bos.” Welke formuleringsfout zit hierin?", ["Een pleonasme", "Een contaminatie", "Een dubbelzinnigheid"], "Een schimmel is al een wit paard. Wit voegt niets toe: dat is een pleonasme.", "Kies het beste antwoord."],
 ["Formuleren", "“Je krijgt het gratis en voor niks.” Welke formuleringsfout zit hierin?", ["Een tautologie", "Een pleonasme", "Een contaminatie"], "Gratis en voor niks betekenen hetzelfde en staan naast elkaar: dat is een tautologie.", "Kies het beste antwoord."],
 ["Formuleren", "“Het meisje … de prijs won, zat bij mij in de klas.” Welk betrekkelijk voornaamwoord hoort op de puntjes?", "dat", "Meisje is een het-woord. Bij een het-woord gebruik je dat.", "Typ alleen het ontbrekende woord."]
]};
function dutchStats(){const d=s.dutch||{};return '<div class="meter">Nederlands · goede antwoorden<b>'+(d.good||0)+' / '+(d.total||0)+'</b></div>'}
function dutchRound(isMission){
 const bank=dutchBanks[profile],stats=s.dutch ||= {good:0,total:0,cursor:0};
 let turn=0,score=0;const count=isMission?mission()[3]-s.seals:5;
 function ask(){
  const [topic,prompt,answer,why,task]=bank[stats.cursor%bank.length];
  show('<small>NEDERLANDS · '+profile.toUpperCase()+' · '+(profile==='Floor'?'HAVO 3':'HAVO 2')+'</small><h2>'+topic+'</h2><p>'+(isMission?'Werkplaats · '+s.seals+' van '+mission()[3]+' instructies opgelost':'Vraag '+(turn+1)+' van '+count)+'</p><div class="question"></div><p id="nlTask"></p><form id="nlForm"></form>'+buttons());back();
  document.querySelector('.question').textContent=prompt;$('nlTask').textContent=task||(Array.isArray(answer)?'Kies het beste antwoord.':'Typ je antwoord.');const form=$('nlForm');
  function grade(value){
   // Quotes, commas and end punctuation never decide whether an answer is right.
   const norm=v=>v.trim().toLocaleLowerCase('nl').replace(/[“”"‘’',;:]/g,'').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
   const typed=typeof answer==='string',accepted=typed?answer.split('|'):[answer[0]],ok=accepted.some(v=>norm(v)===norm(value));
   Track.answer('Nederlands',topic,ok);stats.total++;stats.cursor++;turn++;if(ok){stats.good++;score++;if(isMission)s.seals++;else coin()}persist();
   show('<small>NEDERLANDS · '+topic.toUpperCase()+'</small><h2>'+(ok?'Goed geantwoord':'Bekijk het antwoord')+'</h2><p class="youranswer"></p><div class="question"></div><p id="why"></p><button class="primary" id="nlNext">Verder</button>'+buttons());back();
   document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+value.trim()+' · Het goede antwoord is:';
   document.querySelector('.question').textContent=accepted[0];$('why').textContent=why;
   const done=isMission?s.seals>=mission()[3]:turn>=count;
   $('nlNext').textContent=done?(isMission?'Naar de reparatie':'Bekijk je resultaat'):'Volgende opdracht';
   $('nlNext').onclick=()=>{if(!done)return ask();if(isMission)return workshop();
    show('<small>NEDERLANDS · '+profile.toUpperCase()+'</small><h2>'+score+' van '+count+' goed</h2>'+dutchStats()+'<button id="againNL">Nog een ronde</button>'+buttons());back();$('againNL').onclick=()=>dutchRound(false)}
  }
  if(Array.isArray(answer)){const opts=answer.slice();for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}for(const opt of opts){const b=document.createElement('button');b.type='button';b.textContent=opt;b.onclick=()=>grade(opt);form.append(b)}}
  else {form.innerHTML='<input required id="nlWord" aria-label="Jouw antwoord" autocomplete="off"><button class="primary">Controleer antwoord</button>';form.onsubmit=e=>{e.preventDefault();if($('nlWord').value.trim())grade($('nlWord').value)}}
 }
 ask()
}

 
// T5b: same 110 words for both pupils; original banks and question IDs stay intact.
const t5bWords=[
 [
  "Interpreteren",
  "Begrijpen; opvatten."
 ],
 [
  "Complexe",
  "Ingewikkelde of moeilijke."
 ],
 [
  "Routinematig",
  "Volgens een steeds herhaalde handeling of gewoonte."
 ],
 [
  "Naïef",
  "Onnozel; nietsvermoedend; goedgelovig."
 ],
 [
  "Drijfveer",
  "Aanleiding; reden; motief."
 ],
 [
  "Analytische vaardigheden",
  "Vermogens om een probleem in kleinere stukjes op te splitsen."
 ],
 [
  "Geïntegreerd",
  "Opgenomen in; onderdeel gemaakt van."
 ],
 [
  "Compenseerde",
  "Goedmaakte; met iets goeds aanvulde."
 ],
 [
  "Om de haverklap",
  "Heel vaak, telkens opnieuw."
 ],
 [
  "Geavanceerde",
  "Met de nieuwste technieken of mogelijkheden gemaakte."
 ],
 [
  "Tekstgenerator",
  "Softwareprogramma dat teksten kan produceren."
 ],
 [
  "Uitbesteed",
  "Overgedragen; overgelaten."
 ],
 [
  "Frauderen",
  "Oneerlijk handelen."
 ],
 [
  "Plagiaatdetectie",
  "Methode om te controleren of iemand tekst heeft overgenomen van een ander."
 ],
 [
  "Expliciet",
  "Heel duidelijk; uitdrukkelijk."
 ],
 [
  "Houterig",
  "Niet vlot of soepel."
 ],
 [
  "Achterhaald",
  "Niet meer van toepassing; verouderd."
 ],
 [
  "Niet-representatieve",
  "Geen goed beeld gevend van een hele groep."
 ],
 [
  "Gaan er stemmen op",
  "Hoor je in het openbaar zeggen; mensen pleiten ergens voor."
 ],
 [
  "Veganistische",
  "Zonder dierlijke producten bereide."
 ],
 [
  "Aanzienlijk",
  "Veel; flink."
 ],
 [
  "Relatief",
  "Naar verhouding; vergeleken met iets anders."
 ],
 [
  "Aandoeningen",
  "Ziekten; kwalen."
 ],
 [
  "Propageert",
  "Maakt reclame voor; bepleit."
 ],
 [
  "Volwaardige",
  "Aan alle benodigde kwaliteiten voldoende."
 ],
 [
  "Per se",
  "Automatisch; noodzakelijk (in deze context)."
 ],
 [
  "In principe",
  "Normaal gesproken."
 ],
 [
  "Zonder slag of stoot",
  "Moeiteloos; gemakkelijk; zonder tegenstand."
 ],
 [
  "Geschuwd",
  "Vermeden; uit de weg gegaan."
 ],
 [
  "Verwikkelingen",
  "Ontwikkelingen; voorvallen; gebeurtenissen."
 ],
 [
  "Complex",
  "Ingewikkeld; moeilijk te begrijpen."
 ],
 [
  "Pageturners",
  "Boeken die zo spannend zijn dat je steeds verder wilt lezen."
 ],
 [
  "Plots",
  "Verhaallijnen."
 ],
 [
  "Er je hoofd over breken",
  "Erover tobben; je er zorgen om maken."
 ],
 [
  "Bezwaarlijk",
  "Problematisch; niet goed."
 ],
 [
  "Beslommeringen",
  "Bezigheden."
 ],
 [
  "Marginale",
  "Niet zo belangrijke; bijkomstige."
 ],
 [
  "Voor lief nemen",
  "Accepteren, ook al is het eigenlijk niet zoals je zou willen."
 ],
 [
  "Evidente",
  "Zeer duidelijke."
 ],
 [
  "Autonoom",
  "Zelfstandig; onafhankelijk."
 ],
 [
  "Reflex",
  "Onmiddellijke reactie."
 ],
 [
  "Feilbaar",
  "Vatbaar voor vergissing."
 ],
 [
  "No-brainer",
  "Vanzelfsprekendheid; iets waarover je niet hoeft na te denken."
 ],
 [
  "Grillen",
  "Plotseling opkomende, onberedeneerde gedachten; rare ideeën."
 ],
 [
  "Onbezonnen",
  "Onnadenkend; roekeloos."
 ],
 [
  "Aan het hart gaat",
  "Bezorgd maakt."
 ],
 [
  "Fasen",
  "Momenten of tijdelijke toestanden in de ontwikkeling van iets."
 ],
 [
  "Cyclus",
  "Kringloop; terugkerende, regelmatige reeks."
 ],
 [
  "Micro",
  "Erg klein."
 ],
 [
  "Weefsels",
  "Cellen die samen lichaamsmateriaal vormen."
 ],
 [
  "Recuperatief",
  "Herstellend; gericht op herstel (recuperatie)."
 ],
 [
  "Gedesoriënteerd",
  "Verward; het spoor bijster."
 ],
 [
  "Getriggerd",
  "In gang gezet; gestimuleerd."
 ],
 [
  "Paradoxale",
  "Schijnbaar tegenstrijdige."
 ],
 [
  "Motorische",
  "Met lichamelijke bewegingen te maken hebbend."
 ],
 [
  "Zinnige interactie",
  "Betekenisvol en nuttig contact tussen mensen of systemen."
 ],
 [
  "Episode",
  "Een afzonderlijke gebeurtenis of periode."
 ],
 [
  "Zwaarmoedigheid",
  "Somberheid; neerslachtigheid."
 ],
 [
  "Extreme",
  "Zeer sterke of uitzonderlijke."
 ],
 [
  "Continu",
  "Voortdurend; zonder onderbreking."
 ],
 [
  "Abrupt",
  "Plotseling."
 ],
 [
  "Uit je slof schieten",
  "Plotseling boos of driftig worden."
 ],
 [
  "Zint",
  "Bevalt."
 ],
 [
  "Structureel",
  "Blijvend; voortdurend."
 ],
 [
  "Genetisch",
  "Erfelijk."
 ],
 [
  "Erbij inschiet",
  "Er niet van komt; achterwege blijft."
 ],
 [
  "Averechts",
  "Anders dan je bedoeld had; precies het tegenovergestelde."
 ],
 [
  "Alert",
  "Wakker; oplettend."
 ],
 [
  "Los … in",
  "Maak goed; compenseer."
 ],
 [
  "Logge",
  "Onhandelbare; zware."
 ],
 [
  "Gezeuld",
  "Met veel moeite gedragen."
 ],
 [
  "Op … aankomt",
  "Betreft; geldt."
 ],
 [
  "Revalidatie",
  "Herstel."
 ],
 [
  "Receptoren",
  "Orgaantjes die prikkels waarnemen en die omzetten in signalen."
 ],
 [
  "Microscopische",
  "Heel erg kleine."
 ],
 [
  "Prangendste",
  "Dringendste; urgentste."
 ],
 [
  "Kruipruimte",
  "Lage ruimte tussen de vloer van de begane grond en de bodem."
 ],
 [
  "Exotische",
  "Uitheemse; uit een ander klimaat afkomstige."
 ],
 [
  "Chemicaliën",
  "Scheikundige stoffen."
 ],
 [
  "Detecteren",
  "Ontdekken; opsporen."
 ],
 [
  "Kompres",
  "Natte, gevouwen doek om zwellingen tegen te gaan."
 ],
 [
  "Claimen",
  "Beweren."
 ],
 [
  "Ultrasoon",
  "Niet met het gewone oor te horen vanwege de hoge frequentie."
 ],
 [
  "Bijsluiter",
  "Bijgesloten blaadje bij medicijnen met aanwijzingen voor het gebruik."
 ],
 [
  "Bestuiven",
  "Stuifmeel op de stamper van een bloem overbrengen."
 ],
 [
  "Kenmerkt",
  "Typeert; bepaalt."
 ],
 [
  "Geassocieerd",
  "Verbonden."
 ],
 [
  "Gekweel",
  "Sentimenteel gezang."
 ],
 [
  "Een groot goed",
  "Erg belangrijk; iets heel waardevols."
 ],
 [
  "Voorhouden",
  "Voorspiegelen; iets onwaars vertellen."
 ],
 [
  "Opbiechten",
  "Bekennen."
 ],
 [
  "Stabiliteit",
  "Stevigheid."
 ],
 [
  "Loont",
  "Iets oplevert."
 ],
 [
  "Cliché",
  "Een uitspraak of idee dat zo vaak is gebruikt dat het niet origineel meer is."
 ],
 [
  "Paternalistische",
  "Bevoogdende; voor anderen bepalen wat goed voor hen is."
 ],
 [
  "Betutteld",
  "Behandeld alsof je niet zelf kunt beslissen."
 ],
 [
  "Wrok",
  "Een langdurig gevoel van boosheid of bitterheid tegenover iemand."
 ],
 [
  "Comfort",
  "Gemak en een aangenaam gevoel."
 ],
 [
  "Oprechtheid",
  "Eerlijkheid en gemeend gedrag."
 ],
 [
  "Rechtvaardigen",
  "Met argumenten uitleggen waarom iets juist of aanvaardbaar is."
 ],
 [
  "Idyllische",
  "Aangename en vredige."
 ],
 [
  "Per saldo",
  "Uiteindelijk; tenslotte."
 ],
 [
  "Settelen zich",
  "Gaan ergens wonen en een regelmatig leven leiden."
 ],
 [
  "Voorzieningen",
  "Nuttige zaken voor inwoners, zoals scholen, winkels, theaters en zorginstellingen."
 ],
 [
  "Sociologische",
  "Betrekking hebbend op de manier waarop mensen binnen de samenleving met elkaar omgaan."
 ],
 [
  "Millennial",
  "Geboren in 1980–1999, handig met nieuwe technologieën en minder gericht op zekerheid rond wonen en werken (volgens het lesboek)."
 ],
 [
  "Identificeren zich met",
  "Herkennen zich in; voelen zich betrokken bij."
 ],
 [
  "Materialistisch",
  "Sterk gericht op geld en bezit."
 ],
 [
  "Atmosfeer",
  "Gevoel dat de omgeving oproept."
 ],
 [
  "Klassieke",
  "Traditionele; gebruikelijke."
 ]
];
const t5bTopic='Woordenschat T5b';
function t5bShuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function t5bChoices(i,reverse=false){
 const col=reverse?0:1, correct=t5bWords[i][col];
 // Fixed, semantically distant distractors for stable game-bank answers.
 const wrong=[17,43,67,83,29,53].map(n=>t5bWords[(i+n)%t5bWords.length][col]).filter(v=>v!==correct);
 return [correct,...new Set(wrong)].slice(0,4)
}
for(const who of ['Floor','Niek']){
 dutchBanks[who].push(...t5bWords.map(([word,meaning],i)=>[
  t5bTopic,'Wat betekent “'+word+'”?',t5bChoices(i),word+' = '+meaning,'Kies de juiste betekenis.'
 ]));
}
function t5bProgress(){return s.t5b||=( {items:{}} )}
function t5bMenu(){
 const items=t5bProgress().items, known=Object.values(items).filter(x=>x.known).length, missed=Object.values(items).filter(x=>!x.known).length;
 show('<small>NEDERLANDS · '+profile.toUpperCase()+' · T5b</small><h2>Woordenschat · 110 woorden</h2><p>Leer alle woorden uit het lesboek. Voor beide spelers is de volledige lijst beschikbaar.</p><div class="meter">Bekend<b>'+known+' / 110</b></div><div class="meter">Nog oefenen<b>'+missed+'</b></div><div class="row"><button id="t5bFlash" class="primary">Flashcards</button><button id="t5bMC">Meerkeuze</button><button id="t5bReverse">Omgekeerd</button><button id="t5bOpen">Zelf typen</button><button id="t5bMissed">Moeilijke woorden</button><button id="t5bAll">Alle woorden</button><button id="t5bGeneral">Andere Nederlandse oefeningen</button></div>'+buttons());back();
 $('t5bFlash').onclick=()=>t5bRound('flash');$('t5bMC').onclick=()=>t5bRound('mc');$('t5bReverse').onclick=()=>t5bRound('reverse');$('t5bOpen').onclick=()=>t5bRound('open');$('t5bMissed').onclick=()=>t5bRound('flash',true);$('t5bGeneral').onclick=()=>dutchRound(false);
 $('t5bAll').onclick=()=>{show('<small>NEDERLANDS · T5b</small><h2>Alle 110 woorden</h2><div id="t5bList"></div><button id="t5bMenu">Naar trainer</button>'+buttons());back();const list=$('t5bList');for(const [w,m] of t5bWords){const row=document.createElement('p'), b=document.createElement('b');b.textContent=w+' — ';row.append(b,document.createTextNode(m));list.append(row)}$('t5bMenu').onclick=t5bMenu}
}
function t5bRound(mode,missedOnly=false){
 const items=t5bProgress().items;
 const ids=t5bShuffle(t5bWords.map((_,i)=>i).filter(i=>!missedOnly||items[i]?.known===false));
 if(!ids.length){show('<small>NEDERLANDS · T5b</small><h2>Geen moeilijke woorden</h2><p>Oefen eerst de volledige lijst.</p><button id="t5bMenu">Naar trainer</button>'+buttons());back();$('t5bMenu').onclick=t5bMenu;return}
 // Short rounds allow both players to repeat independently; full list remains available.
 const deck=ids.slice(0,20);let turn=0,score=0;
 function finish(){show('<small>NEDERLANDS · T5b</small><h2>'+score+' van '+deck.length+' goed</h2><button class="primary" id="t5bAgain">Nog een ronde</button><button id="t5bMenu">Naar trainer</button>'+buttons());back();$('t5bAgain').onclick=()=>t5bRound(mode,missedOnly);$('t5bMenu').onclick=t5bMenu}
 function ask(){
  const i=deck[turn], [word,meaning]=t5bWords[i], reverse=mode==='reverse';
  show('<small>NEDERLANDS · '+profile.toUpperCase()+' · T5b</small><h2>Vraag '+(turn+1)+' van '+deck.length+'</h2><div class="question"></div><p id="t5bHint"></p><form id="t5bForm"></form><button id="t5bMenu">Naar trainer</button>'+buttons());back();$('t5bMenu').onclick=t5bMenu;
  document.querySelector('.question').textContent=reverse?meaning:word;
  $('t5bHint').textContent=reverse?'Kies het woord bij deze betekenis.':'Wat betekent dit woord?';
  const form=$('t5bForm');let graded=false;
  function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;form.append(b)}
  function grade(ok){
   if(graded)return;graded=true;
   const prev=items[i]||{attempts:0,good:0};items[i]={attempts:prev.attempts+1,good:prev.good+(ok?1:0),known:ok};
   Track.answer('Nederlands',t5bTopic,ok);if(ok)score++;persist();turn++;
   form.replaceChildren();$('t5bHint').textContent=word+' = '+meaning;button(turn===deck.length?'Resultaat':'Volgende',()=>turn===deck.length?finish():ask());
  }
  function reveal(typed){
   form.replaceChildren();$('t5bHint').textContent=(typed?'Jouw antwoord: '+typed+' · ':'')+word+' = '+meaning;
   button('Ik wist het',()=>grade(true));button('Nog oefenen',()=>grade(false))
  }
  if(mode==='flash')button('Toon betekenis',()=>reveal(''));
  else if(mode==='open'){
   const input=document.createElement('input');input.required=true;input.autocomplete='off';input.setAttribute('aria-label','Jouw betekenis');form.append(input);
   const b=document.createElement('button');b.type='submit';b.textContent='Vergelijk antwoord';form.append(b);form.onsubmit=e=>{e.preventDefault();if(input.value.trim())reveal(input.value.trim())}
  }else for(const v of t5bShuffle(t5bChoices(i,reverse)))button(v,()=>grade(v===(reverse?word:meaning)))
 }
 ask()
}
// Dedicated trainer link on the existing character-selection screen.
if(typeof document!=='undefined'){
 const nav=document.querySelector('#entry nav div');
 if(nav&&!document.getElementById('t5bTrainer')){
  const b=document.createElement('button');b.id='t5bTrainer';b.textContent='Woordenschat · 110 woorden';b.onclick=()=>{start();if(playing)t5bMenu()};nav.append(b)
 }
}
