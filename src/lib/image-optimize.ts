/** Browser-only image optimization. The source File is never overwritten. */
export type ImageOptimizeOptions={
 maxDimension:number
 quality:number
 /** auto preserves the short side of a panorama, fixed limits the longest side. */
 profile?:'auto'|'fixed'
 /** Optional encoded WebP budget. Re-encode at gentler quality steps if needed. */
 maxBytes?:number
}
export const defaultImageOptimizeOptions:ImageOptimizeOptions={
 maxDimension:2048,quality:.88,profile:'auto',maxBytes:16_000_000
}
export const MAX_PANORAMA_LONG_SIDE=6144
export const MAX_PANORAMA_PIXELS=13_000_000

/**
 * An artistic turnaround can contain three 2048px panels side by side.
 * Keep a 2048px short side and a 6144px long side (max 13 MP), rather than
 * squeezing the entire image into a single 2048px-wide miniature.
 */
export function calculateImageDimensions(width:number,height:number,options:ImageOptimizeOptions=defaultImageOptimizeOptions){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)
  throw new Error('A imagem não contém dimensões válidas.')
 const maxDimension=Math.max(256,Math.min(8192,Math.round(options.maxDimension)))
 const long=Math.max(width,height),short=Math.min(width,height)
 const panoramic=options.profile!=='fixed'&&long/short>=2
 const scale=panoramic
  ?Math.min(1,MAX_PANORAMA_LONG_SIDE/long,maxDimension/short,Math.sqrt(MAX_PANORAMA_PIXELS/(width*height)))
  :Math.min(1,maxDimension/long)
 return {
  width:Math.max(1,Math.round(width*scale)),
  height:Math.max(1,Math.round(height*scale)),
  panoramic,
  scale
 }
}

export async function optimizeImage(file:File,options:ImageOptimizeOptions=defaultImageOptimizeOptions):Promise<File>{
 if(!file.type.startsWith('image/'))throw new Error('Selecione uma imagem válida.')
 const objectURL=URL.createObjectURL(file)
 let bitmap:ImageBitmap|undefined
 let photo:HTMLImageElement|undefined
 try{
  let width=0,height=0
  if(typeof createImageBitmap==='function'){
   try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});width=bitmap.width;height=bitmap.height}catch{/* fallback for unsupported formats */}
  }
  if(!bitmap){
   photo=new Image()
   photo.src=objectURL
   await photo.decode()
   width=photo.naturalWidth;height=photo.naturalHeight
  }
  const planned=calculateImageDimensions(width,height,options)
  const canvas=document.createElement('canvas')
  canvas.width=planned.width
  canvas.height=planned.height
  const ctx=canvas.getContext('2d',{alpha:true})
  if(!ctx)throw new Error('Não foi possível iniciar o conversor de imagens.')
  ctx.imageSmoothingEnabled=true
  ctx.imageSmoothingQuality='high'
  ctx.drawImage(bitmap??photo!,0,0,canvas.width,canvas.height)
  const encode=(quality:number)=>new Promise<Blob>((resolve,reject)=>
   canvas.toBlob(value=>value?resolve(value):reject(new Error('Seu navegador não conseguiu converter para WebP.')),'image/webp',quality))
  const quality=Math.max(.55,Math.min(.98,options.quality))
  let blob=await encode(quality)
  // Prefer keeping fine geometry. Lower WebP quality before reducing pixels.
  if(options.maxBytes&&blob.size>options.maxBytes){
   for(const lower of [quality-.04,quality-.08,quality-.12,quality-.16,.68]){
    if(lower<.65)continue
    blob=await encode(lower)
    if(blob.size<=options.maxBytes)break
   }
  }
  if(options.maxBytes&&blob.size>options.maxBytes)
   throw new Error('A imagem detalhada ainda excede 16 MB após a conversão. Use o conversor WebP com uma qualidade menor antes de importar.')
  if(blob.type!=='image/webp')throw new Error('Seu navegador não oferece exportação WebP.')
  const stem=file.name.replace(/\.[^.]+$/,'')||'artwork'
  return new File([blob],stem+'.webp',{type:'image/webp',lastModified:Date.now()})
 }finally{bitmap?.close();URL.revokeObjectURL(objectURL)}
}
