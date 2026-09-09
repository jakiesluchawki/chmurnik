import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { activities, lessonStepComplete } from "../weather-preview/learning/catalog.mjs";
import { guideProbes, probeState, readInvestigations, recordPrediction, recordEvidence } from "../weather-preview/learning/guide-probes.mjs";
import { forcedLift, skyReport, heightReference, icingConditions, windFromCloudMotion } from "../weather-preview/learning/science.mjs";

test("all eight remaining guides require decisions and evidence, with viable actions", () => {
  assert.equal(Object.keys(guideProbes).length, 8);
  for (const [id, probes] of Object.entries(guideProbes)) {
    assert.equal(probes.length, activities[id].steps.length);
    for (const [index, probe] of probes.entries()) {
      for (const [options, correct] of [[probe.options,probe.correct],[probe.evidenceOptions,probe.evidenceCorrect]]) {
        assert.equal(new Set(options).size, 3); assert.ok(options[correct]);
        assert.ok(options.every(x => typeof x === "string" && x.length > 0));
      }
      assert.ok(probe.question.endsWith("?")); assert.ok(probe.evidence.endsWith("?"));
      if (probe.kind === "cause") {
        assert.equal(lessonStepComplete(id,index,probeState(id,index)),false);
        assert.equal(lessonStepComplete(id,index,probeState(id,index,true)),true);
      }
    }
  }
});

test("guide predictions match the existing mechanisms, not invented scores", () => {
  assert.ok(forcedLift(probeState("front",0,true)).saturated);
  assert.equal(forcedLift(probeState("front",1,true)).saturated,false);
  assert.ok(forcedLift(probeState("front",3,true)).buoyant);
  assert.equal(skyReport(probeState("metar",0,true)).ceiling,2000);
  assert.match(skyReport(probeState("metar",1,true)).groups,/BKN010/);
  assert.equal(heightReference(probeState("wysokosc",0,true)).agl,200);
  assert.ok(heightReference(probeState("wysokosc",1,true)).belowGround);
  assert.equal(icingConditions(probeState("oblodzenie",0,true)).amount,0);
  assert.ok(icingConditions(probeState("oblodzenie",1,true)).amount>0);
  assert.equal(icingConditions(probeState("oblodzenie",2,true)).amount,0);
  assert.equal(windFromCloudMotion(90).from,270);
  assert.equal(windFromCloudMotion(225).from,45);
});

test("guide first answers cannot be rewritten after evidence or retry", () => {
  const empty = readInvestigations(null);
  const input = {id:"metar",index:0,answer:1,state:probeState("metar",0),token:"first"};
  const chosen = recordPrediction(empty,input); assert.equal(empty.attempts.length,0);
  input.state.cover="OVC"; assert.equal(chosen.attempts[0].state.cover,"SCT");
  assert.equal(chosen.attempts[0].correct,false);
  assert.strictEqual(recordPrediction(chosen,{...input,answer:0}),chosen);
  const reason = recordEvidence(chosen,"first",2);
  assert.equal(reason.attempts[0].evidenceCorrect,false);
  assert.equal(recordEvidence(reason,"first",1).attempts[0].evidence,2);
  const retry = recordPrediction(reason,{...input,answer:0,token:"retry"});
  assert.equal(retry.attempts.length,2); assert.equal(retry.attempts[0].answer,1);
  assert.deepEqual(readInvestigations(JSON.stringify(retry)),retry);
  assert.equal(readInvestigations('{"version":1,"attempts":[null,{},1]}').attempts.length,0);
  assert.equal(recordPrediction(empty,{...input,answer:99}).attempts.length,0);
});

test("rendered scene actions remain accessible and concealed photo answers stay hidden", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(),"chmurnik-investigation-"));
  const server = await createServer({configFile:false,root:fileURLToPath(new URL("..",import.meta.url)),cacheDir,publicDir:false,logLevel:"error",server:{middlewareMode:true,ws:false,hmr:false,watch:null},optimizeDeps:{noDiscovery:true,include:[]}});
  t.after(async () => {await server.close();await rm(cacheDir,{recursive:true,force:true});});
  const {ActivityScene,draggedSceneValue} = await server.ssrLoadModule("/weather-preview/learning/Scenes.jsx");
  const render = (id,props={}) => renderToStaticMarkup(React.createElement(ActivityScene,{id,state:probeState(id,0),...props}));
  for(const id of ["obserwacja","rodziny","nazwy"]){
    const html=render(id,{conceal:true,hideInterpretation:true,compareState:id==="rodziny"?activities.rodziny.initial:undefined});
    assert.doesNotMatch(html,/<details/); assert.doesNotMatch(html,/href="https:/);
    assert.doesNotMatch(html,/alt="(?:Cirrus|Cumulus|Stratocumulus)/);
  }
  const height=render("wysokosc",{onStateChange:()=>{}});
  assert.match(height,/role="slider"/); assert.match(height,/aria-orientation="vertical"/);
  assert.match(height,/role="group"/);
  const wind=render("wiatr",{onStateChange:()=>{},controlKey:"direction"});
  assert.equal((wind.match(/skieruj chmurę do/g)||[]).length,8);
  const metar=render("metar",{onStateChange:()=>{},controlKey:"cover"});
  assert.match(metar,/Zmień grupę niższej warstwy/);
  assert.equal(draggedSceneValue(100, -100, 592, 0,2000,100),400);
  assert.equal(draggedSceneValue(100, -10000,592,0,2000,100),2000);
  assert.equal(draggedSceneValue(100, 10000,592,0,2000,100),0);
  assert.equal(draggedSceneValue(100, 100,0,0,2000,100),100);
  const {GuidedInvestigation}=await server.ssrLoadModule("/weather-preview/learning/GuidedInvestigation.jsx");
  const guided=renderToStaticMarkup(React.createElement(GuidedInvestigation,{id:"metar",renderControl:()=>null,onAssessment:()=>{}}));
  assert.match(guided,/Zapisz przewidywanie/);
  assert.doesNotMatch(guided,/Ustaw warunki tej próby/);
  assert.doesNotMatch(guided,/BKN tworzy pułap/);
});
