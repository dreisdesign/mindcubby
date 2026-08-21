// This script opens Storybook in Chrome after starting, but only for `npm run local`.
const { exec } = require("child_process");
const open = require("open");

const STORYBOOK_URL = "http://localhost:6006";

// Start Storybook
const storybookProcess = exec("npm run storybook", (err, stdout, stderr) => {
  if (err) {
    console.error("Failed to start Storybook:", err);
    process.exit(1);
  }
});

// Wait a few seconds, then open Chrome
setTimeout(() => {
  open(STORYBOOK_URL, { app: { name: "google chrome" } });
}, 4000);
