# -*- coding: utf-8 -*-
"""1.4.4 — تحديث BARQ-DESKTOP.md: روابط الجدول إلى 1.4.4 + صف الإصدار الجديد"""
import io

p = 'BARQ-DESKTOP.md'
s = io.open(p, encoding='utf-8').read()
orig = s

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, 'anchor (%d): %s' % (n, old[:70])
    s = s.replace(old, new)

# روابط الجدول 1.4.3 → 1.4.4
rep('`releases/download/stable/Barq-Setup-1.4.3-ia32.exe`', '`releases/download/stable/Barq-Setup-1.4.4-ia32.exe`')
rep('`releases/download/stable/Barq-Portable-1.4.3-ia32.zip`', '`releases/download/stable/Barq-Portable-1.4.4-ia32.zip`')
rep('`releases/download/stable/Barq-Setup-win7-1.4.3-ia32.exe`', '`releases/download/stable/Barq-Setup-win7-1.4.4-ia32.exe`')

# صف الإصدار الجديد فوق 1.4.3 وتعديل شارة «الحالي»
rep('| **1.4.3 (الحالي)** |',
    '| 1.4.3 |')
rep('| 1.4.0 | سجل تصفح كامل',
    '''| **1.4.4 (الحالي)** | **قائمة محركات بخانات اختيار + درع بالأسماء الحقيقية + زر شامل ذكي: (1) القائمة المنسدلة لمحركات البحث في الشريط صارت تحوي خانة اختيار أمام كل محرك — الافتراضي جوجل مفعّل والباقي لا، واختيارك محفوظ فيلمس كل مرة تفتح برق، والنقر على اسم المحرك يجعله الافتراضي، ومحرك واحد مفعّل = البحث من الخانة العليا مباشرة فيه، وأكثر من محرك = بحث شامل فيهم كلهم. (2) خانة المتعقبات المحجوبة (الدرع) صارت تنفتح بنقرة تعرض أسماء النطاقات المحجوبة فعلياً وعدد الطلبات الملغاة من كل واحد — طمأنينة حقيقية لا أرقام عمياء. (3) زر «شامل» بجانب الخانة العليا: ضغطة = صح على كل المحركات، وضغطة ثانية = رجوع لاختيارك السابق بالضبط. (4) حُذف زر «الكل» من صفحة البداية وحُذفت خانات المحركات من تحت خانة البحث في صفحة البحث الشامل — واجهة واحدة موحدة بلا تكرار** |
| 1.4.0 | سجل تصفح كامل''')

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('BARQ-DESKTOP.md OK — %d -> %d chars' % (len(orig), len(s)))
