# **Elegoo RFID Tag Codes: Filament Combinations**

Use these 2-line command blocks in **NFC Tools** to set both the **Main Material (A2:12)** and **Subtype / Variant (A2:13)** for your printer.  
*Note: The 32-bit hex code for Elegoo main materials is calculated by converting the ASCII decimal value of each character in the material name directly to hex bytes (padded with 00 on the left).*

## **Printer Menu Order Overview**

| Index | Material | Main Material Hex (A2:12) |
| :---- | :---- | :---- |
| 1 | **PLA** | 00807665 |
| 2 | **PETG** | 80698471 |
| 3 | **ABS** | 00656683 |
| 4 | **TPU** | 00848085 |
| 5 | **PA** | 00008065 |
| 6 | **CPE** | 00678069 |
| 7 | **PC** | 00008067 |
| 8 | **PVA** | 00808665 |
| 9 | **ASA** | 00658365 |
| 10 | **BVOH** | 66867972 |
| 11 | **EVA** | 00698665 |
| 12 | **HIPS** | 72738083 |
| 13 | **PP** | 00008080 |
| 14 | **PPA** | 00808065 |
| 15 | **PPS** | 00808083 |
| 16 | **PET** | 00806984 |

## **1\. PLA Family (Main Material Hex: 00807665\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PLA\] \[Standard PLA\]** | Standard Base PLA | 00807665 | 00000000 | A2:12:00807665 A2:13:00000000 |
| **\[PLA\] \[PLA+\]** | Toughened PLA+ | 00807665 | 00010000 | A2:12:00807665 A2:13:00010000 |
| **\[PLA\] \[Rapid PLA\]** | High-Speed PLA | 00807665 | 00020000 | A2:12:00807665 A2:13:00020000 |
| **\[PLA\] \[Rapid PLA+\]** | High-Speed Toughened PLA+ | 00807665 | 00030000 | A2:12:00807665 A2:13:00030000 |
| **\[PLA\] \[PLA Matte\]** | Low-Gloss Finish PLA | 00807665 | 00040000 | A2:12:00807665 A2:13:00040000 |
| **\[PLA\] \[PLA Silk\]** | High-Shine / Silk Finish | 00807665 | 00050000 | A2:12:00807665 A2:13:00050000 |
| **\[PLA\] \[PLA-CF\]** | Carbon Fiber Reinforced PLA | 00807665 | 00060000 | A2:12:00807665 A2:13:00060000 |
| **\[PLA\] \[PLA Luminous\]** | Glow-in-the-Dark PLA | 00807665 | 00070000 | A2:12:00807665 A2:13:00070000 |
| **\[PLA\] \[PLA Wood\]** | Wood Fiber Composite PLA | 00807665 | 00080000 | A2:12:00807665 A2:13:00080000 |
| **\[PLA\] \[PLA Marble\]** | Speckled / Marble Effect PLA | 00807665 | 00090000 | A2:12:00807665 A2:13:00090000 |
| **\[PLA\] \[PLA Galaxy\]** | Glitter / Sparkle PLA | 00807665 | 000A0000 | A2:12:00807665 A2:13:000A0000 |
| **\[PLA\] \[PLA Dual-Color\]** | Co-extruded 2-Color PLA | 00807665 | 000B0000 | A2:12:00807665 A2:13:000B0000 |
| **\[PLA\] \[PLA Tri-Color\]** | Co-extruded 3-Color PLA | 00807665 | 000C0000 | A2:12:00807665 A2:13:000C0000 |

## **2\. PETG Family (Main Material Hex: 80698471\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PETG\] \[Standard PETG\]** | Standard PETG | 80698471 | 00000000 | A2:12:80698471 A2:13:00000000 |
| **\[PETG\] \[Rapid PETG\]** | High-Speed PETG | 80698471 | 00020000 | A2:12:80698471 A2:13:00020000 |
| **\[PETG\] \[PETG-CF\]** | Carbon Fiber PETG | 80698471 | 00060000 | A2:12:80698471 A2:13:00060000 |
| **\[PETG\] \[PETG-GF\]** | Glass Fiber PETG | 80698471 | 000D0000 | A2:12:80698471 A2:13:000D0000 |

## **3\. ABS Family (Main Material Hex: 00656683\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[ABS\] \[Standard ABS\]** | Standard ABS | 00656683 | 00000000 | A2:12:00656683 A2:13:00000000 |
| **\[ABS\] \[ABS+\]** | Toughened ABS+ | 00656683 | 00010000 | A2:12:00656683 A2:13:00010000 |
| **\[ABS\] \[Rapid ABS\]** | High-Speed ABS | 00656683 | 00020000 | A2:12:00656683 A2:13:00020000 |
| **\[ABS\] \[ABS-CF\]** | Carbon Fiber ABS | 00656683 | 00060000 | A2:12:00656683 A2:13:00060000 |

## **4\. TPU Family (Main Material Hex: 00848085\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[TPU\] \[Standard TPU\]** | Flexible TPU (95A) | 00848085 | 00000000 | A2:12:00848085 A2:13:00000000 |
| **\[TPU\] \[Rapid TPU\]** | High-Flow TPU | 00848085 | 00020000 | A2:12:00848085 A2:13:00020000 |

## **5\. PA (Nylon) Family (Main Material Hex: 00008065\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PA\] \[Standard Nylon\]** | Standard Polyamide | 00008065 | 00000000 | A2:12:00008065 A2:13:00000000 |
| **\[PA\] \[PA-CF\]** | Carbon Fiber Nylon | 00008065 | 00060000 | A2:12:00008065 A2:13:00060000 |
| **\[PA\] \[PA-GF\]** | Glass Fiber Nylon | 00008065 | 000D0000 | A2:12:00008065 A2:13:000D0000 |

## **6\. CPE Family (Main Material Hex: 00678069\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[CPE\] \[Standard CPE\]** | Co-polyester | 00678069 | 00000000 | A2:12:00678069 A2:13:00000000 |
| **\[CPE\] \[CPE-CF\]** | Carbon Fiber CPE | 00678069 | 00060000 | A2:12:00678069 A2:13:00060000 |

## **7\. PC (Polycarbonate) Family (Main Material Hex: 00008067\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PC\] \[Standard PC\]** | Standard Polycarbonate | 00008067 | 00000000 | A2:12:00008067 A2:13:00000000 |
| **\[PC\] \[PC-CF\]** | Carbon Fiber Polycarbonate | 00008067 | 00060000 | A2:12:00008067 A2:13:00060000 |

## **8\. PVA Family (Main Material Hex: 00808665\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PVA\] \[Standard PVA\]** | Water-Soluble Support | 00808665 | 00000000 | A2:12:00808665 A2:13:00000000 |

## **9\. ASA Family (Main Material Hex: 00658365\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[ASA\] \[Standard ASA\]** | Weather-Resistant ASA | 00658365 | 00000000 | A2:12:00658365 A2:13:00000000 |
| **\[ASA\] \[Rapid ASA\]** | High-Speed ASA | 00658365 | 00020000 | A2:12:00658365 A2:13:00020000 |

## **10\. BVOH Family (Main Material Hex: 66867972\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[BVOH\] \[Standard BVOH\]** | High-Solubility Support | 66867972 | 00000000 | A2:12:66867972 A2:13:00000000 |

## **11\. EVA Family (Main Material Hex: 00698665\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[EVA\] \[Standard EVA\]** | Ethylene-Vinyl Acetate | 00698665 | 00000000 | A2:12:00698665 A2:13:00000000 |

## **12\. HIPS Family (Main Material Hex: 72738083\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[HIPS\] \[Standard HIPS\]** | Dissolvable Support / Model | 72738083 | 00000000 | A2:12:72738083 A2:13:00000000 |

## **13\. PP Family (Main Material Hex: 00008080\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PP\] \[Standard PP\]** | Polypropylene | 00008080 | 00000000 | A2:12:00008080 A2:13:00000000 |
| **\[PP\] \[PP-GF\]** | Glass Fiber Polypropylene | 00008080 | 000D0000 | A2:12:00008080 A2:13:000D0000 |

## **14\. PPA Family (Main Material Hex: 00808065\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PPA\] \[Standard PPA\]** | High-Temp Polyphthalamide | 00808065 | 00000000 | A2:12:00808065 A2:13:00000000 |
| **\[PPA\] \[PPA-CF\]** | Carbon Fiber PPA | 00808065 | 00060000 | A2:12:00808065 A2:13:00060000 |
| **\[PPA\] \[PPA-GF\]** | Glass Fiber PPA | 00808065 | 000D0000 | A2:12:00808065 A2:13:000D0000 |

## **15\. PPS Family (Main Material Hex: 00808083\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PPS\] \[Standard PPS\]** | Polyphenylene Sulfide | 00808083 | 00000000 | A2:12:00808083 A2:13:00000000 |
| **\[PPS\] \[PPS-CF\]** | Carbon Fiber PPS | 00808083 | 00060000 | A2:12:00808083 A2:13:00060000 |

## **16\. PET Family (Main Material Hex: 00806984\)**

| Combination Pair | Description | Page 12 Hex (A2:12) | Page 13 Hex (A2:13) | NFC Tools Commands |
| :---- | :---- | :---- | :---- | :---- |
| **\[PET\] \[Standard PET\]** | Polyethylene Terephthalate | 00806984 | 00000000 | A2:12:00806984 A2:13:00000000 |
| **\[PET\] \[PET-CF\]** | Carbon Fiber PET | 00806984 | 00060000 | A2:12:00806984 A2:13:00060000 |
