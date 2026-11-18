/** Links to externally hosted certificates: no fetch, storage, or PDF-to-image conversion. */
export function safeShowcaseDocumentHref(value:string|undefined):string|null{
 if(!value?.trim())return null
 try{
  const url=new URL(value.trim())
  if((url.protocol==='https:'||url.protocol==='http:')&&!url.username&&!url.password)return url.href
 }catch{/* Invalid document URLs are never embedded. */}
 return null
}
/** Detect legacy PDF URLs pasted into the image field without treating artwork URLs as documents. */
export function isShowcasePdfLink(value:string|undefined):boolean{
 const href=safeShowcaseDocumentHref(value)
 if(!href)return false
 const url=new URL(href)
 return /\.pdf$/i.test(url.pathname)||(url.hostname.toLowerCase()==='drive.google.com'&&/^\/file\/d\/[a-z0-9_-]+(?:\/|$)/i.test(url.pathname))
}
/** Prefer an embeddable preview URL; the original URL is retained for opening in a tab. */
export function pdfPreviewHref(value:string):string{
 const safe=safeShowcaseDocumentHref(value)
 if(!safe)return ''
 const url=new URL(safe)
 if(url.hostname.toLowerCase()==='drive.google.com'){
  const match=url.pathname.match(/^\/file\/d\/([a-z0-9_-]+)(?:\/|$)/i)
  if(match)return 'https://drive.google.com/file/d/'+match[1]+'/preview'
 }
 if(/\.pdf$/i.test(url.pathname)){
  url.hash='toolbar=0&navpanes=0&scrollbar=0&view=FitH'
  return url.href
 }
 return safe
}
