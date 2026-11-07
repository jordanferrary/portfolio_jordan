import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const upstreamPackage=process.argv[2],upstreamSha=process.argv[3];
assert.ok(upstreamPackage&&/^[a-f0-9]{40}$/.test(upstreamSha||''),'Missing verified upstream commit');
const pkg=JSON.parse(await readFile(upstreamPackage,'utf8'));
assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
const widget=await readFile('public/alquimago/alquimago.js');
const gitSha=createHash('sha1').update('blob '+widget.byteLength+'\0').update(widget).digest('hex');
const manifest={
 version:pkg.version,
 upstream:'jordanferrary/alquimago',
 upstreamCommit:upstreamSha,
 bundleBlobSha:gitSha,
 builtAt:new Date().toISOString(),
 source:'npm run build from upstream main in GitHub Actions'
};
await writeFile('public/alquimago/release.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Alquimago v'+pkg.version+' from '+upstreamSha.slice(0,8)+'; blob '+gitSha.slice(0,12));
