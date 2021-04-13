import React from "react";
import type { IReactSimulation } from "../react/create-simulation";
import { createPlugin } from "../types";

export const cssVarsPlugin = createPlugin<IReactSimulation>()<Record<string, string>>('CSS Vars', {
}, {
    beforeRender(_sim, props, element) {
        return <div style={props}>{element}</div>
    },

})