import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Quitamos "sharp" de aquí para que no lo busque externamente
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web"],

  // Vercel limita la función a 250 MB: dejamos solo el binario de Linux x64 (CPU)
  // y descartamos los de macOS/Windows/ARM, los proveedores GPU y sharp.
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
};

export default nextConfig;
