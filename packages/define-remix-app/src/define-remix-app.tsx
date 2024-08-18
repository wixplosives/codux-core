import { defineApp } from '@wixc3/app-core';
import React from 'react';

export interface IDefineRemixAppProps {
    appPath: string;
    bookmarks?: string[];
    isPageInDirectory?: boolean;
}

export default function defineRemixApp({ appPath, bookmarks, isPageInDirectory }: IDefineRemixAppProps) {
    return defineApp({
        App: () => {
            return <div />;
        },
        prepareApp: () => {},
        getNewPageInfo: () => {},
    });
}
