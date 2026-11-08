import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,copyFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const repoRoot=process.cwd();
const upstreamUrl='https://github.com/jordanferrary/alquimago.git';
const temp=await mkdtemp(path.join(tmpdir(),'alquimago-sync-'));
const upstream=path.join(temp,'alquimago');

function run(command,args,cwd=repoRoot,capture=false){
 const result=spawnSync(command,args,{cwd,encoding:'utf8',stdio:capture?['ignore','pipe','inherit']:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(command+' exited with status '+result.status);
 return capture?result.stdout.trim():'';
}

try{
 // No fallback to the old checked-in widget: failed upstream tests must block a release.
 run('git',['clone','--depth','1','--single-branch','--branch','main',upstreamUrl,upstream]);
 const upstreamSha=run('git',['rev-parse','HEAD'],upstream,true);
 console.log('Testing Alquimago '+upstreamSha.slice(0,12));
 run(process.execPath,['--test'],upstream);
 run(process.execPath,['scripts/build.mjs'],upstream);
 const bundle=path.join(upstream,'dist','alquimago.js');
 await access(bundle);
 await mkdir(path.join(repoRoot,'public','alquimago'),{recursive:true});
 await copyFile(bundle,path.join(repoRoot,'public','alquimago','alquimago.js'));
 run(process.execPath,['scripts/stamp-alquimago-release.mjs',path.join(upstream,'package.json'),upstreamSha]);
 run(process.execPath,['scripts/check-alquimago-release.mjs']);
 console.log('Alquimago synchronized and validated for this site build.');
}finally{
 await rm(temp,{recursive:true,force:true});
}
