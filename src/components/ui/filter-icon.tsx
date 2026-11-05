import { Box,Brush,Film,Grid2X2,Mountain,Palette,Shapes,Sparkles,UserRound } from 'lucide-react'
import type { Category,CategoryIcon } from '../../data/projects'
import { AssetImage } from './asset-image'
const ICONS:Record<CategoryIcon,typeof Box>={user:UserRound,mountain:Mountain,box:Box,sparkles:Sparkles,grid:Grid2X2,palette:Palette,film:Film,brush:Brush,shapes:Shapes}
export function FilterIcon({category}:{category:Category}){
 if(category.image)return <AssetImage className="filter-custom-icon" src={category.image} alt=""/>
 const Icon=ICONS[category.icon]??Grid2X2
 return <Icon aria-hidden="true"/>
}
