import re

js_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/script.js"
with open(js_file, "r", encoding="utf-8") as f:
    js = f.read()

# Make details toggleable id
html_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/index.html"
with open(html_file, "r", encoding="utf-8") as f:
    html = f.read()
html = html.replace('<details class="controls-section-box" style="', '<details id="advSettingsDetails" class="controls-section-box" style="')
with open(html_file, "w", encoding="utf-8") as f:
    f.write(html)

# Now in script.js, modify renderModelPresets
def modify_render(js_content):
    # Locate renderModelPresets inside script.js
    pattern = r'function renderModelPresets\(\) \{[\s\S]*?renderModelPresets\(\);\n        \}\);\n        bar\.appendChild\(showAllWrap\);\n    \}\n\}'
    
    new_func = """
let activeModelPreset = 'custom';
let customModelSettings = null; // Stores last custom color/shading/opacity

function storeCustomSettings() {
    customModelSettings = {
        color: colorPick.value,
        opacity: opacitySlider ? opacitySlider.value : "100",
        shading: shadingEl.value
    };
}

function updateModelSelection() {
    const thumbs = document.querySelectorAll('#quickPresetsBar .shading-thumb');
    thumbs.forEach(t => t.style.borderColor = 'transparent');
    
    if (activeModelPreset === 'custom') {
        const customThumb = document.getElementById('customModelThumb');
        if (customThumb) customThumb.style.borderColor = 'var(--palette-blueberry-500)';
    } else {
        const presetThumb = document.getElementById('model-preset-' + activeModelPreset);
        if (presetThumb) presetThumb.style.borderColor = 'var(--palette-blueberry-500)';
    }
}

// Hook all manual changes to revert to custom mode automatically
[colorPick, shadingEl].forEach(el => {
    if (el) el.addEventListener('input', () => {
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
    if (el) el.addEventListener('change', () => {
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
});
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        activeModelPreset = 'custom';
        storeCustomSettings();
        updateModelSelection();
    });
}

function renderModelPresets() {
    const bar = document.getElementById('quickPresetsBar');
    if (!bar) return;
    
    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '8px';

    // 1. Custom Box
    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';
    
    // Instead of opening OS picker, open Adv Settings details
    customWrap.innerHTML = `
        <label class="shading-option custom-color-option" title="Custom Settings" style="cursor:pointer;">
            <span class="shading-thumb" id="customModelThumb" style="border-radius: 50%; width: 44px; height: 44px; background-color: ${customModelSettings ? customModelSettings.color : colorPick.value}; position: relative; overflow: hidden; border: 3px solid transparent; background-clip: padding-box; background-image: linear-gradient(white, white), conic-gradient(from 180deg at 50% 50%, #ff0844, #ffb199, #f6d365, #fda085, #00c6fb, #005bea, #ff0844); background-origin: border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);">
            </span>
        </label>
        <span class="thumb-label">Custom</span>
    `;
    
    const customAction = customWrap.querySelector('.shading-option');
    customAction.addEventListener('click', () => {
        activeModelPreset = 'custom';
        // Open advanced settings
        const details = document.getElementById('advSettingsDetails');
        if (details) details.open = true;
        
        // Restore custom settings if we had any
        if (customModelSettings) {
            colorPick.value = customModelSettings.color;
            if (opacitySlider) opacitySlider.value = customModelSettings.opacity;
            shadingEl.value = customModelSettings.shading;
            
            colorPick.dispatchEvent(new Event('input'));
            if (opacitySlider) opacitySlider.dispatchEvent(new Event('input'));
            shadingEl.dispatchEvent(new Event('change'));
        }
        updateModelSelection();
    });
    
    bar.appendChild(customWrap);

    // Sync custom thumbnail color visually when picker changes (in the background hole)
    const syncThumbColor = () => {
        const thumb = document.getElementById('customModelThumb');
        if(thumb && activeModelPreset === 'custom') thumb.style.backgroundColor = colorPick.value;
    };
    colorPick.addEventListener('input', syncThumbColor);

    const modelPresets = QUICK_PRESETS;
    const visiblePresets = showAllPresets ? modelPresets : [modelPresets[1], modelPresets[2], modelPresets[3]];

    visiblePresets.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';
        
        wrap.innerHTML = `
            <label class="shading-option preset-option" title="Apply ${preset.name}">
                <span class="shading-thumb" id="model-preset-${preset.id}" style="border-radius: 50%; width: 44px; height: 44px; background-color: ${preset.color}; position: relative; overflow: hidden; background-clip: padding-box; border: 2px solid transparent; cursor:pointer;">
                    <span style="position: absolute; inset: 0; background: ${preset.shading === 'metallic' ? 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.8) 4%, rgba(255,255,255,0.4) 15%, transparent 40%, rgba(0,0,0,0.5) 80%)' : (preset.id === 'glass' ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 2%, rgba(255,255,255,0.4) 12%, transparent 35%, rgba(0,0,0,0.3) 100%)' : 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.6) 5%, transparent 40%, rgba(0,0,0,0.3) 100%)')}; opacity: ${preset.id === 'glass' ? '0.7' : '1'};"></span>
                </span>
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;
        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            // Check if we were in custom mode, if so save it before switching
            if (activeModelPreset === 'custom') {
                storeCustomSettings();
            }
            activeModelPreset = preset.id;
            
            colorPick.value = preset.color;
            if (opacitySlider) opacitySlider.value = preset.opacity;
            shadingEl.value = preset.shading;
            
            colorPick.dispatchEvent(new Event('input', {bubbles: true}));
            if (opacitySlider) opacitySlider.dispatchEvent(new Event('input', {bubbles: true}));
            shadingEl.dispatchEvent(new Event('change', {bubbles: true}));
            
            updateModelSelection();
        });
        bar.appendChild(wrap);
    });

    if (!showAllPresets) {
        const showAllWrap = document.createElement('div');
        showAllWrap.style.gridColumn = '1 / -1';
        showAllWrap.style.textAlign = 'center';
        showAllWrap.style.marginTop = '4px';
        showAllWrap.innerHTML = `
            <button type="button" class="preset-show-all" style="background: none; border: none; color: var(--color-text); text-decoration: underline; font-size: var(--text-xs); cursor: pointer; padding: 4px;">
                Show All (${QUICK_PRESETS.length + 1})
            </button>
        `;
        
        const showAllBtn = showAllWrap.querySelector('.preset-show-all');
        showAllBtn.addEventListener('click', () => {
            showAllPresets = true;
            renderModelPresets();
            updateModelSelection();
        });
        bar.appendChild(showAllWrap);
    }
    
    // Initial call
    requestAnimationFrame(updateModelSelection);
}
"""
    return re.sub(pattern, new_func.strip(), js_content)

js = modify_render(js)

# Also apply selection logic to background presets!
bg_pattern = r'function renderBgPresets\(\) \{[\s\S]*?bgPick.dispatchEvent\(new Event\(\'input\'\)\);\n            \}\n        \}\);\n        bar\.appendChild\(wrap\);\n    \}\);\n\}'
bg_func = """
let activeBgPreset = 'custom';

function updateBgSelection() {
    const thumbs = document.querySelectorAll('#bgPresetsBar .shading-thumb');
    thumbs.forEach(t => t.style.borderColor = 'transparent');
    
    if (activeBgPreset === 'custom') {
        const customBg = document.getElementById('customBgThumb');
        if (customBg) customBg.style.borderColor = 'var(--palette-blueberry-500)';
    } else {
        const presetBg = document.getElementById('bg-preset-' + activeBgPreset);
        if (presetBg) presetBg.style.borderColor = 'var(--palette-blueberry-500)';
    }
}

// Hook all manual changes to revert to custom background mode automatically
bgPick.addEventListener('input', () => {
    activeBgPreset = 'custom';
    updateBgSelection();
});
if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        // Changing opacity is a custom action unless dynamic
        if (!isDynamicBg) {
            activeBgPreset = 'custom';
            updateBgSelection();
        }
    });
}

function renderBgPresets() {
    const bar = document.getElementById('bgPresetsBar');
    if (!bar) return;
    
    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '8px';

    // 1. Custom Bg Box
    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';
    
    customWrap.innerHTML = `
        <label class="shading-option custom-color-option" title="Custom background" style="cursor:pointer;" onclick="isDynamicBg=false; document.getElementById('bgPicker').click()">
            <span class="shading-thumb" id="customBgThumb" style="border-radius: 50%; width: 44px; height: 44px; background-color: ${bgPick.value}; position: relative; overflow: hidden; border: 3px solid transparent; background-clip: padding-box; background-image: linear-gradient(white, white), conic-gradient(from 180deg at 50% 50%, #ff0844, #ffb199, #f6d365, #fda085, #00c6fb, #005bea, #ff0844); background-origin: border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);">
            </span>
        </label>
        <span class="thumb-label">Custom</span>
    `;
    bar.appendChild(customWrap);

    bgPick.addEventListener('input', () => {
        const thumb = document.getElementById('customBgThumb');
        if(thumb && activeBgPreset === 'custom') {
            thumb.style.backgroundColor = bgPick.value;
        }
    });

    BG_PRESETS.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';
        
        let bgStyle = preset.name === 'Dynamic' 
            ? 'background: conic-gradient(from 0deg at 50% 50%, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000); padding: 2px;' 
            : `background-color: ${preset.color};`;
            
        let innerStyle = preset.name === 'Dynamic'
            ? 'width: 100%; height: 100%; border-radius: 50%; background: rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center;'
            : 'display:none;';

        let innerContent = preset.name === 'Dynamic' ? '<span style="font-size:16px;">✨</span>' : '';

        wrap.innerHTML = `
            <label class="shading-option preset-option" title="${preset.name} background">
                <span class="shading-thumb" id="bg-preset-${preset.id}" style="border-radius: 50%; width: 44px; height: 44px; position: relative; overflow: hidden; background-clip: padding-box; border: 2px solid transparent; cursor:pointer; ${bgStyle}">
                    <span style="${innerStyle}">${innerContent}</span>
                </span>
            </label>
            <span class="thumb-label">${preset.name}</span>
        `;
        
        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            activeBgPreset = preset.id;
            
            if (preset.id === 'dynamic') {
                isDynamicBg = true;
                updateDynamicBg();
            } else {
                isDynamicBg = false;
                bgPick.value = preset.color;
                bgPick.dispatchEvent(new Event('input', {bubbles: true}));
            }
            updateBgSelection();
        });
        bar.appendChild(wrap);
    });

    requestAnimationFrame(updateBgSelection);
}
"""
js = re.sub(bg_pattern, bg_func.strip(), js)


with open(js_file, "w", encoding="utf-8") as f:
    f.write(js)
