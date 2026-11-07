/**
 * Integration smoke checks using the project's existing esbuild dependency.
 * These exercise real components via React SSR and pure data helpers; they do not
 * claim to replace interactive browser, accessibility or visual-regression tests.
 */
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {pathToFileURL,fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

const root=resolve(fileURLToPath(new URL('..',import.meta.url)))
const cache=await mkdtemp(join(root,'node_modules','studio-smoke-'))
const entry=[
 "export {normalizeFraming,framingStyle} from './src/lib/image-framing.ts'",
 "export {normalizeHexColor,normalizeThemePalette,applyThemePalette,contrastRatio,DEFAULT_THEME} from './src/lib/theme-palette.ts'",
 "export {defaultContact,normalizeContactTags,defaultHome} from './src/data/studio.ts'",
 "export {normalizeCustomPages} from './src/data/custom-pages.ts'",
 "export {parseVideoEmbed} from './src/lib/video-embed.ts'",
 "export {classifyAudioSource,audioSourceError} from './src/lib/audio-source.ts'",
 "export {MusicPlayer} from './src/components/layout/music-player.tsx'",
 "export {parseModelUrl} from './src/lib/model-embed.ts'",
 "export {HomePage} from './src/components/sections/home-page.tsx'",
 "export {ProjectFramingEditor} from './src/components/sections/project-framing-editor.tsx'",
 "export {MusicLibraryEditor} from './src/components/sections/music-library-editor.tsx'",
 "export {ContactPage} from './src/components/sections/contact-page.tsx'",
 "export {ContactEditor} from './src/components/sections/contact-editor.tsx'",
 "export {ThemePaletteEditor} from './src/components/sections/theme-palette-editor.tsx'",
 "export {ProjectLike} from './src/components/sections/project-like.tsx'",
 "export {StoryBlock,ProjectPage} from './src/components/sections/project-page.tsx'"
].join('\n')
let checks=0
const check=(name,fn)=>{fn();checks++;process.stdout.write('  ✓ '+name+'\n')}
try{
 const output=await build({
  stdin:{contents:entry,resolveDir:root,sourcefile:'studio-smoke-entry.ts',loader:'ts'},
  bundle:true,platform:'node',format:'esm',target:'node22',jsx:'automatic',packages:'external',
  loader:{'.css':'empty'},write:false,logLevel:'silent',
  define:{'import.meta.env.BASE_URL':JSON.stringify('/portfolio_jordan/'),'import.meta.env.VITE_LIKES_API_URL':'undefined'}
 })
 const bundle=join(cache,'entry.mjs')
 await writeFile(bundle,output.outputFiles.find(file=>file.path.endsWith('.js'))?.contents??output.outputFiles[0].contents)
 const app=await import(pathToFileURL(bundle).href)
 const element=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props))
 check('Image framing clamps input, preserves zoom and object position',()=>{
  assert.deepEqual(app.normalizeFraming({x:120,y:-7,zoom:7}),{x:100,y:0,zoom:2.5})
  assert.equal(app.framingStyle({x:23,y:61,zoom:1.7}).objectPosition,'23% 61%')
  assert.equal(app.framingStyle({x:23,y:61,zoom:1.7})['--jf-frame-zoom'],1.7)
 })
 check('Theme normalization and WCAG contrast are correct',()=>{
  assert.equal(app.normalizeHexColor('#abc'),'#AABBCC')
  assert.equal(app.normalizeHexColor('javascript:bad'),null)
  assert.equal(app.contrastRatio('#000000','#FFFFFF'),21)
  assert.ok(app.contrastRatio('#F8F3FF','#090611')>4.5)
  assert.equal(app.normalizeThemePalette({primary:'#ff0000'}).primary,'#FF0000')
 })
 check('Theme application updates all four editable CSS variables',()=>{
  const seen={}
  globalThis.document={documentElement:{style:{setProperty:(name,value)=>{seen[name]=value}}}}
  app.applyThemePalette({primary:'#AABBCC',secondary:'#BBCCDD',background:'#101010',surface:'#202020'})
  for(const key of ['primary','secondary','background','surface'])assert.ok(seen['--jf-'+key])
  delete globalThis.document
 })
 check('Contact specialties support add, remove, duplicate removal and hidden ribbon',()=>{
  assert.deepEqual(app.normalizeContactTags(['  MOTION DESIGN  ','3D ART','motion design','']),['MOTION DESIGN','3D ART'])
  assert.deepEqual(app.normalizeContactTags([]),[])
  assert.deepEqual(app.normalizeContactTags(undefined),app.defaultContact.footerTags)
 })
 check('Contact public page uses only configured footer labels',()=>{
  const html=element(app.ContactPage,{socials:[],settings:{...app.defaultContact,footerTags:['MOTION DESIGN','CHARACTER ART']},demoEnabled:false,onEdit:()=>{}})
  assert.match(html,/MOTION DESIGN/);assert.match(html,/CHARACTER ART/)
  assert.doesNotMatch(html,/>ENVIRONMENTS</)
  const hidden=element(app.ContactPage,{socials:[],settings:{...app.defaultContact,footerTags:[]},demoEnabled:false,onEdit:()=>{}})
  assert.doesNotMatch(hidden,/contact-social-bottomline/)
 })
 check('Contact editor exposes specialties and save controls',()=>{
  const html=element(app.ContactEditor,{settings:app.defaultContact,links:[],onSave:()=>{},onClose:()=>{}})
  assert.match(html,/Especialidades do rodapé/)
  assert.match(html,/Adicionar especialidade/)
  assert.match(html,/Salvar página/)
 })
 check('Home featured cards apply the same cover framing as the project gallery',()=>{
  const project={id:'smoke',title:'Smoke Test',image:'https://example.com/cover.webp',featured:true,coverFocus:{x:28,y:72,zoom:1.6}}
  const html=element(app.HomePage,{home:app.defaultHome,testimonials:[],projects:[project],editing:false,onOpenProject:()=>{},onEditProject:()=>{},onEditHome:()=>{},onNavigatePortfolio:()=>{}})
  assert.match(html,/object-position:28% 72%/)
  assert.match(html,/--jf-frame-zoom:1.6/)
 })
 check('Framing tool has one cover editor, a read-only Home preview and an independent banner',()=>{
  const html=element(app.ProjectFramingEditor,{image:'https://example.com/art.webp',coverFocus:{x:22,y:71,zoom:1.4},heroFocus:{x:78,y:33,zoom:1.1},onChange:()=>{}})
  assert.match(html,/Prévia na Home/)
  assert.match(html,/Somente visualização/)
  assert.match(html,/Capa dos projetos/)
  assert.match(html,/Banner do projeto/)
  assert.equal((html.match(/type="range"/g)||[]).length,6)
  assert.equal((html.match(/class="framing-canvas /g)||[]).length,2)
  assert.match(html,/object-position:22% 71%/)
  assert.match(html,/object-position:78% 33%/)
 })
 check('Music library displays Internet cover artwork without YouTube metadata',()=>{
  const html=element(app.MusicLibraryEditor,{tracks:[{id:'m1',title:'Own recording',artist:'Jordan',src:'https://example.com/audio.mp3',cover:'https://example.com/covers/my-art.webp'}],onTracks:()=>{},onNotice:()=>{}})
  assert.match(html,/Own recording/)
  assert.match(html,/https:\/\/example\.com\/covers\/my-art\.webp/)
 })
 check('Custom page items preserve explicit CTA visibility and slide preferences',()=>{
  const page={id:'page-12345678',title:'Certificates',navLabel:'Certificates',blocks:[
   {id:'block-gallery',type:'showcase',content:'',showcaseItems:[{id:'item-1',image:'https://example.com/cert.webp',name:'Certificate',description:'Completed',portfolioUrl:'https://example.com',showLink:false,linkLabel:'Verify'}]},
   {id:'block-slides',type:'slideshow',content:'',slideHeight:260,slideAutoplay:true,slideShowPauseButton:false,slideItems:[{id:'s1',image:'https://example.com/a.webp',caption:'A'}]}
  ]}
  const [normalized]=app.normalizeCustomPages([page])
  assert.equal(normalized.blocks[0].showcaseItems[0].showLink,false)
  assert.equal(normalized.blocks[1].slideHeight,260)
  assert.equal(normalized.blocks[1].slideShowPauseButton,false)
 })
 check('Remote media rejects invalid model links and parses supported videos',()=>{
  assert.equal(app.parseModelUrl('https://example.com/scene.glb')?.format,'glb')
  assert.equal(app.parseModelUrl('javascript:alert(1)'),null)
  assert.equal(app.parseModelUrl('https://example.com/model.fbx'),null)
  assert.equal(app.parseVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.provider,'youtube')
 })
 check('Audio source diagnostics reject YouTube video pages but preserve direct audio',()=>{
  assert.equal(app.classifyAudioSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'video-page')
  assert.equal(app.classifyAudioSource('https://music.youtube.com/watch?v=dQw4w9WgXcQ'),'video-page')
  assert.equal(app.classifyAudioSource('https://youtu.be/dQw4w9WgXcQ'),'video-page')
  assert.equal(app.classifyAudioSource('https://example.org/audio.mp3'),'direct')
  assert.equal(app.classifyAudioSource('https://example.org/song.m4a?token=123'),'direct')
  assert.equal(app.classifyAudioSource('https://example.org/track.html'),'web-page')
  assert.equal(app.classifyAudioSource('javascript:alert(1)'),'invalid')
  assert.match(app.audioSourceError('video-page'),/MP3, WAV, OGG ou M4A/)
 })
 check('Legacy YouTube links display a meaningful playback error, not Audio unavailable',()=>{
  const html=element(app.MusicPlayer,{tracks:[{id:'bad-video',title:'Video link',artist:'Test',src:'https://youtube.com/watch?v=dQw4w9WgXcQ'}]})
  assert.match(html,/streaming\/video page/)
  assert.doesNotMatch(html,/<audio[^>]+src="https:\/\/youtube\.com/)
 })
 check('Project composer slideshow and detailed gallery produce interactive UI',()=>{
  const slideshow=element(app.StoryBlock,{projectTitle:'Test',block:{id:'b1',type:'slideshow',content:'',slides:[{id:'s1',image:'https://example.com/a.webp',title:'A',caption:''},{id:'s2',image:'https://example.com/b.webp',title:'B',caption:''}],slideHeight:260}})
  assert.match(slideshow,/page-slideshow/);assert.match(slideshow,/page-slideshow-arrow/)
  const gallery=element(app.StoryBlock,{projectTitle:'Test',block:{id:'b2',type:'gallery',content:'',galleryMode:'artists',galleryEntries:[{id:'g1',image:'https://example.com/a.webp',artist:'',title:'Certificate',description:'Valid work',portfolioUrl:''}]}})
  assert.match(gallery,/artist-showcase-grid/);assert.doesNotMatch(gallery,/artist-showcase-detail-copy/)
 })
 check('Project artwork restores the large heading without the small duplicate caption',()=>{
  const project={id:'smoke-project',title:'Unique Project Title',category:'3D',year:'2026',image:'https://example.com/cover.webp',description:'A portfolio project',tools:[],blocks:[],processSteps:[]}
  const html=element(app.ProjectPage,{project,onBack:()=>{},editing:false,onEdit:()=>{},showLikeCounts:false})
  assert.match(html,/<h1>Unique Project Title<\/h1>/)
  assert.match(html,/<h2>Unique Project Title<\/h2>/)
  assert.doesNotMatch(html,/<figcaption>Unique Project Title<\/figcaption>/)
  assert.match(html,/project-artwork-frame/)
 })
 check('Palette editor exposes real-time contrast checks and editable tokens',()=>{
  const html=element(app.ThemePaletteEditor,{value:app.DEFAULT_THEME,onSave:()=>{},onClose:()=>{}})
  assert.match(html,/Legibilidade real/);assert.match(html,/Cor principal/)
 })
 check('Like remains keyboard-accessible and does not fabricate shared counts',()=>{
  const html=element(app.ProjectLike,{projectId:'smoke-test',showCount:true})
  assert.match(html,/aria-pressed="false"/);assert.match(html,/Like project/)
  assert.match(html,/Count on this browser only/)
 })
 console.log('\n'+checks+' Studio checks passed.')
}catch(error){console.error(error);process.exitCode=1}
finally{await rm(cache,{recursive:true,force:true})}
