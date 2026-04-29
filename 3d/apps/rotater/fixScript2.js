const fs = require('fs');
const js_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/script.js";
let js = fs.readFileSync(js_file, 'utf8');

// For Background presets
const old_bg = /function renderBgPresets\(\) \{[\s\S]*?requestAnimationFrame\(updateBgSelection\);\n\}/;
const new_bg = `
function renderBgPresets() {
    const bar = document.getElementById('bgPresetsBar');
    if (!bar) return;
    
    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '8px';

    BG_PRESETS.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';
        
        let bgStyle = preset.name === 'Dynamic' 
            ? 'background: conic-gradient(from 0deg at 50% 50%, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000); padding: 2px;' 
            : \`background-color: \${preset.color};\`;
            
        let innerStyle = preset.name === 'Dynamic'
            ? 'width: 100%; height: 100%; border-radius: 50%; background: rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center;'
            : 'display:none;';

        let innerContent = preset.name === 'Dynamic' ? '<span style="font-size:16px;">✨</span>' : '';

        wrap.innerHTML = \`
            <label class="shading-option preset-option" title="\${preset.name} background">
                <span class="shading-thumb" id="bg-preset-\${preset.id}" style="border-radius: 50%; width: 44px; height: 44px; position: relative; overflow: hidden; background-clip: padding-box; border: 2px solid transparent; cursor:pointer; \${bgStyle}">
                    <span style="\${innerStyle}">\${innerContent}</span>
                </span>
            </label>
            <span class="thumb-label">\${preset.name}</span>
        \`;
        
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

    // 1. Custom Bg Box AT THE END
    const customWrap = document.createElement('div');
    customWrap.className = 'thumb-card-wrap';
    customWrap.style.display = 'flex';
    customWrap.style.flexDirection = 'column';
    customWrap.style.alignItems = 'center';
    
    customWrap.innerHTML = \`
        <label class="shading-option custom-color-option" title="Custom background" style="cursor:pointer;" onclick="isDynamicBg=false; document.getElementById('bgPicker').click()">
            <span class="shading-thumb" id="customBgThumb" style="border-radius: 50%; width: 44px; height: 44px; background-color: \${bgPick.value}; position: relative; overflow: hidden; border: 3px solid transparent; background-clip: padding-box; background-image: linear-gradient(white, white), conic-gradient(from 180deg at 50% 50%, #ff0844, #ffb199, #f6d365, #fda085, #00c6fb, #005bea, #ff0844); background-origin: border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);">
            </span>
        </label>
        <span class="thumb-label">Custom</span>
    \`;
    bar.appendChild(customWrap);

    bgPick.addEventListener('input', () => {
        const thumb = document.getElementById('customBgThumb');
        if(thumb && activeBgPreset === 'custom') {
            thumb.style.backgroundColor = bgPick.value;
        }
    });

    requestAnimationFrame(updateBgSelection);
}
`;
js = js.replace(old_bg, new_bg);

// Also generate the 9 Tone circles for the Model (which replaces opacitySlider visually)
const old_init_pg = /function initPresetGallery\(\) \{[\s\S]*?initPresetGallery\(\);/;

const new_init_pg = `
function renderModelShadeSelector() {
    const sel = document.getElementById('modelShadeSelector');
    if(!sel) return;
    sel.innerHTML = '';
    // Generate 9 dots (-100, -75, -50, -25, 0, 25, 50, 75, 100)
    for(let i=0; i<9; i++) {
        let val = -100 + (i * 25);
        let dot = document.createElement('div');
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.cursor = 'pointer';
        
        // Visual representation: map -100 to white, 0 to 50% gray, 100 to black.
        // Actually, just let 0 be neutral gray, negative be lighter, positive darker
        let lightness = 50 - (val / 2); // 100 on left (white), 0 on right (black)
        dot.style.backgroundColor = \`hsl(0, 0%, \${lightness}%)\`;
        
        dot.onclick = () => {
            if(opacitySlider) {
                opacitySlider.value = val;
                opacitySlider.dispatchEvent(new Event('input', {bubbles: true}));
            }
            renderModelShadeSelector(); // update visual selection state
        };
        
        // active state
        if(opacitySlider && parseInt(opacitySlider.value) === val) {
            dot.style.border = '2px solid var(--palette-blueberry-500)';
            dot.style.transform = 'scale(1.2)';
        } else {
            dot.style.border = '1px solid var(--border-color)';
            dot.style.transform = 'scale(1)';
        }
        sel.appendChild(dot);
    }
}

// Add an event listener to opacitySlider to re-render the dots when loaded from localstorage
if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
        renderModelShadeSelector();
    });
}

function initPresetGallery() {
    renderModelPresets();
    renderBgPresets();
    renderModelShadeSelector();
}
initPresetGallery();
`;
js = js.replace(old_init_pg, new_init_pg);

fs.writeFileSync(js_file, js);
