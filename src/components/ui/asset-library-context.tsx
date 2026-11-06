import {createContext,useMemo,type ReactNode} from 'react'
import type {Project,Category} from '../../data/projects'
import type {HomeContent,MusicTrack,AboutContent} from '../../data/studio'
export type Sources={projects:Project[];categories:Category[];home:HomeContent;about:AboutContent;galleryBackground:string;siteLogo:string;siteLogoHover:string;siteFavicon:string;tracks:MusicTrack[]}
export const LibraryContext=createContext<Sources|null>(null)
export function AssetLibraryProvider({projects,categories,home,about,galleryBackground,siteLogo,siteLogoHover,siteFavicon,tracks,children}:Sources&{children:ReactNode}){
 const value=useMemo(()=>({projects,categories,home,about,galleryBackground,siteLogo,siteLogoHover,siteFavicon,tracks}),[projects,categories,home,about,galleryBackground,siteLogo,siteLogoHover,siteFavicon,tracks])
 return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
