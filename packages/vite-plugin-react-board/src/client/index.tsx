import ReactDOM from 'react-dom/client';
import React from 'react';
import BoardRenderer from './board-renderer.js';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <BoardRenderer />
    </React.StrictMode>,
);
