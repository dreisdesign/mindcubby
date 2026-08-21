// Generate a Storybook sitemap/index for your design system
// Usage: node scripts/generate-storybook-sitemap.js

const fs = require("fs");
const path = require("path");

const STORIES_DIR = path.join(__dirname, "../src/stories");
const OUTPUT_FILE = path.join(__dirname, "../../STORYBOOK_SITEMAP.md");

function getStoryFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".stories.js"))
    .map((f) => path.join(dir, f));
}

function parseStoryFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  // Get the title from the default export
  const titleMatch = content.match(
    /export default \{[^}]*title:\s*['"]([^'"]+)['"]/,
  );
  const title = titleMatch ? titleMatch[1] : "(no title)";
  // Get all named exports (stories) and their display names
  const exportRegex = /export const (\w+)\s*=\s*\{([\s\S]*?)};/g;
  let match;
  const exports = [];
  while ((match = exportRegex.exec(content)) !== null) {
    const exportName = match[1];
    const exportBody = match[2];
    // Try to extract the display name from the `name:` property
    const nameMatch = exportBody.match(/name:\s*['"]([^'"]+)['"]/);
    const displayName = nameMatch ? nameMatch[1] : exportName;
    exports.push({ exportName, displayName });
  }
  return { file: path.basename(filePath), title, exports };
}

function generateSitemap() {
  const files = getStoryFiles(STORIES_DIR);
  // Parse all stories and collect their info
  const allStories = files.map((filePath) => {
    const { file, title, exports } = parseStoryFile(filePath);
    // Split title into levels (e.g., Tokens/Colors)
    const levels = title.split("/");
    return exports.map(({ exportName, displayName }) => ({
      group: levels[0] || "",
      subgroup: levels[1] || "",
      story: displayName,
      file,
      exportName,
      title,
    }));
  }).flat();

  // Storybook sidebar order (from .storybook/preview.js)
  const sidebarOrder = ["Tokens", "Icons", "Components", "Patterns", "Foundation"];
  // Sort by group order, then subgroup, then story
  allStories.sort((a, b) => {
    const aIdx = sidebarOrder.indexOf(a.group);
    const bIdx = sidebarOrder.indexOf(b.group);
    if (aIdx !== bIdx) return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    if (a.subgroup !== b.subgroup) return a.subgroup.localeCompare(b.subgroup);
    return a.story.localeCompare(b.story);
  });

  // Generate timestamp in 12-hour format
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const dateStr = now.toLocaleDateString();
  const timeStr = `${hours}:${minutes} ${ampm}`;
  const timestamp = `> _Last generated: ${dateStr} ${timeStr}_\n\n`;

  let md = "# Storybook Sitemap\n" + timestamp;
  // Group stories by group
  const grouped = {};
  allStories.forEach((s) => {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  });

  Object.keys(grouped).forEach((group) => {
    md += `\n## ${group}\n`;
    md += `| Subgroup | Story | File |\n`;
    md += `|----------|-------|------|\n`;
    grouped[group].forEach(({ subgroup, story, file }) => {
      md += `| ${subgroup} | ${story} | ${file} |\n`;
    });
  });
  md += "\n";
  fs.writeFileSync(OUTPUT_FILE, md);
  console.log("Storybook sitemap generated at", OUTPUT_FILE);
}

generateSitemap();
