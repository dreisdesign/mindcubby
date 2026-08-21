
import "./components/labs-icon.js";
import iconNames from "./components/icons-list.js";

/**
 * @type { import('@storybook/web-components').Meta }
 */
export default {
  title: "Icons/Default",
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: { type: "select" },
      options: iconNames,
      defaultValue: "cancel",
      description: "Icon name from the icon registry",
    },
    size: {
      control: { type: "number", min: 16, max: 128, step: 4 },
      description: "Icon size in pixels",
    },
    color: {
      control: { type: "color", presetColors: [] },
      description: "Icon color",
    },
  },
};

/**
 * Default icon story
 */
export const Default = {
  render: (args) => {
    const size = args.size || 48;
    const color = args.color || "currentColor";

    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: var(--color-surface);
  border-radius: var(--radius-lg, 8px);
      border: 1px solid var(--color-primary-25);
      min-width: ${size + 32}px;
      min-height: ${size + 32}px;
      box-sizing: border-box;
      overflow: visible;
    `;

    const icon = document.createElement("labs-icon");
    icon.setAttribute("name", args.name);
    icon.setAttribute("size", size.toString());
    icon.style.cssText = `
      color: ${color};
      display: block;
      width: ${size}px;
      height: ${size}px;
      min-width: ${size}px;
      min-height: ${size}px;
      box-sizing: content-box;
      overflow: visible;
    `;

    const label = document.createElement("div");
    label.textContent = `Icon: ${args.name}`;
    label.style.cssText = `
      color: var(--color-on-surface);
      font-size: 0.875rem;
      text-align: center;
    `;

    const code = document.createElement("code");
    code.textContent = `<labs-icon name=\"${args.name}\"></labs-icon>`;
    code.style.cssText = `
  background: var(--color-surface);
      padding: 0.5rem;
  border-radius: var(--radius-md, 4px);
      font-size: 0.75rem;
      color: var(--color-on-background);
    `;

    container.appendChild(icon);
    container.appendChild(label);
    container.appendChild(code);

    return container;
  },
  args: {
    name: "settings",
    size: 48,
    color: "currentColor",
  },
  parameters: {
    docs: {
      description: {
        story: "Default icon story with live controls for name, size, and color."
      }
    }
  }
};

export const __namedExportsOrder = ["Default"];
