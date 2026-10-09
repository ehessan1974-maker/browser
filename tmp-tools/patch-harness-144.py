# -*- coding: utf-8 -*-
"""إصلاح توقعات barq144-harness: تسلسل omni-all + شكل get-history"""
import io

p = '/home/z/my-project/tmp-test/barq144-harness.js'
s = io.open(p, encoding='utf-8').read()

old_seq = '''  handlers["barq:omni-set-enabled"]({}, []); // قائمة فارغة = رفض
  en = await enabledNow();
  ok(en.length === 2, "رفض قائمة فارغة — محرك واحد على الأقل يبقى مفعّلاً");
  handlers["barq:omni-set-enabled"]({}, ["hack", "google"]);
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رفض المعرّفات الغريبة");

  console.log("[omni-all] زر شامل: الكل ↔ رجوع للاختيار السابق");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة أولى: صح على كل المحركات الثمانية");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 2 && en.indexOf("bing") !== -1, "ضغطة ثانية: رجوع للاختيار السابق (جوجل + بينج)");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة ثالثة: الكل من جديد");
  handlers["barq:omni-all"]();
  handlers["barq:omni-all"](); // الكل ثم رجوع بلا لقطة (بعد إعادة تشغيل محاكاة) → الافتراضي
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رجوع بلا لقطة محفوظة → الافتراضي جوجل");'''

new_seq = '''  handlers["barq:omni-set-enabled"]({}, []); // قائمة فارغة = رفض
  en = await enabledNow();
  ok(en.length === 2, "رفض قائمة فارغة — محرك واحد على الأقل يبقى مفعّلاً");

  console.log("[omni-all] زر شامل: الكل ↔ رجوع للاختيار السابق");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة أولى: صح على كل المحركات الثمانية");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 2 && en.indexOf("bing") !== -1, "ضغطة ثانية: رجوع للاختيار السابق (جوجل + بينج)");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "ضغطة ثالثة: الكل من جديد");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 2, "ضغطة رابعة: رجوع للاختيار السابق مجدداً (جوجل + بينج)");
  // رفض المعرّفات الغريبة بعد التبديل — ثم لقطة جديدة
  handlers["barq:omni-set-enabled"]({}, ["hack", "google"]);
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رفض المعرّفات الغريبة");
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 8, "شامل من اختيار مفرد: الكل");
  // محاكاة «بلا لقطة» (مثل ما بعد إعادة التشغيل والكل مفعل): رجوع → الافتراضي جوجل
  handlers["barq:omni-set-enabled"]({}, ALL);
  handlers["barq:omni-all"]();
  en = await enabledNow();
  ok(en.length === 1 && en[0] === "google", "رجوع بلا لقطة محفوظة → الافتراضي جوجل");'''

old_h = '''  const hist = await handles["barq:get-history"]();
  ok(Array.isArray(hist) && hist.length >= 1, "السجل يعمل بعد كل التغييرات");'''

new_h = '''  const hist = await handles["barq:get-history"]();
  ok(hist && Array.isArray(hist.list) && hist.list.length >= 1, "السجل يعمل بعد كل التغييرات");'''

n1 = s.count(old_seq)
n2 = s.count(old_h)
assert n1 == 1, 'seq anchor: %d' % n1
assert n2 == 1, 'hist anchor: %d' % n2
s = s.replace(old_seq, new_seq).replace(old_h, new_h)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('harness fixed OK')
