import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solución para Next.js 16 / Turbopack
  turbopack: {},

  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web"],

  outputFileTracingExcludes: {
    "/api/search": [
      "node_modules/onnxruntime-node/bin/napi-v6/darwin/**",
      "node_modules/onnxruntime-node/bin/napi-v6/win32/**",
      "node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**",
      "node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_*",
      "node_modules/onnxruntime-web/**",
      "node_modules/sharp/**",
      "node_modules/@img/**",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
