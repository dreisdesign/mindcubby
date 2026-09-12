#!/usr/bin/env python3
"""
Create a simple icon for Recipe Builder and install it
"""

import subprocess
import os
from pathlib import Path

def create_icon():
    """Create a simple icon using Python PIL, or describe how to do it manually"""
    
    app_path = Path(__file__).parent / "RecipeBuilder.app" / "Contents" / "Resources"
    
    try:
        from PIL import Image, ImageDraw
        print("✓ PIL found, creating icon...")
        
        # Create a 512x512 icon
        size = 512
        img = Image.new('RGB', (size, size), color='#007AFF')
        draw = ImageDraw.Draw(img)
        
        # Add a circle
        circle_size = 450
        x = (size - circle_size) // 2
        y = (size - circle_size) // 2
        draw.ellipse([x, y, x + circle_size, y + circle_size], fill='#0A84FF')
        
        # Save as PNG
        png_path = Path(__file__).parent / "icon.png"
        img.save(png_path)
        print(f"✓ Created icon.png")
        
        # Convert to ICNS using macOS tools
        iconset_path = Path(__file__).parent / "icon.iconset"
        iconset_path.mkdir(exist_ok=True)
        
        sizes = [16, 32, 64, 128, 256, 512]
        for size in sizes:
            output = iconset_path / f"icon_{size}x{size}.png"
            subprocess.run([
                "sips", "-z", str(size), str(size),
                str(png_path), "--out", str(output)
            ], capture_output=True)
        
        print("✓ Created icon sizes")
        
        # Convert iconset to ICNS
        icns_path = app_path / "AppIcon.icns"
        subprocess.run([
            "iconutil", "-c", "icns",
            str(iconset_path), "-o", str(icns_path)
        ], capture_output=True)
        
        print(f"✓ Created AppIcon.icns")
        print(f"✓ Installed to: {icns_path}")
        
        # Clean up
        import shutil
        shutil.rmtree(iconset_path)
        os.remove(png_path)
        
        return True
        
    except ImportError:
        print("⚠ PIL not installed, showing manual instructions...\n")
        return False

if __name__ == "__main__":
    print("🎨 Creating Recipe Builder Icon\n")
    
    success = create_icon()
    
    if not success:
        print("Manual Method:")
        print("=" * 50)
        print("1. Create a 512x512 PNG image (your icon)")
        print("2. Run: python3 -m pip install Pillow")
        print("3. Place PNG in this folder as 'icon.png'")
        print("4. Run this script again")
        print()
        print("Or convert manually:")
        print("  convert icon.png -define icon:auto-resize icon.icns")
        print("  cp icon.icns RecipeBuilder.app/Contents/Resources/")
        print()
        print("Or drag & drop:")
        print("  1. Open RecipeBuilder.app/Contents/Resources/ in Finder")
        print("  2. Paste AppIcon.icns there")
    else:
        print()
        print("✓ Icon installed successfully!")
        print()
        print("Next steps:")
        print("  1. Restart Finder: killall Finder")
        print("  2. Icon should update automatically")
