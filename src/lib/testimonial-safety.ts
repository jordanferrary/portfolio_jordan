import type { Testimonial } from '../data/studio'

/** Remove only the four known fictional reviews used during the site prototype.
 * Real feedback, including new reviews, is not affected.
 */
const sampleReviews:Record<string,string>={
 'review-mw4agj2p':'Misty',
 'review-mw4qu8h0':'Jessie',
 'review-mw4qyb1q':'Ash Ketchum',
 'review-mw4qz0qt':'Gary Oak'
}
export function isKnownDemoTestimonial(review:Pick<Testimonial,'id'|'author'|'quote'>):boolean{
 return sampleReviews[review.id]===review.author && /^["“]?Jordan[’']s\s/i.test(review.quote.trim())
}
