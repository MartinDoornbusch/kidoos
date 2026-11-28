"use strict";
// StudyQuest · Floor (Havo 3) · Duits. Bron: Overhoring_Duits_Floor.docx, 12 pagina's.
// A/B: 99 woorden heen en terug. C/D: 9 zinnen heen en terug.
// E/F: 22 persoonsvormen heen en terug. Exacte instructies uit de overhoring;
// geen verzonnen leerstof. Engelse / Duitse begrippen zijn niet vervangen.
const German=(()=>{
 const groups=["Woorden · NL → DE","Woorden · DE → NL","Zinnen · NL → DE","Zinnen · DE → NL","Grammatica · NL → DE","Grammatica · DE → NL"];
 const nlWords=["de sneeuw","het hagelt","gemiddeld","benieuwd zijn naar","het weer","de wind","betrouwbaar","ook, tevens","blijven (+ voltooid deelwoord)","in juni","in oktober","de zon schijnt","heel","in april","de rivier","in het zuiden","het sneeuwt","goed – beter","de regen","rustig","de plaats (+ meervoud)","’s avonds","helder","de volwassene","de natuurbescherming","het strand","de streek","weliswaar","het effect","in januari","het onweer","het dorp (+ meervoud)","dus","het vriest","per se","de klimaatverandering","de zon","warm – warmer","in mei","de waarde","in het westen","horen bij","laag","letten op","in maart","verwoesten","het enthousiasme","in juli","de bestemming, het doel","barbecueën","in december","altijd","’s middags","de wolk","het waait","de lucht","de berg (+ meervoud)","het meer","in de zomer","er is, er zijn","wandelen","daarom","de omgeving","bekend zijn met","heet","het bos (+ meervoud)","koud – kouder","meer","saai","aanbevelen","in september","in het noorden","de stad (+ meervoud)","glad","het eiland","populair","de zee","de bezienswaardigheid","vanmorgen","het verkeer","in het oosten","voetballen","de natuur","de bescherming","in november","toen","druk, hectisch","zien (+ voltooid deelwoord)","kamperen","de voeding","tijdens","in augustus","vaak","in de winter","het land (+ meervoud)","in februari","in de herfst","het regent","in de lente"];
 const deWords=["der Verkehr","das Meer","im Winter","der Regen","niedrig","im April","es regnet","das Ziel","die Natur","im Süden","die Nahrung","damals","empfehlen","heiß","im Westen","im Oktober","im Juni","grillen","hektisch","der Erwachsene","zelten","der Wert","im Herbst","ebenfalls","der Himmel","zuverlässig","abends","das Land – die Länder","das Wetter","im Dezember","es ist windig","zerstören","die Umgebung","das Gewitter","während","der Schutz","deshalb","langweilig","gut – besser","kalt – kälter","im Norden","gespannt sein auf","es gibt","sich auskennen","im Februar","wandern","es friert","mehr","die Wolke","glatt","ganz","es hagelt","der Wald – die Wälder","die Gegend","Fußball spielen","im August","der Fluss","im Januar","klar","im Frühling","warm – wärmer","die Sonne","im September","im November","die Insel","im Sommer","die Sonne scheint","durchschnittlich","gehören zu","also","im Osten","im März","die Auswirkung","oft","der Wind","unbedingt","im Juli","immer","heute Morgen","der Schnee","es schneit","der Ort – die Orte","der See","das Dorf – die Dörfer","die Begeisterung","der Strand","der Berg – die Berge","im Mai","die Sehenswürdigkeit","beliebt","bleiben – geblieben","zwar","die Stadt – die Städte","nachmittags","ruhig","sehen – gesehen","der Naturschutz","der Klimawandel","achten auf"];
 // 1-gebaseerde positie uit B voor ieder origineel item uit A; B is in andere volgorde gedrukt.
 const wordIndex=[80,52,68,42,29,75,26,24,91,17,16,67,51,6,57,10,81,39,4,95,82,27,59,20,97,86,54,92,73,58,34,84,70,47,76,98,62,61,88,22,15,69,5,99,72,32,85,77,8,18,30,78,94,49,31,25,87,83,66,43,46,37,33,44,14,53,40,48,38,13,63,41,93,50,65,90,2,89,79,1,71,55,9,36,64,12,19,96,21,11,35,56,74,3,28,45,23,7,60];
 const nlSentences=["Het is hier mooier dan thuis.","Beste opa","Helaas is het weer niet zo mooi als op de foto.","We zijn sinds een week in Breitenwang.","Liefs,","Hoe gaat het met jullie?","Meestal wandelen we gewoon door het dal.","Het sneeuwt hier maar zelden.","Leuk om van je te horen."];
 const deSentences=["Es ist hier schöner als zu Hause.","Wie geht es euch?","Meistens wandern wir einfach durch das Tal.","Leider ist das Wetter nicht so schön wie auf dem Bild.","Es schneit hier eher selten.","Lieber Opa,","Wir sind seit einer Woche in Breitenwang.","Liebe Grüße","Freut mich, von dir zu hören."];
 const sentenceIndex=[1,6,4,7,8,2,3,5,9];
 const nlGrammar=["u had","zij waren","wij hadden","wij waren","wij worden","jij wordt","jullie hadden","ik word","zij hadden","u wordt","jullie worden","ik ben geworden","u was","zij worden","jij had","hij / zij / het wordt","hij / zij / het / men was","hij / zij / het / men had","jij was","jullie waren","ik was","ik had"];
 const deGrammar=["wir waren","er / sie / es / man war","wir werden","ihr wart","er / sie / es / man hatte","sie hatten","ich war","du warst","ihr werdet","Sie hatten","ihr hattet","sie waren","ich bin geworden","sie werden","du wirst","ich hatte","du hattest","Sie werden","Sie waren","ich werde","wir hatten","er / sie / es wird"];
 const grammarIndex=[10,12,21,1,3,15,11,20,6,18,9,13,19,14,17,22,2,5,8,4,7,16];
 const nounForms={
  "de plaats (+ meervoud)":"de plaats – de plaatsen",
  "het dorp (+ meervoud)":"het dorp – de dorpen",
  "de berg (+ meervoud)":"de berg – de bergen",
  "het bos (+ meervoud)":"het bos – de bossen",
  "de stad (+ meervoud)":"de stad – de steden",
  "het land (+ meervoud)":"het land – de landen",
  "blijven (+ voltooid deelwoord)":"blijven – gebleven",
  "zien (+ voltooid deelwoord)":"zien – gezien"
 };
 const cleanNl=s=>nounForms[s]||s;
 const bank=[];
 function add(skill,sentence,correct,answers=null){const isGerman=[0,2,4].includes(skill);
  bank.push({id:bank.length,skill,sentence,correct,answers:answers||[correct],language:isGerman?"de":"nl",
   task:skill<2?"Vertaal met lidwoorden en alle gevraagde vormen.":skill<4?"Vertaal de volledige zin. Let op spelling en woordvolgorde.":"Vertaal inclusief het persoonlijk voornaamwoord en de juiste werkwoordsvorm.",
   why:"Dit is de antwoordvorm uit Floors overhoring."});
 }
 function inverseMap(map,size){const inv=Array(size);map.forEach((v,i)=>inv[v-1]=i);return inv}
 function addPaired(nl,de,map,even,odd,fmtNl=x=>x){
  const inv=inverseMap(map,nl.length);
  nl.forEach((t,i)=>add(even,t,de[map[i]-1]));
  de.forEach((t,i)=>add(odd,t,fmtNl(nl[inv[i]])));
 }
 addPaired(nlWords,deWords,wordIndex,0,1,cleanNl);
 addPaired(nlSentences,deSentences,sentenceIndex,2,3);
 addPaired(nlGrammar,deGrammar,grammarIndex,4,5);
 // Allow the natural answer variants where the paper lists multiple subject pronouns separated by '/'.
 // Keep the intended register: 'Sie' (u) and 'sie' (zij) are not interchangeable.
 const mixedSubjects={
  "er / sie / es wird":["er wird","sie wird","es wird"],
  "er / sie / es / man war":["er war","sie war","es war","man war"],
  "er / sie / es / man hatte":["er hatte","sie hatte","es hatte","man hatte"],
  "hij / zij / het wordt":["hij wordt","zij wordt","het wordt"],
  "hij / zij / het / men was":["hij was","zij was","het was","men was"],
  "hij / zij / het / men had":["hij had","zij had","het had","men had"]
 };
 for(const card of bank)if(mixedSubjects[card.correct])card.answers=[card.correct,...mixedSubjects[card.correct]];
 // A small number of synonyms are printed in the original overhoring.
 const synonyms={
  "ook, tevens":["ook","tevens"],"de bestemming, het doel":["de bestemming","het doel"],
  "druk, hectisch":["druk","hectisch"],"er is, er zijn":["er is","er zijn"]
 };
 for(const card of bank)if(synonyms[card.correct])card.answers=[card.correct,...synonyms[card.correct]];
 // Compare punctuation and redundant whitespace flexibly. Preserve capitalization for sie / Sie.
 // A dash between an infinitive and a participle or between singular / plural is compulsory.
 const normalized=s=>String(s).normalize("NFC").trim().replace(/[.,!?;:“”‘’']/g,"").replace(/[–—]/g,"-").replace(/\s*\/\s*/g," / ").replace(/\s*-\s*/g," - ").replace(/\s+/g," ");
 function accepts(q,value){return q.answers.some(a=>normalized(a)===normalized(value))}
 function nearMiss(q,value){return q.language==="de"&&q.answers.some(a=>normalized(a).toLocaleLowerCase("de")===normalized(value).toLocaleLowerCase("de"))}
 function next(log,skill=null){const pool=bank.filter(q=>skill==null||q.skill===skill),due=pool.filter(q=>log.items?.[q.id]?.due!=null&&log.items[q.id].due<=log.turn);
  if(due.length)return due.sort((a,b)=>log.items[a.id].due-log.items[b.id].due)[0];
  const fresh=pool.filter(q=>!log.items?.[q.id]);if(fresh.length)return fresh[(log.turn||0)%fresh.length];
  return pool.reduce((a,b)=>(log.items[a.id]?.attempts||0)<=(log.items[b.id]?.attempts||0)?a:b);
 }
 function record(log,q,ok){log.items??={};const e=log.items[q.id]||{id:q.id,attempts:0,good:0};e.attempts++;e.good+=+ok;log.turn=(log.turn||0)+1;e.due=ok?null:log.turn+2;log.items[q.id]=e}
 return {groups,bank,next,record,accepts,nearMiss,source:"Overhoring_Duits_Floor.docx",sourceCounts:{words:198,sentences:18,grammar:44}};
})();
