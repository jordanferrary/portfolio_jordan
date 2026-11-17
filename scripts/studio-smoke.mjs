/**
 * Integration smoke checks using the project's existing esbuild dependency.
 * These exercise real components via React SSR and pure data helpers; they do not
 * claim to replace interactive browser, accessibility or visual-regression tests.
 */
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {pathToFileURL,fileURLToPath} from 'node:url'
import {createAffect,affectSignal,setAffectMusic,affectTick} from '../src/lib/alquimago-affect.mjs'
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
 "export {masonryColumnCount,distributeMasonry} from './src/lib/masonry.ts'",
 "export {HomePage} from './src/components/sections/home-page.tsx'",
 "export {FEATURED_LIMIT,getFeaturedProjects,applyFeaturedSelection} from './src/lib/featured-projects.ts'",
 "export {FeaturedProjectsEditor} from './src/components/sections/featured-projects-editor.tsx'",
 "export {ProjectFramingEditor} from './src/components/sections/project-framing-editor.tsx'",
 "export {HomeEditor} from './src/components/sections/home-editor.tsx'",
 "export {GalleryBackgroundEditor} from './src/components/sections/gallery-background-editor.tsx'",
 "export {Gallery} from './src/components/sections/gallery.tsx'",
 "export {ProjectDivider} from './src/components/ui/project-divider.tsx'",
 "export {isPointOnDisplayedArtwork} from './src/lib/lightbox-hit-test.ts'",
 "export {MusicLibraryEditor} from './src/components/sections/music-library-editor.tsx'",
 "export {ContactPage} from './src/components/sections/contact-page.tsx'",
 "export {ContactEditor} from './src/components/sections/contact-editor.tsx'",
 "export {ThemePaletteEditor} from './src/components/sections/theme-palette-editor.tsx'",
 "export {StudioDock} from './src/components/sections/studio-dock.tsx'",
 "export {normalizeAnimationProfile,DEFAULT_ANIMATION_PROFILE} from './src/lib/alquimago-animation-profile.ts'",
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
  define:{'import.meta.env.BASE_URL':JSON.stringify('/portfolio_jordan/'),'import.meta.env.VITE_LIKES_API_URL':'undefined','import.meta.env.VITE_BUILD_SHA':JSON.stringify('smoke')}
 })
 const bundle=join(cache,'entry.mjs')
 await writeFile(bundle,output.outputFiles.find(file=>file.path.endsWith('.js'))?.contents??output.outputFiles[0].contents)
 const app=await import(pathToFileURL(bundle).href)
 const awaitCss=await readFile(join(root,'src/styles/theme-coverage.css'),'utf8')
 const ambientCss=await readFile(join(root,'src/styles/creative-direction.css'),'utf8')
 const editorSource=await readFile(join(root,'src/components/sections/admin-editor.tsx'),'utf8')
 const awaitMain=await readFile(join(root,'src/main.tsx'),'utf8')
 const appSource=await readFile(join(root,'src/app.tsx'),'utf8')
 const musicSource=await readFile(join(root,'src/components/layout/music-player.tsx'),'utf8')
 const musicCss=await readFile(join(root,'src/styles/engagement.css'),'utf8')
 const studioCss=await readFile(join(root,'src/styles/studio-centered.css'),'utf8')
 const contactCss=await readFile(join(root,'src/styles/contact-social.css'),'utf8')
 const element=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props))
 check('Home and Gallery contextual editors mount and the duplicate background button is absent',()=>{
  const noop=()=>{}
  const home=element(app.HomeEditor,{
   home:app.defaultHome,testimonials:[],tracks:[],links:[],projects:[],onFeaturedProjects:noop,
   onLinks:noop,onHome:noop,onTestimonials:noop,onTracks:noop,onClose:noop,
   onExport:async()=>{},showLikeCounts:false,onShowLikeCounts:noop
  })
  assert.match(home,/Personalizar Home/)
  const galleryEditor=element(app.GalleryBackgroundEditor,{value:'https://example.com/background.webp',onSave:noop,onClose:noop})
  assert.match(galleryEditor,/Fundo da galeria/)
  const gallery=element(app.Gallery,{
   projects:[],categories:[],onOpen:noop,editing:true,onAdd:noop,onEdit:noop,
   heroImage:'https://example.com/background.webp',onReorder:noop
  })
  assert.doesNotMatch(gallery,/gallery-background-edit|Editar fundo/)
  assert.match(appSource,/onEditCurrent=\{editCurrent\}/)
  assert.match(appSource,/AppErrorBoundary compact editorOverlay/)
  assert.match(appSource,/import\('\.\/components\/sections\/home-editor'\)\.catch/)
  assert.match(appSource,/import\('\.\/components\/sections\/gallery-background-editor'\)\.catch/)
 })
 check('Featured Home manager selects, replaces and orders exactly 3 independent of gallery',()=>{
  const base=Array.from({length:5},(_,i)=>({id:'p'+i,title:'Art '+i,image:'https://example.com/'+i+'.webp',category:'3D',year:'2026',description:'',tools:[],featured:i<2,blocks:[]}))
  assert.equal(app.FEATURED_LIMIT,3)
  assert.deepEqual(app.getFeaturedProjects(base).map(p=>p.id),['p0','p1'])
  const chosen=app.applyFeaturedSelection(base,['p3','p1','p4','p0','p3'])
  assert.deepEqual(chosen.map(p=>p.id),base.map(p=>p.id))
  assert.deepEqual(app.getFeaturedProjects(chosen).map(p=>p.id),['p3','p1','p4'])
  assert.deepEqual(base.filter(p=>p.featured).map(p=>p.id),['p0','p1'])
  const replaced=app.applyFeaturedSelection(chosen,['p4','p0'])
  assert.deepEqual(app.getFeaturedProjects(replaced).map(p=>p.id),['p4','p0'])
  const manager=element(app.FeaturedProjectsEditor,{projects:chosen,onChange:()=>{}})
  assert.match(manager,/Projetos em destaque/)
  assert.match(manager,/3 \/ 3/)
  assert.match(manager,/Substituir Art 3/)
  assert.match(manager,/Remover Art 4 dos destaques/)
  const html=element(app.HomePage,{home:app.defaultHome,testimonials:[],projects:chosen,editing:true,onOpenProject:()=>{},onEditProject:()=>{},onEditHome:()=>{},onManageFeatured:()=>{},onNavigatePortfolio:()=>{}})
  assert.match(html,/aria-label="Gerenciar projetos em destaque"[^>]*><svg/)
  assert.doesNotMatch(html,/Gerenciar projetos em destaque[^<]*<\/button>/)
  assert.match(studioCss,/\.site-shell \.home-panel-heading \.home-featured-manage\s*\{/)
  assert.match(studioCss,/border-radius:50%/)
  assert.match(studioCss,/place-items:center/)
  assert.match(studioCss,/width:32px/)
  assert.match(studioCss,/\.home-featured-manage:focus-visible/)
  assert.ok(html.indexOf('Art 3')<html.indexOf('Art 1'))
  assert.ok(html.indexOf('Art 1')<html.indexOf('Art 4'))
  assert.doesNotMatch(html,/data-alquimago-project="Art 0"/)
 })
 check('Portfolio ambient glow stays in the viewport while scrolling',()=>{
  assert.match(ambientCss,/\.site-shell\s*\{[\s\S]*?background-attachment:fixed!important;/)
  assert.match(ambientCss,/radial-gradient\(ellipse 720px 560px at 8% 5%,color-mix\(in srgb,var\(--jf-primary\)/)
 })
 check('Divider preview uses the public renderer and updates for every icon and style',()=>{
  assert.match(editorSource,/<ProjectDivider icon=\{b\.dividerIcon\} variant=\{b\.dividerStyle\} preview\/>/)
  const star=element(app.ProjectDivider,{icon:'star',variant:'solid',preview:true})
  assert.match(star,/art-divider-solid/)
  assert.match(star,/lucide-star/)
  assert.match(star,/Prévia da linha divisória/)
  const diamond=element(app.ProjectDivider,{icon:'diamond',variant:'dashed',preview:true})
  assert.match(diamond,/art-divider-dashed/)
  assert.match(diamond,/lucide-diamond/)
  const circle=element(app.ProjectDivider,{icon:'circle',variant:'glow',preview:true})
  assert.match(circle,/lucide-circle/)
  const plain=element(app.ProjectDivider,{icon:'none',variant:'solid',preview:true})
  assert.doesNotMatch(plain,/art-divider-symbol/)
  const projectDivider=element(app.StoryBlock,{projectTitle:'Test',block:{id:'divider',type:'divider',dividerIcon:'diamond',dividerStyle:'dashed'}})
  assert.match(projectDivider,/art-divider-dashed/)
  assert.match(projectDivider,/lucide-diamond/)
  assert.doesNotMatch(projectDivider,/art-divider-preview/)
  assert.match(ambientCss,/\.site-shell \.art-divider-solid \.art-divider-line/)
  assert.match(ambientCss,/\.site-shell \.art-divider-dashed \.art-divider-line/)
 })
 check('Lightbox closes only for a stationary click outside the visible artwork',()=>{
  const hit=app.isPointOnDisplayedArtwork
  const stage={left:0,top:0,width:1200,height:700}
  // Panoramic artwork occupies y=150..550; black bars are outside.
  assert.equal(hit({x:600,y:90},stage,2400,800),false)
  assert.equal(hit({x:600,y:350},stage,2400,800),true)
  assert.equal(hit({x:600,y:620},stage,2400,800),false)
  // Tall artwork leaves blank bars left and right.
  assert.equal(hit({x:80,y:350},stage,800,2400),false)
  assert.equal(hit({x:600,y:350},stage,800,2400),true)
  // The hit-test follows the transformed bounds while zooming/panning.
  assert.equal(hit({x:600,y:90},{left:-600,top:-350,width:2400,height:1400},2400,800),true)
  assert.equal(hit({x:600,y:-100},{left:-600,top:-350,width:2400,height:1400},2400,800),false)
  // Before an image loads, never interpret an empty preview as a backdrop click.
  assert.equal(hit({x:600,y:90},stage,0,0),true)
 })
 check('Image framing controls both crop and zoom origin on either axis',()=>{
  assert.deepEqual(app.normalizeFraming({x:120,y:-7,zoom:7}),{x:100,y:0,zoom:2.5})
  const focus=app.framingStyle({x:23,y:61,zoom:1.7})
  assert.equal(focus.objectPosition,'23% 61%')
  assert.equal(focus.transformOrigin,'23% 61%')
  assert.equal(focus['--jf-frame-zoom'],1.7)
  assert.equal(app.framingStyle({x:50,y:0,zoom:1.93}).transformOrigin,'50% 0%')
  assert.equal(app.framingStyle({x:50,y:100,zoom:1.93}).transformOrigin,'50% 100%')
  const coverFocus={x:20,y:10,zoom:1.4}
  const homeFocus={x:73,y:42,zoom:1.8}
  const heroFocus={x:50,y:13,zoom:1.93}
  const preview=element(app.ProjectFramingEditor,{
   image:'https://example.com/art.webp',coverFocus,homeFocus,heroFocus,onChange:()=>{}
  })
  assert.match(preview,/Capa da galeria/)
  assert.match(preview,/Destaque da Home/)
  assert.match(preview,/Banner do projeto/)
  assert.match(preview,/transform-origin:20% 10%/)
  assert.match(preview,/transform-origin:73% 42%/)
  assert.match(preview,/transform-origin:50% 13%/)
  assert.doesNotMatch(preview,/Somente visualização/)
  const project={id:'framed',title:'Focus',category:'3D',year:'2026',image:'https://example.com/art.webp',description:'',tools:[],featured:true,blocks:[],coverFocus,homeFocus,heroFocus}
  const page=element(app.ProjectPage,{project,onBack:()=>{},editing:false,onEdit:()=>{},showLikeCounts:false})
  assert.match(page,/transform-origin:50% 13%/)
  const props={home:app.defaultHome,testimonials:[],projects:[project],editing:false,onOpenProject:()=>{},onEditProject:()=>{},onEditHome:()=>{},onNavigatePortfolio:()=>{}}
  const homePage=element(app.HomePage,props)
  assert.match(homePage,/transform-origin:73% 42%/)
  assert.doesNotMatch(homePage,/transform-origin:20% 10%/)
  const legacyPage=element(app.HomePage,{...props,projects:[{...project,homeFocus:undefined}]})
  assert.match(legacyPage,/transform-origin:20% 10%/)
 })
 check('Local Studio dock renders with safe creator actions',()=>{
  const html=element(app.StudioDock,{
   pageLabel:'Home',editLabel:'Editar página',
   onEditCurrent:()=>{},onNewProject:()=>{},onPublish:()=>{},
   onExport:async()=>{},onRestorePublished:()=>{},onLock:()=>{},
   publishedRevision:'smoke-revision',actions:[]
  })
  assert.match(html,/Local Studio/)
  assert.match(html,/Ferramentas/)
  assert.match(html,/Publicar/)
  assert.match(html,/Novo projeto/)
 })
 const familiarCode=await readFile(join(root,'public','alquimago','alquimago.js'),'utf8')
 check('Orb 2D has 26 vector expressions and an emotion adapter',()=>{
  assert.match(familiarCode,/class="alquimago-orb"/)
  assert.match(familiarCode,/previewExpression:\(name,duration=2100\)=>/)
  const shapes=[
   'idle','breath','blink','happy','excited','laugh','curious','focused',
   'thinking','surprised','confused','sad','worried','angry','tired','yawn',
   'sleep','pet','love','shy','proud','talk',
   'lookleft','lookright','lookup','lookdown'
  ]
  for(const shape of shapes){
   assert.match(familiarCode,new RegExp(' '+shape+':orbFace\\('))
   assert.ok(familiarCode.includes('.orb-expression-'+shape))
  }
  assert.match(familiarCode,/data-expression/)
  assert.match(familiarCode,/prefers-reduced-motion/)
 })
 check('Local affect engine responds to real music without hardcoded emotion mapping',()=>{
  const start=10000
  const neutral=createAffect(99,start)
  const music=affectTick(setAffectMusic(neutral,true,start+6000),start+6000)
  assert.equal(music.expression,'serene')
  assert.ok(music.calm>neutral.calm)
  assert.ok(music.tension<neutral.tension)
  const musicAndPet=affectTick(affectSignal(music,'pet',start+8000),start+8000)
  assert.equal(musicAndPet.expression,'pet')
  const neutralSelection=affectTick(affectSignal(neutral,'angry',start+6000),start+6000)
  const musicSelection=affectTick(affectSignal(music,'angry',start+8000),start+8000)
  assert.equal(neutralSelection.expression,'angry')
  assert.notEqual(musicSelection.expression,'angry')
  const stopped=affectTick(setAffectMusic(music,false,start+10000),start+14000)
  assert.equal(stopped.music,false)
  assert.notEqual(stopped.expression,'serene')
 })
 check('Shape Key playback profiles support loop and one-shot independently',()=>{
  const base=app.normalizeAnimationProfile({})
  assert.equal(base.shapes.Breath.loop,true)
  assert.equal(base.shapes.Pet.loop,false)
  assert.equal(base.shapes.Surprised.loop,false)
  const changed=app.normalizeAnimationProfile({shapes:{
   Breath:{loop:false,durationMs:4200,intensity:.6},
   Pet:{loop:true,durationMs:850,intensity:.7}
  }})
  assert.equal(changed.shapes.Breath.loop,false)
  assert.equal(changed.shapes.Pet.loop,true)
  assert.equal(changed.shapes.Pet.durationMs,850)
  assert.equal(changed.shapes.Surprised.loop,false)
 })
 check('Theme normalization and WCAG contrast are correct',()=>{
  assert.equal(app.normalizeHexColor('#abc'),'#AABBCC')
  assert.equal(app.normalizeHexColor('javascript:bad'),null)
  assert.equal(app.contrastRatio('#000000','#FFFFFF'),21)
  assert.ok(app.contrastRatio('#F8F3FF','#090611')>4.5)
  assert.equal(app.normalizeThemePalette({primary:'#ff0000'}).primary,'#FF0000')
  assert.equal(app.normalizeThemePalette({primary:'#ff0000'}).text,app.DEFAULT_THEME.text)
  assert.equal(app.normalizeThemePalette({primary:'#ff0000',text:'#dddddd',border:'#abcdef'}).border,'#ABCDEF')
 })
 check('Theme application updates all seven editable CSS variables',()=>{
  const seen={}
  globalThis.document={documentElement:{style:{setProperty:(name,value)=>{seen[name]=value}}}}
  app.applyThemePalette({...app.DEFAULT_THEME,primary:'#AABBCC',secondary:'#BBCCDD',background:'#101010',surface:'#202020'})
  for(const key of ['primary','secondary','background','surface','text','muted','border'])assert.ok(seen['--jf-'+key])
  delete globalThis.document
 })
 check('Public styles consume all seven palette variables across major routes',()=>{
  const css=awaitCss
  const main=awaitMain
  assert.match(main,/styles\/theme-coverage\.css/)
  for(const token of ['primary','secondary','background','surface','text','muted','border'])
   assert.match(css,new RegExp('--jf-'+token+'\\b'))
  for(const selector of ['.home-intro h1','.gallery-heading h1','.project-hero:after','.about-information','.contact-social-directory','.custom-page-hero','.music-widget .music-card'])
   assert.ok(css.includes(selector),'Missing palette coverage for '+selector)
  assert.doesNotMatch(css,/\.editor-overlay[\s.{:]|\.theme-palette-editor[\s.{:]/)
 })
 check('Project Focus stays free of palette strips and Contact uses its own route layout',()=>{
  const html=element(app.HomePage,{home:app.defaultHome,testimonials:[],projects:[],editing:false,onOpenProject:()=>{},onEditProject:()=>{},onEditHome:()=>{},onNavigatePortfolio:()=>{}})
  assert.match(html,/class="focus-entry"/)
  assert.doesNotMatch(html,/class="focus-item"/)
  assert.match(awaitCss,/\.home-focus-panel \.focus-entry/)
  assert.match(awaitCss,/\.site-shell\.contact-route/)
  // Public palette CSS must never override editor overlays: deployment guard.
  assert.doesNotMatch(awaitCss,/\.editor-overlay[\s.{:]|\.theme-palette-editor[\s.{:]/)
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
 check('Contact cards use list, two-column and icon-only density without repeated descriptions',()=>{
  const socials=Array.from({length:12},(_,i)=>({id:'social-'+i,label:'Platform '+i,icon:i%2?'behance':'instagram',url:'https://example.com/user/'+i}))
  const render=n=>element(app.ContactPage,{socials:socials.slice(0,n),settings:app.defaultContact,demoEnabled:false,onEdit:()=>{}})
  assert.match(render(3),/contact-directory-list/)
  const grid=render(5)
  assert.match(grid,/contact-directory-grid/)
  assert.equal((grid.match(/class="contact-social-card(?: contact-social-card-featured)?"/g)||[]).length,5)
  assert.doesNotMatch(grid,/contact-social-card-tag|Follow my creative process|Visit my profile and connect with me there/)
  const icons=render(12)
  assert.match(icons,/contact-directory-icons/)
  assert.match(icons,/title="Platform 11"/)
  assert.match(icons,/aria-label="Visit Platform 11 profile/)
  assert.ok(contactCss.includes('contact-directory-grid .contact-social-cards'))
  assert.ok(contactCss.includes('contact-directory-icons .contact-social-cards'))
  assert.ok(!awaitCss.includes(':has(.contact-social-card:nth-child(n+4))'))
 })
 check('Contact editor exposes specialties and save controls',()=>{
  const html=element(app.ContactEditor,{settings:app.defaultContact,links:[],onSave:()=>{},onClose:()=>{}})
  assert.match(html,/Especialidades do rodapé/)
  assert.match(html,/Adicionar especialidade/)
  assert.match(html,/Salvar página/)
 })
 check('Mobile portfolio balances two artwork columns at 320-430px viewports',()=>{
  // Typical content widths after the site's 14px left/right padding.
  assert.equal(app.masonryColumnCount(320-28),2)
  assert.equal(app.masonryColumnCount(375-28),2)
  assert.equal(app.masonryColumnCount(430-28),2)
  assert.equal(app.masonryColumnCount(250),2)
  assert.equal(app.masonryColumnCount(249),1)
  assert.equal(app.masonryColumnCount(661),3)
  assert.equal(app.masonryColumnCount(921),4)
  const projects=Array.from({length:8},(_,i)=>({id:'p'+i,title:'Project '+i,blocks:[],tools:[]}))
  const columns=app.distributeMasonry(projects,app.masonryColumnCount(292))
  assert.equal(columns.length,2)
  assert.deepEqual(columns.flat().map(item=>item.project.id).sort(),projects.map(p=>p.id).sort())
 })
 check('Legacy Home cards inherit gallery framing when homeFocus is absent',()=>{
  const project={id:'smoke',title:'Smoke Test',image:'https://example.com/cover.webp',featured:true,coverFocus:{x:28,y:72,zoom:1.6}}
  const html=element(app.HomePage,{home:app.defaultHome,testimonials:[],projects:[project],editing:false,onOpenProject:()=>{},onEditProject:()=>{},onEditHome:()=>{},onNavigatePortfolio:()=>{}})
  assert.match(html,/object-position:28% 72%/)
  assert.match(html,/--jf-frame-zoom:1.6/)
 })
 check('Framing tool has independent Gallery, Home and Banner controls',()=>{
  const html=element(app.ProjectFramingEditor,{image:'https://example.com/art.webp',coverFocus:{x:22,y:71,zoom:1.4},homeFocus:{x:15,y:60,zoom:1.3},heroFocus:{x:78,y:33,zoom:1.1},onChange:()=>{}})
  assert.match(html,/Capa da galeria/)
  assert.match(html,/Destaque da Home/)
  assert.match(html,/Banner do projeto/)
  assert.doesNotMatch(html,/Somente visualização/)
  assert.equal((html.match(/type="range"/g)||[]).length,9)
  assert.equal((html.match(/class="framing-canvas /g)||[]).length,3)
  assert.match(html,/object-position:22% 71%/)
  assert.match(html,/object-position:15% 60%/)
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
  assert.equal(app.classifyAudioSource('media://music/16700000-test.mp3'),'local')
  assert.equal(app.classifyAudioSource('https://example.org/song.m4a?token=123'),'direct')
  assert.equal(app.classifyAudioSource('https://example.org/track.html'),'web-page')
  assert.equal(app.classifyAudioSource('javascript:alert(1)'),'invalid')
  assert.match(app.audioSourceError('video-page'),/MP3, WAV, OGG ou M4A/)
 })
 check('Music volume opens vertically in a compact side panel',()=>{
  assert.match(musicSource,/className="music-volume-popover"/)
  assert.match(musicSource,/aria-controls="jf-music-volume-control"/)
  assert.doesNotMatch(musicSource,/className="music-volume-inline"/)
  assert.match(musicCss,/\.music-widget \.music-volume-popover\s*\{[\s\S]*?position:absolute;/)
  assert.match(musicCss,/left:calc\(100% \+ 7px\)/)
  assert.match(musicCss,/left:calc\(100% \+ 47px\)/)
  assert.match(musicCss,/border-radius:999px/)
  assert.match(musicCss,/width:38px;\s*height:124px/)
  assert.match(musicCss,/height:58px;\s*min-width:6px/)
  assert.match(musicCss,/height:118px/)
  assert.match(musicCss,/height:54px;\s*flex-basis:54px/)
  assert.match(musicCss,/flex-direction:column-reverse/)
  assert.match(musicCss,/writing-mode:vertical-lr/)
  assert.match(musicCss,/direction:rtl/)
  assert.match(musicSource,/aria-orientation="vertical"/)
  assert.match(musicSource,/linear-gradient\(to top,var\(--jf-primary/)
  const html=element(app.MusicPlayer,{tracks:[]})
  assert.match(html,/aria-controls="jf-music-volume-control"/)
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
  assert.match(html,/Texto principal/);assert.match(html,/Texto secundário/);assert.match(html,/Bordas e divisórias/)
 })
 check('Like remains keyboard-accessible and does not fabricate shared counts',()=>{
  const html=element(app.ProjectLike,{projectId:'smoke-test',showCount:true})
  assert.match(html,/aria-pressed="false"/);assert.match(html,/Like project/)
  assert.match(html,/Count on this browser only/)
 })
 console.log('\n'+checks+' Studio checks passed.')
}catch(error){console.error(error);process.exitCode=1}
finally{await rm(cache,{recursive:true,force:true})}
