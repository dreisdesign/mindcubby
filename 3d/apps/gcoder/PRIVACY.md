# Privacy Policy

**Last Updated:** December 20, 2025

## Overview

g-coder is a browser-based tool that helps you generate 3D printing specifications from G-code files. This Privacy Policy explains how the application handles your data.

**TL;DR:** We do not collect, store, or transmit any of your data. All processing happens locally in your browser.

---

## Data Collection

**g-coder collects ZERO personal data.** We do not:

- ❌ Collect your IP address
- ❌ Track your usage or sessions
- ❌ Store G-code files you upload
- ❌ Store generated specifications
- ❌ Use cookies or tracking pixels
- ❌ Share data with third parties
- ❌ Use analytics or telemetry
- ❌ Build user profiles
- ❌ Sell or monetize your data

---

## How Your Data Is Processed

### 1. File Upload
- You select a `.gcode` file from your computer using your browser's file picker
- The file is read into your browser's memory only
- The file never leaves your device

### 2. Parsing & Analysis
- Your browser runs JavaScript code that:
  - Reads the G-code file contents (stored in browser memory)
  - Extracts specification comments using pattern matching (regex)
  - Calculates print time and filament weight
  - Formats the data into Markdown tables
- **No data is sent to any server during this process**

### 3. Output & Copy/Download
- The formatted specifications are displayed in your browser
- When you copy to clipboard, your browser's clipboard API handles it locally
- When you download a file, it's generated and saved by your browser locally
- **No data is transmitted over the internet**

---

## What Is NOT Stored

- Your G-code files
- Generated specifications
- Browser history (beyond your normal browser cache)
- Session data (unless you manually enable localStorage in a future version)
- Any metadata about your usage

---

## Technical Implementation

g-coder is a **100% client-side application:**

- **No backend server** – Everything runs in your browser
- **No external API calls** – The app does not communicate with any remote servers
- **No dependencies** – Pure HTML, CSS, and JavaScript (no third-party libraries)
- **Open source architecture** – The code is available on GitHub for audit

### Hosted On

g-coder is hosted on **GitHub Pages**, which means:
- GitHub can see that you visited the app (standard web server logs)
- GitHub does not have access to your G-code files or the data you process
- GitHub's privacy policy applies to their hosting service: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

---

## Browser-Level Privacy

Your browser may cache:
- The g-coder HTML, CSS, and JavaScript files
- Your browser history
- Any files you download (to your Downloads folder)

These are normal browser functions and fall under your browser's privacy controls, not g-coder's.

---

## Clipboard & Downloads

- **Copy to Clipboard:** Uses browser's native clipboard API. Your copied content stays on your device.
- **File Download:** Your browser downloads a `.md` file to your local device. g-coder does not receive notification of this action.

---

## Security Practices

### What We Do
- ✅ Serve the app over HTTPS (enforced by GitHub Pages)
- ✅ Use no external scripts or libraries (reducing attack surface)
- ✅ Process all data locally (eliminating transmission risks)
- ✅ Validate file types (only accept `.gcode` files)

### What Attackers Cannot Do
- ❌ Intercept your G-code files (they never leave your device)
- ❌ Extract your data from g-coder (no data stored remotely)
- ❌ Track your usage (no tracking code)
- ❌ Compromise your data through g-coder (no server to hack)

---

## Your Rights

### Access & Deletion
Since we do not collect or store any data about you or your G-code files, there is nothing for us to access, correct, or delete.

### Data Portability
Your G-code files and generated specifications remain entirely in your control. You can:
- Download specifications as Markdown files
- Copy output to any other application
- Delete your browser cache to remove any cached files

### Right to Know
You have the right to know what happens to your data. This document provides complete transparency.

---

## Third Parties

g-coder does not share data with, sell data to, or use services from third parties for data processing. The only exception is:

- **GitHub Pages** (hosting provider) may see that you accessed the app, but cannot see your G-code or processed data

---

## Changes to This Policy

If we make changes to this Privacy Policy, we will update the "Last Updated" date at the top of this document. Since g-coder does not collect data, major changes are unlikely, but we may clarify or expand this policy.

---

## Contact

Questions about this Privacy Policy? Open an issue on the GitHub repository:
https://github.com/dreisdesign/MindCubby-3D/issues

---

## Legal Compliance

This Privacy Policy is provided in good faith to ensure transparency. g-coder complies with:

- **GDPR** – No personal data is processed
- **CCPA** – No personal data is collected or sold
- **HIPAA, COPPA, etc.** – Not applicable (no personal data collection)

---

## Summary

**Your G-code files and data belong to you and stay with you.** g-coder is a tool that runs entirely on your device. We do not see, store, or use your data in any way. Your privacy is not compromised by using g-coder.

---

*g-coder – Privacy-First 3D Printing Specification Generator*
