import type { Config } from "tailwindcss";
import originPreset from "@origin/tokens/tailwind";

const config: Config = {
  presets: [originPreset],
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
};

export default config;
