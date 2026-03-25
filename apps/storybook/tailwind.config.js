import originPreset from "@origin/tokens/tailwind";

export default {
  presets: [originPreset],
  content: [
    // Storybook MDX and story files
    "./src/**/*.{ts,tsx,mdx}",
    // React component source (path relative to this config file's location)
    "../../packages/react/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};
