import { createPlugin, IRenderableMetadataBase } from '@wixc3/simulation-core';

export const cssVarsPlugin = createPlugin<IRenderableMetadataBase>()<{ [varName: string]: string }>(
    'CSS Vars',
    {},
    {
        beforeRender(props, canvas) {
            for (const [varName, varValue] of Object.entries(props)) {
                canvas.style.setProperty(varName, varValue);
            }
        },
    }
);
