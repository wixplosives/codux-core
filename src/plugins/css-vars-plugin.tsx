import React from "react";
import type { IReactSimulation } from "../react/create-simulation";
import { createPlugin } from "../types";

export const cssVarsPlugin = createPlugin<IReactSimulation>()<Record<string, string>>('CSS Vars', {
}, {
    wrapRender(_renderable, props, renderableElement) {
        return <div style={props}>{renderableElement}</div>
    },

})