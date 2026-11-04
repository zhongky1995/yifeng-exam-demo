/* Product-prototype rules for the 2026-11-03 revision. All records are fictional. */
(() => {
  'use strict';
  const subjects = ['作品朗读', '新闻播报', '话题评述'];
  const now = d => Date.now() + (d.captureTimeOffset || 0);
  const batchKey = (q, teacher) => `${q}-${teacher}`;
  const scoreKey = (q, teacher, person) => `${q}-${teacher}-${person}`;
  const stamp = () => new Date().toLocaleString('sv-SE', {timeZone:'Asia/Shanghai'});
  function beginPreparation(r,d){r.stage='intro';r.preparationSeq=(r.preparationSeq||0)+1;r.introState=r.introAudioOwner?'awaiting_audio':'demo';r.introStarted=r.introAudioOwner?0:now(d);r.phaseDeadline=r.introAudioOwner?0:now(d)+ExamSpec.prepareCues[r.subject].totalMs;}
  function decorate(d) {
    RoomStaffV14.decorate(d);for(const e of Object.values(d.exams))ExamScopeV15.decorate(e);
    for (const e of Object.values(d.exams)) {
      e.site ??= '示例校区A · 教学楼2层';
      e.batchLabel ??= '上午批';
      e.reportScope ??= '本次考试';
      e.setupReview ??= null;
      e.studentVideoRelease ??= {enabled:false,at:'',by:''};
      e.batches ??= {};
      e.watchRecords ??= {};
      e.metricsSynthetic ??= false;
      e.scoreAudit ??= [];
      for (const [q, teachers] of e.assignments.entries()) {
        for (const t of teachers) e.batches[batchKey(q,t)] ??= {q,teacher:t,status:'draft',revision:0,history:[],reason:''};
      }
      for (const r of Object.values(e.records)) {
        r.forcePrepEnd ??= 0;
        r.forcePrepReason ??= '';
        if(r.stage==='buffer')beginPreparation(r,d);r.autoSequence ??= false;
        r.pauseNext ??= false;
        for (const f of r.files.filter(Boolean)) {if(f.upload!=='received')f.serverVerified=false;else f.serverVerified ??= true;}
      }
    }
    return d;
  }
  function studentReplay(e,person) {
    const r=e.records[person],ended=!!r?.onsiteEnded,released=ExamScopeV15.release(e,person),opened=!!released.enabled;
    const items=subjects.map((subject,q)=>{
      const f=r?.files[q],blocked=f?.abnormal||e.exceptions.some(x=>x.person===person&&x.q===q&&['material','retake','replace'].includes(x.type)&&['pending','approved','executing','awaiting_material'].includes(x.status));
      const state=r?.attendance==='absent'?'absent':!ended?'exam_pending':!opened?'not_open':!f||f.upload!=='received'||!f.serverVerified?'processing':!f.checked||blocked?'checking':'ready';
      const label={absent:'暂无考试录像',exam_pending:'考试尚未结束',not_open:'等待教务开放',processing:'视频处理中',checking:'视频复核中',ready:'可以回看'}[state];
      return {q,subject,state,label,canPlay:state==='ready',duration:state==='ready'?f.duration:null,version:state==='ready'?f.version:null,playbackId:state==='ready'?f.id:null};
    });
    return {ended,opened,releasedAt:opened?released.at:'',available:items.filter(x=>x.canPlay).length,items};
  }
  function batch(e, teacher, q) {
    const assigned = !!e.assignments[q]?.includes(teacher);
    const missing = [], scored = [],absent=e.roster.filter(id=>e.records[id]?.attendance==='absent'),eligible=e.roster.filter(id=>!absent.includes(id));
    for (const person of eligible) {
      const score = e.scores[scoreKey(q,teacher,person)], f = e.records[person]?.files[q];
      const valid = score && Number.isFinite(score.value) && f && score.videoVersion === f.version && f.checked && !f.abnormal && !e.blockedFiles?.includes(person+'-'+q) && !e.exceptions.some(x=>x.person===person&&x.q===q&&['pending','approved','executing','awaiting_material'].includes(x.status)&&['material','retake','replace'].includes(x.type));
      (valid ? scored : missing).push(person);
    }
    const meta = e.batches?.[batchKey(q,teacher)] || {status:'draft',revision:0,history:[]};
    return {...meta,status:!eligible.length&&absent.length?'not_required':meta.status,assigned,missing,scored,absent,eligible,total:e.roster.length,expected:eligible.length,canSubmit:assigned && !missing.length && !!eligible.length && e.opened[q] && meta.status !== 'submitted'};
  }
  function distribution(e,teacher,q) {
    const b=batch(e,teacher,q),values=b.scored.map(p=>e.scores[scoreKey(q,teacher,p)].value);
    const buckets=ExamSpec.scoreBands.map(({lower,upper,inclusive,label})=>({lower,upper,inclusive,label,count:values.filter(v=>v>=lower&&(inclusive?v<=upper:v<upper)).length}));
    return {...b,values,buckets};
  }
  function recentScores(e,teacher,q,limit=15){
    const valid=batch(e,teacher,q).scored;
    return valid.map(person=>({person,...e.scores[scoreKey(q,teacher,person)]})).sort((a,b)=>((b.updatedAtMs??Date.parse((b.updatedAt||'').replace(' ','T')))||0)-((a.updatedAtMs??Date.parse((a.updatedAt||'').replace(' ','T')))||0)||(b.saveOrder||0)-(a.saveOrder||0)).slice(0,limit);
  }
  function markSubmitted(e) {
    for (let q=0;q<3;q++) for (const t of e.assignments[q]) {
      const b=batch(e,t,q);
      if (!b.missing.length && b.expected) Object.assign(e.batches[batchKey(q,t)],{status:'submitted',revision:1,submittedAt:stamp()});
    }
  }
  const validScore = value => value !== '' && value !== null && value !== undefined && /^\d+(\.\d{1,2})?$/.test(String(value)) && Number(value)>=0 && Number(value)<=100;
  const localCommands = ['intro-audio-started','intro-audio-finished','intro-audio-failed','restart-intro-audio','force-end-preparation','start-record','finish-record','end-subject-early','query-save','retry-save','pause-sequence','next-subject','verify-local','draft-score'];
  function run(command,c) {
    const {d,e,a,input,p,r,q,needs,group,person,currentPerson,teacher,fullFile,findFile,fileBlocked,onsiteBlocked}=c;
    const result=(message,target)=>({message,target});
    switch(command) {
      case 'confirm-exam-setup':
        group('academic','admin');needs(e.status==='draft','本场已开放，此处查看已确认的准备结果。');needs(e.roster.length&&e.paperSelected&&e.paperComplete,'请先导入名单并选择完整套卷，再核对岗位和评分分工。');
        needs(!RoomStaffV14.issues(e,d.staff).length,RoomStaffV14.issues(e,d.staff).join('；'));needs(d.staff[e.staff.invigilator]?.active&&d.staff[e.staff.recorder]?.active,'现场岗位尚未安排有效人员。');needs(e.assignments.every(v=>v.length)&&new Set(e.assignments.flat()).size===e.assignments.flat().length,'请按单老师单科核对全部评分分工。');needs(input.verified,'请确认岗位及评分分工已核对。');
        e.setupReview={staffRev:e.staffRev,assignmentRev:e.assignmentRev,at:stamp(),by:c.actorId};return result('岗位和评分分工已核对，继续检查并开放本场。','W01');
      case 'open-student-videos': {
        group('academic');needs(e.status!=='draft','本场尚未开放考试。');const batch=ExamScopeV15.batches(e).find(b=>b.id===(input.batchId||'legacy'));needs(batch&&batch.ids.length,'请选择有考生的现场班次。');needs(batch.ids.every(id=>e.records[id].onsiteEnded||e.records[id].attendance==='absent'),'这个班次仍有现场考试未结束，其他班次不受影响。');needs(input.verified,'请确认本班次现场已结束，视频逐科核验后向本人开放。');e.studentVideoReleases??={};if(e.studentVideoReleases[batch.id]?.enabled)return result('本班次已开放，保留原开放记录。');e.studentVideoReleases[batch.id]={enabled:true,at:stamp(),by:c.actorId};if(batch.id==='legacy')e.studentVideoRelease={...e.studentVideoReleases[batch.id]};return result('已开放'+batch.label+'本人视频；仅已收到并核验通过的本科可播放，无需等待评分。');
      }
      case 'accept-person':
        group('recorder');person();needs(input.verified,'请先核对考号、机位和原题组，再确认接收。');return null;
      case 'force-end-preparation':
        group('invigilator');person();needs(r.draw && r.prepStarted && !r.handoff?.match(/pending|accepted/) && !r.onsiteEnded,'仅能结束已抽题、尚未交接的本人考场学员备考。');
        needs(!r.forcePrepEnd && Date.now()+(d.reviewTimeOffset||0)<r.prepStarted+900000,'本人备考已结束，无需重复结束。');needs(input.reason?.trim(),'请说明提前结束备考原因。');
        r.forcePrepEnd=Date.now()+(d.reviewTimeOffset||0);r.forcePrepReason=input.reason.trim();r.forcePrepBy=a.name;
        return result('已按方案R01结束该生备考，原自然截止与原因保留；仍需监考叫号交接。');
      case 'start-record':
        group('recorder');currentPerson();needs(e.deviceChecked,'请先完成设备检查。');needs(r.stage==='ready'&&!r.files[q]&&r.subject===q,'当前科目尚不具备启动条件。');
        r.captureOwner=a.staffId;r.autoSequence=true;r.pauseNext=false;r.introAudioOwner=input.audioOwner||'';beginPreparation(r,d);
        return result('本次三科考试已启动：准备语音 → 3、2、1 → 开始；播报结束后才开始本科计时。');
      case 'restart-intro-audio':
        group('recorder');currentPerson();needs(r.stage==='intro'&&input.audioOwner,'当前没有待重播的本科准备提示。');r.introAudioOwner=input.audioOwner;beginPreparation(r,d);return result('重新播放开考提示，正式录制尚未开始。');
      case 'intro-audio-started':
        group('recorder');currentPerson();needs(r.stage==='intro'&&r.introAudioOwner===input.audioOwner,'当前提示已变化。');r.introState='playing';r.introStarted=now(d);r.phaseDeadline=now(d)+ExamSpec.prepareCues[r.subject].totalMs;return result('正在播报开考提示。');
      case 'intro-audio-finished':
        group('recorder');currentPerson();needs(r.stage==='intro'&&r.introAudioOwner===input.audioOwner&&r.introState==='playing','当前提示尚未完整播放。');r.stage='recording';r.started=now(d);r.captureDeadline=now(d)+ExamSpec.durations[r.subject]*1000;r.introState='finished';return result('开考提示已播放完毕，本科正式录制开始。');
      case 'intro-audio-failed':
        group('recorder');currentPerson();needs(r.stage==='intro'&&r.introAudioOwner===input.audioOwner,'当前提示已变化。');r.introState='audio_failed';r.phaseDeadline=0;return result('开考提示未能播放完成，请点击重播。正式计时尚未开始。');
      case 'finish-record': case 'end-subject-early':
        group('recorder');currentPerson();needs(r.stage==='recording'&&r.subject===q,'当前没有正在录制的本科。');
        if(command==='end-subject-early')needs(input.reason?.trim(),'请说明提前结束原因。');
        r.stopDuration=input.auto?ExamSpec.durations[q]:Math.max(1,Math.min(ExamSpec.durations[q],Math.round((now(d)-r.started)/1000)));
        r.stopReason=command==='end-subject-early'?input.reason.trim():input.auto?'本科到时':'工作人员结束本科';
        r.endedAt=now(d);r.stage='saving';r.saveAt=now(d)+650;
        return result('本科已结束，正在保存原片；保存未成功不会开下一科。');
      case 'query-save': case 'retry-save':
        group('recorder');currentPerson();needs(['saving','save_failed'].includes(r.stage),'当前没有待恢复的保存任务。');
        needs(!d.faults.saveFail,'保存仍失败，原任务与已录片段保留；先恢复模拟故障再查询。');r.stage='saving';r.saveAt=now(d);
        return result('正在核对同一科原保存结果，不重录、不改变学员归属。');
      case 'pause-sequence':
        group('recorder');currentPerson();needs(['recording','intro','buffer','awaiting_next'].includes(r.stage),'当前不在可暂停/接续阶段。');
        if(r.stage==='awaiting_next'){r.pauseNext=false;beginPreparation(r,d);return result('已恢复接续，重新播放本科完整准备提示，尚未开始正式计时。');}
        r.pauseNext=!r.pauseNext;if(['intro','buffer'].includes(r.stage)&&r.pauseNext)r.stage='awaiting_next';
        if(r.stage==='awaiting_next')return result('本科准备已暂停，继续时重新播放完整提示。');
        return result(r.pauseNext?'当前本科继续；保存完成后等待人工接续。':'后续恢复自动接续，当前本科计时不变。');
      case 'next-subject':
        group('recorder');currentPerson();needs(r.stage==='awaiting_next','自动接续已启用；只有暂停等待状态才需人工进入下一科。');
        needs(r.subject>0&&r.files[r.subject-1]?.local,'先确认上一科已保存。');r.pauseNext=false;beginPreparation(r,d);
        return result('已进入下一科准备，完整文字与语音提示结束后才开始答题。');
      case 'verify-local':
        group('recorder');person();needs(r.files[q]?.local&&!r.files[q].abnormal,'没有可核对的完整本地原片。');needs(input.verified,'请核对本科画面、声音、时长与归属。');
        r.files[q].localReviewed=true;if(r.files[q].upload==='none')r.files[q].upload='queued';
        return result('本科原片检查已确认；三科检查齐备后统一提交技术检查。');
      case 'end-person':
        group('recorder');currentPerson();needs(r.files.length===3&&r.files.every(f=>f?.local&&f.localReviewed&&!f.abnormal),'三科须分别保存并完成原片检查。');needs(input.verified,'请确认三科检查结果后提交。');needs(!onsiteBlocked(e,p),'本位仍有视频问题待处理。');
        r.technicalSubmitted=true;r.stage='awaiting_release';for(const f of r.files)if(f.upload!=='received'){f.upload='uploading';f.uploadUntil=now(d)+1400;}
        return result('三科技术检查已提交，系统排队上传；监考集中监督并按方案R03条件放行。','A06');
      case 'begin-upload': case 'query-upload': case 'retry-upload': {
        group('invigilator','recorder');const f=findFile(e,input.fileId);needs(f?.local&&f.localReviewed&&!f.abnormal,'原片尚未保存/检查或存在异常。');needs(e.records[f.person]?.technicalSubmitted,'请先完成三科技术检查提交。');
        if(a.group==='recorder')return result('上传由系统排队，监考负责集中监督及重试；录制员只查看原文件状态。');
        needs(f.upload!=='received','该原文件已收到并核验，不重复上传。');f.upload='uploading';f.uploadUntil=now(d)+1000;
        return result('已在原文件任务上继续上传，归属与版本保持。');
      }
      case 'release-person':
        group('invigilator');person();needs(e.current===p&&r.technicalSubmitted,'请等待本位三科技术检查提交。');needs(r.files.every(f=>f?.localReviewed&&f.serverVerified&&!f.abnormal),'方案R03当前演示：三科后台收到并完整核验后才可放行。');needs(input.verified,'请核对本位三科检查/接收结果。');needs(!onsiteBlocked(e,p),'本位仍有视频问题待处理。');
        r.onsiteEnded=true;r.stage='done';e.current=null;e.lastEnded=p;for(const x of e.exceptions.filter(x=>x.person===p&&x.status==='executing'&&['material','retake','replace'].includes(x.type)))x.status='awaiting_material';
        return result('已确认放行本位，考位释放；原学员视频、题组和记录保留。','M04');
      case 'save-assignments': {
        group('admin','academic');const arr=input.assignments;needs(arr?.length===3&&arr.every(v=>v.length&&v.every(t=>Number.isInteger(t)&&t>=0&&t<6)),'每科至少分配一名可用评卷老师。');
        const flat=arr.flat();needs(new Set(flat).size===flat.length,'同一考试内一位评卷老师只能负责一科；同科可分配多位评委。');needs(!Object.keys(e.scores).length,'已有评分时不能直接改变评委集合。');
        e.assignments=structuredClone(arr);e.assignmentRev++;decorate(d);return result('已按单老师单科保存分工；每名评委仍评本科全部应评对象。');
      }
      case 'save-score-policy':group('academic');{const value=input.threshold===''?null:Number(input.threshold);needs(value===null||Number.isFinite(value)&&value>0&&value<=100,'请输入合法参考阈值或保持未配置。');e.scorePolicy={differenceThreshold:value};return result('仅保存演示提醒口径，不自动调分。');}
      case 'draft-score':
        teacher();needs(r.attendance!=='absent','已正式缺考，不计入应评，不填写分数。');needs(batch(e,a.teacher,q).status!=='submitted','当前批已提交；按R05建议须由教务退回后再改。');e.drafts[scoreKey(q,a.teacher,p)]=String(input.value??'');return result('本人输入已保留，尚未保存。');
      case 'save-score': {
        teacher();needs(r.attendance!=='absent','已正式缺考，不计入应评，不填写分数。');const b=batch(e,a.teacher,q),f=r.files[q],key=scoreKey(q,a.teacher,p);needs(b.status!=='submitted','当前批已提交，普通入口只读；请由教务按建议退回。');
        needs(e.opened[q]&&f?.checked&&!f.abnormal&&!fileBlocked(e,p,q),'当前材料未开放、失效或有问题，不能用填分代替处理。');needs(input.videoVersion===undefined||input.videoVersion===f.version,'材料版本已更新，请重新查看当前视频后打分。');needs(validScore(input.value),'请填写0–100分，最多两位小数为演示口径；空白不能当成0。');needs(!d.faults.saveFail,'评分保存失败，原输入保留，可在原任务重试。');
        const old=e.scores[key],value=Number(input.value);if(old)e.scoreAudit.push({key,...structuredClone(old),newValue:value,reason:'当前批本人回改',at:stamp(),by:actorIdOrName(c)});
        e.scores[key]={value,videoVersion:f.version,revision:(old?.revision||0)+1,updatedAt:stamp(),updatedAtMs:Date.now(),saveOrder:++d.seq,reviewMs:Number.isFinite(input.reviewMs)&&input.reviewMs>=0?Math.max(input.reviewMs,old?.timeSource==='browser'?old.reviewMs||0:0):old?.reviewMs??null,timeSource:Number.isFinite(input.reviewMs)?'browser':old?.timeSource||null};delete e.drafts[key];e.scoreRev++;
        return result(old?`本人当前批评分已从${old.value}改为${value}分，原值与修订保留。`:`本人${value}分已保存；0分有效，当前批内仍可回改。`);
      }
      case 'submit-review-batch': {
        group('teacher');needs(e.assignments[q]?.includes(a.teacher),'本人没有这科评卷批。');const b=batch(e,a.teacher,q);needs(!b.missing.length&&b.expected,`当前批仍有${b.missing.length}份未有效评分，不能提交本批。`);needs(e.opened[q],'本科尚未开放。');
        const meta=e.batches[batchKey(q,a.teacher)];if(meta.status==='submitted')return result('本批已提交，读取原提交记录。','W17');
        meta.history.push({revision:meta.revision+1,scores:structuredClone(Object.fromEntries(b.scored.map(p=>[p,e.scores[scoreKey(q,a.teacher,p)]]))),at:stamp()});meta.revision++;meta.status='submitted';meta.submittedAt=stamp();
        return result('本人本批已评齐并提交；按R05建议进入教务核查，报告仍可查看。','W17');
      }
      case 'return-review-batch': {
        group('academic');const t=Number(input.teacher),meta=e.batches[batchKey(q,t)];needs(meta?.status==='submitted','该科该评委本批尚未提交。');needs(input.reason?.trim(),'请填写退回原因。');meta.status='returned';meta.reason=input.reason.trim();meta.returnedAt=stamp();
        e.reportStale=true;return result('按方案R05退回同一评卷批，原提交版本保留，老师可回改后重新提交。');
      }
      case 'create-correction': case 'decide-correction': case 'cancel-correction':
        needs(false,'新版当前批评分直接回改；提交后的恢复按教务退回建议，不再使用旧改分申请路径。');return null;
      case 'publish': {
        group('academic');needs(input.scoreRev===e.scoreRev,'评分已变化，请重新核对本次结果。');needs(!c.publishIssues(e).length,'当前仍有材料/缺评待办，不能定稿。');
        for(let sq=0;sq<3;sq++)for(const t of e.assignments[sq])needs(batch(e,t,sq).expected===0||batch(e,t,sq).status==='submitted','仍有评委本批未提交，先核对完整评卷进度。');
        if(e.publications.at(-1)?.scoreRev===e.scoreRev)return result('当前核查版本已留存，不重复创建。','W18');
        e.publications.push(c.snapshot(e));e.reportStale=false;return result('教务内部核查版本已留存，未向考生展示或发布。','W18');
      }
      case 'save-exam':
        group('admin','academic');needs(e.status==='draft','已开放场次保留原安排，不能直接覆盖。');needs(input.name?.trim()&&input.date,'请填写考试名称和日期。');
        Object.assign(e,{name:input.name.trim(),date:input.date,room:input.room||e.room,site:input.site?.trim()||e.site,batchLabel:input.batchLabel?.trim()||e.batchLabel,slot:input.slot?.trim()||e.slot,prepSaved:true});return result('考前安排已保存，接下来选择完整套卷。','W03');
      default:return null;
    }
  }
  function actorIdOrName(c){return c.actorId||c.a.name;}
  function pulse(d,helpers) {
    let changed=false;const at=now(d);
    for(const e of Object.values(d.exams)) {
      if(e.status==='archived')continue;
      for(const r of Object.values(e.records)){
      if(r?.handoff==='accepted'&&!r.technicalSubmitted) {
        if(['intro','buffer'].includes(r.stage)&&r.phaseDeadline>0&&r.phaseDeadline<=at&&!(r.stage==='intro'&&r.introAudioOwner)){r.stage='recording';r.started=at;r.captureDeadline=at+ExamSpec.durations[r.subject]*1000;changed=true;}
        else if(r.stage==='recording'&&(r.captureDeadline||r.started+ExamSpec.durations[r.subject]*1000)<=at){r.stage='saving';r.stopDuration=ExamSpec.durations[r.subject];r.stopReason='本科到时';r.endedAt=at;r.saveAt=at+650;changed=true;}
        else if(r.stage==='saving'&&r.saveAt<=at){
          if(d.faults.saveFail){r.stage='save_failed';changed=true;continue;}
          const q=r.subject;
          if(!r.files[q])r.files[q]={...helpers.fullFile(e,r.id,q,r.history[q].length+1,r.captureOwner||ExamScopeV15.fileOwner(e,r.id)),upload:'none',localReviewed:false,checked:false,serverVerified:false,duration:r.stopDuration||ExamSpec.durations[q],early:(r.stopDuration||ExamSpec.durations[q])<ExamSpec.durations[q],endReason:r.stopReason||'本科到时',recorded:true};
          const next=r.files.findIndex(f=>!f);if(next<0){r.stage='saved';}
          else if(r.autoSequence){r.subject=next;if(r.pauseNext)r.stage='awaiting_next';else beginPreparation(r,d);}
          else r.stage='saved';
          changed=true;
        }
      }
      }
      for(const rr of Object.values(e.records))for(const f of rr.files.filter(Boolean)) {
        if(f.upload==='uploading'&&f.uploadUntil<=at){f.upload=d.faults.networkFail?'failed':'received';f.serverVerified=!d.faults.networkFail;changed=true;}
      }
    }
    return changed;
  }
  function advance(d,e) {
    const r=e.current&&e.records[e.current];if(!r)return {ok:false,message:'当前没有场内任务。'};
    if(!['intro','buffer','recording','saving'].includes(r.stage))return {ok:false,message:'当前等待人工或故障恢复，不推进业务条件。'};
    if(r.stage==='intro'&&r.introAudioOwner){r.introAudioOwner='';r.introState='demo';r.introStarted=now(d);r.phaseDeadline=now(d)+ExamSpec.prepareCues[r.subject].totalMs;}
    const at=now(d),end=r.stage==='recording'?(r.captureDeadline||r.started+ExamSpec.durations[r.subject]*1000):r.stage==='saving'?r.saveAt:r.phaseDeadline;
    d.captureTimeOffset=(d.captureTimeOffset||0)+Math.max(0,end-at)+1;return {ok:true,message:'仅推演时钟已推进到本阶段结束，原任务和题组不变。'};
  }
  function submittedIssues(e) {
    const items=[];for(let q=0;q<3;q++)for(const t of e.assignments[q])if(batch(e,t,q).expected&&batch(e,t,q).status!=='submitted')items.push(`${subjects[q]}的评委${t+1}本批未提交`);return items;
  }
  window.WorkflowRevision={decorate,studentReplay,batch,distribution,recentScores,markSubmitted,run,pulse,advance,now,localCommands,submittedIssues,batchKey,scoreKey};
})();
