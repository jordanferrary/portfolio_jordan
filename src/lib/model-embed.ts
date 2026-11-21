/** Browser-compatible external URLs and self-contained Studio GLB files. */
export const MAX_MODEL_BYTES=24*1024*1024
export const MODEL_MIME='model/gltf-binary'
export function parseModelUrl(value:string):{url:string;format:'glb'|'gltf'}|null{
 const source=value.trim()
 if(/^media:\/\/models\/[a-f0-9]{64}\.glb$/i.test(source)||/^site:\/\/models\/studio\/[a-f0-9]{64}\.glb$/i.test(source))return {url:source,format:'glb'}
 try{
  const url=new URL(source)
  if(url.protocol!=='https:'&&url.protocol!=='http:')return null
  if(!['.glb','.gltf'].some(extension=>url.pathname.toLowerCase().endsWith(extension)))return null
  return {url:url.href,format:url.pathname.toLowerCase().endsWith('.glb')?'glb':'gltf'}
 }catch{return null}
}
/** Require embedded buffers and textures for portable publication. */
export async function validateGlb(file:Blob):Promise<void>{
 if(file.size>MAX_MODEL_BYTES)throw new Error('Modelo acima de 24 MiB. Reduza a geometria ou as texturas no Blender.')
 if(file.size<20)throw new Error('Arquivo GLB inválido.')
 const header=new DataView(await file.slice(0,20).arrayBuffer())
 if(header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==file.size||header.getUint32(16,true)!==0x4e4f534a)throw new Error('Use um arquivo GLB 2.0 válido, exportado com as texturas incorporadas.')
 const jsonLength=header.getUint32(12,true)
 if(!jsonLength||jsonLength%4||20+jsonLength>file.size)throw new Error('Estrutura GLB inválida.')
 let data:{asset?:{version?:string};buffers?:{uri?:string}[];images?:{uri?:string}[]}
 try{data=JSON.parse(await file.slice(20,20+jsonLength).text())}catch{throw new Error('Estrutura GLB inválida.')}
 if(!data||data.asset?.version!=='2.0')throw new Error('O modelo precisa usar glTF 2.0.')
 if((data.buffers!==undefined&&!Array.isArray(data.buffers))||(data.images!==undefined&&!Array.isArray(data.images)))throw new Error('Estrutura GLB inválida.')
 for(const uri of [...(data.buffers??[]),...(data.images??[])].map(item=>item?.uri)){
  if(uri!==undefined&&(typeof uri!=='string'||!uri.startsWith('data:')))throw new Error('O GLB depende de arquivos externos. Exporte novamente com as texturas incorporadas.')
 }
}
