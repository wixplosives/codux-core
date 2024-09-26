export const pageTemplate = (pageName: string, varNames: Set<string>) => {
    const compIdentifier = cleanInvalidJsIdentChars(pageName[0].toUpperCase() + pageName.slice(1));
    return varNames.size === 0
        ? `
import React from 'react';
export default function ${compIdentifier}() {
return <div>${clearJsxSpecialCharactersFromText(pageName)}</div>;
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

const ${compIdentifier} = () => {
const params = useLoaderData<typeof loader>();
return <div>
${[...varNames].map((name) => `<div>${clearJsxSpecialCharactersFromText(name)}: {params["${name}"]}</div>`).join('\n')}
</div>;
};
export default ${compIdentifier};
  
        
        `;
};

function clearJsxSpecialCharactersFromText(txt: string) {
    return txt.replace(/[{}<>]/g, '');
}
function cleanInvalidJsIdentChars(txt: string) {
    return txt.replace(/[$!@#%^&*()\-+=[\]{}|;:'",.<>?/~\\`\s]/g, '');
}
