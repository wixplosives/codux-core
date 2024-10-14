import type { LinksFunction } from "@remix-run/node";

export const createLinksProxy = () => {
    const lastLoadedLinks: { current: null | LinksFunction } = { current: null };
    const linksWrapper = ()=>{
        if(lastLoadedLinks.current){
            return lastLoadedLinks.current();
        }
        return [];
    }
    return {
        linksWrapper,
        setLinks: (linksFunction: LinksFunction) => {
            lastLoadedLinks.current = linksFunction;
        }
    };
}