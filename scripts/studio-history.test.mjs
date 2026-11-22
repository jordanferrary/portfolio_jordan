import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import {readFile} from 'node:fs/promises'
const source=await readFile(new URL('../src/lib/studio-history.ts',import.meta.url),'utf8')
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {limitHistory,makeHistoryRecord,recoverHistory}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(output))
const entry=i=>({time:i,label:'projects',store:{projects:[],customPages:[],title:String(i)}})
test('history retains the nearest entries and checks the exact draft and deployment',()=>{
 const past=Array.from({length:40},(_,i)=>entry(i))
 const record=makeHistoryRecord('rev','draft',{past,future:[]})
 assert.equal(record.history.past.length,30)
 assert.equal(record.history.past[0].time,10)
 assert.equal(record.history.past.at(-1).time,39)
 assert.equal(recoverHistory(record,'rev','other'),null)
 assert.equal(recoverHistory(record,'other','draft'),null)
 assert.deepEqual(recoverHistory(record,'rev','draft'),record.history)
})
test('storage budget bounds snapshots and discards malformed entries',()=>{
 assert.deepEqual(limitHistory({past:[entry(1)],future:[entry(2)]},0),{past:[],future:[]})
 assert.equal(limitHistory({past:[null,entry(1)],future:[]}).past.length,1)
 assert.equal(recoverHistory({revision:'rev',snapshot:'draft',history:{}},'rev','draft'),null)
})
