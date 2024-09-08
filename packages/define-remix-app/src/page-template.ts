export const pageTemplate = (pageName: string, varNames: Set<string>) => {
    return varNames.size === 0
        ? `
import React from 'react';
export default function ${pageName}() {
return <div>${pageName}</div>;
}
`
        : `
import React from 'react';
import { useLoaderData } from "@remix-run/react";

export const loader = async (params: { 
${[...varNames].map((name) => `${name}: string`).join(',\n')}
}) => {
return params;
};

const ${pageName} = () => {
const params = useLoaderData<typeof loader>();
return <div>
${[...varNames].map((name) => `<div>${name}: {params.${name}}</div>`).join('\n')}
</div>;
};
export default ${pageName};
  
        
        `;
};

export const loader = (params: { a: string; b: string }) => {
    return params;
};
