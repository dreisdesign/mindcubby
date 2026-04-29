import re

js_file = "/Users/danielreis/Documents/3D_PRINTING/mindcubby/3d/apps/rotater/script.js"
with open(js_file, "r") as f:
    js = f.read()

# 4. Background tone slider logic
# The slider is bgOpacitySlider from -100 to 100.
# Find where it updates bg
js = js.replace("updateDynamicBg() {\n    if (isDynamicBg && renderer) {", "updateDynamicBg() {\n    if (isDynamicBg && renderer) {")

def replace_renderer_set_clear_color(match):
    # This was: if (renderer) renderer.setClearColor(bgC, bgOpacitySlider ? bgOpacitySlider.value / 100 : 1);
    # We want: 
    # const targetCol = new THREE.Color(...);
    # let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
    # if (tone > 0) targetCol.lerp(new THREE.Color(0x000000), tone/100);
    # else if (tone < 0) targetCol.lerp(new THREE.Color(0xffffff), -tone/100);
    # if (renderer) renderer.setClearColor(targetCol, 1);
    pass

# Rather than regex, just replace the block manually.
# In "updateDynamicBg"
js = js.replace("if (renderer) renderer.setClearColor(bgC, bgOpacitySlider ? bgOpacitySlider.value / 100 : 1);", """
            let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
            if (tone > 0) bgC.lerp(new THREE.Color(0x000000), tone/100);
            else if (tone < 0) bgC.lerp(new THREE.Color(0xffffff), -tone/100);
            if (renderer) renderer.setClearColor(bgC, 1);
""")

# In the bgOpacitySlider listener:
old_listener = """if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        document.getElementById('bgOpacityVal').textContent = bgOpacitySlider.value + '%';
        if (renderer) renderer.setClearColor(new THREE.Color(bgPick.value), bgOpacitySlider.value / 100);
        saveSettings();
    });
}"""

new_listener = """if (bgOpacitySlider) {
    bgOpacitySlider.addEventListener('input', () => {
        document.getElementById('bgOpacityVal').textContent = bgOpacitySlider.value;
        const c = new THREE.Color(bgPick.value);
        let tone = parseInt(bgOpacitySlider.value, 10);
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone/100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone/100);
        if (renderer) renderer.setClearColor(c, 1);
        if (isDynamicBg) updateDynamicBg();
        saveSettings();
    });
}"""
js = js.replace(old_listener, new_listener)

# In scene setup/restore
js = js.replace("if (renderer) renderer.setClearColor(new THREE.Color(bgPick.value), bgOpacitySlider ? bgOpacitySlider.value / 100 : 1);", """
    {
        const c = new THREE.Color(bgPick.value);
        let tone = bgOpacitySlider ? parseInt(bgOpacitySlider.value, 10) : 0;
        if (tone > 0) c.lerp(new THREE.Color(0x000000), tone/100);
        else if (tone < 0) c.lerp(new THREE.Color(0xffffff), -tone/100);
        if (renderer) renderer.setClearColor(c, 1);
    }""")


# 5. Fix depthWrite issues with alpha
js = js.replace("depthWrite: alpha >= 1", "depthWrite: alpha >= 0.98")

with open(js_file, "w") as f:
    f.write(js)
