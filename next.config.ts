import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transformers.js y onnxruntime-node son paquetes nativos: no se empaquetan, se cargan desde node_modules.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web", "sharp"],

  // Vercel solo copia a la función los ficheros que Next detecta por análisis estático, y
  // Transformers.js carga onnxruntime-node con un require dinámico y `sharp` con una ruta
  // que depende de la plataforma: ninguno de los dos se detecta solo, así que se indican aquí.
  outputFileTracingIncludes: {
    "/api/search": [
      // Runtime de ONNX (solo el binario de Linux x64 en CPU)
      "./node_modules/onnxruntime-common/**/*",
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*",
      // sharp: Transformers.js lo importa siempre al arrancar, aunque aquí no se procesen imágenes
      "./node_modules/sharp/**/*",
      "./node_modules/@img/colour/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
      "./node_modules/detect-libc/**/*",
      "./node_modules/semver/**/*",
    ],
  },

  // Vercel limita la función a 250 MB: se descarta todo lo que no se usa en CPU/Linux.
  outputFileTracingExcludes: {
    "/api/search": [
      "node_modules/onnxruntime-node/bin/napi-v6/darwin/**",
      "node_modules/onnxruntime-node/bin/napi-v6/win32/**",
      "node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**",
      "node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_*",
      "node_modules/onnxruntime-web/**",
    ],
  },
};

export default nextConfig;
