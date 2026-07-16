"""
PDF builder using ReportLab for layout and image rendering.
Handles page layout, image placement, metadata labels, and page styling.
"""

import os
from pathlib import Path
from PIL import Image
from reportlab.lib.pagesizes import letter, landscape, portrait
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from typing import Dict, List


class PDFBuilder:
    """Build PDF catalog from configuration and images."""
    
    def __init__(self, config_data: dict):
        """Initialize with configuration."""
        self.config = config_data
    
    def generate_catalog(self, variants: Dict[str, List[str]], output_pdf: str) -> int:
        """
        Generate multi-page PDF catalog from variant images.
        
        Args:
            variants: Dict of {variant_name: [image_paths]}
            output_pdf: Output PDF file path
        
        Returns: Total pages generated
        """
        # Ensure output directory exists
        output_path = Path(output_pdf)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Get configuration values
        images_per_row = self.config["grid"]["images_per_row"]
        rows_per_page = self.config["grid"]["rows_per_page"]
        img_width = self.config["image"]["width_inches"] * inch
        img_height = self.config["image"]["height_inches"] * inch
        h_spacing = self.config["image"]["horizontal_spacing_inches"] * inch
        v_spacing = self.config["image"]["vertical_spacing_inches"] * inch
        margin_lr = self.config["layout"]["margin_lr_inches"] * inch
        title_area = self.config["layout"]["title_area_inches"] * inch
        page_orientation = self.config["layout"]["page_orientation"]
        
        # Determine page size
        if page_orientation == "landscape":
            page_size = landscape(letter)
        else:
            page_size = portrait(letter)
        
        page_width, page_height = page_size
        
        # Create PDF canvas
        c = canvas.Canvas(output_pdf, pagesize=page_size)
        c.setTitle("PDF Catalog")
        c.setAuthor(self.config["paths"].get("branding_text", "MindCubby"))
        
        page_num = 0
        total_variants = len(variants)
        
        # Process each variant
        for variant_idx, (variant_name, images) in enumerate(sorted(variants.items())):
            if not images:
                print(f"⚠ No images found for {variant_name}")
                continue
            
            print(f"Processing {variant_name}...")
            print(f"  Found {len(images)} images")
            
            # Calculate grid centering
            total_grid_w = (images_per_row * img_width) + ((images_per_row - 1) * h_spacing)
            start_x = (page_width - total_grid_w) / 2
            grid_top_y = page_height - title_area
            
            # Start new page
            c.setPageSize(page_size)
            page_num += 1
            
            # Draw title
            title = self._get_variant_title(variant_name)
            c.setFont(
                self.config["text"]["title_font"],
                self.config["text"]["title_size"]
            )
            c.setFillColor(HexColor(self.config["colors"]["title"]))
            title_y = page_height - 0.75 * inch
            title_text = f"{page_num}. {title}"
            c.drawString(start_x, title_y, title_text)
            
            # Draw subtitle
            c.setFont(
                self.config["text"]["subtitle_font"],
                self.config["text"]["subtitle_size"]
            )
            c.setFillColor(HexColor(self.config["colors"]["subtitle"]))
            subtitle_y = title_y - 0.3 * inch
            c.drawString(start_x, subtitle_y, "PDF Catalog - Page " + str(page_num))
            
            # Draw images in grid
            img_index = 0
            for row in range(rows_per_page):
                for col in range(images_per_row):
                    if img_index >= len(images):
                        break
                    
                    img_path = images[img_index]
                    
                    # Calculate position
                    x = start_x + col * (img_width + h_spacing)
                    y = grid_top_y - (row * v_spacing) - img_height
                    
                    # Draw image
                    self._draw_image_with_metadata(
                        c, img_path, x, y, img_width, img_height
                    )
                    
                    img_index += 1
                
                if img_index >= len(images):
                    break
            
            # Draw footer
            self._draw_footer(c, page_width, margin_lr, page_num, total_variants, variant_name)
            
            c.showPage()
            print(f"  ✓ Page {page_num} complete\n")
        
        # Save PDF
        c.save()
        print(f"✓ PDF saved: {output_pdf}")
        print(f"✓ Total pages: {page_num}")
        
        return page_num
    
    def _draw_image_with_metadata(self, c, img_path: str, x: float, y: float, 
                                  img_width: float, img_height: float) -> None:
        """Draw image with metadata labels below it."""
        try:
            filename = os.path.basename(img_path)
            
            # Check if image is valid
            with Image.open(img_path) as img:
                # Draw white background
                c.saveState()
                c.setFillColor(HexColor(self.config["colors"]["image_background"]))
                c.rect(x, y, img_width, img_height, fill=1, stroke=0)
                c.restoreState()
                
                # Draw image
                c.drawImage(img_path, x, y, width=img_width, height=img_height, mask='auto')
                
                # Parse metadata from filename
                from thumbnail_scanner import ThumbnailScanner
                separator = self.config["metadata"]["separator"]
                metadata = ThumbnailScanner.parse_filename_metadata(filename, separator)
                
                # Draw metadata labels
                label_y = y - 0.12 * inch
                
                # Line 1: Position + Type
                c.setFont(
                    self.config["text"]["label_font"],
                    self.config["text"]["label_size"]
                )
                c.setFillColor(HexColor(self.config["colors"]["label_primary"]))
                line1 = f"{metadata['position']} - {metadata['type']}"
                c.drawCentredString(x + img_width/2, label_y, line1)
                
                # Line 2: Size
                label_y -= 0.14 * inch
                if metadata['size_label']:
                    line2 = f"{metadata['size_label']} {metadata['size_value']}"
                    c.drawCentredString(x + img_width/2, label_y, line2)
                
                # Line 3: Texture
                label_y -= 0.14 * inch
                c.setFillColor(HexColor(self.config["colors"]["label_secondary"]))
                c.drawCentredString(x + img_width/2, label_y, metadata['texture'])
                
                # Line 4: Filename
                label_y -= 0.12 * inch
                c.setFont("Helvetica", 5.5)
                c.setFillColor(HexColor(self.config["colors"]["label_filename"]))
                c.drawCentredString(x + img_width/2, label_y, filename)
        
        except Exception as e:
            print(f"  ERROR loading {img_path}: {e}")
    
    def _draw_footer(self, c, page_width: float, margin_lr: float, 
                     page_num: int, total_variants: int, variant_name: str) -> None:
        """Draw footer with branding and page numbers."""
        c.setFont(self.config["text"]["footer_font"], self.config["text"]["footer_size"])
        c.setFillColor(HexColor(self.config["colors"]["footer"]))
        
        footer_y = 0.3 * inch
        
        # Left branding
        branding = self.config["paths"].get("branding_text", "PDF Catalog")
        c.drawString(margin_lr, footer_y, branding)
        
        # Centered URL (optional)
        # c.drawCentredString(page_width/2, footer_y, "www.example.com")
        
        # Right variant info
        clean_variant = variant_name.split("--", 1)[1] if "--" in variant_name else variant_name
        c.drawRightString(page_width - margin_lr, footer_y, 
                         f"{clean_variant} - Page {page_num} of {total_variants}")
    
    @staticmethod
    def _get_variant_title(variant_name: str) -> str:
        """Get friendly title from variant name."""
        from thumbnail_scanner import ThumbnailScanner
        return ThumbnailScanner.get_variant_title(variant_name)
