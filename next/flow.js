/* Review-only model for the published fictional PRD. No business API calls. */
import * as M from './model.js?v=0.20.1';
import {paper,fixture} from './data.js?v=0.20.1';
export const files=s=>s.suites.flatMap(v=>v.files.map(f=>({run:v,file:f})));
export const material=(s,id,q)=>s.materialOverrides?.[id+':'+q]||M.run(s,M.entry(s,id)?.suite)?.files.find(f=>f.subject===q);
export const quality=(s,f)=>s.qualityChecks?.[f.id]?.version===f.materialVersion?s.qualityChecks[f.id]:null;
export const checked=(s,f)=>!!f&&f.upload==='VERIFIED'&&quality(s,f)?.verdict==='PASS'&&s.materialChecks?.[f.id]==='CHECKED';
export const subjectReady=(s,q)=>s.students.length>0&&s.students.every(p=>checked(s,material(s,p.id,q)));
export const reviewReady=(s,q)=>!!s.exam.reviewOpen?.[q]&&subjectReady(s,q);
function allowed(s,c,role){if(c.role!==role||!M.seatsAllowed(s,c.role,c.room))throw Error('当前岗位无权处理此任务，请返回本人有效岗位。');}
export function recordQuality(s,c,id,verdict,reason){
 allowed(s,c,'recorder');const found=files(s).find(x=>x.file.id===id&&x.run.room===c.room),f=found?.file;
 if(!f||f.upload!=='VERIFIED')throw Error('当前原片尚未技术就绪，不能记录质量通过。');
 if(!['PASS','ISSUE'].includes(verdict)||verdict==='ISSUE'&&!reason.trim())throw Error('发现问题时请填写具体情况，保留原片等待处理。');
 const prior=quality(s,f);if(prior?.verdict==='ISSUE'&&verdict==='PASS'&&!reason.trim())throw Error('更正问题结论时请填写复核依据，原问题记录继续保留。');if(prior)(s.qualityHistory||=[]).push({fileId:id,...structuredClone(prior)});
 (s.qualityChecks||={})[id]={version:f.materialVersion,verdict,reason:reason.trim(),at:M.now(s),seat:'recorder:'+c.room};
 delete (s.materialChecks||={})[id];(s.exam.reviewOpen||={})[f.subject]=false;
 M.event(s,c,'记录原版质量',f.id+' / '+f.materialVersion+' / '+(verdict==='PASS'?'本版已记录可用，交教务核验；未自动开放评卷。':'问题已记录并保留原片；补考、换版或采用须另行决定。')+(reason?' '+reason.trim():''));
}
export function checkMaterial(s,c,id){allowed(s,c,'academic');const f=files(s).find(x=>x.file.id===id)?.file;if(!f||f.upload!=='VERIFIED'||quality(s,f)?.verdict!=='PASS')throw Error('本版技术或录制员质量检查未完成，暂不能核验。');(s.materialChecks||={})[id]='CHECKED';M.event(s,c,'教务核验材料','已核对本生本科当前材料版本，尚未自动开放。');}
export function openSubject(s,c,q){allowed(s,c,'academic');if(!subjectReady(s,q))throw Error('本科仍有材料未就绪或问题待处理，请先逐版核验。');(s.exam.reviewOpen||={})[q]=true;M.event(s,c,'明确开放本科',paper.parts[q].title+'已开放，本科席位可读取当前材料；正式合分与精度另按采用配置。');}
export function releaseVideos(s,c){allowed(s,c,'academic');if(!paper.parts.every((_,q)=>subjectReady(s,q)))throw Error('三科当前材料尚未全部核验，不能开放本人录像。');s.exam.videoReleased=true;M.event(s,c,'开放本人录像','三科当前可用版本已明确开放，学生仍仅能查看本人的录像。');}
export function closeOnsite(s,c){allowed(s,c,'academic');if(s.students.some(p=>M.run(s,p.suite)?.phase!=='CLEARED')||Object.keys(s.requests).length||s.rooms.some(r=>r.current))throw Error('仍有未完成考生、占用或待查原请求，请先核对；不会自动改成缺考。');s.exam.onsiteState='CLOSED';s.exam.status='ONSITE_CLOSED';M.event(s,c,'现场收场','已核对本场现场任务，原上传、质量检查及评分独立继续；尚未最终归档。');}
export function readyFixtures(s,page){
 if(['AC02','RV01','AD05','AD06','ST03'].includes(page))for(const {file:f} of files(s))(s.qualityChecks||={})[f.id]||={version:f.materialVersion,verdict:'PASS',reason:'明确标识的上游样例',at:M.now(s),seat:'recorder:R1'};
 if(['RV01','AD05','ST03'].includes(page)){
  for(const {file:f} of files(s))(s.materialChecks||={})[f.id]='CHECKED';
  s.exam.reviewOpen={0:true,1:true,2:true};
 }
 return s;
}
function exampleRun(s,p){
 const at=M.now(s);if(!p.issue)p.issue={paperId:(s.paperOverride||paper).id,paper:structuredClone(s.paperOverride||paper),issuedAt:at-1200000,deadline:at-300000,seat:'monitor:'+p.room};p.signedAt||=at-1210000;p.signRoom||=p.room;
 const id='SAMPLE-'+p.id+'-'+crypto.randomUUID().slice(0,8),v={id,student:p.id,room:p.room,phase:'CLEARED',subject:2,requestedAt:at-400000,startedAt:at-390000,deadline:null,clearedAt:at-90000,orientation:'landscape',lens:'rear',paperId:p.issue.paperId,paper:structuredClone(p.issue.paper||paper),subjects:paper.parts.map(()=>({status:'SAVED',announcements:1})),files:paper.parts.map((_,q)=>({id:'FILE-'+id+'-'+q,student:p.id,subject:q,upload:'VERIFIED',materialVersion:'MAT-'+p.id+'-'+q+'-v1'}))};s.suites.push(v);p.suite=id;return v;
}
export function upstream(s,c,page){
 if(page==='ST02'){
  const p=M.entry(s,c.person);if(!p?.signedAt)throw Error('请先在本人页面完成签到。');if(!p.issue)p.issue={paperId:(s.paperOverride||paper).id,paper:structuredClone(s.paperOverride||paper),issuedAt:M.now(s),deadline:M.now(s)+900000,seat:'monitor:'+p.room};
 }else if(page==='AC02'||page==='AD06'){
  if(s.suites.length)throw Error('已有本场原执行，请沿原文件继续，不覆盖已操作进度。');
  for(const p of s.students){const v=exampleRun(s,p);for(const f of v.files){(s.qualityChecks||={})[f.id]={version:f.materialVersion,verdict:'PASS',reason:'明确标识的录制员已完成样例'};if(page==='AD06')(s.materialChecks||={})[f.id]='CHECKED';}}
  s.exam.status='OPEN';
  if(page==='AD06'){
   s.exam.onsiteState='CLOSED';s.exam.status='ONSITE_CLOSED';s.exam.reviewOpen={0:true,1:true,2:true};s.exam.videoReleased=true;
   for(const subject of ['reading','news','commentary'])for(let i=1;i<=s.exam.judgeCount;i++){const seat=subject+':'+i;for(const p of s.students)s.scores[M.scoreKey(seat,p.id,s)]??='80';s.submitted[seat]={at:M.now(s),sample:'明确标识的其他席位完成样例'};}
  }
 }else if(page==='ST03'){
  const p=M.entry(s,c.person);if(!p)throw Error('当前本人没有安排。');const v=M.run(s,p.suite)||exampleRun(s,p);if(v.phase!=='CLEARED')throw Error('原现场尚未结束，不能覆盖本人的有效进度。');
  for(const f of v.files){f.upload='VERIFIED';(s.qualityChecks||={})[f.id]={version:f.materialVersion,verdict:'PASS',reason:'本人录像明确开放后的样例'};(s.materialChecks||={})[f.id]='CHECKED';}s.exam.videoReleased=true;
 }else throw Error('本任务无需补齐跨岗位样例。');
 M.event(s,{role:'review-sample'},'接看上游样例','已接看其他岗位完成后的虚构前提；当前岗位自己的核验、保存或提交仍需实际操作。');
}
export function progress(s,c,id){const p=M.entry(s,c.person),v=M.run(s,p?.suite),own=files(s).filter(x=>x.run.room===c.room);
 const done={AD01:s.master.length>0,AD02:s.exam.created&&s.students.length>0,AD03:s.exam.created,AD05:true,AD06:s.exam.status==='ARCHIVED',AC01:s.exam.paperReady&&s.exam.arrangementReady,AC02:s.exam.onsiteState==='CLOSED'&&[0,1,2].every(q=>reviewReady(s,q))&&s.exam.videoReleased,MO01:s.students.some(p=>p.room===c.room&&p.issue),ST01:!!p?.signedAt,ST02:!!p?.issue&&(M.remaining(s,p)===0||!!v?.startedAt),ST03:!!s.exam.videoReleased&&!!v?.files.length,RE01:!!v,RE02:v?.phase==='CLEARED',RE03:own.length>0&&own.every(x=>!!quality(s,x.file)),RV01:!!s.submitted[c.seat]};
 const hints={AD02:'先建立本场并生成考号。',AD06:'先核对遗留事项，明确最终归档。',AC01:'先保存完整题卷和排场。',AC02:'逐版核验并明确开放三科评卷与本人录像；现场收场单独确认。',MO01:'先对至少一位已签到学生发整套题。',ST01:'先核对本人并签到。',ST02:'等待监考发题；按原截止备考，到时或已开考后继续。',ST03:'等待本人录像被明确开放。',RE01:'先从已发题名单选人发起。',RE02:'等待三科安全保存和固定机清屏回执。',RE03:'等待原片云端就绪并逐版记录检查结果。',RV01:'保存全批本人分数后明确提交；0分有效。'};
 const seed=id==='ST02'&&!p?.issue||id==='AC02'&&!s.suites.length||id==='ST03'&&!s.exam.videoReleased||id==='AD06'&&s.exam.status!=='ARCHIVED'&&!s.suites.length;
 return {done:!!done[id],hint:hints[id]||'本项可只读核对。',seed};
}
