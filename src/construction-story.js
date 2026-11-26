"use strict";
/** Pure narrative and visual target descriptions; renderer owns all actual meshes. */
const ConstructionStory = (() => {
  const STORIES = Object.freeze({
    wachttoren_ruine: {
      id: "de-vergeten-wachttoren",
      title: "Het geheim van de vergeten wachttoren",
      intro: "Achter het bos staat een vervallen wachttoren. In een oud logboek schrijft Linde dat de toren vroeger reizigers veilig over de eilanden leidde.",
      ending: "Vanaf de herstelde uitkijkpost kun je de oude handelsroute weer zien. In de toren ligt een verzegelde kaart.",
      rewards: { coins: 12, unlocks: ["wachttoren_toegang", "wachttoren_uitkijkpost", "wachttoren_kaart"] },
      steps: [
        { id: "survey", npc:"linde", prompt:"Linde vraagt je een oude plattegrond te vergelijken met de ruïne.", goal:"Onderzoek de schade en ontdek welke delen hersteld moeten worden.", completedText:"De schade is in kaart gebracht. Je hebt nu een herstelplan.", visuals:{reveal:["damage_markers","site_plan"],hide:[]}},
        { id: "clear", npc:"gerrit", prompt:"Gerrit wil weten hoe je de gevallen balken veilig opruimt.",goal:"Ruim de toegang vrij zonder de oude fundering te beschadigen.",completedText:"Het puin is verwijderd. De fundering is weer zichtbaar.",visuals:{reveal:["clear_site"],hide:["rubble_piles"]}},
        { id: "stonework",npc:"joost",prompt:"Joost legt uit waarom oude muren in verband worden gemetseld.",goal:"Herstel de verdwenen stukken van de muren met steen en hout.",completedText:"De muren staan weer recht. De toren is opnieuw herkenbaar.",visuals:{reveal:["repaired_walls","window_openings"],hide:["broken_wall_overlays"]}},
        { id: "platform",npc:"bram",prompt:"Bram vraagt hoe je een stevige trap en verdiepingsvloer maakt.",goal:"Plaats trappen, vloeren en een veilige balustrade.",completedText:"Je kunt nu via de trap naar de bovenverdieping.",visuals:{reveal:["stairs","floor","railings"],hide:[]}},
        { id: "roof",npc:"linde",prompt:"Linde heeft nog één raadsel over de richting van de oude lichttoren.",goal:"Breng het dak en de uitkijkpost aan en ontdek de verborgen kaart.",completedText:"De toren is hersteld en de verzegelde kaart is gevonden.",visuals:{reveal:["roof","lantern","archive_door","lookout"],hide:["scaffolding"]}}
      ]
    },
    luchtschip: {
      id: "de-hemelvaarder",
      title: "De Hemelvaarder",
      intro: "In de verzegelde kaart uit de wachttoren staat een zesde eiland, hoog boven de wolken: de Wolkenkruin. Wie er ooit was, zag er een boom van kristal. Op de noordrand van de Valkenrots ligt het wrak van het oude luchtschip De Hemelvaarder, nog vastgebonden aan zijn mast. Herstel het schip en vlieg erheen.",
      ending: "De motor bromt, de ballon trekt aan de touwen. Vanaf de landingsplaats zie je de Wolkenkruin boven de wolken liggen. Stap aan boord en vlieg erheen.",
      rewards: { coins: 20, unlocks: ["wolkenkruin"] },
      steps: [
        { id: "wreck", npc: "linde", prompt: "Linde legt de verzegelde kaart naast het wrak en vraagt je eerst iets uit te zoeken.", goal: "Onderzoek het wrak van De Hemelvaarder en ontdek wat er nog bruikbaar is.", completedText: "Het wrak is onderzocht. De kiel is gebroken, maar de motor en de ballonstof zijn te redden.", visuals: { reveal: ["survey"], hide: [] } },
        { id: "keel", npc: "bram", prompt: "Bram wil weten hoe je spanten zo neerzet dat de kiel recht blijft.", goal: "Bouw een nieuwe kiel met negen spanten op de schragen.", completedText: "De kiel ligt recht op de schragen. Het luchtschip heeft weer een ruggengraat.", visuals: { reveal: ["keel"], hide: ["wreck"] } },
        { id: "gondola", npc: "joost", prompt: "Joost vraagt hoe zwaar de ballast mag zijn voordat het schip niet meer opstijgt.", goal: "Timmer de gondel dicht en leg de stenen ballast in het ruim.", completedText: "De gondel is klaar: planken, ramen en een reling. De ballast ligt in het ruim.", visuals: { reveal: ["gondola"], hide: ["keel"] } },
        { id: "envelope", npc: "wies", prompt: "Wies verkoopt je zeildoek, maar wil eerst weten of je goed hebt opgelet.", goal: "Naai de ballon dicht en vul hem, zodat het schip aan de mast gaat zweven.", completedText: "De ballon staat bol. De Hemelvaarder zweeft naast de landingsplaats en trekt aan de touwen.", visuals: { reveal: ["ship"], hide: ["gondola"] } },
        { id: "engine", npc: "mara", prompt: "Mara smeedt een nieuwe schroef. Eerst heeft ze nog een vraag voor je.", goal: "Plaats de motor, de schroeven en het roer.", completedText: "De schroeven draaien. De Hemelvaarder is klaar voor de reis naar de Wolkenkruin.", visuals: { reveal: ["engine"], hide: [] } }
      ]
    },
    vakwerkhuis: {
      id: "een-plek-voor-jezelf",
      title:"Bouw je eigen vakwerkhuis",
      intro:"Kies een vrije bouwkavel en maak samen met Bram je eerste ontwerp.",
      ending:"Je huis is klaar. Tijd om binnen een eigen plek in te richten.",
      rewards:{coins:0,unlocks:["eigen_huis_inrichting"]},
      steps:[
        {id:"foundation",npc:"joost",goal:"Leg de fundering.",visuals:{reveal:["foundation"],hide:[]}},
        {id:"frame",npc:"bram",goal:"Bouw de draagconstructie.",visuals:{reveal:["frame"],hide:[]}},
        {id:"walls",npc:"bram",goal:"Plaats muren, ramen en deurkozijn.",visuals:{reveal:["walls","windows"],hide:[]}},
        {id:"roof",npc:"bram",goal:"Maak het dak waterdicht.",visuals:{reveal:["roof"],hide:[]}},
        {id:"interior",npc:"wies",goal:"Richt de eerste kamer in.",visuals:{reveal:["interior","entrance"],hide:[]}}
      ]
    }
  });
  function get(blueprintId){const story=STORIES[blueprintId];if(!story)throw Error("Geen verhaal voor bouwtekening "+blueprintId);return story}
  function step(blueprintId,stepId){return get(blueprintId).steps.find(s=>s.id===stepId)||null}
  return {STORIES,get,step};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ConstructionStory;
