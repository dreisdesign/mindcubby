import re
import html

html_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/index.html"
with open(html_file, "r") as f:
    text = f.read()

# 1. Close the controls-row properly before <details>
pattern_to_close = r'(<input type="range" id="opacitySlider" min="0" max="100" step="1" value="100">\s*</div>\s*</label>\s*)(<!-- Advanced Settings inside Model Box -->)'
text = re.sub(pattern_to_close, r'\1</div>\n                                \2', text)

# 2. At the end of Advanced settings, we just need `</details>` and `</div>` (to close Model Box)
text = text.replace('</details></div>', '</details>\n                    </div>')

# 3. Fix background Custom color picker (make it truly invisible)
text = text.replace('style="position:absolute; opacity:0; pointer-events:none;"', 'style="position:absolute; width:0; height:0; padding:0; margin:0; border:none; overflow:hidden; clip:rect(0,0,0,0); pointer-events:none;"')

# 4. Same for JS injected colorPicker if any, or we just do it via DOM later.

# 5. Remove the shadingSelect dropdown
pattern_shading_select = r'<div class="export-select-group" style="margin-top: 8px;">\s*<select id="shadingSelect" name="shading" class="export-select">\s*<option value="metallic" selected>Metallic</option>\s*<option value="phong">Phong</option>\s*<option value="clay">Clay</option>\s*</select>\s*</div>'
text = re.sub(pattern_shading_select, '', text)

# 6. Change "Opacity" text for Model to Tone/Shade selector. Wait, the user wants 9 circles instead of an opacity slider for Model.
# Let's replace the whole opacitySlider wrap with the 9 dots selector.
pattern_model_opacity = r'<label class="control-label range-label alpha-slider-wrap"[\s\S]*?<input type="range" id="opacitySlider"[\s\S]*?</label>'
# The 9 dots container:
dots_html = """<div class="control-label" style="margin-top: 12px; margin-bottom: 0;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                                        <span style="font-size: var(--text-xs); color: var(--color-text-muted);">Tone / Shade</span>
                                    </div>
                                    <div id="modelShadeSelector" style="display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.03); border-radius: 12px; padding: 6px; border: 1px solid var(--border-color);">
                                        <!-- JS will inject 9 dots here -->
                                    </div>
                                </div>"""
text = re.sub(pattern_model_opacity, dots_html, text)

# 7. Add Download Settings button near Copy Settings
pattern_copy_settings = r'<button class="action-btn" type="button" id="btnCopySettings"\s*title="Copy project settings link" aria-label="Copy settings URL">\s*<img src="content_copy.svg" alt="" aria-hidden="true">\s*<span>Copy Settings</span>\s*</button>'
download_btn = """<button class="action-btn" type="button" id="btnDownloadArchive"
                            title="Download settings and STL" aria-label="Download settings">
                            <span>Download Settings</span>
                        </button>"""
text = re.sub(pattern_copy_settings, r'\g<0>\n                        ' + download_btn, text)

# 8. Rename "Model" to "Theme" 
# Oh wait, we already did "Model" -> Model, Let's change the first one.
text = text.replace('Model\n                                <div class="preset-group" id="quickPresetsBar">', 'Theme\n                                <div class="preset-group" id="quickPresetsBar">')

with open(html_file, "w") as f:
    f.write(text)
