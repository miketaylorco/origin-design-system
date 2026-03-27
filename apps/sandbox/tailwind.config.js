import originPreset from "@origin/tokens/tailwind";

export default {
  presets: [originPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/react/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};
