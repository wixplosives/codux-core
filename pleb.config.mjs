export default {
  pinnedPackages: [
    { name: 'react', reason: `remix isn't compatible with react@19 yet` },
    { name: 'react-dom', reason: `remix isn't compatible with react@19 yet` },
    { name: '@types/react', reason: `remix isn't compatible with react@19 yet` },
    { name: '@types/react-dom', reason: `remix isn't compatible with react@19 yet` },
    { name: 'typescript', reason: 'remix breaks with typescript@5.7 (reported upstream)' },

    { name: 'chai', reason: 'esm-only' },
    { name: '@types/chai', reason: 'esm-only' },
    { name: 'chai-as-promised', reason: 'esm-only' },
    { name: '@types/chai-as-promised', reason: 'esm-only' },
  ],
};
