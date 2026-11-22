/** Use a self-hosted .js module worker on both GitHub Pages and custom domains.
 * Many shared hosts serve .mjs incorrectly, even when normal JS bundles work.
 * Build revision ensures updates cannot leave PDF.js using an old worker.
 */
export function pdfWorkerHref():string{
 const version=encodeURIComponent(import.meta.env.VITE_BUILD_SHA||'local')
 return import.meta.env.BASE_URL+'assets/pdf.worker.compat.js?v='+version
}
