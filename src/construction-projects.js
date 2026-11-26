"use strict";
/*
 * StudyQuest construction project logic (proposal).
 * Standalone; intentionally NOT loaded by index.html yet.
 * No Three.js, DOM, storage, global save or render modifications.
 * Existing free-build entries in s.builds remain untouched.
 */
const ConstructionProjects = (() => {
  const MATERIALS = ["hout", "steen", "planken"];
  const BLUEPRINTS = Object.freeze({
    vakwerkhuis: {
      id: "vakwerkhuis",
      title: "Mijn vakwerkhuis",
      footprint: { width: 8, depth: 6 },
      stages: [
        { id: "foundation", title: "Fundering leggen", cost: { steen: 4, hout: 1 }, questions: 1, visual: "foundation" },
        { id: "frame", title: "Houten draagconstructie", cost: { hout: 5, planken: 2 }, questions: 1, visual: "frame" },
        { id: "walls", title: "Muren en ramen", cost: { steen: 4, hout: 2 }, questions: 2, visual: "walls" },
        { id: "roof", title: "Dak bouwen", cost: { hout: 2, planken: 4 }, questions: 1, visual: "roof" },
        { id: "interior", title: "Deuren en inrichting", cost: { steen: 1, planken: 3 }, questions: 1, visual: "interior" }
      ]
    },
    luchtschip: {
      id: "luchtschip",
      title: "De Hemelvaarder",
      footprint: { width: 12, depth: 8 },
      stages: [
        { id: "wreck", title: "Het wrak onderzoeken", cost: {}, questions: 1, visual: "wreck" },
        { id: "keel", title: "Kiel en spanten", cost: { hout: 4, planken: 3 }, questions: 2, visual: "keel" },
        { id: "gondola", title: "De gondel timmeren", cost: { planken: 5, steen: 2 }, questions: 1, visual: "gondola" },
        { id: "envelope", title: "De ballon vullen", cost: { hout: 2, steen: 3 }, questions: 2, visual: "envelope" },
        { id: "engine", title: "Motor en roer", cost: { hout: 2, steen: 2, planken: 3 }, questions: 2, visual: "engine" }
      ]
    },
    wolkentuin: {
      id: "wolkentuin",
      title: "De Wolkentuin",
      footprint: { width: 14, depth: 14 },
      stages: [
        { id: "spring", title: "De bron vrijmaken", cost: {}, questions: 1, visual: "spring" },
        { id: "beds", title: "Terrassen metselen", cost: { steen: 5, hout: 1 }, questions: 2, visual: "beds" },
        { id: "trough", title: "De waterloop timmeren", cost: { planken: 4, hout: 2 }, questions: 2, visual: "trough" },
        { id: "kas", title: "De kas bouwen", cost: { planken: 4, hout: 2, steen: 1 }, questions: 2, visual: "kas" },
        { id: "flow", title: "Het water laten stromen", cost: { steen: 2, planken: 1 }, questions: 2, visual: "flow" }
      ]
    },
    wachttoren_ruine: {
      id: "wachttoren_ruine",
      title: "Herstel de oude wachttoren",
      footprint: { width: 10, depth: 9 },
      stages: [
        { id: "survey", title: "Onderzoek de ruïne", cost: {}, questions: 1, visual: "surveyed" },
        { id: "clear", title: "Puin ruimen", cost: {}, questions: 1, visual: "cleared" },
        { id: "stonework", title: "Muren herstellen", cost: { steen: 6, hout: 2 }, questions: 2, visual: "stonework" },
        { id: "platform", title: "Trappen en vloeren", cost: { hout: 3, planken: 4 }, questions: 1, visual: "platform" },
        { id: "roof", title: "Dak en uitkijkpost", cost: { hout: 2, steen: 3, planken: 5 }, questions: 2, visual: "roof" }
      ]
    }
  });
  function blueprint(id) {
    const result = BLUEPRINTS[id];
    if (!result) throw new Error("Onbekende bouwtekening: " + id);
    return result;
  }
  function create(options) {
    const o = options || {}, b = blueprint(o.blueprintId);
    if (!o.id || !o.plotId || !Number.isFinite(o.x) || !Number.isFinite(o.z))
      throw new Error("Bouwproject heeft id, plotId en geldige coordinaten nodig");
    const rotation = o.rotation === undefined ? 0 : o.rotation;
    if (![0, 90, 180, 270].includes(rotation))
      throw new Error("Rotatie moet 0, 90, 180 of 270 graden zijn");
    return {
      version: 1,
      id: String(o.id),
      blueprintId: b.id,
      plotId: String(o.plotId),
      x: o.x,
      z: o.z,
      rotation,
      style: o.style || "classic",
      completed: 0
    };
  }
  function progress(project) {
    const b = blueprint(project.blueprintId), n = project.completed;
    if (!Number.isInteger(n) || n < 0 || n > b.stages.length)
      throw new Error("Ongeldige bouwvoortgang");
    return {
      current: n,
      total: b.stages.length,
      finished: n === b.stages.length,
      next: b.stages[n] || null,
      visibleParts: b.stages.slice(0, n).map(s => s.visual)
    };
  }
  function budget(blueprintId) {
    const total = { hout: 0, steen: 0, planken: 0, questions: 0 };
    for (const step of blueprint(blueprintId).stages) {
      for (const key of MATERIALS) total[key] += step.cost[key] || 0;
      total.questions += step.questions;
    }
    return total;
  }
  function advance(project, inventory, acceptedCorrectAnswers) {
    const p = progress(project), step = p.next;
    if (!step) return { ok: false, reason: "already-complete" };
    // Answers must be supplied by the existing profile-specific learning logic.
    const correct = Number.isFinite(acceptedCorrectAnswers) ? acceptedCorrectAnswers : 0;
    if (correct < step.questions) return { ok: false, reason: "needs-answers", required: step.questions };
    const lacking = MATERIALS.filter(k => (Number(inventory[k]) || 0) < (step.cost[k] || 0));
    if (lacking.length) return { ok: false, reason: "needs-materials", missing: lacking };
    const updatedInventory = { ...inventory };
    for (const k of MATERIALS) updatedInventory[k] = (Number(inventory[k]) || 0) - (step.cost[k] || 0);
    const updatedProject = { ...project, completed: p.current + 1 };
    return {
      ok: true,
      project: updatedProject,
      inventory: updatedInventory,
      stage: step.id,
      visualPart: step.visual,
      finished: progress(updatedProject).finished
    };
  }
  return { BLUEPRINTS, blueprint, create, progress, budget, advance };
})();
if (typeof module !== "undefined" && module.exports) module.exports = ConstructionProjects;
