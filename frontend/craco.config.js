const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallback for node core modules. Webpack 5+ no longer includes them by default.
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback, // Keep existing fallbacks
        "assert": require.resolve("assert/"), // Use 'assert' polyfill
        "buffer": require.resolve("buffer/"), // Use 'buffer' polyfill
        // Add others if needed by dependencies (e.g., crypto, stream, etc.)
        // "crypto": require.resolve("crypto-browserify"),
        // "stream": require.resolve("stream-browserify"),
        // "http": require.resolve("stream-http"),
        // "https": require.resolve("https-browserify"),
        // "os": require.resolve("os-browserify/browser"),
        // "url": require.resolve("url/")
      };

      // Provide Buffer globally
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
        // Provide process if needed by dependencies (install 'process' first: npm i process)
        // new webpack.ProvidePlugin({
        //   process: 'process/browser',
        // }),
      ]);

      // Optional: Ignore source map warnings from problematic libraries
      webpackConfig.ignoreWarnings = [/Failed to parse source map/];

      // Optional: Explicitly set target to ensure BigInt support if needed
      // webpackConfig.target = ['web', 'es2020']; 

      return webpackConfig;
    },
  },
  // Configure ESLint to understand BigInt
  eslint: {
    configure: (eslintConfig) => {
      if (!eslintConfig.parserOptions) {
        eslintConfig.parserOptions = {};
      }
      // Use a modern ECMAScript version that supports BigInt
      eslintConfig.parserOptions.ecmaVersion = 2020; // or 'latest'
      
      // Optionally adjust rules if needed
      // eslintConfig.rules = {
      //     ...eslintConfig.rules,
      //     'no-undef': 'warn', // Example: Downgrade 'no-undef' temporarily
      // };

      return eslintConfig;
    }
  }
};