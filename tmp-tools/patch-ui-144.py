# -*- coding: utf-8 -*-
"""1.4.4 — ui.html: قائمة محركات منسدلة بخانات اختيار + نافذة المتعقبات المحجوبة"""
import io

p = 'chrome/ui.html'
src = io.open(p, encoding='utf-8').read()
orig = src

def rep(old, new, count=1):
    global src
    n = src.count(old)
    assert n == count, 'anchor not found or ambiguous (%d): %s' % (n, old[:70])
    src = src.replace(old, new)

# ---------- CSS الجديد قبل إغلاق </style> ----------
rep('''  /* 1.2.6: ستايلات اللوحة انتقلت إلى panel.html */
  </style>''',
'''  /* 1.2.6: ستايلات اللوحة انتقلت إلى panel.html */

  /* 1.4.4 — قائمة محركات البحث المنسدلة: خانة اختيار لكل محرك */
  .edrop { flex: 0 0 auto; position: relative; }
  #engineBtn {
    width: auto; min-width: 86px; height: 34px; padding: 0 10px; gap: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  #engineBtn svg { width: 13px; height: 13px; }
  .emenu {
    position: absolute; top: 42px; right: 0; z-index: 60;
    width: 236px; max-height: 380px; overflow-y: auto;
    background: #14201b; border: 1px solid rgba(52,211,153,.35); border-radius: 14px;
    box-shadow: 0 14px 40px rgba(0,0,0,.55); padding: 6px;
  }
  .eng-row {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 9px; border-radius: 9px; cursor: pointer;
    font-size: 13px; color: #cfe0d9;
  }
  .eng-row:hover { background: rgba(52,211,153,.1); }
  .eng-row input { width: 15px; height: 15px; accent-color: #34d399; cursor: pointer; flex: 0 0 auto; }
  .eng-row .eng-name { flex: 1; }
  .eng-row.cur .eng-name { color: #34d399; font-weight: 700; }
  .eng-row.cur .eng-badge::after {
    content: "افتراضي"; font-size: 10px; color: #0c1210;
    background: #34d399; border-radius: 999px; padding: 2px 8px;
  }
  .eng-row.shake { animation: shake .25s; }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(3px); }
    75% { transform: translateX(-3px); }
  }

  /* 1.4.4 — نافذة المتعقبات المحجوبة: الأسماء الحقيقية والأعداد */
  .shield { cursor: pointer; }
  .shield.on { color: #34d399; border-color: rgba(52,211,153,.55); background: rgba(52,211,153,.14); }
  .tpop {
    position: absolute; top: 42px; left: 10px; z-index: 60;
    width: 310px; display: flex; flex-direction: column;
    background: #14201b; border: 1px solid rgba(52,211,153,.35); border-radius: 14px;
    box-shadow: 0 14px 40px rgba(0,0,0,.55); padding: 10px 12px;
  }
  .tpop-h { color: #34d399; font-weight: 800; font-size: 13px; margin-bottom: 4px; }
  .tpop-sub { color: #93a8a0; font-size: 11.5px; margin-bottom: 8px; }
  .tpop-list { overflow-y: auto; max-height: 224px; }
  .trk-row {
    display: flex; justify-content: space-between; gap: 8px;
    padding: 4px 2px; border-bottom: 1px solid rgba(255,255,255,.05);
    font-size: 12px; direction: ltr;
  }
  .trk-d { color: #e7f0ec; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trk-n { color: #34d399; font-weight: 700; }
  .trk-empty { color: #6f877e; font-size: 12px; padding: 8px 2px; }
  .tpop-note {
    color: #6f877e; font-size: 10.5px; margin-top: 8px;
    border-top: 1px solid rgba(255,255,255,.06); padding-top: 6px;
  }
  </style>''')

# ---------- استبدال select بالقائمة المنسدلة ----------
rep('''    <select id="engine" title="محرك البحث الافتراضي" aria-label="محرك البحث"></select>''',
'''    <!-- 1.4.4 — قائمة محركات البحث: خانة اختيار لكل محرك (محفوظة — الافتراضي جوجل)
         والنقر على الاسم نفسه يجعله المحرك الافتراضي -->
    <div class="edrop" id="edrop">
      <button id="engineBtn" title="محركات البحث — التفعيل والافتراضي" aria-label="قائمة محركات البحث">
        <span id="engineName">…</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="emenu" id="engineMenu" hidden></div>
    </div>''')

# ---------- نافذة المتعقبات بعد الدرع ----------
rep('''    <span class="shield" id="shield" title="متعقّبات محجوبة في هذه الصفحة / الجلسة">
      <svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
      <span id="count">0</span>
    </span>''',
'''    <span class="shield" id="shield" title="اضغط لعرض أسماء المتعقبات المحجوبة فعلياً">
      <svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>
      <span id="count">0</span>
    </span>

    <!-- 1.4.4 — نافذة المتعقبات المحجوبة: أسماء النطاقات وعدد الطلبات الملغاة من كل منها -->
    <div class="tpop" id="shieldPop" hidden>
      <div class="tpop-h">🛡 المتعقبات المحجوبة فعلياً</div>
      <div class="tpop-sub" id="shieldSub"></div>
      <div class="tpop-list" id="shieldList"></div>
      <div class="tpop-note">كل طلب من هذه النطاقات أُلغي قبل الاتصال — حجب مؤكد على مستوى الشبكة</div>
    </div>''')

io.open(p, 'w', encoding='utf-8', newline='').write(src)
print('ui.html OK — %d -> %d chars' % (len(orig), len(src)))
