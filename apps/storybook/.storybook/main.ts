import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
    "../../../packages/react/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-designs"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp")
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {},
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
