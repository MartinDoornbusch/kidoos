// Guard against missing/incorrect cards when transcribing Floors uploaded Word overhoring.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/floor-german.js',import.meta.url),'utf8');
const German=vm.runInNewContext(source+'\nGerman');
const counts=German.groups.map((_,i)=>German.bank.filter(q=>q.skill===i).length);
assert.equal(JSON.stringify(counts),JSON.stringify([99,99,9,9,22,22]));
assert.equal(German.bank.length,260);
assert.equal(new Set(German.bank.map(q=>q.id)).size,260);
for(const q of German.bank){
 assert.ok(q.sentence&&q.correct&&q.task);
 assert.equal(German.accepts(q,q.correct),true,'correct answer accepted for '+q.sentence);
 const log={turn:0,items:{}};German.record(log,q,false);
 assert.equal(log.items[q.id].due,3);
 German.record(log,q,true);
 assert.equal(log.items[q.id].due,null);
}
const item=(p)=>{const c=German.bank.find(q=>q.sentence===p);assert.ok(c,'missing prompt: '+p);return c};
assert.equal(item('de sneeuw').correct,'der Schnee');
assert.equal(item('das Meer').correct,'de zee');
assert.equal(item('het meer').correct,'der See');
assert.equal(item('Beste opa').correct,'Lieber Opa,');
assert.equal(item('Wir sind seit einer Woche in Breitenwang.').correct,'We zijn sinds een week in Breitenwang.');
assert.equal(item('jij wordt').correct,'du wirst');
assert.equal(item('Sie hatten').correct,'u had');
assert.ok(German.accepts(item('de plaats (+ meervoud)'),'der Ort, die Orte'));
assert.ok(German.accepts(item('der Ort – die Orte'),'de plaats, de plaatsen'));
assert.ok(German.accepts(item('hij / zij / het wordt'),'sie wird'));
assert.equal(German.accepts(item('u had'),'sie hatten'),false,'respect Sie/sie distinction');
assert.equal(German.sourceCounts.words+German.sourceCounts.sentences+German.sourceCounts.grammar,260);
console.log('Floor German overhoring: 260 questions, six groups, bidirectional answers OK.');
