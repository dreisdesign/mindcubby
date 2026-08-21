// Early theme/flavor script (inlined into app pages during docs sync)
(function () {
    try {
        var root = document && document.documentElement;
        if (!root) return;
        // Detect app name from path to prefer app-specific keys (e.g. 'tracker-flavor')
        var path = (location && location.pathname) ? location.pathname : '';
        var appMatch = path.match(/(?:\/labs)?\/(tracker|today-list|pad)(?:\/|$)/);
        var appName = appMatch ? appMatch[1] : null;

        var ordered = [];
        if (appName) {
            ordered.push(appName + '-flavor', appName + '-theme');
        }
        // Fallback global/local keys
        ['today-list-flavor', 'today-list-theme', 'tracker-flavor', 'tracker-theme', 'pad-flavor', 'pad-theme', 'labs-flavor', 'labs-theme'].forEach(function (k) { if (ordered.indexOf(k) === -1) ordered.push(k); });

        var foundFlavor = null;
        var foundTheme = null;
        for (var i = 0; i < ordered.length; i++) {
            try {
                var k = ordered[i];
                var v = localStorage.getItem(k);
                if (!v) continue;
                v = String(v).replace(/^flavor-/, '').replace(/^theme-/, '').trim();
                if (k.indexOf('flavor') !== -1 && !foundFlavor) foundFlavor = v;
                if (k.indexOf('theme') !== -1 && !foundTheme) foundTheme = v;
                // stop early if both found and app-specific were checked first
                if (foundFlavor && foundTheme) break;
            } catch (e) { }
        }
        // remove any existing flavor- / theme- classes
        Array.from(root.classList).forEach(function (c) { if (c && c.indexOf('flavor-') === 0) root.classList.remove(c); });
        Array.from(root.classList).forEach(function (c) { if (c && c.indexOf('theme-') === 0) root.classList.remove(c); });
        if (foundFlavor) root.classList.add('flavor-' + String(foundFlavor));
        if (foundTheme) root.classList.add('theme-' + String(foundTheme));
    } catch (e) { }
})();
