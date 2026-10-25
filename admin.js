'use strict';
const $ = id => document.getElementById(id);
let catalog = null;
const status = (message, error = false) => { $('status').textContent = message; $('status').classList.toggle('error', error); };
const counts = value => {
  const units = value.courses.flatMap(course => course.units);
  const lessons = units.flatMap(unit => unit.lessons);
  const meetings = lessons.flatMap(lesson => lesson.meetings);
  return { courses: value.courses.length, units: units.length, lessons: lessons.length, meetings: meetings.length };
};
function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function text(tag, value, parent) { const node = document.createElement(tag); node.textContent = value; parent.append(node); return node; }
function render() {
  const tally = counts(catalog);
  $('nCourses').textContent = tally.courses; $('nUnits').textContent = tally.units;
  $('nLessons').textContent = tally.lessons; $('nMeetings').textContent = tally.meetings;
  const grades = [...new Set(catalog.courses.map(course => course.grade))].sort((a,b) => a-b);
  const filter = $('gradeFilter'); const chosen = filter.value;
  filter.replaceChildren(new Option('جميع الصفوف', 'all'), ...grades.map(grade => new Option(`الصف ${grade}`, String(grade))));
  if ([...filter.options].some(option => option.value === chosen)) filter.value = chosen;
  const query = $('search').value.trim().toLocaleLowerCase('ar');
  const selectedGrade = filter.value;
  const list = $('courses'); list.replaceChildren();
  const matches = catalog.courses.filter(course => {
    const content = [course.title, course.subject, ...course.units.flatMap(unit => [unit.title, ...unit.lessons.map(lesson => lesson.title)])].join(' ').toLocaleLowerCase('ar');
    return (selectedGrade === 'all' || String(course.grade) === selectedGrade) && (!query || content.includes(query));
  });
  for (const course of matches) {
    const card = document.createElement('article'); card.className = 'course';
    const heading = document.createElement('div'); heading.style.display='flex'; heading.style.justifyContent='space-between'; heading.style.gap='8px';
    text('h2', course.title, heading);
    const badge = document.createElement('span'); badge.className = 'badge' + (course.status === 'ready' ? '' : ' draft'); badge.textContent = course.status === 'ready' ? 'محتوى جاهز للمراجعة' : 'يحتاج مراجعة'; heading.append(badge); card.append(heading);
    const lessons = course.units.flatMap(unit => unit.lessons);
    const meetings = lessons.flatMap(lesson => lesson.meetings);
    text('p', `${course.subject} · الصف ${course.grade} · الفصل ${course.semester}`, card);
    text('p', `${course.units.length} وحدة · ${lessons.length} درس · ${meetings.length} لقاء`, card);
    const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'عرض الوحدات والدروس'; details.append(summary);
    const ul = document.createElement('ul');
    for (const unit of course.units) { const li = document.createElement('li'); li.textContent = `${unit.title} — ${unit.lessons.length} درس`; ul.append(li); }
    details.append(ul); card.append(details); list.append(card);
  }
  if (!matches.length) text('p', 'لا توجد نتائج مطابقة.', list);
}
function setCatalog(data) {
  const validated = TeachCore.validate(data);
  catalog = JSON.parse(JSON.stringify(validated));
  localStorage.setItem('noor-addon-admin-catalog-v1', JSON.stringify(catalog));
  render();
}
$('gradeFilter').onchange = render; $('search').oninput = render;
$('exportCatalog').onclick = () => download('catalog.json', catalog);
$('exportPack').onclick = () => download('noor-studio-content-pack.json', { format: 'noor-learning-studio', version: 1, catalog });
$('reset').onclick = async () => {
  try { const data = await (await fetch('content/catalog.json', { cache: 'no-store' })).json(); setCatalog(data); status('استعدت المكتبة المنشورة في المستودع.'); }
  catch (error) { status(`تعذر تحميل المكتبة: ${error.message}`, true); }
};
$('importFile').onchange = async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 12000000) throw Error('حجم الملف أكبر من 12 ميجابايت.');
    const parsed = JSON.parse(await file.text());
    const data = parsed?.format === 'noor-learning-studio' ? TeachCore.validatePack(parsed).catalog : TeachCore.validate(parsed);
    setCatalog(data); status(`تم استيراد مكتبة صالحة: ${counts(catalog).courses} مناهج. راجعها ثم صدّر الحزمة.`);
  } catch (error) { status(`لم أستورد الملف: ${error.message}`, true); }
  event.target.value = '';
};
(async () => {
  try {
    const saved = localStorage.getItem('noor-addon-admin-catalog-v1');
    if (saved) { setCatalog(JSON.parse(saved)); status('عُرضت نسختك المحلية المحفوظة في هذا المتصفح.'); return; }
    const data = await (await fetch('content/catalog.json', { cache: 'no-store' })).json(); setCatalog(data); status('تم تحميل مكتبة المناهج المنشورة.');
  } catch (error) { status(`تعذر تحميل المكتبة أو التحقق منها: ${error.message}`, true); }
})();
