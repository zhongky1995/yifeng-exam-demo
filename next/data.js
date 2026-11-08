import {fixture35} from './fixture35.js?v=0.20.1';
export const VERSION='0.20.1';
export const roles={admin:'管理员',academic:'教务席位',monitor:'监考席位',recorder:'录制席位',student:'学生本人',reviewer:'本科评委席位',ops:'运维只读'};
export const pages=[
 ['AD01','admin','长期学生名册','手机号与资料先校验，预览新增、更新和冲突，再明确导入。','导入只关联稳定内部学生身份；完成后选择本场名单。','F01'],
 ['AD02','admin','建考与本场考号','从机构名册选人建立新场，新增者只补号，旧号保持。','教务完成卷和排场后，由管理员检查开放本场。','F01'],
 ['AD03','admin','临时岗位与席位','按本场、考场和科目配置临时岗位，换操作者继续原席位。','席位只见自己的范围；固定录制手机使用独立设备身份。','F01'],
 ['AD04','admin','撤场与重新分配','故障场先预览影响，只迁移未开录者。','原考号、签到、已发题和截止保留；原场旧码和岗位失效。','F05'],
 ['AD05','admin','业务看板与导出','按场、考场、科目与席位核对业务进度。','统计注明快照与未采集，内部数据和导出由管理员查看。','F08'],
 ['AD06','admin','最终关场与归档','查看遗留事项，再明确结束整场并回收临时席位。','学生长期账号与本人已授权录像保留，管理员仍可追溯。','F09'],
 ['AC01','academic','本场题卷与排场','教务维护获分配考试的完整三科、时段与安排。','准备保存后交管理员检查开放，不提供机构名册或跨场看板。','F02'],
 ['AC02','academic','本场材料与评卷准备','现场收场后仍继续上传、核验和本场材料处理。','各科评卷依据真实材料和已采纳规则开放，不用TEST代正式配置。','F07'],
 ['MO01','monitor','签到名单与发题','本考场已签到学生中自由选人，发出整套三科。','成功即领取并计时，录制员名单同步出现；不在线交接。','F03'],
 ['ST01','student','本人考号与签到','学生用长期账号查看本人当前考场并扫码签到。','签到后等待监考发题，无自行抽题按钮。','F03'],
 ['ST02','student','整套题目与备考','收到三科时同步展示题目与15分钟原截止。','到时或已开考后收起正文，继续候考，不自动标缺考。','F03'],
 ['ST03','student','本人已授权录像','学生长期账号仅回看本人被明确开放的录像。','没有成绩、排名和他人录像；未开放和处理中分开显示。','F07'],
 ['RE01','recorder','任选考生一键开考','从本考场已发题名单自由选人，一次人工发起。','后台与手机准备可等待，收到设备实际开录事实才显示录制。','F04'],
 ['RE02','recorder','三科执行与原片接续','核对本生三科保存、清屏、原片和上传进度。','清屏事实到达后接下一位，上一位录像独立上传。','F04'],
 ['RE03','recorder','原片质量检查与问题记录','在本人考场逐版查看云端技术就绪的原片，记录可用或具体问题。','可用版本交教务核验；问题保留原件，不自动批准补考或换版。','F07'],
 ['DV01','recorder','固定手机与考生大屏','固定手机执行录制、计时和题面，考生只看展示画面。','中央支架留白；小镜像画面在左下；开录后锁定方向与镜头。','F04'],
 ['RV01','reviewer','一屏本科评卷','本批全名单与视频同屏，自由浏览上下份，明确保存草稿。','按本场考号、状态和本人分数筛选；零分有效、漏评阻止提交。','F06'],
 ['OP01','ops','运维只读看板','独立查看服务器、数据库、备份、设备和积压。','显示采样时间及未验证事实，不提供业务改分或发题操作。','F10'],
 ['LG01','admin','旧场原版本记录','保留旧场流程和原交接关联。','旧场不因新场入口上线而改写或迁成新规则。','F09'],
].map(([id,role,title,scene,next,feature])=>({id,role,title,scene,next,feature}));
const sampleBefore={AD01:'已放入两位虚构长期学生，尚未为本场选人。',AD02:'机构名册已准备，本场尚未建立。',AD03:'本场已建立，展示有效岗位及本科席位。',AD04:'甲乙均已发题，尚未实际开录；原签到与截止已保存。',AD05:'两人三科材料已准备，部分本人评分已保存。',AD06:'现场已收场，但仍有材料/评分遗留；默认不能最终归档。',AC01:'管理员已建考选人，题卷和排场待教务保存。',AC02:'两人三科技术与录制员质量检查已完成，教务尚未逐版核验。',MO01:'甲乙已在本考场签到，等待监考发题。',ST01:'本人已有本场考号和安排，尚未签到。',ST02:'本人已收到监考发出的完整三科，正在按原截止备考。',ST03:'本人三科当前可用录像已由教务明确开放。',RE01:'甲乙已领题，录制员可以任选一位开考。',RE02:'乙正在作品朗读，甲仍按原截止备考。',RE03:'两人三科原片已技术就绪，录制员尚未记录质量结果。',DV01:'固定手机正在录制乙，配套视图沿同一范围跟随当前考位。',RV01:'本科材料已明确开放，甲有一份本人0分记录，乙仍漏评。',OP01:'默认指标未采集，不把未知值补0。',LG01:'只读旧场原流程关系，不能由此创建新场交接。'};
for(const p of pages)p.before=sampleBefore[p.id];
export const features=[
 ['F01','名册、建考与临时席位','管理员管理长期身份、本场唯一考号和岗位席位。'],['F02','本场题卷与安排','教务只维护当前考试的完整套卷、时段与排场。'],['F03','签到、发题与统一备考','学生签到；监考发整套；收到即计时，到时或开录收题。'],['F04','任选开考与三科接续','一次人工发起，设备准备和实际开录分开，保存清屏后再接下一人。'],['F05','撤场调人','先预览，迁移未开录者，保留原题、原截止及调整历史。'],['F06','一屏评卷','全名单、视频和本人成绩同屏，浏览不提交，草稿按材料版本保留。'],['F07','考后材料与本人录像','上传核验继续，学生只看本人已授权录像。'],['F08','管理员业务看板','按考试与席位核对统计和内部导出。'],['F09','最终归档与旧场兼容','最终关场撤临时会话，长期学生和历史数据保留。'],['F10','运维只读看板','指标、备份及设备状态独立于业务权限。'],
].map(([id,title,description])=>({id,title,description}));
export const journeys={admin:['AD01','AD02','AD03','AD05','AD06'],academic:['AC01','AC02'],monitor:['MO01'],student:['ST01','ST02','ST03'],recorder:['RE01','RE02','RE03'],reviewer:['RV01']};
export const paper={id:'P17-v1',label:'第17套 · 候选原创题样',parts:[
 {title:'作品朗读',seconds:120,blocks:[['古诗文 · 原创虚构','晨光初照，林色渐明。行者循溪而上，见草木含露，闻远山鸟鸣。\n水绕石而流，风穿叶而过。停步片刻，方知寻常之中亦有新意。'],['现代文 · 原创虚构',Array(5).fill('清晨，第一缕阳光越过树梢，落在安静的小路上。风吹过草木，把远处的声音轻轻送到耳边。我们沿着河岸慢慢前行，身后是城市逐渐苏醒的声音，眼前是尚未写下的一天。\n没有人能替另一个人经历所有的路，但一句认真倾听后的回答，可以让陌生的道路变得清楚一些。').join('\n\n')]]},
 {title:'新闻播报',seconds:60,blocks:[['新闻播报 · 原创虚构','今天上午，社区公共阅读空间向居民开放。空间设置少儿阅读、文化交流和自习区域，并将按预约情况延长服务时间。工作人员表示，后续将根据居民建议调整活动安排。']]},
 {title:'话题评述',seconds:120,blocks:[['话题评述 · 原创虚构','有人认为，面对不同意见应先表达自己的观点；也有人认为，应先了解对方的理由。请围绕“怎样让沟通更有效”进行评述。']]},
]};
export function base(){return {schema:1,revision:1,clockOffset:0,updatedAt:Date.now(),master:[{id:'A',phone:'13800000001',name:'学员甲',gender:'男',className:'播音一班',age:18},{id:'B',phone:'13800000002',name:'学员乙',gender:'女',className:'播音一班',age:18}],exam:{id:'EX-NEXT-1',name:'艺风播音模拟考 · 新流程样例',created:true,status:'OPEN',flow:'新场候选',nextNumber:3,paperReady:true,arrangementReady:true,judgeCount:5,videoReleased:false},students:[{id:'A',no:'N260001',room:'R1',signedAt:null,signRoom:null,issue:null,suite:null},{id:'B',no:'N260002',room:'R1',signedAt:null,signRoom:null,issue:null,suite:null}],rooms:[{id:'R1',name:'01考场',active:true,version:1,token:'NEXT-R1-1',orientation:'landscape',lens:'rear',current:null,projection:'ONLINE'},{id:'R2',name:'02考场',active:true,version:1,token:'NEXT-R2-1',orientation:'landscape',lens:'rear',current:null,projection:'ONLINE'}],seatsActive:true,suites:[],scores:{},drafts:{},submitted:{},requests:{},audit:[],notice:'',finalPreview:false,roomPreview:null,importPreview:null};}
export function fixture(page,variant){const s=base(),t=Date.now();
 const sign=(id,delta)=>{const p=s.students.find(x=>x.id===id);p.signedAt=t+delta;p.signRoom=p.room;};
 const issue=(id,delta)=>{sign(id,delta-10000);s.students.find(x=>x.id===id).issue={paperId:paper.id,issuedAt:t+delta,deadline:t+delta+900000,seat:'monitor:R1'};};
 if(['AD01','AD02'].includes(page)){s.exam.created=false;s.exam.status='DRAFT';s.exam.paperReady=false;s.exam.arrangementReady=false;s.students=[];s.exam.nextNumber=1;}
 if(page==='AC01'){s.exam.status='DRAFT';s.exam.paperReady=false;s.exam.arrangementReady=false;}
 if(page==='MO01'){sign('A',-40000);sign('B',-20000);}
 if(['ST02','AD04','RE01','RE02','DV01'].includes(page)){issue('A',-60000);issue('B',-30000);}
 if(['RE02','DV01'].includes(page)){s.suites.push({id:'RUN-B-1',student:'B',room:'R1',phase:'RECORDING',subject:0,requestedAt:t-10000,startedAt:t-5000,deadline:t+115000,orientation:'landscape',lens:'rear',paperId:paper.id,subjects:paper.parts.map((p,i)=>({status:i?'NOT_STARTED':'RECORDING',fileId:null,announcements:i?0:1})),files:[]});s.students[1].suite='RUN-B-1';s.rooms[0].current='RUN-B-1';}
 if(['RV01','AC02','AD05','AD06','ST03','RE03'].includes(page)){for(const id of ['A','B']){issue(id,-1200000);const r={id:'RUN-'+id+'-1',student:id,room:'R1',phase:'CLEARED',subject:2,requestedAt:t-250000,startedAt:t-240000,deadline:null,orientation:'landscape',lens:'rear',paperId:paper.id,subjects:paper.parts.map(()=>({status:'SAVED',announcements:1})),files:paper.parts.map((p,i)=>({id:'FILE-'+id+'-'+i,student:id,subject:i,upload:'VERIFIED',materialVersion:'MAT-'+id+'-'+i+'-v1'}))};s.suites.push(r);s.students.find(x=>x.id===id).suite=r.id;}s.scores['reading:1:A:MAT-A-0-v1']='0';s.exam.videoReleased=page==='ST03';}
 if(page==='AD04'&&variant==='cancelled-safe'){
 const p=s.students[0],id='RUN-A-CANCELLED-1';p.allocationVersion='ARR-A-R1-v1';p.suite=id;
 s.suites.push({id,student:'A',room:'R1',allocationVersion:'ARR-A-R1-v1',phase:'CANCELLED_SAFE',releaseConfirmed:true,startedAt:null,requestedAt:t-10000,subject:0,subjects:paper.parts.map(()=>({status:'NOT_STARTED',announcements:0})),files:[],paperId:p.issue.paperId});
}
if(page==='AD06'){
 s.exam.onsiteState='CLOSED';s.exam.status='ONSITE_CLOSED';
 if(['clean','clean-backlog'].includes(variant)){
  s.materialChecks={};for(const v of s.suites)for(const f of v.files)s.materialChecks[f.id]='CHECKED';
  for(const subject of ['reading','news','commentary'])for(let i=1;i<=s.exam.judgeCount;i++){const seat=subject+':'+i,q={reading:0,news:1,commentary:2}[subject];for(const p of s.students)s.scores[seat+':'+p.id+':MAT-'+p.id+'-'+q+'-v1']=p.id==='A'?'0':'80';s.submitted[seat]={at:t-1000,sample:'explicit-completed-upstream'};}
  s.exam.videoReleased=true;
 }
 if(variant==='clean-backlog')s.backgroundTasks=[{id:'BG-B-ORIGINAL-CHECK',executionId:'RUN-B-1',fileId:'FILE-B-0',student:'B',originalRoom:'R1',materialVersion:'MAT-B-0-v1',kind:'TECHNICAL_RECHECK',localSafe:true,identityFixed:true,authorizationContinues:true,state:'QUEUED'}];
}
if(['ST02','RV01','DV01'].includes(page)){
 const useStandard=variant!=='extreme';
 if(useStandard){for(const p of s.students)if(p.issue){p.issue.paperId=fixture35.id;p.issue.paper=structuredClone(fixture35);}for(const v of s.suites){v.paperId=fixture35.id;v.paper=structuredClone(fixture35);}}
 if(page==='DV01'&&variant==='fixture35-portrait'){s.rooms[0].orientation='portrait';s.rooms[0].font=16;for(const v of s.suites){v.orientation='portrait';v.font=16;}}
}
if(page==='OP01')s.opsObservation={state:variant==='observed-empty'?'COLLECTED':variant==='stale'?'STALE':'UNKNOWN',observedAt:variant==='observed-empty'?t:variant==='stale'?t-3600000:null,pendingFiles:variant==='observed-empty'?0:null,failedChecks:variant==='observed-empty'?0:null};
if(['AC02','RV01','AD05','AD06','ST03'].includes(page))for(const v of s.suites)for(const f of v.files)(s.qualityChecks||={})[f.id]={version:f.materialVersion,verdict:'PASS',reason:'明确标识的上游已完成样例'};
if(['RV01','AD05','ST03'].includes(page)){for(const v of s.suites)for(const f of v.files)(s.materialChecks||={})[f.id]='CHECKED';s.exam.reviewOpen={0:true,1:true,2:true};}
return s;
}
