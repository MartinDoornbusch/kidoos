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
