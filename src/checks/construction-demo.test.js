"use strict";
/**
 * Isolated end-to-end smoke test of the construction demo UI without WebGL.
 * Run: node src/checks/construction-demo.test.js
 * The actual 3D renderer still requires visual browser verification.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ConstructionProjects = require("../construction-projects.js");
const ConstructionStory = require("../construction-story.js");
const ConstructionCampaign = require("../construction-campaign.js");
const HouseDesigner = require("../house-designer.js");
const HousePlanner = require("../house-planner.js");
function createElement(tag) {
  return {
    tag, children: [], style: {}, value: "", textContent: "", hidden: false,
    disabled: false, className: "",
    classList: { toggle() {} },
    events: {},
    append(...items) { this.children.push(...items) },
    replaceChildren(...items) { this.children = items },
    after() {},
    addEventListener(type, listener) { this.events[type] = listener }
  };
}
const registry = new Map();
const document = {
  getElementById(id) { if (!registry.has(id)) registry.set(id, createElement(id)); return registry.get(id) },
  createElement
};
const values = new Map();
const storage = {
  getItem(key) { return values.get(key) || null },
  setItem(key, value) { values.set(key, value) },
  removeItem(key) { values.delete(key) }
};
const filename = path.join(__dirname, "construction-demo.js");
const source = fs.readFileSync(filename, "utf8");
const context = {
  window: { THREE: undefined }, document, localStorage: storage,
  confirm: () => true, console, ConstructionProjects, ConstructionStory,
  ConstructionCampaign, HouseDesigner, HousePlanner
};
vm.runInNewContext(source, context, { filename });
const $ = id => document.getElementById(id);
const persisted = () => JSON.parse(storage.getItem("studyquest.construction.preview.v1"));
assert.equal($("phaseCount").textContent, "0 van 5 fasen voltooid");
for (let i = 0; i < 5; i++) $("gather").onclick();
assert.equal(persisted().hout, 20);
const correct = {
  ruin: { survey:[1], clear:[0], stonework:[1,1], platform:[0], roof:[1,0] },
  house: { foundation:[0], frame:[0], walls:[0,1], roof:[0], interior:[0] }
};
for (const kind of ["ruin","house"]) {
  if (kind === "house") {
    $("tabHouse").onclick();
    $("roofMaterial").value = "slate";
    $("roofMaterial").events.change();
    assert.equal(persisted().constructionDesigns["house-demo"].roofMaterial, "slate");
    $("moveEast").onclick();
    $("moveEast").onclick();
    assert.equal(persisted().constructionDesigns["house-demo"].x, 2);
    $("moveEast").onclick(); // 3m would exceed the allowed plot footprint
    assert.equal(persisted().constructionDesigns["house-demo"].x, 2, "out-of-plot move must be rejected");
    $("rotateLeft").onclick();
    assert.equal(persisted().constructionDesigns["house-demo"].rotation, 270);
  }
  for (let n = 0; n < 5; n++) {
    const id = kind + "-demo";
    const state = ConstructionCampaign.state(persisted(), id);
    const step = state.progress.next;
    assert.ok(step, kind + " should have a step");
    for (let q = 0; q < step.questions; q++) {
      const option = $("quizBox").children[1].children[correct[kind][step.id][q]];
      assert.ok(option, kind + "/" + step.id + "/question-" + q);
      option.onclick();
    }
    assert.equal($("buildStep").disabled, false, kind + " " + step.id + " should be buildable");
    $("buildStep").onclick();
    assert.equal(ConstructionCampaign.state(persisted(), id).progress.current, n + 1);
    if(kind==="house" && n===0)assert.equal($("moveEast").disabled,true,"finished foundation locks plot position");
  }
}
assert.equal(persisted().munten, 12);
assert.equal(persisted().constructionUnlocks.includes("wachttoren_kaart"), true);
assert.equal(ConstructionCampaign.state(persisted(), "ruin-demo").progress.finished, true);
assert.equal(ConstructionCampaign.state(persisted(), "house-demo").progress.finished, true);
$("furnitureType").value = "table";
$("addFurniture").onclick();
assert.equal(persisted().constructionDesigns["house-demo"].furniture.length, 1);
assert.equal(persisted().hout, 2);
assert.equal(persisted().steen, 2);
assert.equal(persisted().planken, 0);
assert.deepEqual([...values.keys()], ["studyquest.construction.preview.v1"]);
const beforeReset = persisted();
$("reset").onclick();
assert.equal(ConstructionCampaign.state(persisted(), "ruin-demo").progress.current, 0);
assert.equal(persisted().munten, 0);
assert.equal(beforeReset.munten, 12);
console.log("construction-demo: both projects, sample quizzes, rewards, furniture and reset PASS");
