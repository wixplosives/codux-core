import { createPlugin, IRenderableMetaDataBase } from "../types";

export const cssVarsPlugin = createPlugin<IRenderableMetaDataBase>()<{ [varName: string]: string }>('CSS Vars', {
}, {
    beforeRender(props, canvas) {
        for (const [varName, varValue] of props) {
            canvas.style.setProperty(varName, varValue)
        }
    },


})