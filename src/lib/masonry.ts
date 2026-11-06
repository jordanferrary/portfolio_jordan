import type { Project } from '../data/projects'

/* The CSS card variants use these actual width/height ratios. */
export const CARD_RATIOS=[1.30,1.20,.73,.94,.84,1.03,.93] as const

export type MasonryItem={project:Project;originalIndex:number}
export function distributeMasonry(projects:Project[],columns:number):MasonryItem[][]{
 const count=Math.max(1,Math.min(columns,Math.max(1,projects.length)))
 const result:MasonryItem[][]=Array.from({length:count},()=>[])
 const heights:number[]=Array.from({length:count},()=>0)
 const memberships:number[]=Array.from({length:projects.length},()=>0)
 const weights=projects.map((_,i)=>1/CARD_RATIOS[i%CARD_RATIOS.length]+.055)

 // Add items horizontally to the shortest column, not in fixed 0/3/6 groups.
 for(let i=0;i<projects.length;i++){
  let col=0
  for(let c=1;c<count;c++)if(heights[c]<heights[col]-1e-6)col=c
  memberships[i]=col
  heights[col]+=weights[i]
 }
 if(count>1&&projects.length>count){
  const spreadScore=(values:number[])=>{
   const average=values.reduce((sum,v)=>sum+v,0)/values.length
   return values.reduce((sum,v)=>sum+(v-average)*(v-average),0)
  }
  // Local improvement considers transfers and swaps. It substantially reduces
  // the leftover empty space for small, irregular collections without fixed rows.
  for(let pass=0;pass<Math.min(16,projects.length*2);pass++){
   const size=Array.from({length:count},()=>0)
   for(const col of memberships)size[col]++
   const current=spreadScore(heights)
   let best=current-1e-8
   let operation:{a:number;b:number;swap:boolean}|undefined
   for(let i=0;i<projects.length;i++){
    const from=memberships[i]
    if(size[from]>1)for(let to=0;to<count;to++)if(to!==from){
     const updated=[...heights]
     updated[from]-=weights[i]
     updated[to]+=weights[i]
     const score=spreadScore(updated)
     if(score<best){best=score;operation={a:i,b:to,swap:false}}
    }
    for(let j=i+1;j<projects.length;j++){
     const to=memberships[j]
     if(to===from)continue
     const updated=[...heights]
     updated[from]+=weights[j]-weights[i]
     updated[to]+=weights[i]-weights[j]
     const score=spreadScore(updated)
     if(score<best){best=score;operation={a:i,b:j,swap:true}}
    }
   }
   if(!operation)break
   if(operation.swap){
    const first=memberships[operation.a],second=memberships[operation.b]
    memberships[operation.a]=second
    memberships[operation.b]=first
    heights[first]+=weights[operation.b]-weights[operation.a]
    heights[second]+=weights[operation.a]-weights[operation.b]
   }else{
    const from=memberships[operation.a]
    memberships[operation.a]=operation.b
    heights[from]-=weights[operation.a]
    heights[operation.b]+=weights[operation.a]
   }
  }
 }
 for(let i=0;i<projects.length;i++)result[memberships[i]].push({project:projects[i],originalIndex:i})
 // Maintain the natural order of works within each column.
 return result
}
