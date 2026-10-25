'use strict';let busy=false;
browser.browserAction.onClicked.addListener(()=>browser.tabs.create({url:browser.runtime.getURL('dashboard.html')}));
browser.runtime.onMessage.addListener((message,sender)=>{
 if(sender.url!==browser.runtime.getURL('dashboard.html')||message.action!=='fill')return;
 return (async()=>{if(busy)return {ready:false,error:'هناك تعبئة جارية'};busy=true;try{
  const saved=await browser.storage.local.get(['studioCatalog','studioRecords']);const catalog=TeachCore.validate(saved.studioCatalog||await(await fetch(browser.runtime.getURL('catalog.json'))).json());const plan=TeachCore.plans(catalog).find(p=>p.id===message.id);
  if(!plan)throw Error('اللقاء غير موجود');if(plan.course_status!=='ready'||plan.goal_binding==='draft'||plan.goal_source==='draft')plan.goal_binding='review';if(saved.studioRecords?.[plan.id])throw Error('سبق تأكيد حفظ اللقاء محليًا؛ راجع سجل نور قبل التكرار');
  const tab=await browser.tabs.get(message.tabId),url=new URL(tab.url);if(url.origin!=='https://lms.moe.gov.om'||!url.pathname.startsWith('/teacher/'))throw Error('اختر تبويب نور للمعلم');
  const probe=await browser.tabs.sendMessage(tab.id,{action:'probe'});if(!probe.isForm)throw Error('افتح نموذج إضافة تحضير فارغًا في مادة الصف المطلوب');
  return await browser.tabs.sendMessage(tab.id,{action:'prepare',plan});
 }catch(e){return {ready:false,error:e.message};}finally{busy=false;}})();
});
