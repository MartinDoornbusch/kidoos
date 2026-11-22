"use strict";
const assert = require("node:assert/strict");
const B = require("../construction-projects.js");
assert.deepEqual(Object.keys(B.BLUEPRINTS).sort(), ["vakwerkhuis", "wachttoren_ruine"]);
for (const id of Object.keys(B.BLUEPRINTS)) {
  let p = B.create({ id: "demo-" + id, blueprintId: id, plotId: "plot-01", x: 12, z: 10 });
  let bag = { hout: 100, steen: 100, planken: 100, munten: 13 };
  const initial = { ...bag }, totals = B.budget(id);
  const first = B.advance(p, bag, 0);
  assert.equal(first.ok, false);
  assert.equal(first.reason, "needs-answers");
  const seen = [];
  while (!B.progress(p).finished) {
    const stage = B.progress(p).next;
    const oldStage = p.completed;
    const oldBag = { ...bag };
    const result = B.advance(p, bag, stage.questions);
    assert.equal(result.ok, true);
    assert.equal(p.completed, oldStage, "must not mutate previous state");
    assert.deepEqual(bag, oldBag, "must not mutate previous inventory");
    assert.equal(result.project.completed, oldStage + 1);
    assert.equal(result.visualPart, stage.visual);
    seen.push(result.visualPart);
    p = result.project;
    bag = result.inventory;
  }
  assert.deepEqual(B.progress(p).visibleParts, seen);
  assert.equal(B.advance(p, bag, 10).reason, "already-complete");
  for (const resource of ["hout", "steen", "planken"])
    assert.equal(initial[resource] - bag[resource], totals[resource]);
  assert.equal(bag.munten, 13);
}
const sample = B.create({ id: "a", plotId: "b", blueprintId: "vakwerkhuis", x: 0, z: 0 });
assert.equal(B.advance(sample, { hout: 0, steen: 0, planken: 0 }, 1).reason, "needs-materials");
assert.throws(() => B.create({ id: "a", plotId: "b", blueprintId: "vakwerkhuis", x: 0, z: 0, rotation: 13 }));
console.log("construction-projects: alle tests geslaagd");
