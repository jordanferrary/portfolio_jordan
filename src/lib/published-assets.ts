/** Public media committed to GitHub. The reference stays portable across domains. */
const SITE_MEDIA=/^site:\/\/(images|audio)\/studio\/([a-f0-9]{64})\.(png|jpe?g|webp|avif|mp3|wav|ogg|m4a)$/i
export function resolvePublishedAsset(src:string):string{
 const match=src.match(SITE_MEDIA)
 return match?import.meta.env.BASE_URL+match[1].toLowerCase()+'/studio/'+match[2].toLowerCase()+'.'+match[3].toLowerCase():src
}
