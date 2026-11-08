import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const marker=JSON.parse(await readFile('public/alquimago/release.json','utf8'));
const source=await readFile('public/alquimago/alquimago.js');
const text=source.toString('utf8');
const expected='blob '+source.byteLength+'\0';
const sha=createHash('sha1').update(expected).update(source).digest('hex');

// Fail a Pages deployment when somebody edits the source but forgets to
// update and verify the standalone widget installed in this repository.
assert.match(marker.version,/^\d+\.\d+\.\d+$/);
assert.match(marker.bundleBlobSha,/^[a-f0-9]{40}$/);
if(marker.upstreamCommit)assert.match(marker.upstreamCommit,/^[a-f0-9]{40}$/);
assert.equal(sha,marker.bundleBlobSha,'O arquivo do Alquimago não corresponde à versão liberada.');
assert.ok(text.includes('ALQUIMAGO v'+marker.version),'Marcador de release não confere.');
assert.ok(text.includes("version: '"+marker.version+"'"),'Versão interna do widget não confere.');
assert.ok(!/^import\s.*from\s/m.test(text),'O bundle contém imports ESM não processados.');
for(const feature of [
 'function answerFollowUp(', 'function calculateBasic(', 'function recognizeStudioCommand(',
 'function seedNeuralModel(', 'this.pendingQuestion=pendingFromReply(response)',
 'function tickCortex(', 'function answerFromKnowledge(', 'function normalizeKnowledge(',
 'function askLanguageModel(', 'const ALQUIMAGO_PRETRAINED=', 'this.lastProjectId=response.projectId',
 'class AlquimagoFamiliar extends HTMLElement',
 // The published site must not silently fall back to the old single-choice UI.
 'function respondToContextFollowup(', 'function recognizeTeachingLabels(',
 'function approveTeachingExample(', "if(action==='clear-chat')",
 // Cognitive 2.0 release gates: bounded learning, honest plasticity and
 // grounded short follow-ups must ship in the compiled website artifact.
 'const NEURAL_PROTOTYPES_LIMIT=64', 'const LESSONS_LIMIT=128',
 'const TEACHING_EXAMPLES_LIMIT = 160',
 'function recallLessonFollowup(', 'plasticSynapses', 'eligibility.fill(0)'
]){
 assert.ok(text.includes(feature),'Funcionalidade ausente no bundle: '+feature);
}
new Function(text); // syntax validation only; no DOM required
console.log('Alquimago '+marker.version+' liberado e íntegro: '+sha.slice(0,12));
