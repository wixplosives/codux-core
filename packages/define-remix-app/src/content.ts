export const parentLayoutWarning = (parentLayout: string, suggestedChange: string) =>
    `Page will be nested inside "${parentLayout}". to escape this change the url string to "${suggestedChange}" ( this will not effect the url)`;
