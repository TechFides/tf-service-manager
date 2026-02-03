import { fileURLToPath, URL } from "node:url";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      port: parseInt(env.CLIENT_PORT, 10) || 5173,
    },
    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
      quasar({
        sassVariables: "src/quasar-variables.sass",
      }),
    ],
    resolve: {
      alias: {
        src: fileURLToPath(new URL("./src", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        sass: {
          api: "modern-compiler",
        },
      },
    },
  };
});
