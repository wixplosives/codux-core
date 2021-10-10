import React, { createContext, useContext } from 'react';

export const textContext = createContext('');
export const ContextUser: React.FC = () => {
    const text = useContext(textContext);
    return <span>{text}</span>;
};
