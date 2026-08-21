/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/stories/foundation/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/tokens/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/patterns/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/apps/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: {},
    },
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Foundation', 'Tokens', 'Components', 'Patterns', 'Apps'],
      },
    },
  },
  // Serve all static assets (including icons) for Storybook
  staticDirs: [
    { from: "../icons", to: "/icons" },
  ],
  viteFinal: (config) => {
    config.assetsInclude = config.assetsInclude || [];
    config.assetsInclude.push("**/*.svg");

    // Suppress chunk size warnings for Storybook build
    config.build = config.build || {};
    config.build.chunkSizeWarningLimit = 2000; // 2MB limit (default is 500kB)

    // Configure Lit for production mode and prevent multiple versions
    config.define = config.define || {};
    config.define['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');

    // Optimize Lit dependencies
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    config.optimizeDeps.include.push('lit', 'lit-html', 'lit-element');

    return config;
  },
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
};
export default config;
