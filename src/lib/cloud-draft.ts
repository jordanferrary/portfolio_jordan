import {studioWorkerUrl} from './github-auth'
export type CloudDraft={revision:string;bytes:number;updatedAt:string}
async function request(mode:'meta'|'upload'|'download',revision?:string,body?:Blob){
 const headers:Record<string,string>={'X-Alquimago-Request':'1'}
 if(revision)headers['X-Studio-Revision']=revision
 if(body)headers['Content-Type']='application/zip'
 const res=await fetch(studioWorkerUrl('/api/studio/draft')+'?mode='+mode,{method:body?'POST':'GET',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer',headers,body})
 if(!res.ok){
  let message='Não foi possível acessar a sincronização ('+res.status+').'
  try{const data=await res.json() as {error?:string};if(data.error)message=data.error}catch{/* unavailable */}
  throw new Error(message)
 }
 return res
}
export async function getCloudDraft():Promise<CloudDraft|null>{
 return ((await (await request('meta')).json()) as {draft:CloudDraft|null}).draft
}
export async function uploadCloudDraft(body:Blob,revision:string):Promise<CloudDraft>{
 if(body.size>32*1024*1024)throw new Error('O ZIP supera o limite de 32 MB. Utilize o backup local.')
 return ((await (await request('upload',revision,body)).json()) as {draft:CloudDraft}).draft
}
export async function downloadCloudDraft(revision:string):Promise<File>{
 const response=await request('download',revision)
 return new File([await response.blob()],'studio-cloud.zip',{type:'application/zip'})
}
