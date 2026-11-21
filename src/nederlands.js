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
 ["Leesvaardigheid","“Het zwembad gaat om negen uur open. Dat is veel te vroeg.” Welke zin is een mening?",["Dat is veel te vroeg.","Het zwembad gaat om negen uur open."],"Veel te vroeg is een oordeel. De openingstijd kun je controleren, dus dat is een feit.","Kies de zin die een mening geeft."]
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
 ["Argumentatie","“Je zegt dat de kantine duur is, maar jij koopt zelf dure schoenen.” Waar gaat deze reactie mis?",["De reactie valt de spreker aan en bespreekt de kantineprijzen niet.","De reactie toont aan dat de kantine goedkoper is.","De reactie vergelijkt twee prijslijsten."],"De persoonlijke aanval weerlegt het argument over de kantineprijzen niet.","Kies het beste antwoord."]
]};
function dutchStats(){const d=s.dutch||{};return '<div class="meter">Nederlands · goede antwoorden<b>'+(d.good||0)+' / '+(d.total||0)+'</b></div>'}
function dutchRound(mission){
 const bank=dutchBanks[profile],stats=s.dutch ||= {good:0,total:0,cursor:0};
 let turn=0,score=0;const count=mission?missions[s.stage][3]-s.seals:5;
 function ask(){
  const [topic,prompt,answer,why,task]=bank[stats.cursor%bank.length];
  show('<small>NEDERLANDS · '+profile.toUpperCase()+' · '+(profile==='Floor'?'HAVO 3':'HAVO 2')+'</small><h2>'+topic+'</h2><p>'+(mission?'Werkplaats · '+s.seals+' van '+missions[s.stage][3]+' instructies opgelost':'Vraag '+(turn+1)+' van '+count)+'</p><div class="question"></div><p id="nlTask"></p><form id="nlForm"></form>'+buttons());back();
  document.querySelector('.question').textContent=prompt;$('nlTask').textContent=task||(Array.isArray(answer)?'Kies het beste antwoord.':'Typ je antwoord.');const form=$('nlForm');
  function grade(value){
   // Quotes, commas and end punctuation never decide whether an answer is right.
   const norm=v=>v.trim().toLocaleLowerCase('nl').replace(/[“”"‘’',;:]/g,'').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
   const typed=typeof answer==='string',accepted=typed?answer.split('|'):[answer[0]],ok=accepted.some(v=>norm(v)===norm(value));
   stats.total++;stats.cursor++;turn++;if(ok){stats.good++;score++;if(mission)s.seals++}persist();
   show('<small>NEDERLANDS · '+topic.toUpperCase()+'</small><h2>'+(ok?'Goed geantwoord':'Bekijk het antwoord')+'</h2><p class="youranswer"></p><div class="question"></div><p id="why"></p><button class="primary" id="nlNext">Verder</button>'+buttons());back();
   document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+value.trim()+' · Het goede antwoord is:';
   document.querySelector('.question').textContent=accepted[0];$('why').textContent=why;
   const done=mission?s.seals>=missions[s.stage][3]:turn>=count;
   $('nlNext').textContent=done?(mission?'Naar de reparatie':'Bekijk je resultaat'):'Volgende opdracht';
   $('nlNext').onclick=()=>{if(!done)return ask();if(mission)return workshop();
    show('<small>NEDERLANDS · '+profile.toUpperCase()+'</small><h2>'+score+' van '+count+' goed</h2>'+dutchStats()+'<button id="againNL">Nog een ronde</button>'+buttons());back();$('againNL').onclick=()=>dutchRound(false)}
  }
  if(Array.isArray(answer)){const opts=answer.slice();for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}for(const opt of opts){const b=document.createElement('button');b.type='button';b.textContent=opt;b.onclick=()=>grade(opt);form.append(b)}}
  else {form.innerHTML='<input required id="nlWord" aria-label="Jouw antwoord" autocomplete="off"><button class="primary">Controleer antwoord</button>';form.onsubmit=e=>{e.preventDefault();if($('nlWord').value.trim())grade($('nlWord').value)}}
 }
 ask()
}
