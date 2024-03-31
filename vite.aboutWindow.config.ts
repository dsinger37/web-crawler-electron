import { resolve } from "path";
import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"renderer">;
  const { mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? "";

  return {
    root: resolve(__dirname, "src", "about"),
    mode,
    base: "./",
    build: {
      outDir: `../../.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  } as UserConfig;
});
