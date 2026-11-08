/**
 * Static GitHub Pages size guard. Runs after vite build.
 * No paid service, metrics beacon, browser telemetry or user data.
 * Checks the current deploy artifact, not the full .git history.
 */
import {readdir,readFile,stat} from 'node:fs/promises'
import path from 'node:path'

const MIB=1024**2
const ROOT=path.resolve(process.cwd(),'dist')
const CHECK=process.argv.includes('--check')
const LIMITS={
 warningTotal:200*MIB,
 failureTotal:850*MIB,
 warningMedia:8*MIB,
 failureMedia:65*MIB,
 warningImage:2*MIB,
 failureImage:12*MIB,
 warningInitial:750*1024,
 failureInitial:1500*1024
}
const category=file=>{
 if(/\.(?:mp3|m4a|ogg|wav|flac)$/i.test(file))return 'audio'
 if(/\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(file))return 'images'
 if(/\.(?:mp4|webm|mov)$/i.test(file))return 'video'
 if(/\.(?:glb|gltf|fbx)$/i.test(file))return 'models'
 if(/\.js$/i.test(file))return 'js'
 if(/\.css$/i.test(file))return 'css'
 return 'other'
}
const pretty=bytes=>bytes>=MIB?(bytes/MIB).toFixed(2)+' MiB':(bytes/1024).toFixed(1)+' KiB'
async function walk(folder,relative=''){
 const out=[]
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const name=relative?relative+'/'+entry.name:entry.name
  const full=path.join(folder,entry.name)
  if(entry.isDirectory())out.push(...await walk(full,name))
  else if(entry.isFile())out.push({path:name,bytes:(await stat(full)).size,kind:category(name)})
 }
 return out
}
function initialAssets(html,assets){
 const filenames=new Set()
 // A Vite production index only references entry bundles and global CSS.
 for(const tag of html.match(/<(?:script|link)\b[^>]*>/gi)||[]){
  if(!/src=|href=/.test(tag))continue
  if(!/type=["']module["']|rel=["']stylesheet["']/.test(tag))continue
  const url=tag.match(/(?:src|href)=["']([^"']+)["']/i)?.[1]||''
  const marker=url.indexOf('/assets/')
  if(marker>=0)filenames.add('assets/'+url.slice(marker+8).split('?')[0])
  else if(url.startsWith('assets/'))filenames.add(url.split('?')[0])
 }
 return assets.filter(x=>filenames.has(x.path))
}
let assets
try{assets=await walk(ROOT)}
catch(error){console.error('Build dist ausente. Execute npm run build antes do relatório.',error);process.exitCode=1;assets=[]}
if(assets.length){
 const total=assets.reduce((sum,x)=>sum+x.bytes,0)
 const byKind=Object.groupBy?Object.groupBy(assets,x=>x.kind):
  assets.reduce((acc,item)=>{(acc[item.kind]??=[]).push(item);return acc},{})
 const warnings=[],errors=[]
 const warn=message=>warnings.push(message)
 const fail=message=>errors.push(message)
 if(total>LIMITS.warningTotal)warn('O deploy passou de 200 MiB. Revise mídias antes de adicionar novos projetos.')
 if(total>LIMITS.failureTotal)fail('Deploy acima de 850 MiB: muito próximo do limite de 1 GB do GitHub Pages.')
 for(const item of assets){
  if(['audio','video','models'].includes(item.kind)){
   if(item.bytes>LIMITS.warningMedia)warn(item.path+' tem '+pretty(item.bytes)+'. Prefira mídia comprimida ou hospedagem apropriada.')
   if(item.bytes>LIMITS.failureMedia)fail(item.path+' excede 65 MiB. Não publique arquivos gigantes no site.')
  }
  if(item.kind==='images'){
   if(item.bytes>LIMITS.warningImage)warn(item.path+' tem '+pretty(item.bytes)+'. Gere WebP/AVIF responsivo.')
   if(item.bytes>LIMITS.failureImage)fail(item.path+' excede 12 MiB. Converta a imagem antes de publicar.')
  }
 }
 let entry=[]
 try{entry=initialAssets(await readFile(path.join(ROOT,'index.html'),'utf8'),assets)}
 catch{warn('Não foi possível medir a carga inicial pelo index.html.')}
 const initialBytes=entry.reduce((sum,x)=>sum+x.bytes,0)
 if(initialBytes>LIMITS.warningInitial)warn('JavaScript e CSS iniciais acima de 750 KiB não comprimidos.')
 if(initialBytes>LIMITS.failureInitial)fail('Entrada JavaScript/CSS acima de 1,5 MiB não comprimidos.')
 console.log('\n📊 Auditoria de desempenho — GitHub Pages')
 console.log('Deploy atual: '+pretty(total)+' / 1 GiB (limite do Pages)')
 console.log('Arquivos: '+assets.length)
 for(const [key,items] of Object.entries(byKind).sort((a,b)=>b[1].reduce((s,x)=>s+x.bytes,0)-a[1].reduce((s,x)=>s+x.bytes,0)))
  console.log('  '+key.padEnd(8)+' '+pretty(items.reduce((s,x)=>s+x.bytes,0))+' ('+items.length+' arquivo(s))')
 console.log('Entrada Vite (JS + CSS sem gzip): '+pretty(initialBytes)+(entry.length?' em '+entry.length+' arquivo(s)':''))
 console.log('Maiores arquivos:')
 for(const item of assets.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,7))
  console.log('  '+pretty(item.bytes).padStart(12)+'  '+item.path)
 for(const w of warnings)console.warn('⚠️ '+w)
 for(const e of errors)console.error('❌ '+e)
 console.log('Resultado: '+errors.length+' erro(s), '+warnings.length+' aviso(s).')
 if(CHECK&&errors.length)process.exitCode=1
}
