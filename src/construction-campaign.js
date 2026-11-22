"use strict";
/*
 * Standalone, data-only integration contract for milestone restoration.
 * Does NOT modify StudyQuest game.js, world.js, s.builds, storage or Vercel.
 * Calls from the actual game must be trusted school-quiz callbacks, never UI buttons.
 */
const ConstructionCampaign = (() => {
  const Projects = typeof ConstructionProjects !== "undefined" ? ConstructionProjects : require("./construction-projects.js");
  const Story = typeof ConstructionStory !== "undefined" ? ConstructionStory : require("./construction-story.js");
  const SUBJECTS = new Set(["Duits", "Geschiedenis", "Nederlands"]);
  const projectList = save => Array.isArray(save.constructionProjects) ? save.constructionProjects : [];
  const studyEntries = save => save.constructionStudy && typeof save.constructionStudy === "object" && !Array.isArray(save.constructionStudy) ? save.constructionStudy : {};
  const unlocks = save => Array.isArray(save.constructionUnlocks) ? save.constructionUnlocks : [];
  function lookup(save, id) { return projectList(save).find(p => p.id === id) || null; }
  function start(save, options) {
    if (!save || typeof save !== "object") throw Error("Ongeldige spelvoortgang");
    const project = Projects.create(options), all = projectList(save);
    if (all.some(p => p.id === project.id)) return {ok:false,reason:"project-exists"};
    if (all.some(p => p.plotId === project.plotId)) return {ok:false,reason:"plot-occupied"};
    // The game must validate safe plot placement separately, BEFORE calling start().
    Story.get(project.blueprintId);
    const next = { ...save, constructionProjects:[...all,project], constructionStudy:{...studyEntries(save)}, constructionUnlocks:[...unlocks(save)] };
    return {ok:true,save:next,project};
  }
  function state(save,id) {
    const p=lookup(save,id);
    if(!p)return {ok:false,reason:"project-not-found"};
    const prog=Projects.progress(p), next=prog.next;
    const v=studyEntries(save)[id], credited=next&&v&&v.stepId===next.id&&Array.isArray(v.answerIds)?v.answerIds:[];
    const remaining={};if(next)for(const resource of ["hout","steen","planken"])remaining[resource]=Math.max(0,(next.cost[resource]||0)-(Number(save[resource])||0));
    return {ok:true,project:p,progress:prog,story:Story.get(p.blueprintId),stepStory:next?Story.step(p.blueprintId,next.id):null,correctAnswers:credited.length,answersNeeded:next?Math.max(0,next.questions-credited.length):0,missingMaterials:remaining,canFinishStep:!!next&&credited.length>=next.questions&&Object.values(remaining).every(n=>n===0)};
  }
  function answer(save,id,event) {
    const current=state(save,id);
    if(!current.ok)return current;
    if(current.progress.finished)return {ok:false,reason:"already-complete"};
    const stage=current.progress.next;
    if(!event||event.correct!==true||event.verified!==true||event.stageId!==stage.id||!SUBJECTS.has(event.subject))
      return {ok:false,reason:"unverified-answer"};
    if(typeof event.eventId!=="string"||event.eventId.length<6||event.eventId.length>120||
       typeof event.questionId!=="string"||!event.questionId.trim()||event.questionId.length>120)
      return {ok:false,reason:"invalid-answer-id"};
    const map=studyEntries(save), prev=map[id]&&map[id].stepId===stage.id?map[id]:null;
    const answerIds=prev&&Array.isArray(prev.answerIds)?prev.answerIds:[];
    const questionIds=prev&&Array.isArray(prev.questionIds)?prev.questionIds:[];
    if(answerIds.includes(event.eventId)||questionIds.includes(event.questionId))
      return {ok:false,reason:"duplicate-answer"};
    if(answerIds.length>=stage.questions)return {ok:false,reason:"answers-complete"};
    const entry={stepId:stage.id,answerIds:[...answerIds,event.eventId],questionIds:[...questionIds,event.questionId]};
    return {ok:true,save:{...save,constructionStudy:{...map,[id]:entry}},credited:entry.answerIds.length,required:stage.questions};
  }
  function complete(save,id) {
    const current=state(save,id);
    if(!current.ok)return current;
    if(current.progress.finished)return {ok:false,reason:"already-complete"};
    const entry=studyEntries(save)[id];
    const answerCount=entry&&entry.stepId===current.progress.next.id?entry.answerIds.length:0;
    const result=Projects.advance(current.project,save,answerCount);
    if(!result.ok)return result;
    const nextProjects=projectList(save).map(p=>p.id===id?result.project:p);
    const nextStudy={...studyEntries(save)};delete nextStudy[id];
    let newFlags=[...unlocks(save)];
    let rewardCoins=0;
    if(result.finished){
      const rewards=Story.get(current.project.blueprintId).rewards;
      newFlags=[...new Set([...newFlags,...rewards.unlocks])];
      rewardCoins=rewards.coins;
    }
    const next={...save,...result.inventory,constructionProjects:nextProjects,constructionStudy:nextStudy,constructionUnlocks:newFlags};
    if(rewardCoins)next.munten=(Number(save.munten)||0)+rewardCoins;
    return {ok:true,save:next,project:result.project,stage:result.stage,visibleParts:Projects.progress(result.project).visibleParts,stageStory:current.stepStory,finished:result.finished,rewards:result.finished?{coins:rewardCoins,unlocks:Story.get(current.project.blueprintId).rewards.unlocks}:null};
  }
  function summary(save){return projectList(save).map(p=>state(save,p.id)).filter(r=>r.ok)}
  return {start,state,answer,complete,summary};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=ConstructionCampaign;
