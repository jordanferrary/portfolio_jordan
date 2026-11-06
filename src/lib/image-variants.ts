/** Widths are the actual encoded CSS-independent pixel widths of the WebP files. */
export type ResponsiveImageVariant={
 small:string
 smallWidth:number
 medium:string
 mediumWidth:number
 largeWidth:number
}
export type ResponsiveImageMap=Record<string,ResponsiveImageVariant>
