"use strict";
const villageHomes=[
 {key:'linde',place:'Kaartenhuis',name:'Linde',role:'Cartograaf',x:-10,z:7.18,join:12,bend:2,k:0,color:0x356360,
  task:'Een reiziger zoekt een veilige oversteek naar de Bloesemvallei.',questions:['Welke route heb je zelf gecontroleerd?','Welke kleur heeft de havenbrug?'],answers:['Ik ben gisteren over de havenbrug gelopen. Bij de noordelijke splitsing staat een wegwijzer naar de vallei.','De leuning is bruin. Aan de kleur kun je de bestemming niet zien.'],check:'Welke aanwijzing is gebaseerd op een eigen waarneming?',choices:['Linde liep gisteren zelf over de havenbrug.','Elke bruine brug leidt naar de vallei.'],right:0},
 {key:'bram',place:'Timmerwerkplaats',name:'Bram',role:'Timmerman',x:-15.88,z:-1.24,join:-2.2,bend:1.6,k:0,color:0x986940,
  task:'De brugploeg wil weten waarom één plank moet worden vervangen.',questions:['Wat zag je toen je de plank onderzocht?','Hoe laat begint de ploeg?'],answers:['De plank veerde door onder mijn voet. Aan de onderkant zag ik een scheur tot aan de rand.','De ploeg begint om acht uur. Dat vertelt je nog niets over de staat van het hout.'],check:'Welke conclusie past bij Brams onderzoek?',choices:['De hele brug moet worden afgebroken.','De beschadigde plank moet worden vervangen.'],right:1},
 {key:'mara',place:'Smederij',name:'Mara',role:'Smid',x:9.97,z:9.05,join:8.2,bend:1.3,k:0,color:0x734936,
  task:'Bij een lantaarn hangt de kap scheef. Zoek uit wat de oorzaak is.',questions:['Wat veranderde er toen je de beugel vastzette?','Hoeveel lampen hangen er buiten?'],answers:['Toen ik de losse beugel vastzette, hing de kap weer recht. Het glas heb ik niet aangeraakt.','Er hangen meerdere lampen langs het pad. Het aantal verklaart de scheve kap niet.'],check:'Wat was volgens de proef de oorzaak?',choices:['De losse beugel.','Het gewicht van nieuw glas.'],right:0},
 {key:'tomas',place:'Veldhuis',name:'Tomas',role:'Tuinman',x:12,z:-57.84,join:-55,bend:1.45,k:1,color:0x526341,
  task:'Het dorpsblad zoekt uit waarom de jonge bomen langs het pad staan.',questions:['Waarop baseerde je de keuze van de plantplek?','Welke boom vind je zelf de mooiste?'],answers:['Ik heb de volwassen kruin opgemeten en vanaf de padrand die afstand vrijgehouden. Zo blijven de takken straks uit de looproute.','Mijn favoriet is de kersenboom. Dat is mijn smaak.'],check:'Welke uitspraak geeft een meetbaar argument?',choices:['De kersenboom is de mooiste.','De breedte van de volwassen kruin bepaalt de vrije afstand.'],right:1},
 {key:'wies',place:'Handelspost',name:'Wies',role:'Koopvrouw',x:13,z:-4.12,join:2.2,bend:1.3,k:0,color:0x8a5a2b,shop:true,
  task:'Een klant vraagt waarom de appels vandaag duurder zijn dan vorige week.',questions:['Wat is er deze week veranderd bij de oogst?','Welke kleur hebben de appels?'],answers:['Door de storm is de helft van de appels uit de bomen gewaaid. Er zijn er nu veel minder, terwijl net zoveel mensen appels willen.','Ze zijn rood en geel. Aan de kleur zie je niet waarom de prijs verandert.'],check:'Welke verklaring past bij wat Wies vertelt?',choices:['Er is minder aanbod bij dezelfde vraag, dus de prijs stijgt.','Rode appels zijn altijd duurder dan gele.'],right:0},
 {key:'vandalen',place:'Landhuis',name:'Meneer Van Dalen',role:'Landheer',x:-13,z:-49.74,join:-45,bend:1.4,k:1,color:0x5a4a6a,manor:true,
  task:'In de bibliotheek boven ontbreekt een oud boek. Meneer Van Dalen wil weten wie het het laatst had.',questions:['Wat staat er in het uitleenschrift?','Hoe oud is het boek?'],answers:['In het uitleenschrift staat dat Linde het boek vorige maand heeft geleend en nog niet heeft teruggebracht.','Het boek is meer dan honderd jaar oud. Dat zegt niets over wie het nu heeft.'],check:'Welke conclusie past bij het bewijs?',choices:['Linde heeft het boek waarschijnlijk nog.','Oude boeken raken altijd kwijt.'],right:0}
];
function mainPathX(z,k){return 1.2*Math.sin((z+[0,61,120][k])*.18+k)}
function branchPoints(h){
 const start=mainPathX(h.join,h.k);
 return [[start,h.join],[start+(h.x-start)*.5,h.join],[h.x,h.z+h.bend],[h.x,h.z-.13]]
}
function laneDistance(x,z,h){
 const points=branchPoints(h);let best=Infinity;
 for(let i=1;i<points.length;i++){
  const [a,b]=points[i-1],[c,d]=points[i],dx=c-a,dz=d-b;
  const t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz)));
  best=Math.min(best,Math.hypot(x-a-t*dx,z-b-t*dz))
 }
 return best
}
function nearPaving(x,z,k,r){
 return Math.abs(x-mainPathX(z,k))<2.37+r||villageHomes.some(h=>h.k===k&&laneDistance(x,z,h)<.92+r)
}
