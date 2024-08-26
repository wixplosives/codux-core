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
import { useLoader } from '../router-example';

export const loader = async (params: { 
${[...varNames].map((name) => `${name}: string`).join(',\n')}
}) => {
return params;
};

const ${pageName} = () => {
const params = useLoader<typeof loader>();
return <div>
${[...varNames].map((name) => `<div>${name}: {params.${name}}</div>`).join('\n')}
</div>;
};
export default ${pageName};
  
        
        `;
};
