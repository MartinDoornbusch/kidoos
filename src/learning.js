"use strict";
const German = (() => {
 const groups=["Woorden B · NL → DE","Woorden B · DE → NL","Woorden A, C, D en H · DE → NL","Schreibmittel · NL → DE","Voorzetsels","Voornaamwoorden"];
 const bank=[];
 // Every item carries its own task line, so the pupil knows exactly what to type.
 function add(skill,sentence,answers,why,language='de',task=''){
  const variants=answers.split('|');
  bank.push({id:bank.length,skill,sentence,correct:variants[0],answers:variants,why,language,task});
 }
 // Dutch words that can mean more than one thing get a short hint in the prompt.
 const hints={'de bank':'de bank (om op te zitten)','de banken':'de banken (om op te zitten)','het bureau':'het bureau (meubel)','de bureaus':'de bureaus (meubels)','bevallen':'bevallen (= in de smaak vallen)'};
 const nounTask={
  0:['Vertaal naar het Duits, met lidwoord (der, die of das). Een zelfstandig naamwoord krijgt een hoofdletter.','Vertaal naar het Duits. Het is meervoud, dus het lidwoord is die. Vergeet de hoofdletter niet.'],
  1:['Vertaal naar het Nederlands, met de of het ervoor.','Vertaal naar het Nederlands. Het is meervoud, dus met de ervoor.']
 };
 // Separate singular and plural prompts keep the article and umlaut visible.
 const nouns=[
  ['het balkon','der Balkon','de balkons','die Balkons'],['de boerderij','der Bauernhof','de boerderijen','die Bauernhöfe'],
  ['het bureau','der Schreibtisch','de bureaus','die Schreibtische'],['de kast','der Schrank','de kasten','die Schränke'],
  ['de stoel','der Stuhl','de stoelen','die Stühle'],['de tafel','der Tisch','de tafels','die Tische'],
  ['de televisie','der Fernseher','de televisies','die Fernseher'],['de tuin','der Garten'],
  ['het appartement','die Wohnung','de appartementen','die Wohnungen'],['de deur','die Tür','de deuren','die Türen'],
  ['de douche','die Dusche'],['de garage','die Garage','de garages','die Garagen'],['de keuken','die Küche'],
  ['de muur','die Wand','de muren','die Wände'],['het toilet','die Toilette','de toiletten','die Toiletten'],
  ['de badkamer','das Badezimmer','de badkamers','die Badezimmer'],['de bank','das Sofa','de banken','die Sofas'],
  ['het bed','das Bett','de bedden','die Betten'],['de eengezinswoning','das Einfamilienhaus'],
  ['het huis','das Haus','de huizen','die Häuser'],['de kamer','das Zimmer','de kamers','die Zimmer'],
  ['het raam','das Fenster','de ramen','die Fenster'],['de slaapkamer','das Schlafzimmer','de slaapkamers','die Schlafzimmer'],
  ['de woonkamer','das Wohnzimmer']
 ];
 function both(nl,de,note,kind=null){
  const prompt=hints[nl]||nl.replaceAll('|',' / ');
  add(0,prompt,de,note,'de',kind===null?'Vertaal naar het Duits. Typ alleen het Duitse woord of de uitdrukking.':nounTask[0][kind]);
  add(1,de.split('|')[0],nl,note,'nl',kind===null?'Vertaal naar het Nederlands.':nounTask[1][kind]);
 }
 for(const [nl,de,pluralNL,pluralDE] of nouns){
  const note=pluralDE?de+' → '+pluralDE:de+' betekent '+nl+'.';
  both(nl,de,note,0);if(pluralDE)both(pluralNL,pluralDE,note,1);
 }
 const words=[
  ['opruimen','aufräumen'],['schoonmaken','sauber machen'],['staan','stehen'],['gestaan','gestanden'],
  ['donker','dunkel'],['gezellig','gemütlich'],['groot','groß'],['klein','klein'],['licht','hell'],
  ['beneden','unten'],['boven','oben'],['heel|helemaal','ganz'],['thuis','zu Hause|zuhause'],
  ['blauw','blau'],['geel','gelb'],['rood','rot'],['roze','rosa'],['wit','weiß'],['zwart','schwarz'],
  ['beschrijven','beschreiben'],['bevallen','gefallen'],['doen|maken','machen'],['horen','hören'],
  ['lezen','lesen'],['spelen','spielen'],['vinden','finden'],['wonen','wohnen']
 ];
 words.forEach(([nl,de])=>both(nl,de,de.split('|')[0]+' betekent '+nl.replaceAll('|',' of ')+'.'));
 const readingWords=[
  ['her (zwei Jahre her)','geleden'],['fertig','klaar'],['ziemlich','best wel|tamelijk|vrij|nogal'],['die Nachbarn','de buren'],['nie','nooit'],
  ['schlimm','erg|slecht'],['der Ort','de plek|de plaats'],['nerven','irriteren|ergeren|op de zenuwen werken'],['häufig','vaak'],['eng','krap|smal|nauw'],
  ['nutzen','gebruiken'],['wenn','als|wanneer'],['zum Beispiel','bijvoorbeeld'],['der Stock (in een gebouw)','de verdieping'],
  ['umziehen','verhuizen'],['brauchen','nodig hebben'],['gerade','recht'],['umweltfreundlich','milieuvriendelijk'],
  ['verbringen','doorbrengen'],['deshalb','daarom'],['das Holz','het hout'],['das Jahrhundert','de eeuw'],
  ['spazieren gehen','wandelen'],['altmodisch','ouderwets']
 ];
 readingWords.forEach(([de,nl])=>add(2,de,nl,'In deze woordenlijst betekent '+de.replace(/ \(.*\)$/,'')+' '+nl.replaceAll('|',' of ')+'.','nl','Wat betekent dit woord uit de leestekst? Typ de Nederlandse betekenis. Een lidwoord mag, maar hoeft niet.'));
 const writing=[
  ['Ons huis heeft drie kamers.','Unser Haus hat drei Zimmer.'],
  ['Mijn kamer is groot en modern, maar donker.','Mein Zimmer ist groß und modern, aber dunkel.'],
  ['In mijn kamer is het gezellig.','In meinem Zimmer ist es gemütlich.'],
  ['Ik heb een bank en een tv in mijn kamer.','Ich habe ein Sofa und einen Fernseher in meinem Zimmer.|In meinem Zimmer habe ich ein Sofa und einen Fernseher.'],
  ['Ik wil andere meubels.','Ich möchte andere Möbel.|Ich will andere Möbel.'],
  ['Groetjes, Lydia','Liebe Grüße Lydia|Viele Grüße Lydia']
 ];
 writing.forEach(([nl,de])=>add(3,nl,de,'In het boek staat: '+de.split('|')[0],'de',nl.startsWith('Groetjes')?'Schrijf deze afsluiting van een brief in het Duits. Een komma mag, maar hoeft niet.':'Schrijf de hele zin in het Duits. Let op de hoofdletters bij zelfstandige naamwoorden.'));
 const prep=[
  ['door','durch','Wir laufen ___ den Garten.'],['voor','für','Diese Lampe ist ___ dich.'],
  ['zonder','ohne','Ich gehe ___ meinen Schlüssel los.'],['om','um','Wir gehen einmal ___ das Haus herum.'],
  ['tot','bis','Wir bleiben ___ Freitag.'],['tegen','gegen','Der Ball fliegt ___ die Tür.']
 ];
 prep.forEach(([nl,de,example])=>{add(4,'Welk Duits voorzetsel betekent ‘'+nl+'’?',de,de+' hoort bij de voorzetsels met de vierde naamval.','de','Typ alleen het Duitse voorzetsel, één woord.');
  add(4,example+' ('+nl+')',de,example.replace('___',de),'de','Welk Duits voorzetsel hoort op de streepjes? Tussen haakjes staat wat het betekent. Typ alleen dat ene woord.');});
 const pronouns=[
  ['ich','mij','mich','Das Paket ist für ___.'],['du','jou','dich','Ohne ___ fahre ich morgen nicht.'],
  ['er','hem','ihn','Wir spielen gegen ___.'],['sie','haar','sie','Ich kümmere mich um ___.'],
  ['es','het','es','Das Kind braucht ein Bett. Dieses Bett ist für ___.'],
  ['wir','ons','uns','Der Garten ist für ___.'],['ihr','jullie','euch','Wir spielen gegen ___.'],
  ['sie','hen','sie','Die Nachbarn sind nett. Ich kaufe Blumen für ___.'],
  ['Sie','u','Sie','Frau Wolf, das Sofa ist für ___.'],['wer','wie','wen','Für ___ ist die Lampe?'],['was','wat','was','Gegen ___ bist du?']
 ];
 pronouns.forEach(([nom,nl,acc,example])=>{const why=nom+' wordt '+acc+' in de vierde naamval.';
  add(5,example+' ('+nl+')',acc,why,'de','Welk Duits woord hoort op de streepjes? Tussen haakjes staat het Nederlandse woord. Typ alleen dat ene woord.');
  add(5,'Wat is de vierde naamval van ‘'+nom+'’? (Nederlands: '+nl+')',acc,why,'de','Typ alleen het Duitse woord. Let op het verschil tussen sie en Sie.')});
 const phrases=[
  ['voor mij','für mich'],['zonder jou','ohne dich'],['tegen hem','gegen ihn'],['voor haar','für sie'],
  ['voor ons','für uns'],['tegen jullie','gegen euch'],['zonder hen','ohne sie'],['voor u (beleefd)','für Sie'],
  ['voor wie','für wen'],['tegen wat','gegen was']
 ];
 phrases.forEach(([nl,de])=>add(5,'Vertaal de hele woordgroep: '+nl,de,'Na dit voorzetsel gebruik je de vierde naamval.','de','Schrijf het voorzetsel én het voornaamwoord in het Duits.'));
 // Equal turns for the six topics, followed by spaced retesting within a topic.
 function next(log,skill=null){
  const pool=bank.filter(q=>skill==null||q.skill===skill);
  const due=pool.filter(q=>log.items[q.id]?.due!=null&&log.items[q.id].due<=log.turn);
  if(due.length)return due.sort((a,b)=>log.items[a.id].due-log.items[b.id].due)[0];
  const fresh=pool.filter(q=>log.items[q.id]?.due==null);
  const section=skill??(log.turn%groups.length);
  const candidates=fresh.filter(q=>q.skill===section);
  const ranked=(candidates.length?candidates:fresh.length?fresh:pool).slice();
  return ranked.sort((a,b)=>(log.items[a.id]?.attempts||0)-(log.items[b.id]?.attempts||0)||((a.id*73+17)%211)-((b.id*73+17)%211))[0];
 }
 function record(log,q,ok){const e=log.items[q.id]||{id:q.id,attempts:0,good:0};e.attempts++;e.good+=Number(ok);log.turn++;e.due=ok?null:log.turn+2;log.items[q.id]=e}
 function normalize(value,lang){let str=value.normalize('NFC').trim().replace(/[.,!?;:"“”‘’]/g,'').replace(/\s+/g,' ');return lang==='nl'?str.toLocaleLowerCase('nl'):str}
 // Reading words test the meaning, so a Dutch article is optional there.
 const bare=v=>v.replace(/^(de|het|een) /,'');
 function accepts(q,value){return q.answers.some(a=>{const x=normalize(value,q.language),y=normalize(a,q.language);return x===y||(q.skill===2&&bare(x)===bare(y))})}
 function nearMiss(q,value){return q.language==='de'&&q.answers.some(a=>normalize(value,'de').toLocaleLowerCase('de')===normalize(a,'de').toLocaleLowerCase('de'))}
 return {bank,groups,next,record,accepts,nearMiss}
})();
