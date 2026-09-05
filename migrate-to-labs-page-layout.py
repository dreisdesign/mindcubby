#!/usr/bin/env python3
"""
Migrate pages to use labs-page-layout component.
This script:
1. Adds labs-page-layout import if missing
2. Extracts page title and subtitle
3. Wraps content with labs-page-layout component
4. Preserves breadcrumbs and content sections
"""

import os
import re
import sys
from pathlib import Path

def extract_title_and_subtitle(html_content):
    """Extract h1 (title) and p.subtitle from HTML"""
    title_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html_content)
    title = title_match.group(1) if title_match else 'Page'
    
    subtitle_match = re.search(r'<p[^>]*class="subtitle"[^>]*>([^<]+)</p>', html_content)
    subtitle = subtitle_match.group(1) if subtitle_match else ''
    
    return title, subtitle

def get_back_href(filepath):
    """Determine back-href based on page location"""
    path_parts = filepath.replace('/smoothie/', '').split('/')
    
    if 'tokens' in path_parts:
        return '../../#tokens'
    elif 'foundations' in path_parts:
        return '../../#foundations'
    elif 'components' in path_parts:
        return '../../#components'
    elif 'patterns' in path_parts:
        return '../../#patterns'
    else:
        return '../../'

def migrate_page(filepath):
    """Migrate a single page to use labs-page-layout"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already migrated
    if 'labs-page-layout' in content:
        print(f"✓ Already migrated: {filepath}")
        return True
    
    # Extract title and subtitle
    title, subtitle = extract_title_and_subtitle(content)
    back_href = get_back_href(filepath)
    
    # Add import if missing
    if 'labs-page-layout.js' not in content:
        import_line = "        import '../../libs/smoothie-design-system/v3.0/src/components/labs-page-layout.js';\n"
        
        # Find where to insert (after labs-container import or at end of imports)
        import_pattern = r"(import '[^']*labs-container\.js';\n)"
        if re.search(import_pattern, content):
            content = re.sub(import_pattern, r"\1" + import_line, content, count=1)
        else:
            # Add after labs-breadcrumbs if that exists, otherwise at end of imports
            import_pattern = r"(import '[^']*?';\n)(\s*</script>)"
            content = re.sub(import_pattern, r"\1" + import_line + r"\2", content)
    
    # Build the new structure
    subtitle_attr = f' subtitle="{subtitle}"' if subtitle else ''
    page_layout_open = f'    <labs-page-layout title="{title}"{subtitle_attr} back-href="{back_href}">'
    page_layout_close = '    </labs-page-layout>'
    
    # Pattern 1: <labs-container> wrapping (new pages)
    pattern1 = r'<body>\s*<labs-container[^>]*>\s*<div class="container">(.*?)</div>\s*</labs-container>\s*<script'
    # Pattern 2: direct <div class="container"> (older pages)
    pattern2 = r'<body>\s*<div class="container">(.*?)</div>\s*<script'
    
    if re.search(pattern1, content, re.DOTALL):
        new_content = re.sub(
            pattern1,
            f'<body>\n{page_layout_open}\n\\1\n{page_layout_close}\n    <script',
            content,
            flags=re.DOTALL,
            count=1
        )
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"✓ Migrated (pattern 1): {filepath}")
        return True
    elif re.search(pattern2, content, re.DOTALL):
        new_content = re.sub(
            pattern2,
            f'<body>\n{page_layout_open}\n\\1\n{page_layout_close}\n    <script',
            content,
            flags=re.DOTALL,
            count=1
        )
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"✓ Migrated (pattern 2): {filepath}")
        return True
    else:
        print(f"⚠ Could not find container pattern in: {filepath}")
        return False

def main():
    smoothie_dir = Path('/Users/danielreis/mindcubby/smoothie')
    pages = sorted(smoothie_dir.glob('**/index.html'))
    
    # Skip home page and already migrated theme-toggle
    skip_pages = {
        smoothie_dir / 'index.html',
        smoothie_dir / 'foundations' / 'theme-toggle' / 'index.html',
        smoothie_dir / 'components' / 'index.html',
        smoothie_dir / 'foundations' / 'index.html',
        smoothie_dir / 'tokens' / 'index.html',
        smoothie_dir / 'patterns' / 'index.html',
    }
    
    success_count = 0
    for page in pages:
        if page not in skip_pages:
            if migrate_page(str(page)):
                success_count += 1
    
    print(f"\n✓ Successfully migrated {success_count} pages")

if __name__ == '__main__':
    main()
