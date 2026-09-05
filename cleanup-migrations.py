#!/usr/bin/env python3
"""
Clean up redundant elements from labs-page-layout migrations.
Removes duplicate h1, subtitle, and back-link elements that are now handled by the component.
"""

import re
from pathlib import Path

def clean_page(filepath):
    """Remove redundant elements from migrated page"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'labs-page-layout' not in content:
        return False
    
    original = content
    
    # Pattern: Remove <labs-button class="back-link">...</labs-button> followed by optional whitespace
    content = re.sub(
        r'\s*<labs-button[^>]*class="back-link"[^>]*>.*?</labs-button>\s*',
        '\n',
        content,
        flags=re.DOTALL
    )
    
    # Pattern: Remove <h1>...</h1> (but keep h2, h3, etc.)
    content = re.sub(
        r'\s*<h1[^>]*>.*?</h1>\s*',
        '\n',
        content,
        flags=re.DOTALL
    )
    
    # Pattern: Remove <p class="subtitle">...</p>
    content = re.sub(
        r'\s*<p[^>]*class="subtitle"[^>]*>.*?</p>\s*',
        '\n',
        content,
        flags=re.DOTALL
    )
    
    # Move breadcrumbs outside labs-container if they ended up there
    # Pattern: breadcrumbs without slot attribute inside page-layout should get slot="breadcrumbs"
    content = re.sub(
        r'(<labs-page-layout[^>]*>)\s*<labs-breadcrumbs(?!\s+slot)([^>]*)>',
        r'\1\n        <labs-breadcrumbs\2 slot="breadcrumbs">',
        content
    )
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Cleaned: {filepath}")
        return True
    else:
        print(f"- No changes: {filepath}")
        return False

def main():
    smoothie_dir = Path('/Users/danielreis/mindcubby/smoothie')
    pages = sorted(smoothie_dir.glob('**/index.html'))
    
    count = 0
    for page in pages:
        if clean_page(str(page)):
            count += 1
    
    print(f"\n✓ Cleaned {count} pages")

if __name__ == '__main__':
    main()
