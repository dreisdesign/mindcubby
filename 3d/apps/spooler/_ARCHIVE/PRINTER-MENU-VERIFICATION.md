# Printer Menu Position Verification

**CRITICAL:** The material hex codes (A2:12) encode the **menu position**, not the material type directly. Your printer's firmware menu order must match exactly, or you'll get wrong results.

**Different firmware versions (Elegoo vs Generic) have different menus.** Use the spreadsheets below to verify YOUR printer's actual menu order.

---

## Quick Start: Use the Comparison Spreadsheet

**👉 Open this file in Excel/Google Sheets/Numbers:**
- [FIRMWARE-COMPARISON.csv](./FIRMWARE-COMPARISON.csv) — Side-by-side comparison of Elegoo vs Generic firmware menus

**Columns:**
1. **Position** — Menu slot on the printer (1-16)
2. **Elegoo Firmware** — Official Elegoo Canvas material name
3. **Elegoo Hex (A2:12)** — Hex code for that position in Elegoo firmware
4. **Generic Firmware (Typical)** — What generic firmware usually has (or "[Not available]")
5. **Generic Hex (A2:12)** — Hex code for generic firmware
6. **Your Printer Menu Item** — **FILL THIS IN:** What you actually see on your printer
7. **Your Hex Code** — Once verified, the correct code for YOUR printer
8. **Verified?** — Check when confirmed

---

## How to Use

### Step 1: Identify Your Firmware
- Is your printer **Elegoo Canvas (official)** or **Generic/Compatible**?
- Select the correct firmware in the Spooler app dropdown

### Step 2: Check Your Printer's Menu
1. Navigate to **Materials** or **Filament** menu on your printer
2. Look at **position 1** — what material is listed?
3. Look at **position 2** — what material is listed?
4. Continue through all positions until you find differences

### Step 3: Fill in the Spreadsheet
- In the **"Your Printer Menu Item"** column, write what you see at each position
- Example:
  - Position 1: PLA (matches Elegoo) ✓
  - Position 2: PLA+ (but Elegoo says PETG) ✗ — This is a difference!
  - Position 3: PETG (but Elegoo says ABS) ✗ — Another difference!

### Step 4: Report Differences
Once you find differences, tell us:
- **Your printer model**
- **Firmware version** (if visible in printer settings)
- **Positions that differ** (e.g., "Position 2 is PLA+, not PETG")
- We'll update the Generic firmware config

---

## Simple Verification Checklist

**If using Elegoo firmware:**
- Position 1 should be: PLA ✓
- Position 2 should be: PETG ✓
- Position 3 should be: ABS ✓
- Position 4 should be: TPU ✓
- ...etc.

**If using Generic firmware:**
- Positions 1-4 usually match Elegoo
- But positions 6, 10, 14, 15 might be missing (no CPE, BVOH, PPA, PPS)
- Or they might be completely rearranged

---

## Why This Matters

**When you select "Rapid PLA+" in the spooler:**
- App generates hex code based on the **position** in your selected firmware menu
- If your printer's menu is different, the position is wrong
- Printer reads the wrong material

**Example:**
```
Elegoo firmware (official):
  Position 4: TPU
  
Your printer (Generic):
  Position 1: PLA
  Position 2: PLA+
  Position 3: Rapid PLA
  Position 4: Rapid PLA+  ← Different!

When you select "Rapid PLA+":
- App looks up position 4 in Elegoo config → finds TPU code
- Your printer interprets that same code as Rapid PLA+
- Result: WRONG MATERIAL! 🔴
```

---

## Files in This Folder

- **[FIRMWARE-COMPARISON.csv](./FIRMWARE-COMPARISON.csv)** — Main comparison spreadsheet (open in Excel/Sheets)
- **[printer-menu-verification.csv](./printer-menu-verification.csv)** — Simple single-firmware checklist
- **[PRINTER-MENU-VERIFICATION.md](./PRINTER-MENU-VERIFICATION.md)** — This file (instructions)
- **[Elegoo-RFID-HEX-FILAMENT-CODES.md](./Elegoo-RFID-HEX-FILAMENT-CODES.md)** — Official Elegoo firmware reference

---

## What Happens Next

1. **You verify your printer's menu** using the spreadsheet
2. **You report any differences** (share the filled-in CSV)
3. **We update the Generic firmware config** in the spooler
4. **Everyone with similar printers benefits** from your testing

The spooler already supports dual firmware — we just need your printer's actual menu order to populate the Generic config correctly.


