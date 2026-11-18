/** Safe public document links; never embed a GitHub HTML file page in an iframe. */
export function safeShowcaseDocumentHref(value:string|undefined):string|null{
 if(!value?.trim())return null
 try{
  const url=new URL(value.trim())
  if((url.protocol==='https:'||url.protocol==='http:')&&!url.username&&!url.password)return url.href
 }catch{/* Invalid URLs are not rendered. */}
 return null
}

/** Convert GitHub's HTML blob link to a publicly readable PDF binary URL. */
export function pdfFetchHref(value:string|undefined):string|null{
 const safe=safeShowcaseDocumentHref(value)
 if(!safe)return null
 const url=new URL(safe)
 const host=url.hostname.toLowerCase()
 if(host==='github.com'||host==='www.github.com'){
  const match=url.pathname.match(/^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+\.pdf)$/i)
  if(!match)return null
  const result=new URL('https://raw.githubusercontent.com/'+match.slice(1).join('/'))
  return result.href
 }
 if(host==='drive.google.com')return null
 return /\.pdf$/i.test(url.pathname)?url.href:null
}

/** Detect both direct PDF files and links to their GitHub or Drive pages. */
export function isShowcasePdfLink(value:string|undefined):boolean{
 const safe=safeShowcaseDocumentHref(value)
 if(!safe)return false
 const url=new URL(safe)
 return !!pdfFetchHref(safe)||
  (url.hostname.toLowerCase()==='drive.google.com'&&/^\/file\/d\/[a-z0-9_-]+(?:\/|$)/i.test(url.pathname))
}

/** Embeddable PDF-service viewer where cross-origin PDF bytes are not available. */
export function pdfPreviewHref(value:string):string{
 const safe=safeShowcaseDocumentHref(value)
 if(!safe)return ''
 const url=new URL(safe)
 if(url.hostname.toLowerCase()==='drive.google.com'){
  const match=url.pathname.match(/^\/file\/d\/([a-z0-9_-]+)(?:\/|$)/i)
  if(match)return 'https://drive.google.com/file/d/'+match[1]+'/preview'
 }
 return ''
}
