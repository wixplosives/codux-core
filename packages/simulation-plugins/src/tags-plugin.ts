import { createPlugin } from '@wixc3/simulation-core';

export const tagsPlugin = createPlugin()<{ tags: string[] }>(
    'Tags',
    {
        tags: [],
    },
    {}
);
