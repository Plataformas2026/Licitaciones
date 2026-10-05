import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web"],
  
  // Añadimos variables de entorno en tiempo de compilación/ejecución si es necesario
  env: {
    // Esto suele desactivar chequeos innecesarios en algunos entornos serverless
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignorar completamente sharp y módulos nativos pesados en el empaquetado del servidor
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
