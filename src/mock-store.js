/* Local fictional workflow model for the interactive prototype. No production service or authentication. */
(() => {
  const params = new URLSearchParams(location.search);
  const fixture = ['published','pending','signed'].includes(params.get('fixture')) ? params.get('fixture') : '';
  const walk=['academic','student','invigilator','recorder','teacher','admin'].includes(params.get('walk'))?params.get('walk'):'';
  const KEY = 'yifeng.frontend.github.v04' + (walk ? ':walk:'+walk : fixture ? ':' + fixture : '');
  const subjects = ['作品朗读','新闻播报','话题评述'];
  const students = [
    {id:'A',name:'示例学员A',code:'YF-001',class:'示例一班'},
    {id:'B',name:'示例学员B',code:'YF-002',class:'示例二班'},
    {id:'C',name:'示例学员C',code:'YF-003',class:'示例一班'}
  ];
  const clone = v => structuredClone(v);
  const stamp = () => new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});
  const record = (id,seat) => ({id,seat,checkin:false,checkinAt:'',draw:null,drawPending:false,handoff:'idle',onsiteEnded:false,attendance:'normal',subject:0,stage:'ready',started:0,files:[null,null,null],history:[[],[],[]]});
  const makeExam = (id,name,date,room='03考场') => ({id,name,date,room,status:'draft',slot:'09:00–12:00',roster:[],records:{},paperSelected:false,paperComplete:true,staff:{invigilator:'staff1',recorder:'staff1'},staffRev:1,deviceChecked:false,assignments:[[0,1],[0,1],[0,1]],assignmentRev:1,opened:[false,false,false],current:null,queue:[],scores:{},drafts:{},scoreAudit:[],scoreRev:1,publications:[],exceptions:[],transfers:[],corrections:[],log:[],prepSaved:false});
  const fullFile = (e,p,q,version=1,owner='staff1') => ({id:`${e.id}-${p}-${q}-v${version}`,examId:e.id,person:p,q,version,device:e.room+'-01',originRecorder:owner,custodian:owner,local:true,abnormal:false,upload:'received',checked:true,createdAt:stamp()});
  const key = (q,t,p) => `${q}-${t}-${p}`;
  const mean = (e,q,p) => {
    const values=e.assignments[q].map(t=>e.scores[key(q,t,p)]?.value);
    return values.length&&values.every(Number.isFinite)?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2):null;
  };
  const snapshot = e => ({version:e.publications.length+1,scoreRev:e.scoreRev,name:e.name,date:e.date,publishedAt:stamp(),results:Object.fromEntries(e.roster.map(p=>[p,subjects.map((_,q)=>mean(e,q,p))]))});
  function prepare(e) {e.roster=['A','B','C'];e.queue=[...e.roster];e.records=Object.fromEntries(e.roster.map((p,i)=>[p,record(p,String(i+1).padStart(2,'0'))]));e.paperSelected=true;e.status='ready';e.prepSaved=true;}
  function fillResults(e) {
    prepare(e);e.status='live';e.deviceChecked=true;e.opened=[true,true,true];
    for(const p of e.roster){const r=e.records[p];Object.assign(r,{checkin:true,checkinAt:'09:00',draw:17,handoff:'accepted',onsiteEnded:true,stage:'done',subject:2});r.files=subjects.map((_,q)=>fullFile(e,p,q));for(let q=0;q<3;q++)for(let t=0;t<2;t++)e.scores[key(q,t,p)]={value:[86,85,90][q]+t*2-(p==='B'?2:p==='C'?4:0),videoVersion:1,revision:1,updatedAt:stamp()};}
  }
  function seed(preset='start') {
    const e=makeExam('EX1','第一轮播音模拟考','2026-10-22');const history=makeExam('EXH','上一轮播音模拟考','2026-10-15');fillResults(history);history.publications=[snapshot(history)];history.status='archived';
    if(['queue','record','transfer','incident','signed'].includes(preset))prepare(e);
    if(['queue','record','transfer','incident'].includes(preset))for(const p of e.roster)Object.assign(e.records[p],{checkin:true,checkinAt:'09:05',draw:17});
    if(['record','transfer','incident'].includes(preset)){e.status='live';e.deviceChecked=true;e.current='A';e.records.A.handoff='accepted';}
    if(preset==='signed')Object.assign(e.records.A,{checkin:true,checkinAt:'09:05'});
    if(['post','grading','missing','upload','published','pending'].includes(preset)){fillResults(e);if(preset==='grading')e.scores={};if(preset==='missing')delete e.scores['1-1-A'];if(preset==='upload'){e.records.A.files[2].upload='failed';e.records.A.files[2].checked=false;e.opened[2]=false;for(let t=0;t<2;t++)delete e.scores[key(2,t,'A')];}if(preset==='published')e.publications=[snapshot(e)];}
    if(preset==='incident'){const f=fullFile(e,'A',0);Object.assign(f,{abnormal:true,upload:'none',checked:false});e.records.A.files[0]=f;e.records.A.stage='interrupted';e.exceptions.push({id:'CASE-1',type:'retake',person:'A',q:0,fileId:f.id,reason:'麦克风中断，原片段已保留',status:'pending',by:'recorder',createdAt:stamp(),messages:[]});}
    return {version:4,seq:20,examSeq:2,exams:{EX1:e,EXH:history},staff:{staff1:{id:'staff1',name:'工作人员甲',active:true},staff2:{id:'staff2',name:'工作人员乙',active:true}},faults:{offline:false,saveFail:false,networkFail:false,permission:false}};
  }
  function walkSeed(role){
    const d=seed(role==='teacher'?'post':['student','invigilator','recorder','admin'].includes(role)?'queue':'start'),e=d.exams.EX1;
    d.exams={EX1:e};e.name='正常流程体验 · 模拟考';
    if(role!=='academic'){
      const ids=role==='invigilator'?['A','B']:['A'];e.roster=ids;e.queue=[...ids];e.records=Object.fromEntries(ids.map((p,i)=>[p,e.records[p]||record(p,String(i+1).padStart(2,'0'))]));
      e.scores=Object.fromEntries(Object.entries(e.scores).filter(([k])=>ids.includes(k.split('-')[2])));
    }
    if(role==='student'||role==='invigilator'){e.records.A=record('A','01');}
    if(role==='recorder'){e.current='A';e.records.A.handoff='pending';e.status='live';e.deviceChecked=false;}
    if(role==='admin'){e.status='draft';e.records.A=record('A','01');}
    if(role==='teacher'){e.assignments=[[0,1],[1],[1]];delete e.scores['0-0-A'];}
    d.walkRole=role;return d;
  }
  function completeWalkSample(e,graded=false,published=false){
    if(!e.roster.length)throw Error('请先完成本场名单。');
    e.status='live';e.current=null;e.deviceChecked=true;e.opened=[graded,graded,graded];e.scores={};e.drafts={};e.publications=[];
    for(const p of e.roster){const r=e.records[p];Object.assign(r,{checkin:true,checkinAt:r.checkinAt||stamp(),draw:17,drawPending:false,handoff:'accepted',onsiteEnded:true,subject:2,stage:'done'});r.files=subjects.map((_,q)=>({...fullFile(e,p,q,1,e.staff.recorder),checked:graded}));
      if(graded)for(let q=0;q<3;q++)for(const t of e.assignments[q])e.scores[key(q,t,p)]={value:86+q+t,videoVersion:1,revision:1,updatedAt:stamp()};
    }
    e.scoreRev++;if(published)e.publications=[snapshot(e)];
  }
  function advanceWalk(action,examId='EX1'){
    if(!walk)return {ok:false,message:'仅在独立角色体验中接续虚构样例。'};
    const d=read(),e=d.exams[examId];if(!e)return {ok:false,message:'请先选择本场。'};
    try{
      if(action==='materials'&&walk==='academic'){if(e.status==='draft')throw Error('请先由教务开放本场。');completeWalkSample(e);}
      else if(action==='graded'&&walk==='admin')completeWalkSample(e,true);
      else if(action==='published'&&walk==='student')completeWalkSample(e,true,true);
      else if(action==='arrival'&&walk==='invigilator'){const r=e.records[e.roster[0]];Object.assign(r,{checkin:true,checkinAt:stamp(),draw:17,drawPending:false});}
      else if(action==='receive'&&walk==='invigilator'){const r=e.records[e.current];if(!r||r.handoff!=='pending')throw Error('先完成学员核对并发出交接。');r.handoff='accepted';}
      else if(action==='onsite-end'&&walk==='invigilator'){const r=e.records[e.current];if(!r||r.handoff!=='accepted')throw Error('先查看录制员接收后的状态。');Object.assign(r,{onsiteEnded:true,stage:'done',subject:2});r.files=subjects.map((_,q)=>({...fullFile(e,r.id,q,1,e.staff.recorder),upload:'queued',checked:false}));e.lastEnded=r.id;e.current=null;}
      else throw Error('当前角色没有这一段体验接续。');
      write(d);return {ok:true,message:'已接续其他岗位完成后的虚构样例。'};
    }catch(error){return {ok:false,message:error.message};}
  }
  let memory=null,storageError=false;
  function read(){if(storageError&&memory)return memory;try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===4?d:walk?walkSeed(walk):seed(fixture||'start');}catch{return memory||(walk?walkSeed(walk):seed(fixture||'start'));}}
  const listeners=new Set();
  function notify(announce=true){listeners.forEach(fn=>fn());if(announce&&parent!==window)parent.postMessage({type:'yf-state'},'*');}
  function write(d){memory=d;try{localStorage.setItem(KEY,JSON.stringify(d));storageError=false;}catch{storageError=true;}notify();}
  function edit(fn){const d=read();const temp={...d.faults};fn(temp);for(const k of Object.keys(d.faults))d.faults[k]=!!temp[k];write(d);}
  function reset(preset='start'){write(seed(preset));}
  function allowedExam(a,e){return ['admin','academic'].includes(a.group)||a.group==='teacher'&&e.assignments.some(v=>v.includes(a.teacher))||a.group==='student'&&e.roster.includes(a.studentId)||['invigilator','recorder'].includes(a.group)&&(e.staff[a.group]===a.staffId||e.transfers.some(t=>t.from===a.staffId||t.to===a.staffId));}
  function responsible(a,e){return ['admin','academic'].includes(a.group)||['invigilator','recorder'].includes(a.group)&&e.staff[a.group]===a.staffId;}
  const publicRecord = r => ({id:r.id,seat:r.seat,checkin:r.checkin,checkinAt:r.checkinAt,draw:r.draw,drawPending:r.drawPending,handoff:r.handoff,onsiteEnded:r.onsiteEnded,attendance:r.attendance});
  function view(actorId,examId='EX1'){
    const d=read(),a=RolePolicy.get(actorId),source=d.exams[examId];const out={actor:a,staff:clone(d.staff),faults:clone(d.faults),storageError,exams:Object.values(d.exams).filter(e=>allowedExam(a,e)).map(e=>({id:e.id,name:e.name,date:e.date,room:e.room,status:e.status,publicationVersion:e.publications.length})),exam:null,people:[]};
    if(!source||!allowedExam(a,source))return out;
    const e=clone(source);out.exam=e;
    if(['admin','academic'].includes(a.group)){out.people=clone(students);if(a.group==='academic'){delete e.scores;delete e.drafts;delete e.scoreAudit;delete e.corrections;e.publications=e.publications.map(p=>({version:p.version,publishedAt:p.publishedAt}));}return out;}
    delete e.log;delete e.scoreAudit;
    if(a.group==='teacher'){
      out.staff={};out.people=e.roster.map(id=>({id,code:students.find(p=>p.id===id).code}));e.assignedSubjects=e.assignments.map((v,q)=>v.includes(a.teacher)?q:-1).filter(q=>q>=0);delete e.staff;delete e.transfers;delete e.queue;delete e.current;
      const mine=k=>+k.split('-')[1]===a.teacher&&e.assignedSubjects.includes(+k.split('-')[0]);e.scores=Object.fromEntries(Object.entries(e.scores).filter(([k])=>mine(k)));e.drafts=Object.fromEntries(Object.entries(e.drafts).filter(([k])=>mine(k)));e.corrections=e.corrections.filter(v=>v.by===actorId);e.publications=[];
      for(const r of Object.values(e.records)){r.files=r.files.map((f,q)=>e.assignedSubjects.includes(q)&&f?{id:f.id,version:f.version,checked:f.checked,upload:f.upload,abnormal:f.abnormal}:null);delete r.history;delete r.checkinAt;}
      e.exceptions=e.exceptions.filter(x=>x.by===actorId).map(x=>clone(x));e.blockedFiles=source.roster.flatMap(p=>subjects.map((_,q)=>fileBlocked(source,p,q)?`${p}-${q}`:null)).filter(Boolean);return out;
    }
    delete e.scores;delete e.drafts;delete e.corrections;delete e.assignments;
    if(a.group==='student'){
      out.staff={};delete e.lastEnded;out.people=clone(students.filter(p=>p.id===a.studentId));e.records={[a.studentId]:publicRecord(e.records[a.studentId])};e.roster=[a.studentId];e.publications=e.publications.map(p=>({version:p.version,name:p.name,date:p.date,publishedAt:p.publishedAt,result:p.results[a.studentId]}));delete e.staff;delete e.queue;delete e.current;delete e.transfers;e.exceptions=e.exceptions.filter(v=>v.person===a.studentId&&['absence','reorder','redraw','return'].includes(v.type)).map(v=>({id:v.id,type:v.type,status:v.status,response:v.response}));return out;
    }
    e.publications=[];e.transfers=e.transfers.filter(t=>t.from===a.staffId||t.to===a.staffId);
    if(a.group==='invigilator'){
      out.people=responsible(a,source)?clone(students.filter(p=>e.roster.includes(p.id))):[];e.records=responsible(a,source)?Object.fromEntries(Object.entries(e.records).map(([p,r])=>[p,publicRecord(r)])):{};e.exceptions=e.exceptions.filter(v=>['absence','reorder','redraw','return'].includes(v.type));
    }else if(a.group==='recorder'){
      const ids=source.roster.filter(p=>source.current===p&&responsible(a,source)||source.records[p].files.some(f=>f?.custodian===a.staffId)||source.records[p].history.some(v=>v.some(f=>f.custodian===a.staffId)));
      out.people=clone(students.filter(p=>ids.includes(p.id)));e.records=Object.fromEntries(Object.entries(e.records).filter(([p])=>ids.includes(p)));e.roster=ids;e.exceptions=e.exceptions.filter(v=>ids.includes(v.person));
    }
    return out;
  }
  function fileBlocked(e,p,q){return e.exceptions.some(x=>x.person===p&&x.q===q&&['material','retake','replace'].includes(x.type)&&['pending','approved','executing'].includes(x.status));}
  function prepIssues(e,d){return [!e.name.trim()&&'考试名称',!e.date&&'日期',!e.roster.length&&'名单',!e.paperSelected&&'完整套卷',!e.paperComplete&&'题套缺科',!d.staff[e.staff.invigilator]?.active&&'监考岗位',!d.staff[e.staff.recorder]?.active&&'录制岗位',e.assignments.some(v=>!v.length)&&'评分分工'].filter(Boolean);}
  function publishIssues(e){let list=[];for(const p of e.roster){const r=e.records[p];if(r.attendance==='absent'){list.push(`${p}缺考的成绩规则待确认`);continue;}for(let q=0;q<3;q++){const f=r.files[q];if(!f||f.abnormal||f.upload!=='received'||!f.checked||!e.opened[q]||fileBlocked(e,p,q))list.push(`${p}的${subjects[q]}材料未就绪`);for(const t of e.assignments[q])if(!Number.isFinite(e.scores[key(q,t,p)]?.value)||e.scores[key(q,t,p)]?.videoVersion!==f?.version)list.push(`${p}的${subjects[q]}缺老师${t+1}有效评分`);}}
      if(e.corrections.some(x=>x.status==='pending'))list.push('仍有待处理改分申请');return list;}
  function findFile(e,id){for(const r of Object.values(e.records))for(const f of [...r.files,...r.history.flat()])if(f?.id===id)return f;return null;}
  function busy(e){return e.current&&['recording','saving'].includes(e.records[e.current].stage);}
  function pendingTransfer(e,role){return e.transfers.some(t=>t.role===role&&t.status==='pending');}
  function staffConflict(d,e,id,role){return Object.values(d.exams).some(x=>x.id!==e.id&&x.status!=='archived'&&x.status!=='draft'&&x.date===e.date&&x.slot===e.slot&&x.staff[role]===id);}
  function invalidate(e,p,q,reason){for(const t of e.assignments[q]){const k=key(q,t,p);if(e.scores[k]){e.scoreAudit.push({key:k,...clone(e.scores[k]),reason,at:stamp()});delete e.scores[k];}}e.opened[q]=false;e.scoreRev++;}
  function run(actorId,command,input={}){
    const a=RolePolicy.get(actorId),d=read(),e=d.exams[input.examId||'EX1'];let message='',target=null;const fail=reason=>{throw new Error(reason)};const needs=(truth,msg)=>{if(!truth)fail(msg)};const group=(...groups)=>needs(groups.includes(a.group),'当前岗位不能执行这个操作。');const id=prefix=>prefix+'-'+(++d.seq);const log=(text)=>e?.log.push({at:stamp(),by:a.name,text});
    try{
      needs(a.group!=='unknown','请选择有效的体验身份。');
      const localCommands=['draft-score','start-record','finish-record','query-save','interrupt-record','verify-local','next-subject','end-person'];
      needs(!d.faults.offline||localCommands.includes(command),'当前离线。原记录保留，恢复连接后继续此操作。');
      if(command==='create-exam'){
        group('admin','academic');needs(input.name?.trim()&&input.date,'请填写考试名称和日期。');const nid='EX'+d.examSeq++;const n=makeExam(nid,input.name.trim(),input.date,input.room||'03考场');if(input.copyFrom&&d.exams[input.copyFrom]){const old=d.exams[input.copyFrom];n.staff=clone(old.staff);n.assignments=clone(old.assignments);n.paperSelected=old.paperSelected;n.paperComplete=old.paperComplete;}d.exams[nid]=n;write(d);return {ok:true,message:'新考试草稿已建立。请准备本场名单，再检查并开放岗位任务。',examId:nid,target:'W01'};
      }
      needs(e&&allowedExam(a,e),'当前身份没有这场考试的任务。');needs(e.status!=='archived','这场考试已归档，当前仅可查阅历史记录。');needs(!d.faults.permission,'当前任务授权待核对，请联系管理员。');
      if(['recorder','invigilator'].includes(a.group)&&!['create-transfer','accept-transfer','reject-transfer','cancel-transfer'].includes(command)){needs(d.staff[a.staffId]?.active&&responsible(a,e),'本场岗位已移交或账号已停用，请查看移交回执。');}
      const p=input.person||a.studentId||e.current, r=e.records[p], q=Number.isInteger(+input.q)?+input.q:0;
      const qValid=()=>needs(q>=0&&q<3,'科目不正确。');const person=()=>needs(r,'这名学员不在本场名单中。');const currentPerson=()=>{person();needs(e.current===p&&r.handoff==='accepted','请先接收本场当前学员。');};
      const teacher=()=>{group('teacher');person();qValid();needs(e.assignments[q].includes(a.teacher),'本科目未分配给本人。');};
      switch(command){
        case'save-exam': group('admin','academic');needs(e.status==='draft','本场已开放，不能在准备页改变考试归属。');needs(input.name?.trim()&&input.date,'请填写名称和日期。');Object.assign(e,{name:input.name.trim(),date:input.date,room:input.room,prepSaved:true});message='本场草稿已保存，名单、套卷和岗位仍需逐项确认。';break;
        case'import-roster': group('admin','academic');needs(e.status==='draft','本场已开放，不在导入页覆盖应考记录。');needs(input.people?.length,'至少选择一名学员。');needs(input.verified,'请确认同名学员的机构编号和本场安排。');needs(input.people.every(p=>students.some(s=>s.id===p)),'名单包含未知学员。');e.roster=[...new Set(input.people)];e.queue=[...e.roster];e.records=Object.fromEntries(e.roster.map((p,i)=>[p,e.records[p]||record(p,String(i+1).padStart(2,'0'))]));message='本批名单已导入。请核对本场排次和岗位。';target='W12';break;
        case'save-paper': group('admin','academic');needs(e.status==='draft','现场已开放，现用题套保持原版本。重抽需单独申请。');needs(input.complete,'缺科题套不能选入本场。');e.paperSelected=true;e.paperComplete=true;message='完整17号-v1已选入本场。';break;
        case'save-assignments': group('admin');needs(input.assignments?.length===3&&input.assignments.every(v=>v.length&&v.every(t=>[0,1].includes(t))),'每科至少分配一位老师。');needs(!Object.keys(e.scores).length,'已有评分时保持分工；不通过撤换老师改变平均分依据。');e.assignments=clone(input.assignments);e.assignmentRev++;message='评分分工已保存，每位老师评本科全部学员。';break;
        case'assign-staff': group('admin');needs(e.status==='draft','已开放场次请使用人员移交。');needs(d.staff[input.monitor]?.active&&d.staff[input.recorder]?.active,'请选择可用工作人员。');e.staff={invigilator:input.monitor,recorder:input.recorder};e.staffRev++;message='本场岗位已安排。';break;
        case'activate-exam': group('admin','academic');needs(e.status==='draft','本场已开放，无需重复开放。');needs(!prepIssues(e,d).length,'请先处理：'+prepIssues(e,d).join('、'));for(const role of ['invigilator','recorder'])needs(!staffConflict(d,e,e.staff[role],role),'同日期同时间段已有该人员的岗位任务，请调整安排。');e.status='ready';message='本场已开放。学生、监考、录制和评卷老师可从自己的任务列表找到本场。';target='U03';break;
        case'checkin': group('student');person();needs(e.status!=='draft'&&e.status!=='archived','本场尚未开放或已归档。');needs(input.scan==='valid','请扫描本人的本场考场签到码。');if(!r.checkin){r.checkin=true;r.checkinAt=stamp();}message='本人签到已确认，重复操作保留原记录。请按现场安排候考。';target='S04';break;
        case'draw': group('student');person();needs(r.checkin&&!r.onsiteEnded&&r.attendance!=='absent','请先确认本人签到与候考状态。');needs(!r.draw,'已有本次抽题结果，请查询原记录。');r.draw=17;r.drawPending=true;message='抽题请求已登记，请查询本次结果。';break;
        case'query-draw':group('student');person();needs(r.draw,'尚无抽题记录。');r.drawPending=false;message='本次抽取17号-v1，查询没有重新抽取。';break;
        case'handoff':group('invigilator');person();needs(!pendingTransfer(e,'invigilator')&&!pendingTransfer(e,'recorder'),'岗位移交待接收，先完成移交后再交接学员。');needs(!e.current,'场内仍有当前学员，请等本位现场结束。');needs(r.checkin&&r.draw&&!r.drawPending&&!r.onsiteEnded&&r.attendance!=='absent','本位签到、抽题确认或候考条件尚未满足。');const next=e.queue.find(id=>!e.records[id].onsiteEnded&&e.records[id].attendance!=='absent');needs(next===p,'请先处理队首学员，过号或调整顺序请登记现场申请。');e.current=p;r.handoff='pending';e.status='live';message='已发出本位交接，等待录制员确认接收。';target='M04';break;
        case'check-device':group('recorder');needs(input.verified,'请逐项确认画面、声音和同屏检查。');e.deviceChecked=true;message='本场设备检查已记录。';break;
        case'accept-person':group('recorder');person();needs(e.current===p&&r.handoff==='pending'&&e.deviceChecked,'请先完成设备检查并核对待接收学员。');needs(!pendingTransfer(e,'recorder'),'请先完成岗位移交。');r.handoff='accepted';message='本位已接收。场外可查询此回执。';target='A04';break;
        case'start-record':group('recorder');currentPerson();qValid();needs(e.deviceChecked&&!pendingTransfer(e,'recorder'),'请先完成设备检查或待接收的岗位移交。');needs(r.subject===q&&r.stage==='ready'&&!r.files[q],'当前科目不满足开始条件。');r.stage='recording';r.started=Date.now();message='本科录制进行中。';break;
        case'finish-record':group('recorder');currentPerson();needs(r.stage==='recording'&&r.subject===q,'当前没有该科录制。');r.stage='saving';message='正在保存本科原文件。离开后可查询原保存结果。';break;
        case'query-save':group('recorder');currentPerson();needs(r.stage==='saving'&&r.subject===q,'没有待查询的本科保存任务。');const ver=r.history[q].length+1;r.files[q]={...fullFile(e,p,q,ver,a.staffId),upload:'none',checked:false};r.stage='saved';message='本地已保存。请检查本科结果后加入上传。';break;
        case'verify-local':group('recorder');person();qValid();needs(r.files[q]?.custodian===a.staffId&&r.files[q].local&&!r.files[q].abnormal,'没有可核验的完整本机文件。');needs(r.files[q].upload==='none','本科已进入原上传任务，无需重复加入。');r.files[q].upload='queued';message='本科原文件已加入上传队列。';break;
        case'next-subject':group('recorder');currentPerson();needs(r.files[r.subject]?.upload!=='none'&&r.files[r.subject]&&!r.files[r.subject].abnormal,'请先检查本科保存结果。');const nextQ=r.files.findIndex(f=>!f);needs(nextQ>=0,'三科均已保存，请结束本位现场。');r.subject=nextQ;r.stage='ready';message='已进入下一科准备。';break;
        case'end-person':group('recorder');currentPerson();needs(r.files.every(f=>f?.local&&!f.abnormal&&f.upload!=='none'),'三科尚未完整保存并检查。');r.onsiteEnded=true;r.stage='done';e.current=null;e.lastEnded=p;for(const x of e.exceptions.filter(x=>x.person===p&&['retake','replace','material'].includes(x.type)&&x.status==='executing')){x.status='awaiting_material';}message='本位现场已结束，考场已释放给下一位。原文件继续保留在本考试、本学员名下。';target='A04';break;
        case'begin-upload':case'query-upload': {group('recorder');const f=findFile(e,input.fileId);needs(f?.custodian===a.staffId&&f.local&&!f.abnormal,'请从本人保管的完整原文件执行上传。');needs(f.upload!=='received','后台已收到该原文件，无需重复上传。');if(command==='begin-upload'){needs(f.upload!=='uploading','上传中请查询原任务。');f.upload='uploading';message='正在上传原文件，归属保持不变。';}else{needs(f.upload==='uploading','没有正在上传的原任务。');f.upload=d.faults.networkFail?'failed':'received';message=d.faults.networkFail?'上传失败，原文件保留，请重试。':'后台已收到，等待材料负责人核对。';}break;}
        case'confirm-material': group('admin','academic');person();qValid();needs(r.files[q]?.upload==='received'&&!r.files[q].abnormal,'后台尚无可核验的完整视频。');r.files[q].checked=true;for(const x of e.exceptions.filter(x=>x.person===p&&x.q===q&&['awaiting_material','executing'].includes(x.status))){x.status='resolved';x.resolvedAt=stamp();}message='本场、本人、本科的视频版本已核验。请回本科清单检查开放条件。';break;
        case'open-subject':group('admin','academic');qValid();needs(e.roster.length&&e.roster.every(p=>e.records[p].files[q]?.checked&&!fileBlocked(e,p,q)),'本科仍有缺视频、异常或未核验材料，请按完整名单处理。');e.opened[q]=true;message='本科已开放，每位分配老师均评本科全部学员。';break;
        case'draft-score':teacher();e.drafts[key(q,a.teacher,p)]=String(input.value??'');message='输入已在本机保留，尚未提交。';break;
        case'save-score':teacher();{const k=key(q,a.teacher,p),f=r.files[q],value=Number(input.value);needs(input.value!==''&&Number.isFinite(value)&&value>=0&&value<=100&&/^\d+(\.\d{1,2})?$/.test(String(input.value)),'请填写0–100之间的分数，最多两位小数（演示假设）。');needs(e.opened[q]&&f?.checked&&!fileBlocked(e,p,q),'本科尚未开放或原视频有待处理问题。');needs(!e.scores[k],'已有评分请提交改分申请，保留原分数和原因。');needs(!d.faults.saveFail,'保存失败，原输入已保留，请回原任务重试。');e.scores[k]={value,videoVersion:f.version,revision:1,updatedAt:stamp()};delete e.drafts[k];e.scoreRev++;message='本人评分已保存，尚未向学生发布。';break;}
        case'create-correction':teacher();{const k=key(q,a.teacher,p),old=e.scores[k],value=Number(input.value);needs(old,'请先完成原评分。');needs(input.reason?.trim(),'请填写改分原因。');needs(input.value!==''&&Number.isFinite(value)&&value>=0&&value<=100&&/^\d+(\.\d{1,2})?$/.test(String(input.value)),'新分数须在0–100之间，最多两位小数。');needs(value!==old.value,'新分数与原分数一致。');needs(!e.corrections.some(c=>c.key===k&&c.status==='pending'),'本任务已有待处理申请，请查看原申请。');const c={id:id('COR'),key:k,person:p,q,teacher:a.teacher,by:actorId,oldValue:old.value,newValue:value,reason:input.reason.trim(),scoreRevision:old.revision,videoVersion:old.videoVersion,status:'pending',createdAt:stamp()};e.corrections.push(c);message='改分申请已提交，原分数和已发布成绩保持原版本。';target='W24';break;}
        case'cancel-correction':group('teacher');{const c=e.corrections.find(x=>x.id===input.id);needs(c?.by===actorId&&c.status==='pending','仅能撤回本人待处理申请。');c.status='cancelled';message='申请已撤回，原评分未改变。';break;}
        case'decide-correction':group('admin');{const c=e.corrections.find(x=>x.id===input.id);needs(c?.status==='pending','该申请已处理，请查看最新记录。');needs(input.reason?.trim(),'请填写处理说明。');needs(input.demoConfirmed,'请确认此处按演示假设处理，正式改分决定权仍待确认。');const old=e.scores[c.key];if(input.decision==='approve'){needs(old&&old.revision===c.scoreRevision&&old.videoVersion===c.videoVersion,'原评分或视频版本已改变，请退回后由老师重新申请。');needs(!fileBlocked(e,c.person,c.q),'原材料仍有待处理异常，请先核验。');e.scoreAudit.push({key:c.key,...clone(old),reason:c.reason,decisionReason:input.reason,requestId:c.id,at:stamp()});e.scores[c.key]={value:c.newValue,revision:old.revision+1,videoVersion:old.videoVersion,updatedAt:stamp()};delete e.drafts[c.key];e.scoreRev++;c.status='applied';}else c.status='rejected';c.response=input.reason.trim();c.decidedAt=stamp();c.decider=a.name;message=c.status==='applied'?'申请分数已生效，旧原始分保留。学生仍看旧发布版本，请重新核对再发布。':'申请已退回，原分数保持。老师可查看原因后重新申请。';break;}
        case'publish':group('admin');needs(e.status!=='draft','本场尚未开放。');needs(input.scoreRev===e.scoreRev,'评分发生变化，请重新核对后发布。');needs(!publishIssues(e).length,'发布条件尚未满足：'+publishIssues(e).slice(0,3).join('；'));if(e.publications.at(-1)?.scoreRev===e.scoreRev){message='本版本已发布，重复提交返回原记录。';target='W18';break;}e.publications.push(snapshot(e));message='本次结果已发布，每位学生仅能查看本人结果。';target='W18';break;
        case'create-transfer':group('admin','recorder','invigilator');{const role=input.role;needs(['recorder','invigilator'].includes(role),'请选择现场岗位。');needs(a.group==='admin'||role===a.group&&e.staff[role]===a.staffId,'只能移交本人现有岗位。');needs(d.staff[input.to]?.active&&input.to!==e.staff[role],'请选择另一位可用接手人。');needs(input.reason?.trim(),'请填写移交原因。');needs(!pendingTransfer(e,role),'该岗位已有待接收移交，请查询原单。');needs(!busy(e),'正在录制或封装，请先保存或登记异常再移交。');const t={id:id('TR'),role,from:e.staff[role],to:input.to,reason:input.reason.trim(),status:'pending',staffRev:e.staffRev,person:e.current,createdAt:stamp(),files:Object.values(e.records).flatMap(r=>[...r.files,...r.history.flat()]).filter(f=>f&&f.custodian===e.staff[role]&&f.upload!=='received').map(f=>f.id)};e.transfers.push(t);message='移交单已发出，原岗位仍有效；接手人确认后才切换责任。';target='T01';break;}
        case'accept-transfer':case'reject-transfer':{group('recorder','invigilator');const t=e.transfers.find(x=>x.id===input.id);needs(t?.status==='pending'&&t.to===a.staffId&&t.role===a.group,'当前岗位没有这份待接收移交。');needs(input.reason?.trim(),'请填写接收或退回说明。');if(command==='reject-transfer'){t.status='rejected';t.response=input.reason.trim();message='已退回，原人员继续负责。';break;}needs(input.verified,'请核对当前学员、同一设备和原文件清单。');needs(t.staffRev===e.staffRev&&e.staff[t.role]===t.from,'岗位已变化，请退回后重新发起。');needs(!busy(e),'当前仍在录制或封装，暂不能接收。');needs(!staffConflict(d,e,t.to,t.role),'同时间段有其他考试岗位，请先调整冲突。');e.staff[t.role]=t.to;e.staffRev++;if(t.role==='recorder'){for(const r of Object.values(e.records))for(const f of [...r.files,...r.history.flat()])if(f?.custodian===t.from)f.custodian=t.to;e.deviceChecked=false;}t.status='accepted';t.response=input.reason.trim();t.acceptedAt=stamp();message='岗位移交完成。原人退出本岗位执行，原文件与学员归属保留；接手录制员需复核设备。';break;}
        case'cancel-transfer':group('admin','recorder','invigilator');{const t=e.transfers.find(x=>x.id===input.id);needs(t?.status==='pending'&&(a.group==='admin'||t.from===a.staffId),'仅能撤回本人待接收移交。');t.status='cancelled';message='移交已撤回，原岗位保持。';break;}
        case'disable-staff':group('admin');needs(d.staff[input.staffId],'账号不存在。');needs(!Object.values(d.exams).some(x=>x.status!=='archived'&&(Object.values(x.staff).includes(input.staffId)||x.transfers.some(t=>t.status==='pending'&&t.to===input.staffId))),'该账号仍有场次岗位或待接收任务，请先完成各岗位移交。');d.staff[input.staffId].active=false;message='账号已停用，历史移交和原文件记录保留。';break;
        case'interrupt-record':group('recorder');currentPerson();needs(r.stage==='recording'&&input.reason?.trim(),'请在录制中填写具体异常原因。');{const f={...fullFile(e,p,r.subject,r.history[r.subject].length+1,a.staffId),upload:'none',checked:false,abnormal:true};r.files[r.subject]=f;r.stage='interrupted';e.exceptions.push({id:id('CASE'),type:'retake',person:p,q:r.subject,fileId:f.id,reason:input.reason.trim(),status:'pending',by:actorId,createdAt:stamp(),messages:[]});message='异常片段和原因已保留，等待负责人处理。';target='X01';break;}
        case'create-exception':{group('admin','academic','invigilator','recorder','teacher');person();needs(input.reason?.trim(),'请填写具体原因。');const type=input.type;needs(['material','retake','replace','absence','reorder','redraw','return'].includes(type),'请选择异常类型。');if(a.group==='teacher'){teacher();needs(type==='material','老师只能报告本人任务的视频问题。');}if(a.group==='invigilator')needs(['absence','reorder','redraw','return'].includes(type),'当前岗位只能提交现场安排申请。');if(a.group==='recorder')needs(['retake','material'].includes(type)&&e.current===p,'当前岗位只能提交当前学员的录制异常。');needs(!e.exceptions.some(x=>x.type===type&&x.person===p&&x.q===q&&['pending','approved','executing'].includes(x.status)),'该异常已有原申请，请查看处理进度。');e.exceptions.push({id:id('CASE'),type,person:p,q,fileId:r.files[q]?.id||null,reason:input.reason.trim(),status:'pending',by:actorId,createdAt:stamp(),messages:[]});message='原任务异常已登记，等待处理。不会补零或删除应评记录。';target='X01';break;}
        case'decide-exception':group('admin');{const x=e.exceptions.find(x=>x.id===input.id);needs(x?.status==='pending','此申请已处理，请查看原记录。');needs(input.reason?.trim(),'请填写处理说明。');needs(input.demoConfirmed,'正式决定权待确认，请先确认本次仅用于演示流程。');const rr=e.records[x.person];if(input.decision==='reject'){x.status='rejected';}else if(input.decision==='original-ok'){needs(x.type==='material'&&rr.files[x.q]?.upload==='received'&&input.verified,'请核验原视频可以正常评阅。');x.status='resolved';}else if(['retake','replace','material'].includes(x.type)){
          needs(!busy(e),'场内正在录制或封装，请完成当前任务后再执行处置。');needs(!e.current||e.current===x.person,'场内仍有另一位学员，待其结束后处理本申请。');const old=rr.files[x.q];if(old)rr.history[x.q].push(clone(old));rr.files[x.q]=null;invalidate(e,x.person,x.q,'异常处置 '+x.id);rr.onsiteEnded=false;rr.stage='ready';rr.subject=x.q;rr.handoff='pending';e.current=x.person;x.status='executing';
        }else if(x.type==='absence'){needs(e.current!==x.person,'该学员仍在场内，不能直接标记缺考。');rr.attendance='absent';x.status='resolved';}
        else if(x.type==='return'){needs(rr.attendance==='absent','当前学员没有缺考状态。');rr.attendance='normal';e.queue=e.queue.filter(p=>p!==x.person);e.queue.push(x.person);x.status='resolved';}
        else if(x.type==='reorder'){needs(e.current!==x.person&&!rr.onsiteEnded,'正在场内或已结束学员不能改候考顺序。');e.queue=e.queue.filter(p=>p!==x.person);e.queue.push(x.person);x.status='resolved';}
        else if(x.type==='redraw'){needs(!rr.files.some(Boolean)&&rr.handoff!=='accepted','已有录制或场内接收不能直接重抽，应核对影响范围。');rr.draw=null;rr.drawPending=false;x.status='resolved';}
        x.response=input.reason.trim();x.decidedAt=stamp();x.decider=a.name;message=x.status==='executing'?'处置已登记，原视频保留；录制员重新接收本科任务，完成后材料复核、受影响老师重评。':x.status==='rejected'?'申请已退回，原记录保持。':'处置已记录，各岗位可查询结果。';break;}
        default:fail('未识别的演示动作。');
      }
      log(message);write(d);return {ok:true,message,target,examId:e.id};
    }catch(error){return {ok:false,message:error.message};}
  }
  addEventListener('storage',ev=>{if(ev.key===KEY)notify(false);});
  addEventListener('message',ev=>{if(ev.data?.type==='yf-refresh')listeners.forEach(fn=>fn());});
  window.YF={KEY,fixture,walk,advanceWalk,subjects,students,view,run,reset,seed,edit,subscribe:fn=>listeners.add(fn),get state(){const d=read();return {...d,...d.faults};},prepIssues:(examId)=>prepIssues(read().exams[examId],read()),publishIssues:(examId)=>publishIssues(read().exams[examId]),mean:(examId,q,p)=>mean(read().exams[examId],q,p),snapshot};
  if(walk){try{if(params.get('walkReset')==='1'||!localStorage.getItem(KEY))write(walkSeed(walk));}catch{write(walkSeed(walk));}if(params.has('walkReset')){const u=new URL(location.href);u.searchParams.delete('walkReset');history.replaceState(null,'',u);}}
})();
