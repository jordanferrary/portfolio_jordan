/** Browser-only image optimization. Original file is never overwritten. */
export type ImageOptimizeOptions={maxDimension:number;quality:number}
export const defaultImageOptimizeOptions:ImageOptimizeOptions={maxDimension:2048,quality:.82}
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
  const maxDimension=Math.max(256,Math.min(8192,Math.round(options.maxDimension)))
  const scale=Math.min(1,maxDimension/Math.max(width,height))
  const canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.round(width*scale))
  canvas.height=Math.max(1,Math.round(height*scale))
  const ctx=canvas.getContext('2d',{alpha:true})
  if(!ctx)throw new Error('Não foi possível iniciar o conversor de imagens.')
  ctx.imageSmoothingEnabled=true
  ctx.imageSmoothingQuality='high'
  ctx.drawImage(bitmap??photo!,0,0,canvas.width,canvas.height)
  const quality=Math.max(.45,Math.min(.98,options.quality))
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Seu navegador não conseguiu converter para WebP.')),'image/webp',quality))
  if(blob.type!=='image/webp')throw new Error('Seu navegador não oferece exportação WebP.')
  const stem=file.name.replace(/\.[^.]+$/,'')||'artwork'
  return new File([blob],stem+'.webp',{type:'image/webp',lastModified:Date.now()})
 }finally{bitmap?.close();URL.revokeObjectURL(objectURL)}
}
