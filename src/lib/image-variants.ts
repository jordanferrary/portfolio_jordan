/** Widths are the actual encoded CSS-independent pixel widths of the WebP files. */
export type ResponsiveImageVariant={
 small:string
 smallWidth:number
 medium:string
 mediumWidth:number
 /** A 2560px presentation image avoids loading 6K originals into ordinary cards. */
 display?:string
 displayWidth?:number
 /** Version 2 records 640/1280/2560 previews with unmodified detail source. */
 generation?:number
 largeWidth:number
}
export type ResponsiveImageMap=Record<string,ResponsiveImageVariant>
