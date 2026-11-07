import test from 'node:test';
import assert from 'node:assert/strict';
import {__test} from '../src/index.js';
const env={GH_OWNER:'jordanferrary',GH_REPO:'portfolio_jordan',SESSION_SAMESITE:'Lax'};

test('only the selected repo and publishing endpoints may be proxied',()=>{
 const check=(method,path)=>__test.allowedRepoPath(method,path,env);
 assert.equal(check('GET','/user'),'/user');
 assert.ok(check('GET','/repos/jordanferrary/portfolio_jordan/git/ref/heads/main'));
 assert.ok(check('GET','/repos/jordanferrary/portfolio_jordan/git/trees/main?recursive=1'));
 assert.ok(check('GET','/repos/jordanferrary/portfolio_jordan/git/trees/'+'a'.repeat(40)+'?recursive=1'));
 assert.equal(check('GET','/repos/jordanferrary/portfolio_jordan/contents/src/app.tsx'),null);
 assert.equal(check('POST','/repos/jordanferrary/another_repo/git/trees'),null);
 assert.equal(check('PATCH','/repos/jordanferrary/portfolio_jordan/git/refs/heads/other'),null);
 assert.equal(check('GET','https://api.github.com/user'),null);
});
test('tree write accepts only published portfolio and safe media files',()=>{
 const path='/repos/jordanferrary/portfolio_jordan/git/trees';
 const entry={path:'src/data/published-portfolio.json',mode:'100644',type:'blob',content:'{}'};
 const payload={base_tree:'a'.repeat(40),tree:[entry]};
 assert.equal(__test.validateWrite(path,'POST',payload,env),true);
 assert.equal(__test.validateWrite(path,'POST',{...payload,tree:[{...entry,path:'src/app.tsx'}]},env),false);
 assert.equal(__test.validateWrite(path,'POST',{...payload,tree:[{...entry,path:'public/images/../../src/app.tsx'}]},env),false);
 assert.equal(__test.validateWrite(path,'POST',{...payload,tree:[{...entry,path:'public/alquimago/config.json'}]},env),true);
 assert.equal(__test.validateWrite(path,'POST',{...payload,tree:[{...entry,path:'public/alquimago/token.json'}]},env),false);
});
test('cannot force push and cannot send arbitrary GitHub commit message',()=>{
 assert.equal(__test.validateWrite('/repos/jordanferrary/portfolio_jordan/git/refs/heads/main','PATCH',{sha:'a'.repeat(40),force:false},env),true);
 assert.equal(__test.validateWrite('/repos/jordanferrary/portfolio_jordan/git/refs/heads/main','PATCH',{sha:'a'.repeat(40),force:true},env),false);
 assert.equal(__test.validateWrite('/repos/jordanferrary/portfolio_jordan/git/commits','POST',{message:'evil',tree:'a'.repeat(40),parents:['b'.repeat(40)]},env),false);
});
test('session cookies use Secure and HttpOnly, and flow is Lax',()=>{
 const cookie=__test.cookie('__Host-alq_session','abc',600,env);
 assert.match(cookie,/HttpOnly/);
 assert.match(cookie,/Secure/);
 assert.match(cookie,/SameSite=Lax/);
 assert.match(__test.flowCookie('state',600),/SameSite=Lax/);
});
