import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8')
const [optimizer,media,publisher,variants,assetImage,lightbox,zoomable,converter,workflow]=await Promise.all([
 read('src/lib/image-optimize.ts'),
 read('src/lib/media-store.ts'),
 read('src/lib/github-publish.ts'),
 read('src/lib/image-variants.ts'),
 read('src/components/ui/asset-image.tsx'),
 read('src/components/ui/art-lightbox.tsx'),
 read('src/components/ui/zoomable-art.tsx'),
 read('src/components/sections/image-converter.tsx'),
 read('.github/workflows/deploy.yml')
])
const built=await build({
 entryPoints:[new URL('../src/lib/image-optimize.ts',import.meta.url).pathname],
 bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'
})
const {calculateImageDimensions,defaultImageOptimizeOptions,MAX_PANORAMA_LONG_SIDE,MAX_PANORAMA_PIXELS}=
 await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))
test('standard art remains at most 2048px, without enlarging smaller sources',()=>{
 assert.deepEqual(calculateImageDimensions(2048,2048),{width:2048,height:2048,panoramic:false,scale:1})
 assert.equal(calculateImageDimensions(3200,2800).width,2048)
 assert.equal(calculateImageDimensions(3200,2800).height,1792)
 assert.deepEqual(calculateImageDimensions(800,600),{width:800,height:600,panoramic:false,scale:1})
})
test('turnarounds retain up to three 2048px views, horizontal or vertical',()=>{
 const wide=calculateImageDimensions(6144,2048)
 assert.equal(wide.width,6144)
 assert.equal(wide.height,2048)
 assert.equal(wide.panoramic,true)
 assert.equal(MAX_PANORAMA_LONG_SIDE,6144)
 assert.equal(MAX_PANORAMA_PIXELS,13_000_000)
 const vertical=calculateImageDimensions(2400,7200)
 assert.equal(vertical.width,2048)
 assert.equal(vertical.height,6144)
 assert.equal(vertical.panoramic,true)
 const double=calculateImageDimensions(6000,3000)
 assert.equal(double.width,4096)
 assert.equal(double.height,2048)
 const veryWide=calculateImageDimensions(10000,1000)
 assert.equal(veryWide.width,6144)
 assert.equal(veryWide.height,614)
})
test('large sources cannot exceed the panorama pixel budget; previews remain fixed-size',()=>{
 for(const [w,h] of [[20000,6000],[12000,4000],[4000,14000],[8000,2666],[50000,3000]]){
  const size=calculateImageDimensions(w,h)
  assert.ok(size.width<=6144&&size.height<=6144)
  assert.ok(size.width*size.height<=13_000_000)
  assert.ok(size.width<=w&&size.height<=h)
 }
 const preview=calculateImageDimensions(6144,2048,{maxDimension:1280,quality:.85,profile:'fixed'})
 assert.equal(preview.width,1280)
 assert.equal(preview.height,427)
 assert.equal(preview.panoramic,false)
 assert.equal(defaultImageOptimizeOptions.maxDimension,2048)
 assert.equal(defaultImageOptimizeOptions.profile,'auto')
})
test('new uploads preserve detail and stay WebP within the adjusted encoded budget',()=>{
 assert.match(media,/const optimized=await optimizeImage\(file\)/)
 assert.match(media,/if\(optimized\.size>16_000_000\)/)
 assert.match(media,/if\(file\.size>50_000_000\)/)
 assert.match(optimizer,/maxBytes:16_000_000/)
 assert.match(optimizer,/canvas\.toBlob\(/)
 assert.match(optimizer,/for\(const lower of/)
 assert.match(optimizer,/ctx\.imageSmoothingQuality='high'/)
 assert.match(optimizer,/return new File\(\[blob\],stem\+'\.webp'/)
 assert.match(converter,/Panorama \/ turnaround/)
})
test('published images get crisp card/hero versions with original intact for zoom',()=>{
 assert.match(publisher,/fixed\(640,\.81\)/)
 assert.match(publisher,/fixed\(1280,\.85\)/)
 assert.match(publisher,/fixed\(2560,\.88\)/)
 assert.match(publisher,/generation:2/)
 assert.match(publisher,/snapshot\.imageVariants\[value\]\?\.generation!==2/)
 assert.match(variants,/display\?:string/)
 assert.match(variants,/displayWidth\?:number/)
 assert.match(assetImage,/item\.display&&item\.displayWidth/)
 assert.match(assetImage,/item\.largeWidth/)
 assert.match(zoomable,/<ArtLightbox src=\{src\}/)
 assert.match(lightbox,/const resolved=useAssetSrc\(src\)/)
 assert.doesNotMatch(lightbox,/srcSet=/)
 assert.match(workflow,/npm run test:art-resolution/)
})

test('case-study artwork containers respect intrinsic ratios; drag ghosts are disabled',async()=>{
 const css=await read('src/styles/artwork-aspect-ratio.css')
 const entry=await read('src/main.tsx')
 const page=await read('src/components/sections/project-page.tsx')
 assert.match(entry,/styles\/artwork-aspect-ratio\.css/)
 for(const selector of [
  /\.story-block\.block-image > img\.zoomable-art/,
  /\.story-block\.story-split > img\.zoomable-art/,
  /\.story-block\.story-multi-images > img\.zoomable-art/,
  /\.project-artwork-frame > img\.zoomable-art/
 ])assert.match(css,selector)
 assert.match(css,/width:auto;/)
 assert.match(css,/max-width:100%/)
 assert.match(css,/height:auto;/)
 assert.match(css,/max-height:min\(690px,85dvh\)/)
 assert.match(css,/-webkit-user-drag:none;/)
 assert.match(zoomable,/draggable=\{false\}/)
 assert.match(zoomable,/onDragStart=\{event=>event\.preventDefault\(\)\}/)
 assert.match(page,/alt=\{title\+' before'\} draggable=\{false\}/)
 assert.match(page,/alt=\{title\+' after'\} draggable=\{false\}/)
})
