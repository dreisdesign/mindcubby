import"./iframe-D5IUrsFN.js";import"./preload-helper-PPVm8Dsz.js";function Z(s={}){const u=s&&s.onlyFlavor?String(s.onlyFlavor):"",p={global:{"--palette-base-100":"Surface","--palette-base-500":"Outline","--palette-base-800":"Text","--palette-green-500":"Success","--palette-yellow-500":"Warning","--palette-red-500":"Error"},vanilla:{"--palette-vanilla-100":"Surface","--palette-vanilla-200":"Background","--palette-vanilla-300":"Primary Lighter","--palette-vanilla-500":"Primary","--palette-vanilla-800":"Primary Darker","--palette-vanilla-900":"Background Darkest"},blueberry:{"--palette-blueberry-100":"Surface","--palette-blueberry-200":"Background","--palette-blueberry-300":"Primary Lighter","--palette-blueberry-500":"Primary","--palette-blueberry-800":"Primary Darker","--palette-blueberry-900":"Background Darkest"},strawberry:{"--palette-strawberry-100":"Surface","--palette-strawberry-200":"Background","--palette-strawberry-300":"Primary Lighter","--palette-strawberry-500":"Primary","--palette-strawberry-800":"Primary Darker","--palette-strawberry-900":"Background Darkest"}},y=(l,k,i,h)=>{let e="";return p[l]&&p[l][i]&&(e=`<br><span style="font-weight:bold;font-size:13px;opacity:0.8;">${p[l][i]}</span>`),`
    <div class="polaroid-card${i==="--color-primary"?" polaroid-primary":""}" data-var="${i}" role="button" tabindex="0" title="Copy ${i}">
      <div class="card-swatch" style="background:var(${i});">
        <div class="swatch-text">${(()=>{const r=String(i).replace(/^--/,"");if(i==="--color-primary-lighter")return"Primary Lighter";if(i==="--color-on-primary-lighter")return"On Primary Lighter";const a=r.match(/^palette-([^-]+)-(\d+)$/);if(a)return a[1].charAt(0).toUpperCase()+a[1].slice(1)+" "+a[2];const t=r.match(/^palette-([^-]+)-([a-zA-Z]+)$/);return t?t[1].charAt(0).toUpperCase()+t[1].slice(1)+" "+t[2]:r.replace(/^color-/,"").split("-").map(function(o){return o.charAt(0).toUpperCase()+o.slice(1)}).join(" ")||r})()}${e}</div>
      </div>
      <div class="card-token-label"><code>${i}</code></div>
      
    </div>
    `},$=l=>u&&u!==l?'style="display:none;"':"",x={global:{label:"Global",tokens:["--color-surface","--color-surface-alt","--color-success","--color-warning","--color-error"],palette:["--palette-base-100","--palette-base-500","--palette-base-800"],statusPalette:["--palette-green-500","--palette-yellow-500","--palette-red-500"]},blueberry:{semantic:["--color-primary","--color-primary-darker","--color-primary-lighter","--color-background-darkest"],neutrals:["--color-surface","--color-background"],palette:["--palette-blueberry-100","--palette-blueberry-200","--palette-blueberry-300","--palette-blueberry-500","--palette-blueberry-800","--palette-blueberry-900"],accents:[]},strawberry:{semantic:["--color-primary","--color-primary-darker","--color-primary-lighter","--color-background-darkest"],neutrals:["--color-surface","--color-background"],palette:["--palette-strawberry-100","--palette-strawberry-200","--palette-strawberry-300","--palette-strawberry-500","--palette-strawberry-800","--palette-strawberry-900"],accents:[]},vanilla:{semantic:["--color-primary","--color-primary-darker","--color-primary-lighter","--color-background-darkest"],neutrals:["--color-surface","--color-background"],palette:["--palette-vanilla-100","--palette-vanilla-200","--palette-vanilla-300","--palette-vanilla-500","--palette-vanilla-800","--palette-vanilla-900"],accents:[]}},_=l=>{const k=x[l];return Array.from(new Set([...k.semantic||[],...k.neutrals||[]]))},M=u?`flavor-${u} theme-light`:"flavor-global theme-light",S=u?`data-only-flavor="${u}"`:"";let D="";if(u&&x[u]){const l=u,k=_(l);D=`
  <details class="flavor-column flavor-${l}" ${$(l)} open style="margin-top:12px">
        <summary style="margin:8px 0"><h3 style="display:inline;margin:0">Theme: ${l.charAt(0).toUpperCase()+l.slice(1)}</h3></summary>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${x[l].palette.map(i=>y(l,i.replace(/^--/,""),i)).join("")}
        </div>
        <div class="token-list-wrap">
          <table class="token-list">
            <thead><tr><th>Semantic</th><th>Swatch</th><th>Resolved</th><th>Base</th><th>Text color</th><th>Contrast</th></tr></thead>
            <tbody>
              ${k.map(i=>{let h="",e="";if(/--palette-(vanilla|blueberry|strawberry)-([0-9]+)/.test(i)){const r=i.match(/([0-9]+)$/)[1];["100","200","300"].includes(r)?(e="--color-on-primary-lighter",h="var(--color-on-primary-lighter, #000)"):(e="--color-on-primary-darker",h="var(--color-on-primary-darker, #fff)")}return`
                <tr>
                  <td><code>${i}</code></td>
                  <td><span class="swatch-thumb" data-var="${i}" style="background:var(${i});"><span class="swatch-thumb-text" data-var="${i}" style="color:${h}">Aa</span></span></td>
                  <td class="list-resolved" data-var="${i}">resolving...</td>
                  <td class="list-chain" data-var="${i}">–</td>
                  <td class="list-text-color" data-var="${i}">${e?`<code>${e}</code>`:"computing..."}</td>
                  <td class="list-contrast" data-var="${i}">–</td>
                </tr>
                `}).join("")}
            </tbody>
          </table>
        </div>
      </details>
    `}const W=`
    <div style="width:100%; display:flex; justify-content:center;">
      <div style="max-width:1200px; padding:20px; font-family:var(--font-family-base); color:var(--color-on-background); background:var(--color-surface);">
        <div class="tokens-doc-root ${M}" ${S} data-flavor-root>
      <style>
  .tokens-doc-root{padding:16px 40px;font-family:var(--font-family-base);}

  /* Responsive grid of compact polaroids */
  .polaroid-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:16px}
  details.flavor-column{margin-bottom:12px;border-radius:var(--radius-lg,8px);padding:8px;border:1px solid rgba(0,0,0,0.04);background:var(--color-surface);color:var(--color-on-surface);transition:background 0.2s,color 0.2s}
  /* Force the Global details to use the neutral base palette (Base 100/800) via semantic tokens
     so we render using --color-surface / --color-on-surface while remaining flavor-agnostic. */
  details.flavor-column.flavor-global{
    --color-surface: var(--palette-base-100);
    --color-on-surface: var(--palette-base-800);
    background: var(--color-surface);
    color: var(--color-on-surface);
  }
  details.flavor-column[open]{box-shadow:0 1px 0 rgba(0,0,0,0.04)}
  details.flavor-column summary{list-style:none;cursor:pointer;padding:6px 8px}
  details.flavor-column summary::-webkit-details-marker{display:none}
  details.flavor-column summary h3{font-size:15px;display:inline}

  .polaroid-card{border-radius:var(--radius-lg,8px);padding:10px;border:1px solid var(--palette-base-500, var(--color-outline));background:var(--color-surface,#FBFBFD);}
  /* Make the swatch a square (1:1) so color area is consistent */
  .card-swatch{width:100%;min-width:64px;min-height:64px;aspect-ratio:1/1;border-radius:var(--radius-lg,8px);background-size:cover;margin-bottom:10px;position:relative;display:flex;align-items:center;justify-content:center;background:var(--color-surface,#FBFBFD);}
  .swatch-text{
    font-weight:700;
    font-size:16px;
    line-height:1;
    color:var(--color-on-surface);
    pointer-events:none;
    text-shadow:0 1px 0 rgba(0,0,0,0.15);
    transition:color 0.2s;
  }
  /* Override text color for primary-lighter swatch to use correct on color */
  .polaroid-card[data-var="--color-primary-lighter"] .swatch-text {
    color: var(--color-on-primary-lighter, var(--color-on-surface));
  }
  /* Override text color for dark palette tokens (500, 700, 800, 900) to use light text */
  .polaroid-card[data-var*="-500"] .swatch-text,
  .polaroid-card[data-var*="-700"] .swatch-text,
  .polaroid-card[data-var*="-800"] .swatch-text,
  .polaroid-card[data-var*="-900"] .swatch-text,
  .polaroid-card[data-var="--palette-base-800"] .swatch-text {
    color: var(--color-on-primary-darker, #fff);
  }
  /* Override yellow-500 swatch to use dark text for contrast */
  .polaroid-card[data-var="--palette-yellow-500"] .swatch-text {
    color: var(--color-on-primary-lighter, #222);
  }
  /* Override text color for light palette tokens (100, 200, 300) to use dark text */
  .polaroid-card[data-var*="-100"] .swatch-text,
  .polaroid-card[data-var*="-200"] .swatch-text,
  .polaroid-card[data-var*="-300"] .swatch-text,
  .polaroid-card[data-var="--palette-base-100"] .swatch-text,
  .polaroid-card[data-var="--palette-base-500"] .swatch-text {
    color: var(--color-on-primary-lighter, #000);
  }
  /* Remove any dark mode overrides for .swatch-text (do not force color) */
  /* Ensure polaroid code labels never wrap */
  .card-token-label, .card-base-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .card-token-label{font-size:12px;color:inherit;margin-top:6px;word-break:break-all;transition:color 0.2s;}
  .card-base-label{font-size:11px;color:inherit;opacity:0.8;margin-top:4px;word-break:break-all;transition:color 0.2s;}
  .polaroid-card[data-copied]{outline:2px solid rgba(0,0,0,0.08)}

  /* Match global polaroid size to theme palettes */
  .flavor-global .polaroid-row{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
  .flavor-global .polaroid-card{padding:12px}
  .polaroid-palette{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}
  .polaroid-palette .polaroid-card{padding:12px}

  .token-list-wrap{margin-top:8px}
  .token-list{width:100%;border-collapse:collapse;font-size:13px}
  .token-list th,.token-list td{border:1px solid rgba(0,0,0,0.06);padding:6px 8px;text-align:left}
  .token-list th{background:rgba(0,0,0,0.02);font-weight:600}
  .token-list code{font-size:12px}
  .swatch-thumb, .swatch-thumb-text {
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:40px;height:40px;
  border-radius:var(--radius-lg,8px);
    border:2px solid rgba(0,0,0,0.08) !important;
    font-size:16px;
    font-weight:700;
    text-align:center;
    cursor:pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .swatch-thumb:hover, .swatch-thumb-text:hover {
    border-color: rgba(0,0,0,0.28) !important;
  }
  /* Let the text sample inherit theme text color; background remains the swatch color when inside .swatch-thumb */
  .swatch-thumb-text { color: var(--color-on-surface); background: transparent; display:inline-flex; align-items:center; justify-content:center; width:100%; height:100%; border-radius:var(--radius-md,4px); }
  .resolve-chain{font-size:11px;color:var(--color-on-surface, rgba(28,27,31,0.6));margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  /* Contrast cell visual states (JS will place a .contrast-badge inside the cell) */
  .list-contrast{transition:background 0.18s, color 0.18s; text-align:center}
  .contrast-badge{display:inline-block;padding:2px 8px;border-radius:var(--radius-full,9999px);font-size:12px;line-height:1;min-width:36px}
  .palette-heading {
    font-size:14px;
    color:inherit;
    opacity:0.6;
    margin-bottom:12px;
    font-weight:600;
  }
      </style>
      <div id="flavors-top">
        <h1 style="margin:8px 0">Design Tokens — Palette</h1>
  <details class="flavor-column flavor-global" ${$("global")} ${!u||u==="global"?"open":""} style="margin-bottom:18px">
        <summary style="margin:8px 0"><h3 style="display:inline;margin:0">Global</h3></summary>
  <div class="palette-heading">Core Palette</div>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${x.global.palette.map(l=>y("global",l.replace(/^--/,""),l)).join("")}
        </div>
  <div class="palette-heading">Status Palette</div>
        <div class="polaroid-row polaroid-palette" style="margin-bottom:18px;">
          ${x.global.statusPalette.map(l=>y("global",l.replace(/^--/,""),l)).join("")}
        </div>
        <div class="token-list-wrap">
          <table class="token-list">
            <thead><tr><th>Semantic</th><th>Swatch</th><th>Resolved</th><th>Base</th><th>Text color</th><th>Contrast</th></tr></thead>
            <tbody>
              ${x.global.tokens.map(l=>`
                <tr>
                  <td><code>${l}</code></td>
                  <td><span class="swatch-thumb" data-var="${l}" style="background:var(${l});"><span class="swatch-thumb-text" data-var="${l}">Aa</span></span></td>
                  <td class="list-resolved" data-var="${l}">resolving...</td>
                  <td class="list-chain" data-var="${l}">–</td>
                  <td class="list-text-color" data-var="${l}">computing...</td>
                  <td class="list-contrast" data-var="${l}">–</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        </details>
  ${D}
      </div>
    </div>
  </div>
  </div>
  `;return setTimeout(()=>{const l=document.querySelector(".tokens-doc-root[data-flavor-root]")||document.documentElement;document.querySelectorAll(".swatch-thumb, .swatch-thumb-text").forEach(t=>{t.addEventListener("click",function(n){const o=t.getAttribute("data-var");if(!o)return;let b=getComputedStyle(l).getPropertyValue(o).trim();b||(b=o),navigator.clipboard.writeText(b),t.style.outline="2px solid #007aff",setTimeout(()=>{t.style.outline=""},600)})}),document.querySelectorAll(".list-resolved").forEach(t=>{const n=t.getAttribute("data-var");if(n){const o=getComputedStyle(l).getPropertyValue(n).trim();t.textContent=o||"unset"}});const k=Array.from(l.classList).find(t=>t.indexOf("flavor-")===0);let i=k?k.replace("flavor-",""):"blueberry";const h=(t,n)=>`--palette-${t}-${n}`,e=t=>({"--color-primary":h(t,"500"),"--color-primary-darker":h(t,"800"),"--color-primary-lighter":h(t,"300"),"--color-surface":h(t,"100"),"--color-background":h(t,"200")}),r={"--color-primary":"--color-on-primary","--color-primary-darker":"--color-on-primary-darker","--color-primary-lighter":"--color-on-primary-lighter","--color-surface":"--color-on-surface","--color-background":"--color-on-background"},a=e(i);try{window.__colors_last_resolutions=window.__colors_last_resolutions||[],window.__colors_last_resolutions.push({debug:"baseMapSnapshot",flavor:i,baseMap:a,ts:Date.now()})}catch{}document.querySelectorAll(".list-chain").forEach(t=>{const n=t.getAttribute("data-var");if(n){const o=a[n]||"–";t.innerHTML=o!=="–"?`<code>${o}</code>`:"–"}}),document.querySelectorAll(".list-text-color").forEach(t=>{const n=t.getAttribute("data-var");if(n){const o=r[n];o?t.innerHTML=`<code>${o}</code>`:t.textContent="computing..."}})},300),W}function J(){function s(){return document.querySelector(".tokens-doc-root[data-flavor-root]")||document.documentElement}function u(e,r){const a=s();try{if(r&&r.nodeType===1)return getComputedStyle(r).getPropertyValue(e).trim()}catch{}return getComputedStyle(a).getPropertyValue(e).trim()}function p(e,r,a){r=r||[];var t=u(e,a);if(!t)return{chain:[e],value:"unset"};if(t=t.trim(),t.indexOf("var(")===0){var n=t.slice(4,-1).trim(),o=n.split(/,(.+)/).map(function(d){return d&&d.trim()}).filter(Boolean),b=o[0],g=o[1]||null;if(!b||r.indexOf(b)!==-1||b===e)return{chain:[e,b],value:g||t};var c=p(b,r.concat([e]),a);return{chain:[e].concat(c.chain),value:c.value}}return{chain:[e],value:t}}function y(e){if(!e)return null;e=e.trim();try{if(e.indexOf("rgb")===0){var r=e.replace(/[rgba()]/g,"").split(",").map(function(n){return parseFloat(n.trim())});return{r:r[0],g:r[1],b:r[2],a:r[3]||1}}if(e[0]==="#"){var a=e.slice(1);a.length===3&&(a=a.split("").map(function(n){return n+n}).join(""));var t=parseInt(a,16);return{r:t>>16&255,g:t>>8&255,b:t&255,a:1}}}catch{}return null}function $(e){var r=Math.round(e||0),a=(r<0?0:r>255?255:r).toString(16);return a.length===1?"0"+a:a}function x(e){try{var r=y(e);return r?"#"+$(r.r)+$(r.g)+$(r.b):null}catch{return null}}function _(e){try{if(!e||typeof e!="string")return e;var r=e.trim();if(r[0]!=="#")return e;var a=r.slice(1).toLowerCase();return a.length===3&&(a=a.split("").map(function(t){return t+t}).join("")),a.length===6&&/^[0-9a-f]{6}$/.test(a)?"#"+a:e}catch{return e}}function M(e){return e=e/255,e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4)}function S(e){return .2126*M(e.r)+.7152*M(e.g)+.0722*M(e.b)}function D(e,r){var a=S(e),t=S(r),n=Math.max(a,t),o=Math.min(a,t);return(n+.05)/(o+.05)}const W={global:{tokens:["--color-surface","--color-surface-hover","--color-surface-alt","--color-success","--color-warning","--color-error"],palette:["--palette-base-100","--palette-base-800"],statusPalette:["--palette-green-500","--palette-yellow-500","--palette-red-500"]},vanilla:{semantic:["--color-primary","--color-primary-darker"],neutrals:["--color-surface","--color-surface-hover","--color-background"],palette:["--palette-vanilla-100","--palette-vanilla-200","--palette-vanilla-500","--palette-vanilla-800","--palette-vanilla-900"],accents:[]},blueberry:{semantic:["--color-primary","--color-primary-darker"],neutrals:["--color-surface","--color-surface-hover","--color-background"],palette:["--palette-blueberry-100","--palette-blueberry-200","--palette-blueberry-500","--palette-blueberry-800","--palette-blueberry-900"],accents:[]},strawberry:{semantic:["--color-primary","--color-primary-darker"],neutrals:["--color-surface","--color-surface-hover","--color-background"],palette:["--palette-strawberry-100","--palette-strawberry-200","--palette-strawberry-500","--palette-strawberry-800","--palette-strawberry-900"],accents:[]}};function l(e){if(!e||typeof e!="string")return null;const r=e.match(/^--palette-([^-]+)-(\d+)$/);if(r)return r[1].charAt(0).toUpperCase()+r[1].slice(1)+" "+r[2];const a=e.match(/^--palette-([^-]+)-([a-zA-Z]+)$/);return a?a[1].charAt(0).toUpperCase()+a[1].slice(1)+" "+a[2]:e.indexOf("--")===0?e.replace(/^--/,"").split("-").map(function(t){return t.charAt(0).toUpperCase()+t.slice(1)}).join(" "):e}function k(){document.querySelectorAll(".polaroid-card").forEach(function(e){var r=e.getAttribute("data-var");try{for(var a=s(),t=e;t&&t!==a&&!(t.classList&&Array.from(t.classList).some(function(o){return o.indexOf("flavor-")===0||o.indexOf("theme-")===0}));)t=t.parentElement;var n=r?p(r,void 0,t||a):null}catch(o){console.error("Error resolving polaroid token:",r,o)}}),document.querySelectorAll("[data-var]").forEach(function(e){var r=e.getAttribute("data-var");if(r)try{for(var a=e,t=s();a&&a!==t&&!(a.classList&&Array.from(a.classList).some(function(m){return m.indexOf("flavor-")===0||m.indexOf("theme-")===0}));)a=a.parentElement;var n=!1;a&&a.classList&&a.classList.contains("flavor-global")&&(n=!0);var o=null;if(n){var b={"--color-surface":"--palette-base-100","--color-surface-alt":"--palette-base-800","--color-success":"--palette-green-500","--color-warning":"--palette-yellow-500","--color-error":"--palette-red-500"};if(b[r]){var g=b[r];try{var c=p(g,void 0,t);o={chain:[r,g],value:c&&c.value?c.value:getComputedStyle(t).getPropertyValue(g).trim()||"unset"}}catch{o={chain:[r,g],value:getComputedStyle(document.documentElement).getPropertyValue(g).trim()||"unset"}}}else o=p(r,void 0,t)}else o=p(r,void 0,a||t);var d=o.value;if(e.classList.contains("list-resolved")&&(e.textContent=d||"unset"),e.classList.contains("list-chain")){var P=!1;try{var z=e.querySelector&&e.querySelector("code");z&&z.textContent&&z.textContent.indexOf("--palette-")===0&&(P=!0)}catch{}if(!P&&o&&o.value&&o.value!=="unset"){var O=null;try{if(o.chain&&Array.isArray(o.chain))for(var B=0;B<o.chain.length;B++){var C=o.chain[B];if(C&&typeof C=="string"&&C.indexOf("--palette-")===0){O=l(C);break}}}catch{}if(!O){var T=o.value,K={};try{Object.keys(W).forEach(function(m){var F=W[m];F&&Array.isArray(F.palette)&&F.palette.forEach(function(j){try{var q=getComputedStyle(s()).getPropertyValue(j).trim();if(q&&q!=="unset"){var re=_(x(q)||q);re&&(K[re.toLowerCase()]=l(j))}}catch{}})}),["--palette-base-100","--palette-base-500","--palette-base-800","--palette-green-500","--palette-yellow-500","--palette-red-500","--palette-blueberry-300","--palette-vanilla-300","--palette-strawberry-300"].forEach(function(m){try{var F=getComputedStyle(s()).getPropertyValue(m).trim();if(F&&F!=="unset"){var j=_(x(F)||F);j&&(K[j.toLowerCase()]=l(m))}}catch{}});var N=_(x(T)||T);N&&(O=K[(N||"").toLowerCase()])}catch{}}if(O)e.innerHTML="<code>"+O+"</code>";else{try{window.__colors_last_resolutions=window.__colors_last_resolutions||[],window.__colors_last_resolutions.push({token:r,resolved:o&&o.value,chain:o&&o.chain,ctx:a&&a.className||null,ts:Date.now()})}catch{}var U="";try{o&&Array.isArray(o.chain)&&(U='<br/><small style="color:#aaa">'+o.chain.join(" → ")+"</small>"),o&&o.value&&(U+='<br/><small style="color:#aaa">'+o.value+"</small>")}catch{U=""}e.innerHTML='<small style="color:#888">Unknown base</small>'+U}}else e.innerHTML="–"}if(e.classList.contains("swatch-thumb")&&(d&&d!=="unset"?(e.style.background=d,e.style.backgroundColor=d):(e.style.background="transparent",e.style.backgroundColor="transparent")),e.classList.contains("list-text-color")&&d&&d!=="unset"){var f=null,L=null;if(r.includes("--palette-"))try{var A=y(d);if(A){var Q=S(A);f=Q>.5?"#000000":"#ffffff"}else f="#ffffff";L=_(f)}catch{f="#ffffff",L="#ffffff"}else{if(r.startsWith("--color-")){var ae=r.replace(/^--color-/,""),V="--color-on-"+ae,X=p(V,void 0,a||s());X.value&&X.value!=="unset"&&(f=X.value,L=V)}if(!f&&!r.includes("primary")){var Y=p("--color-on-background",void 0,a||s());Y.value&&Y.value!=="unset"&&(f=Y.value,L="--color-on-background")}if(!f||f==="unset")try{var A=y(d);if(A){var Q=S(A);f=Q>.5?"#000000":"#ffffff",L=_(f)}else f="#ffffff",L="#ffffff"}catch{f="#ffffff",L="#ffffff"}}e.textContent=L||"unset";var ee=e.parentElement.querySelector(".swatch-thumb-text");if(ee&&f&&f!=="unset"){var oe=_(f);ee.style.color=oe}var v=e.parentElement.querySelector(".list-contrast");if(v&&d&&f)try{var A=y(d),te=y(f);if(A&&te){var E=D(A,te);v.textContent=E.toFixed(1)+":1",E>=7?(v.style.color="#006600",v.style.fontWeight="bold"):E>=4.5?(v.style.color="#006600",v.style.fontWeight="normal"):E>=3?(v.style.color="#cc6600",v.style.fontWeight="normal"):(v.style.color="#cc0000",v.style.fontWeight="normal");var w=document.createElement("span");w.className="contrast-badge",w.textContent=E.toFixed(1)+":1",w.style.background="#FFFFFF",E>=7?(w.style.color="#006600",w.style.fontWeight="700"):E>=4.5?(w.style.color="#006600",w.style.fontWeight="600"):E>=3?(w.style.color="#cc6600",w.style.fontWeight="600"):(w.style.color="#a00000",w.style.fontWeight="600"),v.innerHTML="",v.appendChild(w)}}catch{v.textContent="–",v.style.color="",v.style.fontWeight=""}}}catch(m){console.error("Error processing element:",e,m),e.classList.contains("list-resolved")&&(e.textContent="error")}})}function i(){var e=document.querySelectorAll(".polaroid-card .swatch-text");e.forEach(function(r){try{var a=r.closest(".polaroid-card");if(!a)return;for(var t=s(),n=a;n&&n!==t&&!(n.classList&&Array.from(n.classList).some(function(T){return T.indexOf("flavor-")===0||T.indexOf("theme-")===0}));)n=n.parentElement;var o=a.getAttribute("data-var");if(!o)return;var b=p(o,void 0,n||t),g=b.value;if(g&&g!=="unset"){var c=null;if(o.includes("--palette-"))try{var d=y(g);if(d){var P=S(d);c=P>.5?"#000000":"#ffffff"}else c="#ffffff"}catch{c="#ffffff"}else{var z=o.replace(/^--color-/,"").replace(/^palette-/,""),O="--color-on-"+z,B=p(O,void 0,n||t);if(c=B.value,(!c||c==="unset")&&(o.includes("primary")&&(c=p("--color-on-primary",void 0,n||t).value),(!c||c==="unset")&&(c=p("--color-on-background",void 0,n||t).value)),!c||c==="unset")try{var d=y(g);if(d){var P=S(d);c=P>.5?"#000000":"#ffffff"}else c="#ffffff"}catch{c="#ffffff"}}try{var C=a.querySelector(".swatch-thumb-text");C&&(c&&c!=="unset"?C.style.color=_(c):C.style.color="")}catch{}}}catch{}})}function h(){k(),i()}return h}const ie={title:"0. Tokens/Colors",parameters:{viewMode:"docs"}},H={name:"Global",render:()=>Z(),play:async()=>{const s=J();console.log("Colors story: executing color logic"),setTimeout(()=>{console.log("Colors story: first execution"),s()},100),setTimeout(()=>{console.log("Colors story: second execution"),s()},300),setTimeout(()=>{console.log("Colors story: third execution"),s()},600),setTimeout(()=>{try{if(window.__colors_observer){try{window.__colors_observer.disconnect()}catch{}window.__colors_observer=null}const u=new MutationObserver(p=>{p.forEach(y=>{if(y.attributeName==="class"||y.attributeName==="data-color-scheme"){console.log("Colors story: root attribute change detected, re-executing");try{s()}catch($){console.error($)}}})});u.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-color-scheme"]}),window.__colors_observer=u}catch{}},100),setTimeout(()=>{try{s()}catch(u){console.error(u)}},1200)}},G={name:"Theme: Blueberry",render:()=>Z({onlyFlavor:"blueberry"}),play:async()=>{const s=J();setTimeout(s,100),setTimeout(s,300),setTimeout(s,600),setTimeout(s,1200),setTimeout(()=>{try{window.__colors_observer&&(window.__colors_observer.disconnect(),window.__colors_observer=null);const u=new MutationObserver(()=>{try{s()}catch{}});u.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-color-scheme"]}),window.__colors_observer=u}catch{}},120)}},I={name:"Theme: Strawberry",render:()=>Z({onlyFlavor:"strawberry"}),play:async()=>{const s=J();setTimeout(s,100),setTimeout(s,300),setTimeout(s,600),setTimeout(s,1200)}},R={name:"Theme: Vanilla",render:()=>Z({onlyFlavor:"vanilla"}),play:async()=>{const s=J();setTimeout(s,100),setTimeout(s,300),setTimeout(s,600)}};H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: 'Global',
  render: () => renderColors(),
  play: async () => {
    const execute = executeColorLogic();
    console.log('Colors story: executing color logic');

    // Wait a bit for DOM to be ready and execute multiple times
    setTimeout(() => {
      console.log('Colors story: first execution');
      execute();
    }, 100);
    setTimeout(() => {
      console.log('Colors story: second execution');
      execute();
    }, 300);
    setTimeout(() => {
      console.log('Colors story: third execution');
      execute();
    }, 600);

    // Set up mutation observer for theme changes
    setTimeout(() => {
      try {
        // avoid multiple observers across hot reloads
        if (window.__colors_observer) {
          try {
            window.__colors_observer.disconnect();
          } catch (e) {}
          window.__colors_observer = null;
        }
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' || mutation.attributeName === 'data-color-scheme') {
              console.log('Colors story: root attribute change detected, re-executing');
              try {
                execute();
              } catch (e) {
                console.error(e);
              }
            }
          });
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-color-scheme']
        });
        window.__colors_observer = observer;
      } catch (e) {/* ignore */}
    }, 100);
    // Final delayed run to catch late theme initialization
    setTimeout(() => {
      try {
        execute();
      } catch (e) {
        console.error(e);
      }
    }, 1200);
  }
}`,...H.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: 'Theme: Blueberry',
  render: () => renderColors({
    onlyFlavor: 'blueberry'
  }),
  play: async () => {
    const execute = executeColorLogic();
    setTimeout(execute, 100);
    setTimeout(execute, 300);
    setTimeout(execute, 600);
    setTimeout(execute, 1200);
    // ensure observer runs for late theme changes
    setTimeout(() => {
      try {
        if (window.__colors_observer) {
          window.__colors_observer.disconnect();
          window.__colors_observer = null;
        }
        const obs = new MutationObserver(() => {
          try {
            execute();
          } catch (e) {}
        });
        obs.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-color-scheme']
        });
        window.__colors_observer = obs;
      } catch (e) {}
    }, 120);
  }
}`,...G.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: 'Theme: Strawberry',
  render: () => renderColors({
    onlyFlavor: 'strawberry'
  }),
  play: async () => {
    const execute = executeColorLogic();
    setTimeout(execute, 100);
    setTimeout(execute, 300);
    setTimeout(execute, 600);
    setTimeout(execute, 1200);
  }
}`,...I.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: 'Theme: Vanilla',
  render: () => renderColors({
    onlyFlavor: 'vanilla'
  }),
  play: async () => {
    const execute = executeColorLogic();
    setTimeout(execute, 100);
    setTimeout(execute, 300);
    setTimeout(execute, 600);
  }
}`,...R.parameters?.docs?.source}}};const ce=["Colors","Blueberry","Strawberry","Vanilla"];export{G as Blueberry,H as Colors,I as Strawberry,R as Vanilla,ce as __namedExportsOrder,ie as default};
