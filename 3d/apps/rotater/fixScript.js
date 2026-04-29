const fs = require('fs');
const js_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/script.js";
let js = fs.readFileSync(js_file, 'utf8');

// Replace the entire renderModelPresets function
const old_render = /function renderModelPresets\(\) \{[\s\S]*?requestAnimationFrame\(updateModelSelection\);\n\}/;

const new_render = `
function renderModelPresets() {
    const bar = document.getElementById('quickPresetsBar');
    if (!bar) return;
    
    bar.innerHTML = '';
    bar.style.display = 'grid';
    bar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    bar.style.gap = '8px';

    const modelPresets = QUICK_PRESETS;
    // user wants: Chrome, Ink, Ceramic, Clear for the first 4.
    // QUICK_PRESETS 0,1,2,3 happen to be exactly those!
    const visiblePresets = showAllPresets ? modelPresets : [modelPresets[0], modelPresets[1], modelPresets[2], modelPresets[3]];

    visiblePresets.forEach((preset) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-card-wrap';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';
        
        wrap.innerHTML = \`
            <label class="shading-option preset-option" title="Apply \${preset.name}">
                <span class="shading-thumb" id="model-preset-\${preset.id}" style="border-radius: 50%; width: 44px; height: 44px; background-color: \${preset.color}; position: relative; overflow: hidden; background-clip: padding-box; border: 2px solid transparent; cursor:pointer;">
                    <span style="position: absolute; inset: 0; background: \${preset.shading === 'metallic' ? 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.8) 4%, rgba(255,255,255,0.4) 15%, transparent 40%, rgba(0,0,0,0.5) 80%)' : (preset.id === 'glass' ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 2%, rgba(255,255,255,0.4) 12%, transparent 35%, rgba(0,0,0,0.3) 100%)' : 'radial-gradient(circle at 36% 32%, rgba(255,255,255,0.6) 5%, transparent 40%, rgba(0,0,0,0.3) 100%)')}; opacity: \${preset.id === 'glass' ? '0.7' : '1'};"></span>
                </span>
            </label>
            <span class="thumb-label">\${preset.name}</span>
        \`;
        const actionArea = wrap.querySelector('.shading-option');
        actionArea.addEventListener('click', () => {
            if (activeModelPreset === 'custom') storeCustomSettings();
            activeModelPreset = preset.id;
            
            colorPick.value = preset.color;
            if (opacitySlider) opacitySlider.value = preset.opacity;
            shadingEl.value = preset.shading;

            // Chrome sets roughness 0
            if (preset.id === 'chrome' && document.getElementById('textureTuneRoughness')) {
                 document.getElementById('textureTuneRoughness').value = 0;
                 textureTuneState.clayRoughness = 0;
                 document.getElementById('textureTuneRoughnessVal').innerText = "0%";
            }
            
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
        showAllWrap.innerHTML = \`
            <button type="button" class="preset-show-all" style="background: none; border: none; color: var(--color-text); text-decoration: underline; font-size: var(--text-xs); cursor: pointer; padding: 4px;">
                Show All (\${modelPresets.length + 1})
            </button>
        \`;
        showAllWrap.querySelector('.preset-show-all').addEventListener('click', () => {
            showAllPresets = true;
            renderModelPresets();
            updateModelSelection();
        });
        bar.appendChild(showAllWrap);
    } else {
        // Shown on Expanded exactly at the end
        const customWrap = document.createElement('div');
        customWrap.className = 'thumb-card-wrap';
        customWrap.style.display = 'flex';
        customWrap.style.flexDirection = 'column';
        customWrap.style.alignItems = 'center';
        
        customWrap.innerHTML = \`
            <label class="shading-option custom-color-option" title="Custom Settings" style="cursor:pointer;">
                <span class="shading-thumb" id="customModelThumb" style="border-radius: 50%; width: 44px; height: 44px; background-color: \${customModelSettings ? customModelSettings.color : colorPick.value}; position: relative; overflow: hidden; border: 3px solid transparent; background-clip: padding-box; background-image: linear-gradient(white, white), conic-gradient(from 180deg at 50% 50%, #ff0844, #ffb199, #f6d365, #fda085, #00c6fb, #005bea, #ff0844); background-origin: border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.1);">
                </span>
            </label>
            <span class="thumb-label">Custom</span>
        \`;
        
        customWrap.querySelector('.shading-option').addEventListener('click', () => {
            activeModelPreset = 'custom';
            const details = document.getElementById('advSettingsDetails');
            if (details) details.open = true;
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

        const showLessWrap = document.createElement('div');
        showLessWrap.style.gridColumn = '1 / -1';
        showLessWrap.style.textAlign = 'center';
        showLessWrap.style.marginTop = '4px';
        showLessWrap.innerHTML = \`
            <button type="button" class="preset-show-all" style="background: none; border: none; color: var(--color-text); text-decoration: underline; font-size: var(--text-xs); cursor: pointer; padding: 4px;">
                Show Less
            </button>
        \`;
        showLessWrap.querySelector('.preset-show-all').addEventListener('click', () => {
            showAllPresets = false;
            renderModelPresets();
            updateModelSelection();
        });
        bar.appendChild(showLessWrap);

        // Thin separator & 4 Custom Slots
        const sepWrap = document.createElement('div');
        sepWrap.style.gridColumn = '1 / -1';
        sepWrap.style.borderTop = '1px solid var(--border-color)';
        sepWrap.style.margin = '8px 0';
        bar.appendChild(sepWrap);

        // Render custom preset slots
        let savedCustoms = [];
        try {
            savedCustoms = JSON.parse(localStorage.getItem('rotater_custom_presets') || '[]');
        } catch(e){}

        for(let i = 0; i < 4; i++) {
            const wrap = document.createElement('div');
            wrap.className = 'thumb-card-wrap';
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.alignItems = 'center';
            if (savedCustoms[i]) {
                const sp = savedCustoms[i];
                wrap.innerHTML = \`
                    <label class="shading-option" style="cursor:pointer;" title="Apply saved preset \${i+1}">
                        <span class="shading-thumb" id="custom-slot-\${i}" style="border-radius: 50%; width: 44px; height: 44px; background-color: \${sp.color}; position: relative; overflow: hidden; background-clip: padding-box; border: 2px solid transparent;">
                            <span style="position:absolute; inset:0; background: \${sp.shading === 'metallic' ? 'rgba(255,255,255,0.5)' : 'transparent'};"></span>
                        </span>
                    </label>
                    <span class="thumb-label">Preset \${i+1}</span>
                \`;
                wrap.querySelector('.shading-option').addEventListener('click', () => {
                    colorPick.value = sp.color;
                    if (opacitySlider) opacitySlider.value = sp.opacity;
                    shadingEl.value = sp.shading;
                    colorPick.dispatchEvent(new Event('input', {bubbles: true}));
                    if (opacitySlider) opacitySlider.dispatchEvent(new Event('input', {bubbles: true}));
                    shadingEl.dispatchEvent(new Event('change', {bubbles: true}));
                    
                    // Mark as active
                    activeModelPreset = 'custom-slot-' + i;
                    updateModelSelection();
                });
            } else {
                wrap.innerHTML = \`
                    <div class="preset-add-slot" title="Save current settings to slot \${i+1}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                \`;
                wrap.querySelector('.preset-add-slot').addEventListener('click', () => {
                    savedCustoms[i] = {
                        color: colorPick.value,
                        opacity: opacitySlider ? opacitySlider.value : "100",
                        shading: shadingEl.value
                    };
                    localStorage.setItem('rotater_custom_presets', JSON.stringify(savedCustoms));
                    renderModelPresets();
                });
            }
            bar.appendChild(wrap);
        }
    }
    
    // Initial call
    requestAnimationFrame(updateModelSelection);
}
`;

js = js.replace(old_render, new_render);
fs.writeFileSync(js_file, js);
