# -*- coding: utf-8 -*-
"""1.4.4 — home.html: إزالة زر «الكل» — omni.html: إزالة خانات المحركات تحت البحث"""
import io

# ================= home.html =================
p = 'chrome/home.html'
src = io.open(p, encoding='utf-8').read()
orig = src

def rep(old, new, count=1):
    global src
    n = src.count(old)
    assert n == count, '[%s] anchor (%d): %s' % (p, n, old[:70])
    src = src.replace(old, new)

rep('''  #omni-btn {
    height: 52px; padding: 0 20px; border-radius: 26px; cursor: pointer;
    border: 1px solid rgba(52,211,153,.5); background: rgba(52,211,153,.15);
    color: #34d399; font-size: 14px; font-weight: 700; font-family: inherit;
    white-space: nowrap;
    transition: background .06s, transform .05s, border-color .06s;
  }
  #omni-btn:hover { background: rgba(52,211,153,.28); }
  #omni-btn:active { transform: translateY(1px) scale(.94); background: rgba(52,211,153,.4); }
''', '')

rep('''    <div class="row">
      <input id="q" type="text" spellcheck="false" placeholder="ابحث في الإنترنت أو اكتب عنوانًا…" aria-label="البحث" />
      <button type="button" id="omni-btn" title="ابحث في كل المحركات في نفس اللحظة">🔍 الكل</button>
    </div>''',
'''    <div class="row">
      <input id="q" type="text" spellcheck="false" placeholder="ابحث في الإنترنت أو اكتب عنوانًا…" aria-label="البحث" />
    </div>''')

rep('''
    // 1.3.0 — زر «الكل»: بحث شامل في كل المحركات بنفس اللحظة
    document.getElementById("omni-btn").addEventListener("click", function () {
      var v = document.getElementById("q").value.trim();
      location.href = "https://barq.internal/omni" + (v ? "?q=" + encodeURIComponent(v) : "");
    });
''', '''
''')

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('home.html OK — %d -> %d chars' % (len(orig), len(src)))

# ================= omni.html =================
p = 'chrome/omni.html'
src = io.open(p, encoding='utf-8').read()
orig = src

def rep2(old, new, count=1):
    global src
    n = src.count(old)
    assert n == count, '[%s] anchor (%d): %s' % (p, n, old[:70])
    src = src.replace(old, new)

# CSS: إزالة ستايلات خانات المحركات كاملة (chips/eng/live/zero)
rep2('''  /* 1.3.1 — خانة تفعيل أمام كل محرك: اختيارك يُحفظ ويُطبّق فوراً */
  .engines-set { margin: 2px 0 16px; }
  .engines-set .lbl { color: #93a8a0; font-size: 13px; display: block; margin-bottom: 8px; }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .chips label.eng {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 999px; cursor: pointer; user-select: none;
    border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04);
    color: #cfe0d9; font-size: 13px;
    transition: background .06s, color .06s, border-color .06s;
  }
  .chips label.eng:hover { border-color: rgba(52,211,153,.45); color: #34d399; }
  .chips label.eng:active { transform: translateY(1px); }
  .chips label.eng.on {
    border-color: rgba(52,211,153,.55); background: rgba(52,211,153,.1);
    color: #34d399; font-weight: 700;
  }
  .chips label.eng input { accent-color: #34d399; width: 15px; height: 15px; cursor: pointer; margin: 0; }
  .chips label.eng .live { font-size: 10.5px; color: #6f877e; font-weight: 400; }
  .chips label.eng.on .live { color: rgba(52,211,153,.85); }
  .zero { color: #f5b83d; font-size: 13px; margin: 10px 0 0; display: none; }''',
'''  /* 1.4.4 — خانات المحركات انتقلت إلى القائمة المنسدلة في شريط الأدوات */
  .hint { color: #6f877e; font-size: 12.5px; margin: 2px 0 16px; }
  .hint b { color: #34d399; }''')

# HTML: استبدال كتلة الخانات بسطر توضيحي
rep2('''    <!-- 1.3.1 — خانة تفعيل أمام كل محرك: الاختيار يُحفظ ويُطبّق فوراً -->
    <div class="engines-set">
      <span class="lbl">محركات البحث الشامل — فعّل أو ألغِ أي محرك:</span>
      <div class="chips" id="chips"></div>
      <p class="zero" id="zero">ما في أي محرك مفعّل — فعّل محرك واحد على الأقل ☝</p>
    </div>''',
'''    <!-- 1.4.4 — المحركات المفعّلة تُدار من القائمة المنسدلة في شريط الأدوات -->
    <p class="hint">تُدار المحركات المفعّلة من <b>قائمة محركات البحث في شريط الأدوات</b> ↑ — وهذه الصفحة تبحث في كل المحركات المفعّلة هناك</p>''')

# JS: إزالة حلقة رسم خانات المحركات
rep2('''    /* صف خانات التفعيل: واحد لكل محرك — النقر يطبّق فوراً ويُحفظ */
    var chips = document.getElementById("chips");
    ORDER.forEach(function (id) {
      var lb = document.createElement("label");
      lb.className = "eng";
      lb.setAttribute("data-e", id);
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.setAttribute("aria-label", "تفعيل " + NAMES[id]);
      cb.addEventListener("change", function () { setEngine(id, cb.checked); });
      var nm = document.createElement("span");
      nm.textContent = (ICONS[id] || "") + " " + NAMES[id];
      lb.appendChild(cb);
      lb.appendChild(nm);
      if (LIVE.indexOf(id) !== -1) {
        var lv = document.createElement("span");
        lv.className = "live";
        lv.textContent = "نتائج حية";
        lb.appendChild(lv);
      }
      chips.appendChild(lb);
    });

    /* تغيير تفعيل محرك: حفظ + تطبيق + جلب فوري لو محرك حي بمنتصف بحث */
    function setEngine(id, on) {
      enabled[id] = on;
      try {
        omni.setEnabled(ORDER.filter(function (i) { return enabled[i]; }));
      } catch (e) {}
      applyAll();
      if (Q && on && LIVE.indexOf(id) !== -1 && !CACHE[id]) fetchOne(id);
    }

    /* تطبيق التفعيلات: القسم/الزر يظهر أو يختفي لحضاً + تنبيه لو الكل ملغى */
    function applyAll() {
      var any = false;
      ORDER.forEach(function (id) {
        var lab = chips.querySelector('label.eng[data-e="' + id + '"]');
        if (lab) {
          lab.className = "eng" + (enabled[id] ? " on" : "");
          var cb = lab.getElementsByTagName("input")[0];
          if (cb) cb.checked = !!enabled[id];
        }
        if (enabled[id]) any = true;
        var link = document.querySelector('#open-row a[data-e="' + id + '"]');
        if (link) link.style.display = enabled[id] ? "" : "none";
      });
      LIVE.forEach(function (id) {
        var sec = document.getElementById(FETCHERS[id].sec);
        if (sec) sec.style.display = enabled[id] ? "" : "none";
      });
      document.getElementById("zero").style.display = any ? "none" : "block";
      document.getElementById("open-row").style.display = any ? "" : "none";
    }''',
'''    /* تطبيق التفعيلات: أقسام النتائج الحية وروابط الفتح تظهر أو تخفى لحضاً
       (المصدر = القائمة المنسدلة في شريط الأدوات — هنا عرض فقط بلا تعديل) */
    function applyAll() {
      var any = false;
      ORDER.forEach(function (id) {
        if (enabled[id]) any = true;
        var link = document.querySelector('#open-row a[data-e="' + id + '"]');
        if (link) link.style.display = enabled[id] ? "" : "none";
      });
      LIVE.forEach(function (id) {
        var sec = document.getElementById(FETCHERS[id].sec);
        if (sec) sec.style.display = enabled[id] ? "" : "none";
      });
      document.getElementById("open-row").style.display = any ? "" : "none";
    }''')

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('omni.html OK — %d -> %d chars' % (len(orig), len(src)))
