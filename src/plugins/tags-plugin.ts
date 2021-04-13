import { createPlugin } from "../types";

export const tagPlugin = createPlugin()<{ tags: string[] }>('Tags', {
    tags: []
}, {})