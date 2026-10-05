/* ============================================================
   AiFeng · 资源导航 — 主逻辑
   ============================================================ */

/* ================= 设备性能检测 ================= */
(function(){
  var lite = false;
  var search = window.location.search || '';
  if (/[?&]full=1/.test(search)){ lite = false; }
  else if (/[?&]lite=1/.test(search)){ lite = true; }
  else {
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4){ lite = true; }
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4){ lite = true; }
    if (navigator.connection && navigator.connection.saveData === true){ lite = true; }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ lite = true; }
    var ua = navigator.userAgent || '';
    if (/iPhone OS (7|8|9|10|11|12)_/.test(ua)){ lite = true; }
    var hasMemInfo = typeof navigator.deviceMemory === 'number';
    var hasCpuInfo = typeof navigator.hardwareConcurrency === 'number';
    if (!hasMemInfo && !hasCpuInfo){
      var w = Math.min(window.screen ? window.screen.width : 9999, window.screen ? window.screen.height : 9999);
      if (w <= 360){ lite = true; }
    }
  }
  if (lite){
    var root = document.documentElement;
    if (root.classList) root.classList.add('perf-lite');
    else root.className += ' perf-lite';
  }
})();

/* ================= 主题跟随系统 ================= */
(function(){
  var root = document.documentElement;
  var mq = null;
  try {
    mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  } catch(e) { mq = null; }

  function apply(isDark){
    if (isDark) {
      if (root.classList) root.classList.add('dark');
      else if ((' ' + root.className + ' ').indexOf(' dark ') < 0) root.className += ' dark';
    } else {
      if (root.classList) root.classList.remove('dark');
      else root.className = (' ' + root.className + ' ').replace(' dark ', ' ').replace(/^\s+|\s+$/g,'');
    }
  }

  if (mq){
    apply(mq.matches);
    var listener = function(e){ apply(e.matches); };
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if (mq.addListener) mq.addListener(listener);
  }
})();

/* ================= 数据管理 ================= */
var STORAGE_KEY = '__af_data__';
var DATA_VERSION = 2;

function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

var DEFAULT_ICONS = {
  '原·创': '🏠',
  '网络·工具': '⚒',
  '聆听·音乐': '🎵',
  '影视·追剧': '🎬',
  '系统·软件': '💻',
  '资源·站点': '📦',
  '开源·脚本': '⚙️',
  '其·他': '📌'
};

function fixMissingIcons(data){
  if (!Array.isArray(data)) return data;
  for (var i = 0; i < data.length; i++){
    if (!data[i].icon){
      data[i].icon = DEFAULT_ICONS[data[i].category] || '📁';
    }
  }
  return data;
}

/* 数据版本迁移 */
function migrateData(parsed){
  if (!parsed || typeof parsed !== 'object') return parsed;
  if (Array.isArray(parsed)){
    fixMissingIcons(parsed);
    return { version: DATA_VERSION, data: parsed };
  }
  if (parsed.version === undefined){
    parsed.version = DATA_VERSION;
  }
  if (Array.isArray(parsed.data)){
    fixMissingIcons(parsed.data);
  }
  return parsed;
}

/* 源数据（来自 data.js） */
function getSourceData(){
  var src = window.DATA;
  if (Array.isArray(src) && src.length > 0) return deepClone(src);
  return [];
}

function loadData(){
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      parsed = migrateData(parsed);
      var arr = Array.isArray(parsed) ? parsed : parsed.data;
      if (Array.isArray(arr) && arr.length > 0) {
        return arr;
      }
    }
  } catch(e){}
  return getSourceData();
}

function saveData(data){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: DATA_VERSION,
      data: data
    }));
    return true;
  } catch(e){
    return false;
  }
}

function clearData(){
  try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
}

var WORK_DATA = loadData();
fixMissingIcons(WORK_DATA);

/* ================= 访问统计 / 最近访问 ================= */
var STATS_KEY = '__af_stats__';
var STATS_MAX = 200;

function loadStats(){
  try {
    var raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e){}
  return { freq: {}, recent: [] };
}
function saveStats(stats){
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e){}
}
function recordVisit(item){
  if (!item || !item.url) return;
  var stats = loadStats();
  var key = item.url;
  stats.freq[key] = (stats.freq[key] || 0) + 1;
  stats.recent = stats.recent.filter(function(u){ return u !== key; });
  stats.recent.unshift(key);
  if (stats.recent.length > 20) stats.recent.length = 20;

  var keys = Object.keys(stats.freq);
  if (keys.length > STATS_MAX){
    keys.sort(function(a,b){ return stats.freq[b] - stats.freq[a]; });
    var keep = {};
    for (var i = 0; i < 100 && i < keys.length; i++){
      keep[keys[i]] = stats.freq[keys[i]];
    }
    stats.freq = keep;
  }

  saveStats(stats);
}
function getUrlCount(url){
  var stats = loadStats();
  return stats.freq[url] || 0;
}
function getRecentItems(max){
  var stats = loadStats();
  var items = [];
  for (var i = 0; i < stats.recent.length && items.length < max; i++){
    var url = stats.recent[i];
    var item = findItemByUrl(url);
    if (item) items.push(item);
  }
  return items;
}
function findItemByUrl(url){
  for (var gi = 0; gi < WORK_DATA.length; gi++){
    var group = WORK_DATA[gi];
    for (var ii = 0; ii < group.items.length; ii++){
      if (group.items[ii].url === url) return group.items[ii];
    }
  }
  return null;
}

/* ================= 工具函数 ================= */
function hexToRgba(hex, alpha){
  hex = String(hex).replace('#','');
  if (hex.length === 3){
    hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
  }
  var r = parseInt(hex.substring(0,2),16);
  var g = parseInt(hex.substring(2,4),16);
  var b = parseInt(hex.substring(4,6),16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}
function hasClass(el, cls){
  if (!el) return false;
  if (el.classList) return el.classList.contains(cls);
  return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
}
function addClass(el, cls){
  if (!el) return;
  if (el.classList) el.classList.add(cls);
  else if ((' ' + el.className + ' ').indexOf(' ' + cls + ' ') < 0) el.className += ' ' + cls;
}
function removeClass(el, cls){
  if (!el) return;
  if (el.classList) el.classList.remove(cls);
  else el.className = (' ' + el.className + ' ').replace(' ' + cls + ' ', ' ').replace(/^\s+|\s+$/g,'');
}
function toggleClass(el, cls, force){
  if (force === undefined){
    if (hasClass(el, cls)) removeClass(el, cls); else addClass(el, cls);
  } else if (force){ addClass(el, cls); } else { removeClass(el, cls); }
}
function addEvent(el, type, handler, opts){
  if (!el) return;
  if (el.addEventListener) el.addEventListener(type, handler, opts || false);
  else if (el.attachEvent) el.attachEvent('on' + type, handler);
  else el['on' + type] = handler;
}
function isTyping(el){
  if (!el) return false;
  var tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}
function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, function(m){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m];
  });
}

/* ================= DOM 引用 ================= */
var app       = document.getElementById('app');
var qEl       = document.getElementById('q');
var searchWrap= document.getElementById('searchWrap');
var searchSuggest = document.getElementById('searchSuggest');
var clearBtn  = document.getElementById('clearBtn');
var searchBtn = document.getElementById('searchBtn');
var statSite  = document.getElementById('statSite');
var statCat   = document.getElementById('statCat');
var backTop   = document.getElementById('backTop');
var modal     = document.getElementById('modal');
var modalTitle= document.getElementById('modalTitle');
var modalBody = document.getElementById('modalBody');
var pwdModal  = document.getElementById('pwdModal');
var pwdInput  = document.getElementById('pwdInput');
var pwdError  = document.getElementById('pwdError');
var pwdConfirm= document.getElementById('pwdConfirm');
var editModal = document.getElementById('editModal');
var editTitle = document.getElementById('editTitle');
var editBody  = document.getElementById('editBody');
var adminBar  = document.getElementById('adminBar');
var adminEntry= document.getElementById('adminEntry');
var quickArea = document.getElementById('quickArea');
var quickTitle= document.getElementById('quickTitle');
var quickList = document.getElementById('quickList');
var shortcutPanel = document.getElementById('shortcutPanel');
var btnSave   = document.getElementById('btnSave');
var btnExportData = document.getElementById('btnExportData');
var btnExit   = document.getElementById('btnExit');
var btnAddCat = document.getElementById('btnAddCat');
var btnAddItem= document.getElementById('btnAddItem');

/* ================= 通用弹窗 ================= */
function openModal(title, bodyEl){
  modalTitle.textContent = title;
  while (modalBody.firstChild) modalBody.removeChild(modalBody.firstChild);
  if (typeof bodyEl === 'string'){ modalBody.innerHTML = bodyEl; }
  else if (bodyEl){ modalBody.appendChild(bodyEl); }
  addClass(modal, 'show');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(){
  removeClass(modal, 'show');
  modal.setAttribute('aria-hidden', 'true');
}
function closePwdModal(){
  removeClass(pwdModal, 'show');
  pwdModal.setAttribute('aria-hidden', 'true');
  pwdError.style.display = 'none';
  pwdInput.value = '';
}
function closeEditModal(){
  removeClass(editModal, 'show');
  editModal.setAttribute('aria-hidden', 'true');
}

function openLinkPopup(item){
  var opts = item.popup || [];
  var frag = document.createDocumentFragment();
  for (var oi = 0; oi < opts.length; oi++){
    var opt = opts[oi];
    var a = document.createElement('a');
    a.className = 'modal-opt';
    a.href = opt.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    var ic = document.createElement('div');
    ic.className = 'opt-ic';
    ic.textContent = opt.icon || '🔗';
    var tx = document.createElement('div');
    tx.className = 'opt-tx';
    var b = document.createElement('b');
    b.textContent = opt.label || '打开';
    var s = document.createElement('span');
    s.textContent = opt.desc || '';
    tx.appendChild(b); tx.appendChild(s);
    var arw = document.createElement('div');
    arw.className = 'opt-arw';
    arw.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    a.appendChild(ic); a.appendChild(tx); a.appendChild(arw);
    frag.appendChild(a);
  }
  openModal(item.name, frag);
}

/* ================= 管理员逻辑 ================= */
var ADMIN_PASSWORD = 'admin';
var ADMIN_SESSION_KEY = '__af_admin_ok__';

function checkPwd(input){
  return String(input) === ADMIN_PASSWORD;
}
function isAdminSession(){
  try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'; } catch(e){ return false; }
}
function setAdminSession(){
  try { sessionStorage.setItem(ADMIN_SESSION_KEY, '1'); } catch(e){}
}
function clearAdminSession(){
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch(e){}
}

var ADMIN_MODE = false;

function enterAdminMode(){
  ADMIN_MODE = true;
  addClass(document.body, 'admin-mode');
  addClass(adminBar, 'show');
  render();
}
function exitAdminMode(){
  ADMIN_MODE = false;
  removeClass(document.body, 'admin-mode');
  removeClass(adminBar, 'show');
  render();
}

function openPwdModal(){
  if (isAdminSession()){ enterAdminMode(); return; }
  addClass(pwdModal, 'show');
  pwdModal.setAttribute('aria-hidden', 'false');
  setTimeout(function(){ try { pwdInput.focus(); } catch(e){} }, 50);
}
function tryPwd(){
  var v = pwdInput.value || '';
  if (checkPwd(v)){
    setAdminSession();
    closePwdModal();
    enterAdminMode();
    toast('已进入编辑模式');
  } else {
    pwdError.style.display = 'block';
    pwdInput.value = '';
    pwdInput.focus();
  }
}

addEvent(adminEntry, 'click', function(e){
  e = e || window.event;
  if (e.preventDefault) e.preventDefault();
  openPwdModal();
});

addEvent(pwdConfirm, 'click', tryPwd);
addEvent(pwdInput, 'keydown', function(e){
  e = e || window.event;
  var key = e.key || e.keyCode;
  if (key === 'Enter' || key === 13){ tryPwd(); }
});
(function(){
  var closers = document.querySelectorAll('[data-pwd-close]');
  for (var i = 0; i < closers.length; i++){
    addEvent(closers[i], 'click', closePwdModal);
  }
})();

(function(){
  var closers = document.querySelectorAll('#modal [data-close]');
  for (var i = 0; i < closers.length; i++){
    addEvent(closers[i], 'click', closeModal);
  }
})();
(function(){
  var closers = document.querySelectorAll('#editModal [data-edit-close]');
  for (var i = 0; i < closers.length; i++){
    addEvent(closers[i], 'click', closeEditModal);
  }
})();

/* 快捷键面板关闭 */
(function(){
  var closers = document.querySelectorAll('#shortcutPanel [data-sc-close]');
  for (var i = 0; i < closers.length; i++){
    addEvent(closers[i], 'click', function(){
      removeClass(shortcutPanel, 'show');
    });
  }
})();

/* ================= 搜索建议 ================= */
var suggestIndex = -1;
var suggestItems = [];

function buildSuggest(keyword){
  var kw = String(keyword || '').toLowerCase().replace(/^\s+|\s+$/g,'');
  if (!kw) return [];
  var results = [];
  for (var gi = 0; gi < WORK_DATA.length; gi++){
    var group = WORK_DATA[gi];
    for (var ii = 0; ii < group.items.length; ii++){
      var item = group.items[ii];
      if (item.placeholder) continue;
      var name = String(item.name || '').toLowerCase();
      var desc = String(item.desc || '').toLowerCase();
      var cat  = String(group.category || '').toLowerCase();
      var url  = String(item.url || '').toLowerCase();
      if (name.indexOf(kw) > -1 || desc.indexOf(kw) > -1 || cat.indexOf(kw) > -1 || url.indexOf(kw) > -1){
        results.push({
          item: item,
          group: group,
          score: name.indexOf(kw) === 0 ? 3 : (name.indexOf(kw) > -1 ? 2 : 1)
        });
      }
      if (results.length >= 30) break;
    }
    if (results.length >= 30) break;
  }
  results.sort(function(a,b){ return b.score - a.score; });
  return results.slice(0, 12);
}

function renderSuggest(keyword){
  suggestItems = buildSuggest(keyword);
  suggestIndex = -1;
  while (searchSuggest.firstChild) searchSuggest.removeChild(searchSuggest.firstChild);

  if (!keyword || !keyword.replace(/^\s+|\s+$/g,'')){
    removeClass(searchSuggest, 'show');
    return;
  }

  if (suggestItems.length === 0){
    var empty = document.createElement('div');
    empty.className = 'suggest-empty';
    empty.innerHTML = '没有匹配的卡片，按 <b>回车</b> 搜全网';
    searchSuggest.appendChild(empty);
    addClass(searchSuggest, 'show');
    return;
  }

  for (var i = 0; i < suggestItems.length; i++){
    var r = suggestItems[i];
    var item = r.item;
    var a = document.createElement('a');
    a.className = 'suggest-item';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    var ic = document.createElement('span');
    ic.className = 'si-icon';
    ic.textContent = '🌐';

    var meta = document.createElement('span');
    meta.className = 'si-meta';
    var n = document.createElement('div');
    n.className = 'si-name';
    n.textContent = item.name;
    var d = document.createElement('div');
    d.className = 'si-desc';
    d.textContent = r.group.category + ' · ' + (item.desc || '');
    meta.appendChild(n);
    meta.appendChild(d);

    a.appendChild(ic);
    a.appendChild(meta);
    searchSuggest.appendChild(a);

    (function(it){
      addEvent(a, 'click', function(){
        recordVisit(it);
        removeClass(searchSuggest, 'show');
      });
    })(item);
  }
  addClass(searchSuggest, 'show');
}

function moveSuggest(dir){
  if (!suggestItems.length) return;
  var nodes = searchSuggest.querySelectorAll('.suggest-item');
  if (!nodes.length) return;
  suggestIndex += dir;
  if (suggestIndex < 0) suggestIndex = nodes.length - 1;
  if (suggestIndex >= nodes.length) suggestIndex = 0;
  for (var i = 0; i < nodes.length; i++){
    if (i === suggestIndex) addClass(nodes[i], 'active');
    else removeClass(nodes[i], 'active');
  }
  var active = nodes[suggestIndex];
  if (active && active.scrollIntoView){
    try { active.scrollIntoView({ block: 'nearest' }); } catch(e){}
  }
}

function openSuggest(){
  var nodes = searchSuggest.querySelectorAll('.suggest-item');
  if (suggestIndex >= 0 && nodes[suggestIndex]){
    nodes[suggestIndex].click();
  } else if (nodes.length > 0){
    nodes[0].click();
  } else {
    doSearch();
  }
}

/* ================= 编辑弹窗 ================= */
function openEditItemModal(gi, ii){
  var isNew = (ii === -1);
  var group = WORK_DATA[gi];
  var item = isNew ? { name: '', url: '', desc: '' } : group.items[ii];

  var html = ''
    + '<div class="form-row">'
    +   '<label>名称</label>'
    +   '<input type="text" id="fName" placeholder="例如：百度" value="' + escapeHtml(item.name || '') + '">'
    +   '<div class="error">请填写名称</div>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label>URL</label>'
    +   '<input type="text" id="fUrl" placeholder="https://..." value="' + escapeHtml(item.url || '') + '">'
    +   '<div class="hint">以 http:// 或 https:// 开头</div>'
    +   '<div class="error">请填写有效的 URL</div>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label>描述</label>'
    +   '<textarea id="fDesc" placeholder="简短描述">' + escapeHtml(item.desc || '') + '</textarea>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label>所属分类</label>'
    +   '<select id="fCat">';
  for (var i = 0; i < WORK_DATA.length; i++){
    html += '<option value="' + i + '"' + (i === gi ? ' selected' : '') + '>' + escapeHtml(WORK_DATA[i].category) + '</option>';
  }
  html += '</select></div>'
    + '<div class="form-actions">'
    +   '<button type="button" data-edit-close>取消</button>'
    +   '<button type="button" class="primary" id="fSave">' + (isNew ? '添加' : '保存') + '</button>'
    + '</div>';

  editTitle.textContent = isNew ? '添加链接' : '编辑链接';
  editBody.innerHTML = html;
  addClass(editModal, 'show');
  editModal.setAttribute('aria-hidden', 'false');

  var fName = document.getElementById('fName');
  var fUrl  = document.getElementById('fUrl');
  var fDesc = document.getElementById('fDesc');
  var fCat  = document.getElementById('fCat');
  var fSave = document.getElementById('fSave');

  function doSave(){
    var name = (fName.value || '').replace(/^\s+|\s+$/g,'');
    var url  = (fUrl.value || '').replace(/^\s+|\s+$/g,'');
    var desc = (fDesc.value || '').replace(/^\s+|\s+$/g,'');
    var catIdx = parseInt(fCat.value, 10);

    var hasError = false;
    if (!name){ addClass(fName.parentNode, 'has-error'); hasError = true; }
    else { removeClass(fName.parentNode, 'has-error'); }

    if (!url || !/^https?:\/\//i.test(url)){ addClass(fUrl.parentNode, 'has-error'); hasError = true; }
    else { removeClass(fUrl.parentNode, 'has-error'); }

    if (hasError) return;

    var newItem = { name: name, url: url, desc: desc };
    if (item.popup) newItem.popup = item.popup;

    if (isNew){
      WORK_DATA[catIdx].items.push(newItem);
    } else {
      if (catIdx !== gi){
        WORK_DATA[gi].items.splice(ii, 1);
        WORK_DATA[catIdx].items.push(newItem);
      } else {
        WORK_DATA[gi].items[ii] = newItem;
      }
    }

    saveData(WORK_DATA);
    closeEditModal();
    render();
    toast(isNew ? '已添加' : '已保存');
  }

  addEvent(fSave, 'click', doSave);
  addEvent(fName, 'keydown', function(e){
    if ((e.key || e.keyCode) === 'Enter' || (e.key || e.keyCode) === 13){ e.preventDefault(); fUrl.focus(); }
  });
  addEvent(fUrl, 'keydown', function(e){
    if ((e.key || e.keyCode) === 'Enter' || (e.key || e.keyCode) === 13){ e.preventDefault(); fDesc.focus(); }
  });

  setTimeout(function(){ try { fName.focus(); } catch(e){} }, 50);
}

function openEditCatModal(gi){
  var isNew = (gi === -1);
  var cat = isNew ? { category: '', color: '#60a5fa', icon: '📁' } : WORK_DATA[gi];

  var colors = ['#60a5fa','#38bdf8','#818cf8','#7dd3fc','#93c5fd','#a5b4fc','#c4b5fd','#94a3b8','#f472b6','#fb923c','#4ade80','#facc15'];
  var colorHtml = '<div class="icon-picker" id="colorPicker">';
  for (var ci = 0; ci < colors.length; ci++){
    colorHtml += '<button type="button" data-color="' + colors[ci] + '" style="background:' + colors[ci] + ';border-color:' + (cat.color === colors[ci] ? '#fff' : 'transparent') + ';box-shadow:' + (cat.color === colors[ci] ? '0 0 0 2px ' + colors[ci] : 'none') + '" class="' + (cat.color === colors[ci] ? 'active' : '') + '"></button>';
  }
  colorHtml += '</div>';

  var icons = ['🏠','⚒','🎵','🎬','💻','📦','⚙️','📌','🌐','🔧','📁','⭐','🔥','💡','🧭','📊','🎨','📝','🛜','🔗'];
  var iconHtml = '<div class="icon-picker" id="iconPicker">';
  for (var ii = 0; ii < icons.length; ii++){
    iconHtml += '<button type="button" data-icon="' + icons[ii] + '" class="' + (cat.icon === icons[ii] ? 'active' : '') + '">' + icons[ii] + '</button>';
  }
  iconHtml += '</div>';

  var html = ''
    + '<div class="form-row">'
    +   '<label>分类名称</label>'
    +   '<input type="text" id="cName" placeholder="例如：原·创" value="' + escapeHtml(cat.category || '') + '">'
    +   '<div class="error">请填写分类名称</div>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label>分类图标</label>'
    +   iconHtml
    + '</div>'
    + '<div class="form-row">'
    +   '<label>主题色</label>'
    +   colorHtml
    + '</div>'
    + '<div class="form-actions">'
    +   '<button type="button" data-edit-close>取消</button>'
    +   '<button type="button" class="primary" id="cSave">' + (isNew ? '添加' : '保存') + '</button>'
    + '</div>';

  editTitle.textContent = isNew ? '添加分类' : '编辑分类';
  editBody.innerHTML = html;
  addClass(editModal, 'show');
  editModal.setAttribute('aria-hidden', 'false');

  var cName = document.getElementById('cName');
  var cSave = document.getElementById('cSave');
  var colorPicker = document.getElementById('colorPicker');
  var iconPicker = document.getElementById('iconPicker');
  var chosenColor = cat.color || '#60a5fa';
  var chosenIcon = cat.icon || '📁';

  addEvent(colorPicker, 'click', function(e){
    e = e || window.event;
    var t = e.target || e.srcElement;
    if (t && t.tagName === 'BUTTON'){
      var btns = colorPicker.querySelectorAll('button');
      for (var k = 0; k < btns.length; k++){
        removeClass(btns[k], 'active');
        btns[k].style.boxShadow = 'none';
        btns[k].style.borderColor = 'transparent';
      }
      addClass(t, 'active');
      t.style.boxShadow = '0 0 0 2px ' + t.getAttribute('data-color');
      t.style.borderColor = '#fff';
      chosenColor = t.getAttribute('data-color');
    }
  });

  addEvent(iconPicker, 'click', function(e){
    e = e || window.event;
    var t = e.target || e.srcElement;
    if (t && t.tagName === 'BUTTON'){
      var btns = iconPicker.querySelectorAll('button');
      for (var k = 0; k < btns.length; k++) removeClass(btns[k], 'active');
      addClass(t, 'active');
      chosenIcon = t.getAttribute('data-icon') || '📁';
    }
  });

  function doSave(){
    var name = (cName.value || '').replace(/^\s+|\s+$/g,'');
    if (!name){ addClass(cName.parentNode, 'has-error'); return; }
    removeClass(cName.parentNode, 'has-error');

    if (isNew){
      WORK_DATA.push({ category: name, icon: chosenIcon, color: chosenColor, items: [] });
    } else {
      WORK_DATA[gi].category = name;
      WORK_DATA[gi].icon = chosenIcon;
      WORK_DATA[gi].color = chosenColor;
    }
    saveData(WORK_DATA);
    closeEditModal();
    render();
    toast(isNew ? '已添加分类' : '已保存');
  }

  addEvent(cSave, 'click', doSave);
  addEvent(cName, 'keydown', function(e){
    if ((e.key || e.keyCode) === 'Enter' || (e.key || e.keyCode) === 13){ doSave(); }
  });
  setTimeout(function(){ try { cName.focus(); } catch(e){} }, 50);
}

/* ================= 渲染 ================= */
function render(){
  var frag = document.createDocumentFragment();
  var totalSites = 0;

  for (var gi = 0; gi < WORK_DATA.length; gi++){
    var group = WORK_DATA[gi];
    var sec = document.createElement('section');
    sec.className = 'group';
    sec.style.setProperty('--c', group.color);
    sec.style.setProperty('--c-bg', hexToRgba(group.color, 0.15));
    sec.style.setProperty('--c-border', hexToRgba(group.color, 0.3));
    sec.style.animationDelay = (gi * 0.045) + 's';

    var head = document.createElement('div');
    head.className = 'group-head';

    var groupIcon = document.createElement('span');
    groupIcon.className = 'group-icon';
    groupIcon.setAttribute('aria-hidden', 'true');
    groupIcon.textContent = group.icon || '📁';

    var h2 = document.createElement('h2');
    h2.textContent = group.category;
    var em = document.createElement('em');
    em.textContent = group.items.length + ' 个';

    var catEdit = document.createElement('span');
    catEdit.className = 'group-edit';

    var btnUpCat = document.createElement('button');
    btnUpCat.type = 'button'; btnUpCat.title = '上移分类'; btnUpCat.textContent = '↑';
    btnUpCat.setAttribute('data-act', 'up-cat'); btnUpCat.setAttribute('data-gi', gi);
    if (gi === 0) btnUpCat.disabled = true;

    var btnDownCat = document.createElement('button');
    btnDownCat.type = 'button'; btnDownCat.title = '下移分类'; btnDownCat.textContent = '↓';
    btnDownCat.setAttribute('data-act', 'down-cat'); btnDownCat.setAttribute('data-gi', gi);
    if (gi === WORK_DATA.length - 1) btnDownCat.disabled = true;

    var btnEditCat = document.createElement('button');
    btnEditCat.type = 'button'; btnEditCat.title = '编辑分类'; btnEditCat.textContent = '✎';
    btnEditCat.setAttribute('data-act', 'edit-cat'); btnEditCat.setAttribute('data-gi', gi);

    var btnDelCat = document.createElement('button');
    btnDelCat.type = 'button'; btnDelCat.className = 'del'; btnDelCat.title = '删除分类'; btnDelCat.textContent = '✕';
    btnDelCat.setAttribute('data-act', 'del-cat'); btnDelCat.setAttribute('data-gi', gi);

    catEdit.appendChild(btnUpCat);
    catEdit.appendChild(btnDownCat);
    catEdit.appendChild(btnEditCat);
    catEdit.appendChild(btnDelCat);

    head.appendChild(groupIcon);
    head.appendChild(h2);
    head.appendChild(em);
    head.appendChild(catEdit);
    sec.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'grid';

    for (var ii = 0; ii < group.items.length; ii++){
      var item = group.items[ii];

      if (item.placeholder){
        var ph = document.createElement('div');
        ph.className = 'card card-placeholder';
        ph.style.setProperty('--c', group.color);
        ph.style.setProperty('--c-bg', hexToRgba(group.color, 0.15));
        ph.style.setProperty('--c-border', hexToRgba(group.color, 0.3));
        ph.setAttribute('role', 'note');
        var phIc = document.createElement('div');
        phIc.className = 'ic'; phIc.setAttribute('aria-hidden', 'true');
        var phSpan = document.createElement('span');
        phSpan.textContent = '✦'; phIc.appendChild(phSpan);
        var phMeta = document.createElement('div');
        phMeta.className = 'meta';
        var phN = document.createElement('div'); phN.className = 'n'; phN.textContent = item.name;
        var phD = document.createElement('div'); phD.className = 'd'; phD.textContent = item.desc;
        phMeta.appendChild(phN); phMeta.appendChild(phD);
        ph.appendChild(phIc); ph.appendChild(phMeta);
        grid.appendChild(ph);
        continue;
      }

      totalSites++;

      var a = document.createElement('a');
      a.className = 'card';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.setProperty('--c', group.color);
      a.style.setProperty('--c-bg', hexToRgba(group.color, 0.15));
      a.style.setProperty('--c-border', hexToRgba(group.color, 0.3));
      a.setAttribute('title', item.name + ' · ' + item.desc);

      var ic = document.createElement('div');
      ic.className = 'ic'; ic.setAttribute('aria-hidden', 'true');
      var letter = document.createElement('span');
      letter.textContent = '🌐'; ic.appendChild(letter);

      var meta = document.createElement('div');
      meta.className = 'meta';
      var nm = document.createElement('div'); nm.className = 'n'; nm.textContent = item.name;
      var ds = document.createElement('div'); ds.className = 'd';
      ds.textContent = item.desc || '';
      var count = getUrlCount(item.url);
      if (count > 0){
        var cnt = document.createElement('span');
        cnt.className = 'click-count';
        cnt.textContent = '· 点击 ' + count;
        ds.appendChild(cnt);
      }
      meta.appendChild(nm); meta.appendChild(ds);

      a.appendChild(ic);
      a.appendChild(meta);

      var cardEdit = document.createElement('span');
      cardEdit.className = 'card-edit';

      var btnUpItem = document.createElement('button');
      btnUpItem.type = 'button'; btnUpItem.title = '上移'; btnUpItem.textContent = '↑';
      btnUpItem.setAttribute('data-act', 'up-item'); btnUpItem.setAttribute('data-gi', gi); btnUpItem.setAttribute('data-ii', ii);
      if (ii === 0) btnUpItem.disabled = true;

      var btnDownItem = document.createElement('button');
      btnDownItem.type = 'button'; btnDownItem.title = '下移'; btnDownItem.textContent = '↓';
      btnDownItem.setAttribute('data-act', 'down-item'); btnDownItem.setAttribute('data-gi', gi); btnDownItem.setAttribute('data-ii', ii);
      if (ii === group.items.length - 1) btnDownItem.disabled = true;

      var btnEditItem = document.createElement('button');
      btnEditItem.type = 'button'; btnEditItem.title = '编辑'; btnEditItem.textContent = '✎';
      btnEditItem.setAttribute('data-act', 'edit-item'); btnEditItem.setAttribute('data-gi', gi); btnEditItem.setAttribute('data-ii', ii);

      var btnDelItem = document.createElement('button');
      btnDelItem.type = 'button'; btnDelItem.className = 'del'; btnDelItem.title = '删除'; btnDelItem.textContent = '✕';
      btnDelItem.setAttribute('data-act', 'del-item'); btnDelItem.setAttribute('data-gi', gi); btnDelItem.setAttribute('data-ii', ii);

      cardEdit.appendChild(btnUpItem);
      cardEdit.appendChild(btnDownItem);
      cardEdit.appendChild(btnEditItem);
      cardEdit.appendChild(btnDelItem);
      a.appendChild(cardEdit);

      if (item.popup && item.popup.length){
        a.href = 'javascript:void(0)';
        a.removeAttribute('target');
        a.removeAttribute('rel');
        a.setAttribute('title', item.name + ' · 点击选择入口');
        addClass(a, 'has-popup');
        (function(it){
          addEvent(a, 'click', function(e){
            if (ADMIN_MODE) return;
            e = e || window.event;
            if (e.preventDefault) e.preventDefault();
            openLinkPopup(it);
            return false;
          });
        })(item);
      } else {
        (function(it){
          addEvent(a, 'click', function(){
            recordVisit(it);
          });
        })(item);
      }

      grid.appendChild(a);
    }

    sec.appendChild(grid);
    frag.appendChild(sec);
  }

  app.innerHTML = '';
  app.appendChild(frag);

  if (statSite) statSite.textContent = totalSites;
  if (statCat)  statCat.textContent  = WORK_DATA.length;

  renderQuickArea();
}

/* 渲染最近访问 */
function renderQuickArea(){
  if (ADMIN_MODE){ removeClass(quickArea, 'show'); return; }
  var recent = getRecentItems(6);
  if (recent.length === 0){ removeClass(quickArea, 'show'); return; }
  while (quickList.firstChild) quickList.removeChild(quickList.firstChild);
  quickTitle.textContent = '最近访问';
  for (var i = 0; i < recent.length; i++){
    var item = recent[i];
    var a = document.createElement('a');
    a.className = 'quick-item';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    var ic = document.createElement('span');
    ic.className = 'qi-icon';
    ic.textContent = '🌐';
    var nm = document.createElement('span');
    nm.className = 'qi-name';
    nm.textContent = item.name;
    a.appendChild(ic); a.appendChild(nm);
    (function(it){
      addEvent(a, 'click', function(){ recordVisit(it); });
    })(item);
    quickList.appendChild(a);
  }
  addClass(quickArea, 'show');
}

/* 事件委托 */
addEvent(app, 'click', function(e){
  e = e || window.event;
  var t = e.target || e.srcElement;
  while (t && t !== app && t.tagName !== 'BUTTON'){ t = t.parentNode; }
  if (!t || t.tagName !== 'BUTTON') return;
  var act = t.getAttribute('data-act');
  if (!act) return;
  if (t.disabled) return;
  e.preventDefault();
  e.stopPropagation();

  var gi = parseInt(t.getAttribute('data-gi'), 10);
  var ii = parseInt(t.getAttribute('data-ii'), 10);

  if (act === 'up-item'){
    if (ii <= 0) return;
    var items = WORK_DATA[gi].items;
    var tmp = items[ii - 1]; items[ii - 1] = items[ii]; items[ii] = tmp;
    saveData(WORK_DATA); render();
  }
  else if (act === 'down-item'){
    var items2 = WORK_DATA[gi].items;
    if (ii >= items2.length - 1) return;
    var tmp2 = items2[ii + 1]; items2[ii + 1] = items2[ii]; items2[ii] = tmp2;
    saveData(WORK_DATA); render();
  }
  else if (act === 'edit-item'){ openEditItemModal(gi, ii); }
  else if (act === 'del-item'){
    if (!confirm('确定删除「' + WORK_DATA[gi].items[ii].name + '」？')) return;
    WORK_DATA[gi].items.splice(ii, 1);
    saveData(WORK_DATA); render();
    toast('已删除');
  }
  else if (act === 'up-cat'){
    if (gi <= 0) return;
    var tmp3 = WORK_DATA[gi - 1]; WORK_DATA[gi - 1] = WORK_DATA[gi]; WORK_DATA[gi] = tmp3;
    saveData(WORK_DATA); render();
  }
  else if (act === 'down-cat'){
    if (gi >= WORK_DATA.length - 1) return;
    var tmp4 = WORK_DATA[gi + 1]; WORK_DATA[gi + 1] = WORK_DATA[gi]; WORK_DATA[gi] = tmp4;
    saveData(WORK_DATA); render();
  }
  else if (act === 'edit-cat'){ openEditCatModal(gi); }
  else if (act === 'del-cat'){
    if (!confirm('确定删除分类「' + WORK_DATA[gi].category + '」及其下所有链接？')) return;
    WORK_DATA.splice(gi, 1);
    saveData(WORK_DATA); render();
    toast('已删除分类');
  }
});

/* ================= Toast ================= */
var toastTimer = null;
function toast(msg){
  var el = document.getElementById('__af_toast__');
  if (!el){
    el = document.createElement('div');
    el.id = '__af_toast__';
    el.style.cssText = 'position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:300;' +
      'padding:10px 20px;border-radius:10px;background:rgba(30,41,59,.95);color:#fff;font-size:13px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none;max-width:80vw;text-align:center;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(-6px)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(0)';
  }, 1800);
}

/* ================= 导出 data.js ================= */
function exportDataJs(){
  var dataStr = JSON.stringify(WORK_DATA, null, 2);
  var content = '/* ============================================================\n'
    + '   AiFeng · 资源导航 — 数据文件\n'
    + '   ------------------------------------------------------------\n'
    + '   以后加/删/改链接或分类，主要就改这个文件。\n'
    + '   也可以进入页面「管理员登录」编辑后，点「导出数据」，\n'
    + '   用下载得到的 data.js 覆盖本文件。\n'
    + '   ============================================================ */\n\n'
    + 'window.DATA = ' + dataStr + ';\n';

  var blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'data.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);

  toast('已导出 data.js，上传覆盖同目录源文件即可');
}

/* ================= 编辑工具栏事件 ================= */
addEvent(btnSave, 'click', function(){
  if (saveData(WORK_DATA)){ toast('已保存到本地'); }
  else { toast('保存失败，可能是存储空间不足'); }
});

addEvent(btnExportData, 'click', function(){
  exportDataJs();
});

addEvent(btnExit, 'click', function(){
  var clearLocal = confirm('是否清除本地缓存，以便查看线上版本？\n\n点“确定” = 清除本地数据，下次加载源文件\n点“取消” = 保留本地数据，继续编辑');
  if (clearLocal){
    clearData();
    WORK_DATA = getSourceData();
    fixMissingIcons(WORK_DATA);
  }
  clearAdminSession();
  exitAdminMode();
  toast(clearLocal ? '已清除本地缓存' : '已退出编辑模式');
});

addEvent(btnAddCat, 'click', function(){ openEditCatModal(-1); });
addEvent(btnAddItem, 'click', function(){
  if (WORK_DATA.length === 0){ toast('请先添加一个分类'); return; }
  openEditItemModal(0, -1);
});

/* ================= 搜索 ================= */
function doSearch(){
  var kw = qEl.value.replace(/^\s+|\s+$/g,'');
  if (!kw){ qEl.focus(); return; }
  window.location.href = 'https://www.bing.com/search?q=' + encodeURIComponent(kw);
}

addEvent(qEl, 'input', function(e){
  var v = e && e.target ? e.target.value : qEl.value;
  toggleClass(searchWrap, 'has-value', v.length > 0);
  renderSuggest(v);
});
addEvent(qEl, 'focus', function(){
  if (qEl.value) renderSuggest(qEl.value);
});
addEvent(qEl, 'keydown', function(e){
  e = e || window.event;
  var key = e.key || e.keyCode;
  if (key === 'ArrowDown' || key === 40){
    if (hasClass(searchSuggest, 'show') && suggestItems.length){
      e.preventDefault(); moveSuggest(1); return false;
    }
  }
  if (key === 'ArrowUp' || key === 38){
    if (hasClass(searchSuggest, 'show') && suggestItems.length){
      e.preventDefault(); moveSuggest(-1); return false;
    }
  }
  if (key === 'Enter' || key === 13){
    if (e.preventDefault) e.preventDefault();
    if (hasClass(searchSuggest, 'show') && suggestItems.length){
      openSuggest();
    } else {
      doSearch();
    }
    return false;
  }
  if (key === 'Escape' || key === 27){
    if (hasClass(searchSuggest, 'show')){
      removeClass(searchSuggest, 'show');
      return false;
    }
    qEl.value = '';
    removeClass(searchWrap, 'has-value');
    if (qEl.blur) qEl.blur();
  }
});
addEvent(searchBtn, 'click', function(e){
  e = e || window.event;
  if (e.preventDefault) e.preventDefault();
  doSearch();
  return false;
});
addEvent(clearBtn, 'click', function(e){
  e = e || window.event;
  if (e.preventDefault) e.preventDefault();
  qEl.value = '';
  removeClass(searchWrap, 'has-value');
  removeClass(searchSuggest, 'show');
  qEl.focus();
  return false;
});

/* 点击外部关闭建议 */
addEvent(document, 'click', function(e){
  e = e || window.event;
  var t = e.target || e.srcElement;
  if (t === qEl) return;
  var isInside = false;
  var cur = t;
  while (cur){
    if (cur === searchSuggest || cur === qEl || cur === searchWrap) { isInside = true; break; }
    cur = cur.parentNode;
  }
  if (!isInside) removeClass(searchSuggest, 'show');
});

/* 全局快捷键 */
addEvent(document, 'keydown', function(e){
  e = e || window.event;
  var key = e.key || '';
  var keyCode = e.keyCode || e.which || 0;

  if ((key === '?' || (e.shiftKey && keyCode === 191)) && !isTyping(document.activeElement)){
    e.preventDefault();
    toggleClass(shortcutPanel, 'show');
    return false;
  }

  if ((e.ctrlKey || e.metaKey) && (key === 'k' || key === 'K' || keyCode === 75)){
    e.preventDefault();
    qEl.focus();
    return false;
  }

  var isSlash = (key === '/' || keyCode === 191);
  if (isSlash){
    var active = document.activeElement;
    if (active === qEl) return;
    if (isTyping(active)) return;
    e.preventDefault();
    qEl.focus();
    return false;
  }
});

/* ================= 回到顶部 ================= */
var ticking = false;
var raf2 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(cb){ return setTimeout(cb, 16); };
function onScroll(){
  if (ticking) return;
  ticking = true;
  raf2(function(){
    var y = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop) || 0;
    toggleClass(backTop, 'show', y > 320);
    ticking = false;
  });
}
var supportsPassive = false;
try {
  var testOpts = Object.defineProperty({}, 'passive', { get: function(){ supportsPassive = true; return false; } });
  window.addEventListener('__test_passive__', null, testOpts);
  window.removeEventListener('__test_passive__', null, testOpts);
} catch(e){}
if (window.addEventListener){ window.addEventListener('scroll', onScroll, supportsPassive ? { passive: true } : false); }
else if (window.attachEvent){ window.attachEvent('onscroll', onScroll); }
else { window.onscroll = onScroll; }

addEvent(backTop, 'click', function(){
  if ('scrollBehavior' in document.documentElement.style){
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } catch (e) {}
  }
  var startY = window.pageYOffset || document.documentElement.scrollTop || 0;
  var startTime = null;
  var duration = 400;
  function step(timestamp){
    if (!startTime) startTime = timestamp;
    var p = Math.min((timestamp - startTime) / duration, 1);
    var ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    window.scrollTo(0, startY * (1 - ease));
    if (p < 1) raf2(step);
  }
  raf2(step);
});

/* ================= PWA Service Worker 注册 ================= */
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
}

/* ================= 启动 ================= */
render();

if (isAdminSession()){
  setTimeout(function(){ enterAdminMode(); }, 100);
}