import re

# Read index.html
html_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/index.html"
with open(html_file, "r") as f:
    html = f.read()

# 1. Background tone slider label
html = html.replace("<span>Opacity<span class=\"slider-tooltip\" id=\"bgOpacityVal\">100%</span></span>", "<span>Tone / Shade<span class=\"slider-tooltip\" id=\"bgOpacityVal\">0</span></span>")
html = html.replace("<input type=\"range\" id=\"bgOpacitySlider\" min=\"0\" max=\"100\" step=\"1\" value=\"100\">", "<input type=\"range\" id=\"bgOpacitySlider\" min=\"-100\" max=\"100\" step=\"1\" value=\"0\">")

# 2. Rename labels
html = html.replace("Background Color", "Background")
# "Model Color" occurs natively, but we also have it as a label inside Advanced Settings, so we must be precise.
html = re.sub(r'Model Color\s*<div class="preset-group" id="quickPresetsBar">', 'Model\n                                <div class="preset-group" id="quickPresetsBar">', html)

# 3. Move color picker into Advanced Settings 
# Remove hidden inputs and insert them inline where Texture is.
html = html.replace("<!-- Hidden color pickers -->\n                    <input type=\"color\" id=\"colorPicker\" value=\"#2e2b74\" style=\"position:absolute; opacity:0; pointer-events:none;\">", "")
html = html.replace("<input type=\"color\" id=\"bgPicker\" value=\"#dbd7ff\" style=\"position:absolute; opacity:0; pointer-events:none;\">", "<!-- Keep bg hidden since Custom opens it directly -->\n                    <input type=\"color\" id=\"bgPicker\" value=\"#dbd7ff\" style=\"position:absolute; opacity:0; pointer-events:none;\">")

# In Advanced settings, insert Model Color
adv_settings_start = r'<div class="controls-row" style="margin-top: 16px;">\s*<div class="control-label texture-control" style="flex: 1">'
new_adv_start = """<div class="controls-row" style="margin-top: 12px; margin-bottom: 12px;">
                                        <div class="control-label" style="flex: 1">
                                            Model Color
                                            <div class="thumb-card-wrap" style="margin-top: 8px;">
                                                <label class="color-option" title="Choose model color" style="width: 44px; height: 44px;">
                                                    <input type="color" id="colorPicker" value="#2e2b74">
                                                    <span class="color-swatch" id="colorSwatch" style="border-radius:50%; width: 44px; height:44px; box-shadow: inset -4px -4px 8px rgba(0,0,0,0.3), inset 4px 4px 8px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.1);"></span>
                                                    <span class="color-edit-icon" aria-hidden="true" style="transform: scale(0.8)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="controls-row" style="margin-top: 16px;">
                                        <div class="control-label texture-control" style="flex: 1">"""

html = re.sub(adv_settings_start, new_adv_start, html)

with open(html_file, "w") as f:
    f.write(html)
