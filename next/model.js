import {base,fixture,paper} from './data.js?v=0.20.1';
const prefix='yf-next-20261109:';
export const now=s=>Date.now()+s.clockOffset;
export const person=(s,id)=>s.master.find(x=>x.id===id);
export const entry=(s,id)=>s.students.find(x=>x.id===id);
export const room=(s,id)=>s.rooms.find(x=>x.id===id);
export const run=(s,id)=>s.suites.find(x=>x.id===id);
export const activeRun=(s,roomId)=>run(s,room(s,roomId)?.current);
export const scoreKey=(seat,id,s)=>{const q={reading:0,news:1,commentary:2}[seat.split(':')[0]]||0,version=s?(s.materialOverrides?.[id+':'+q]?.materialVersion||run(s,entry(s,id)?.suite)?.files.find(f=>f.subject===q)?.materialVersion):null;return seat+':'+id+':'+(version||'MAT-'+id+'-'+q+'-v1');};
export const remaining=(s,p)=>p?.issue?Math.max(0,Math.ceil((p.issue.deadline-now(s))/1000)):null;
export const seatsAllowed=(s,role,roomId)=>!['academic','monitor','recorder','reviewer'].includes(role)||s.seatsActive&&(!['monitor','recorder'].includes(role)||room(s,roomId)?.active);
export function load(scope,page,variant){const raw=localStorage.getItem(prefix+scope);if(raw){const s=JSON.parse(raw);if(s.schema!==1)throw Error('样例版本不匹配，请明确重新体验。');return s;}const s=scope==='shared'?fixture('AD02'):fixture(page,variant);save(scope,s);return s;}
export function save(scope,s){s.revision++;s.updatedAt=Date.now();localStorage.setItem(prefix+scope,JSON.stringify(s));}
export function reset(scope,page,variant){localStorage.removeItem(prefix+scope);return load(scope,page,variant);}
export function fresh(page,variant){const scope='page-'+page+'-'+(variant||'default')+'-'+crypto.randomUUID(),state=fixture(page,variant);save(scope,state);return {scope,state};}
export function event(s,ctx,action,details){s.audit.push({at:now(s),role:ctx.role,seat:ctx.role+':'+(ctx.room||ctx.seat||ctx.person||'org'),action,details});s.notice=details;s.noticeFor={role:ctx.role,room:ctx.room,person:ctx.person};}
function requireRole(s,ctx,...allowed){if(!allowed.includes(ctx.role))throw Error('当前身份没有此项操作。请从本人任务进入。');if(!seatsAllowed(s,ctx.role,ctx.room))throw Error('当前临时岗位或原考场已撤回，原记录保留；请重新核对当前有效岗位。');}
export function issue(s,ctx,id,lost=false){requireRole(s,ctx,'monitor');const p=entry(s,id),r=room(s,ctx.room);if(!r?.active||!p||p.room!==r.id||!p.signedAt)throw Error('该生不在本考场当前已签到名单，请刷新核对。');if(s.requests[ctx.role+':'+r.id])throw Error('上笔发题结果待查，请先查询原结果。');if(p.issue){s.notice='已读取原发题：原卷、原发题时间和原截止均保持。';s.noticeFor={role:ctx.role,room:ctx.room};return;}if(s.exam.status!=='OPEN'||s.exam.onsiteState==='CLOSED')throw Error('现场已收场，不接受新发题；原卷与原结果保持。');const original=structuredClone(s.paperOverride||paper);p.issue={paperId:original.id,paper:original,issuedAt:now(s),deadline:now(s)+900000,seat:'monitor:'+r.id};if(lost)s.requests[ctx.role+':'+r.id]={action:'issue',student:id,result:'已发原整套',requestId:crypto.randomUUID()};event(s,ctx,'发题',person(s,id).name+'已领取原整套并开始15分钟备考。'+(lost?'本端响应未取得，先查原结果。':''));}
export function start(s,ctx,id,lost=false){requireRole(s,ctx,'recorder');const p=entry(s,id),r=room(s,ctx.room);if(!p||p.room!==r?.id||!p.issue||!p.signedAt)throw Error('请从本考场当前已签到且已发题名单选择。');if(s.requests[ctx.role+':'+r.id])throw Error('上笔开考结果待查，请先查原笔，不能为另一人重复开考。');if(p.suite){s.notice='沿本生原执行读取当前进度，不另建录像。';s.noticeFor={role:ctx.role,room:ctx.room};return p.suite;}if(s.exam.status!=='OPEN'||s.exam.onsiteState==='CLOSED')throw Error('现场已收场，不接受新开录；原文件续传与考后处理独立继续。');if(activeRun(s,r.id))throw Error('当前考位或设备仍被占用，请等待原任务安全保存并清屏。');const idRun='RUN-'+id+'-'+crypto.randomUUID().slice(0,8),v={id:idRun,student:id,room:r.id,phase:'REQUESTED',subject:0,requestedAt:now(s),startedAt:null,deadline:null,allocationVersion:p.allocationVersion||'ARR-'+p.id+'-'+r.id+'-v1',orientation:r.orientation,lens:r.lens,font:r.font||18,gap:r.gap||18,paperId:p.issue.paperId,subjects:paper.parts.map(()=>({status:'NOT_STARTED',announcements:0})),files:[]};s.suites.push(v);p.suite=idRun;r.current=idRun;if(lost)s.requests[ctx.role+':'+r.id]={action:'start',student:id,result:'原开考请求已登记，等待设备',run:idRun,requestId:crypto.randomUUID()};event(s,ctx,'发起开考',person(s,id).name+'：请求已发出，等待后台及固定手机准备；尚未实际开录。');return idRun;}
export function deviceStep(s,roomId){const v=activeRun(s,roomId);if(!v)throw Error('本考位没有当前执行。');if(v.phase==='REQUESTED'){v.phase='DEVICE_PREPARING';s.notice='样例设备正在核对准备和占用，仍未实际开录。';}else if(v.phase==='DEVICE_PREPARING'){v.phase='RECORDING';v.startedAt=now(s);v.paper=structuredClone(entry(s,v.student)?.issue?.paper||paper);v.deadline=v.startedAt+paper.parts[0].seconds*1000;v.subjects[0].status='RECORDING';v.subjects[0].announcements=1;s.notice='已收到模拟设备实际开录事实，学生端立即收题。';}else throw Error('当前状态无需重复开录，请查看原执行。');}
export function settle(s){let changed=false;for(const v of s.suites){while(v.phase==='RECORDING'&&v.deadline<=now(s)){const i=v.subject,at=v.deadline;v.subjects[i].status='SAVED';v.files.push({id:'FILE-'+v.id+'-'+i,student:v.student,subject:i,upload:'QUEUED',materialVersion:'MAT-'+v.student+'-'+i+'-v1',savedAt:at});if(i===2){v.phase='LOCAL_SAVED';v.deadline=null;}else{v.subject++;v.subjects[v.subject].status='RECORDING';v.subjects[v.subject].announcements=1;v.deadline=at+paper.parts[v.subject].seconds*1000;}changed=true;}}return changed;}
export function clear(s,roomId){const v=activeRun(s,roomId);if(!v||v.phase!=='LOCAL_SAVED'||v.subjects.some(x=>x.status!=='SAVED'))throw Error('三科尚未本机安全保存，不能清场接续。');v.phase='CLEARED';v.clearedAt=now(s);room(s,roomId).current=null;s.notice='模拟手机已清空本生题面，考位空闲；原三份文件留在本生名下继续上传。';}
export function advance(s,roomId){const v=activeRun(s,roomId);if(!v||v.phase!=='RECORDING')throw Error('当前没有正在录制的本科。');s.clockOffset+=Math.max(0,v.deadline-now(s))+10;settle(s);s.notice='演示时钟推进到本科截止；原备考截止没有改写。';}
export function previewImport(text,s){const seen=new Set();return text.trim().split(/\r?\n/).map((line,i)=>{const a=line.split(/[\t,，]/).map(x=>x.trim()),[phone,name,gender,className,rawAge]=a,age=Number(rawAge),old=s.master.find(x=>x.phone===phone),duplicate=seen.has(phone);seen.add(phone);const errors=[a.length!==5?'每行需要5列':'',!/^1\d{10}$/.test(phone||'')?'手机号须11位':'',!name?'姓名缺失':'',!['男','女'].includes(gender)?'性别请用男/女':'',!className?'班级缺失':'',!Number.isInteger(age)||age<1||age>100?'年龄须1–100整数':'',duplicate?'文件内手机号重复':''].filter(Boolean);return {row:i+1,phone,name,gender,className,age,oldId:old?.id||null,state:errors.length?'CONFLICT':old?'UPDATE':'NEW',errors,excluded:false};});}
export function applyImport(s,ctx,rows){requireRole(s,ctx,'admin');const chosen=rows.filter(x=>!x.excluded);if(!chosen.length||chosen.some(x=>x.errors.length))throw Error('请修正或明确排除冲突行后再确认。');for(const p of chosen){const old=s.master.find(x=>x.id===p.oldId);const value={phone:p.phone,name:p.name,gender:p.gender,className:p.className,age:p.age};if(old)Object.assign(old,value);else s.master.push({id:'STU-'+crypto.randomUUID().slice(0,8),...value});}s.importPreview=null;event(s,ctx,'确认名册导入','已确认'+chosen.length+'行，已有内部身份保持，尚未自动加入考试。');}
export function addToExam(s,ctx,ids,name,judgeCount){requireRole(s,ctx,'admin');if(s.exam.status==='ARCHIVED')throw Error('原场已归档，不能补入。');if(!ids.length||!ids.every(id=>s.master.some(p=>p.id===id)))throw Error('请选择本机构名册中的学生。');if(!s.exam.created){s.exam.created=true;s.exam.name=name||s.exam.name;s.exam.judgeCount=judgeCount;s.exam.status='DRAFT';}for(const id of ids)if(!entry(s,id)){s.students.push({id,no:'N26'+String(s.exam.nextNumber++).padStart(4,'0'),room:'R1',signedAt:null,signRoom:null,issue:null,suite:null});}event(s,ctx,'保存本场名单','本场考号已生成；原有考号和资料关联保持。');}
export const safelyCancelled=v=>!!v&&['CANCELLED_SAFE','REJECTED_SAFE'].includes(v.phase)&&v.releaseConfirmed===true&&!v.startedAt&&!v.files.length;
export function migrationState(s,p){
 const v=run(s,p.suite),unknown=Object.values(s.requests).some(x=>x.student===p.id);
 if(unknown)return {kind:'RESOLVE',eligible:false,blocking:true,label:'原开考结果未明，先查询原笔，不直接迁移'};
 if(!v)return {kind:'UNSTARTED',eligible:true,blocking:false,label:'未建立原执行，可以迁移'};
 if(safelyCancelled(v))return {kind:'CANCELLED_SAFE',eligible:true,blocking:false,label:'已确定安全取消、从未实际开录，可以迁移；保留原执行'};
 if(v.phase==='CLEARED')return {kind:'HISTORY',eligible:false,blocking:false,label:'原现场任务已结束，原执行与材料留在原场'};
 if(!v.startedAt&&!v.files.length)return {kind:'RESOLVE',eligible:false,blocking:true,label:'准备中或取消尚未取得安全事实，先处理原请求；不永久等同在录'};
 return {kind:'BLOCK',eligible:false,blocking:true,label:'已实际开录或有待保全原片，不能直接搬走'};
}
export function migrate(s,ctx,target){
 requireRole(s,ctx,'admin');const source=room(s,ctx.room),to=room(s,target);
 if(!source?.active||!to?.active||source.id===to.id)throw Error('请选择另一个有效考场。');
 if(s.roomPreview?.revision!==s.revision||s.roomPreview.target!==target)throw Error('安排或执行在预览后已有变化，请重新预览，未提交半份名单。');
 const affected=s.students.filter(x=>x.room===source.id),block=affected.filter(x=>migrationState(s,x).blocking),moving=affected.filter(x=>migrationState(s,x).eligible);
 if(block.length)throw Error('存在结果未明、准备待核或已开录/待保全任务，须先沿原执行处理。确定安全取消且未实际开录者不会永久被拦住。');
 if(!moving.length)throw Error('没有符合条件的未开录学生。');
 for(const x of moving){const originalVersion=x.allocationVersion||'ARR-'+x.id+'-'+source.id+'-v1',originalExecutionId=x.suite||null;if(x.suite){(x.executionHistory||=[]).push(x.suite);x.suite=null;}(s.allocationHistory||=[]).push({student:x.id,from:source.id,to:target,originalVersion,originalExecutionId,at:now(s)});x.room=target;x.allocationVersion='ARR-'+x.id+'-'+target+'-v'+(s.revision+1);}
 source.active=false;source.version++;source.token=null;s.roomPreview=null;
 event(s,ctx,'撤场重新分配',moving.length+'人改到'+to.name+'；原号、签到来源、原卷和截止保留；原执行仍引用原分配，旧考场码及岗位失效。');
}
export function finalizationCheck(s){
 const safety=s.suites.filter(v=>v.phase!=='CLEARED'&&!safelyCancelled(v)).map(v=>({id:v.id,label:person(s,v.student)?.name+'：'+(v.startedAt?'活动/待保全/清屏未确认':'开考准备或结果尚待核对')}));
 for(const r of Object.values(s.requests))safety.push({id:r.requestId,label:'原操作结果未明：'+r.action});
 const business=[];
 for(const p of s.students){const v=run(s,p.suite);if(!v?.files.length)business.push({id:p.id,label:(p.no||p.id)+'：现场或材料任务尚未完成'});else for(const f of v.files)if(s.materialChecks?.[f.id]!=='CHECKED')business.push({id:f.id,label:(p.no||p.id)+' · '+paper.parts[f.subject].title+'：材料确认未完成或仍有问题'});}
 for(const subject of ['reading','news','commentary'])for(let i=1;i<=s.exam.judgeCount;i++){const seat=subject+':'+i;if(!s.submitted[seat])business.push({id:seat,label:({'reading':'作品朗读','news':'新闻播报','commentary':'话题评述'}[subject])+'第'+i+'席：评分尚未提交'});else if(s.students.some(p=>s.scores[scoreKey(seat,p.id,s)]===undefined))business.push({id:seat,label:'第'+i+'席原提交与当前材料版本不一致，需先核对评分'});}
 const retained=[],unconfirmed=[];
 for(const item of s.backgroundTasks||[]){const v=run(s,item.executionId),f=v?.files.find(x=>x.id===item.fileId);if(item.localSafe&&item.identityFixed&&item.authorizationContinues&&f&&f.student===item.student&&f.materialVersion===item.materialVersion&&v.room===item.originalRoom)retained.push(item);else unconfirmed.push({id:item.id,label:'原后台任务的安全保存、固定归属或持续授权尚未核实'});}
 for(const v of s.suites)for(const f of v.files.filter(x=>x.upload!=='VERIFIED')){const item={id:f.id,executionId:v.id,fileId:f.id,student:f.student,originalRoom:v.room,materialVersion:f.materialVersion,kind:'UPLOAD_OR_CHECK'};if(v.phase==='CLEARED'&&v.subjects.every(x=>x.status==='SAVED')&&f.student===v.student&&s.backgroundAuthorization?.[f.id]===true)retained.push(item);else unconfirmed.push({id:f.id,label:'原文件续传尚缺持续授权或安全保存核对，不能当成允许保留项'});}
 const onsiteClosed=s.exam.onsiteState==='CLOSED'||s.exam.status==='ONSITE_CLOSED'||s.exam.status==='ARCHIVED';
 const reason=!onsiteClosed?'本场现场尚未收场，先完成现场收场。':safety.length?'仍有安全阻断，不能最终结束。':business.length?'存在评分/材料业务遗留，处理政策尚未采用，不能用勾选确认略过。':unconfirmed.length?'后台积压的安全保存、固定归属或持续授权未核实，暂不能归档。':'';
 return {onsiteClosed,safety,business,retained,unconfirmed,policyState:business.length?'NOT_ADOPTED':'NOT_NEEDED_NO_BUSINESS_REMAINDERS',canFinalize:!reason,reason};
}
export function finalize(s,ctx){
 requireRole(s,ctx,'admin');const check=finalizationCheck(s);
 if(s.finalPreview?.revision!==s.revision)throw Error('关场预览后状态已有变化，请重新读取并核对。');
 if(!check.canFinalize)throw Error(check.reason);
 if(s.exam.status==='ARCHIVED')throw Error('本场已最终归档，沿原结果读取即可。');
 s.finalizationRecord={at:now(s),pendingBackgroundItems:structuredClone(check.retained)};s.exam.status='ARCHIVED';s.seatsActive=false;
 event(s,ctx,'演示最终关场','已确认没有评分/材料业务遗留；整场归档并撤临时席位，原授权后台积压单独留存，学生本人权限及管理员历史保持。');
}
