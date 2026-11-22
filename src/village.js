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
  task:'In de bibliotheek boven ontbreekt een oud boek. Meneer Van Dalen wil weten wie het het laatst had.',questions:['Wat staat er in het uitleenschrift?','Hoe oud is het boek?'],answers:['In het uitleenschrift staat dat Linde het boek vorige maand heeft geleend en nog niet heeft teruggebracht.','Het boek is meer dan honderd jaar oud. Dat zegt niets over wie het nu heeft.'],check:'Welke conclusie past bij het bewijs?',choices:['Linde heeft het boek waarschijnlijk nog.','Oude boeken raken altijd kwijt.'],right:0},
 {key:'gerrit',place:'Houtvesterij',name:'Gerrit',role:'Houtvester',x:-64.6,z:-.92,join:0,bend:1.4,k:3,color:0x4d5a2f,
  task:'Er ligt een omgevallen den over het bospad. Gerrit wil weten waarom de boom is omgevallen.',questions:['Wat zag je aan de stam en de wortels?','Hoe oud was de boom?'],answers:['De wortels aan de westkant waren losgetrokken en de grond eromheen was doorweekt. Na de storm van dinsdag stond er nog water in de kuil.','De boom was ongeveer tachtig jaar oud. Dat zegt nog niet waarom hij juist nu omviel.'],check:'Welke verklaring past bij wat Gerrit heeft gezien?',choices:['De storm en de natte grond hebben de wortels losgetrokken.','Oude bomen vallen altijd vanzelf om.'],right:0},
 {key:'anke',place:'Boerderij',name:'Anke',role:'Boerin',x:-50,z:-64.39,join:-60,bend:1.4,k:4,color:0x7a4a2e,
  task:'De kippen leggen deze week minder eieren. Anke zoekt uit hoe dat komt.',questions:['Wat veranderde er deze week bij het kippenhok?','Welke kip is je favoriet?'],answers:['Sinds maandag woont er een nieuwe hond bij de buren. Ik zag dat de kippen opschrokken als hij blafte, en juist op die dagen lag er het minst in de nesten.','Mijn favoriet is de bruine kip met de witte vlek. Dat heeft niets met het aantal eieren te maken.'],check:'Welke conclusie past bij wat Anke heeft gezien?',choices:['Het voer is te duur geworden.','De onrust door het blaffen kan de oorzaak zijn.'],right:1},
 {key:'joost',place:'Steenhouwerij',name:'Joost',role:'Steenhouwer',x:46.03,z:-82.05,join:-80,bend:1.2,k:5,color:0x5a5f66,stone:true,
  task:'Een steen voor de molen is gebarsten. Joost wil weten of de steen al kapot was voordat hij werd vervoerd.',questions:['Wat zag je toen je de steen uit de groeve haalde?','Hoe zwaar is de steen?'],answers:['Toen ik de steen losbrak, heb ik hem van alle kanten bekeken. Er zat geen barst in. Na de rit over het hobbelige pad zat er wel een barst in de hoek die tegen de kar stootte.','De steen weegt zo\'n driehonderd kilo. Het gewicht verklaart niet waar de barst vandaan komt.'],check:'Wat volgt uit wat Joost heeft gezien?',choices:['De barst is tijdens het vervoer ontstaan.','De steen was al gebarsten in de groeve.'],right:0},
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
