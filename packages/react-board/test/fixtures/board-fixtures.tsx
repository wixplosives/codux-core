import React from 'react';
import { createBoard } from '@wixc3/react-board';

export const MockComponent: React.FC<{ text: string }> = (props) => <div>{props.text}</div>;

export const propsOnlyBoard = createBoard({
    Board: () => <MockComponent text="this is a test" />,
    name: 'mock board',
});

export const overrideProps = {
    text: 'override text',
};

export const boardWithWrapper = createBoard({
    name: 'mock board',
    Board: () => <MockComponent text="mock board" />,
});

export const boardWithEnvironmentProps = createBoard({
    Board: () => <MockComponent text="this is a test" />,
    name: 'mock board',
    environmentProps: {
        canvasWidth: 50,
        canvasHeight: 100,
        canvasPadding: { left: 20, right: 10, top: 5, bottom: 2 },
        canvasMargin: { left: 210, right: 110, top: 51, bottom: 21 },
        canvasBackgroundColor: 'red',
        windowWidth: 500,
        windowHeight: 600,
        windowBackgroundColor: 'blue',
    },
});
