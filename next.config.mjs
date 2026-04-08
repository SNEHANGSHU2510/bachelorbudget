/** @type {import('next').NextConfig} */
const nextConfig = {
    // Webpack configuration for Transformers.js
    webpack: (config, { isServer }) => {
        // 1. Alias problematic modules to false (prevents them from being bundled)
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        };

        // 2. Handle binary files (.node) by ignoring them
        config.module.rules.push({
            test: /\.node$/,
            use: 'raw-loader',
        });

        // 3. Fallbacks for node modules that might be requested in the browser
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        }

        return config;
    },
};

export default nextConfig;
