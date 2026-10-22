/* In-browser adapter. Business pages consume a role-specific projection, not the full review state. */
(() => {
  const fixture = new URLSearchParams(location.search).get('fixture') || '';
  const fixtures = ['published','pending','signed'];
  const fixtureName = fixtures.includes(fixture) ? fixture : '';
  const KEY = 'yifeng.frontend.github.v02' + (fixtureName ? ':' + fixtureName : '');
  const subjects = ['作品朗读','新闻播报','话题评述'];
  const students = [
    {id:'A',name:'示例学员A',code:'YF-001',seat:'09',class:'示例一班'},
    {id:'B',name:'示例学员B',code:'YF-002',seat:'07',class:'示例二班'},
    {id:'C',name:'示例学员C',code:'YF-003',seat:'08',class:'示例一班'}
  ];
  const initial = () => ({version:2,examName:'第一轮播音模拟考',date:'2026-10-22',roster:false,identity:false,paper18:false,papersSelected:true,assigned:true,prepared:false,
    checkin:false,checkinAt:'',checkinCount:0,draw:null,drawPending:false,handoff:'idle',onsiteEnded:false,device:false,stage:'ready',subject:0,started:0,
    local:[false,false,false],upload:['none','none','none'],checked:[false,false,false],opened:[false,false,false],
    scores:{},
    drafts:{},scoreIssue:{},published:false,publishVersion:0,scoreRev:1,reviewRev:0,teacherViews:{teacher1:{scoreSub:0,student:'A'},teacher2:{scoreSub:0,student:'A'}},
    offline:false,saveFail:false,networkFail:false,permission:false,materialSub:0,accountActive:true,roleMonitor:true,roleRecord:true,scope:'第一轮 / 03考场',accountRevision:1,examDrafts:[]});
  const average = (data,q,p='A') => {
    const a=[0,1].map(t=>data.scores[`${q}-${t}-${p}`]);
    return a.every(Number.isFinite) ? ((a[0]+a[1])/2).toFixed(2) : null;
  };
  function snapshot(data) {
    return {version:data.publishVersion,examName:data.examName,date:data.date,publishedAt:'2026-10-22 10:36',
      results:Object.fromEntries(students.map(p=>[p.id,subjects.map((_,q)=>average(data,q,p.id))]))};
  }
  function seed(preset='start') {
    const data=initial();
    if(preset==='record') Object.assign(data,{roster:true,identity:true,paper18:true,prepared:true,checkin:true,checkinAt:'10:24',checkinCount:1,draw:17,handoff:'accepted',device:true});
    if(['post','missing','upload','published','pending','grading'].includes(preset)) {
      Object.assign(data,{roster:true,identity:true,paper18:true,prepared:true,checkin:true,checkinAt:'10:24',checkinCount:1,draw:17,handoff:'accepted',onsiteEnded:true,device:true,stage:'done',local:[true,true,true],upload:['received','received','received'],checked:[true,true,true],opened:[true,true,true]});
      for(let q=0;q<3;q++)for(let t=0;t<2;t++){data.scores[`${q}-${t}-B`]=[86,88,85,87,84,86][q*2+t];data.scores[`${q}-${t}-C`]=[82,84,80,82,88,90][q*2+t];}
      for(let q=0;q<3;q++)for(let t=0;t<2;t++) data.scores[`${q}-${t}-A`]=[86,88,85,87,90,92][q*2+t];
      if(preset==='grading')for(let q=0;q<3;q++)for(let t=0;t<2;t++)delete data.scores[`${q}-${t}-A`];
      if(preset==='missing') delete data.scores['1-1-A'];
      if(preset==='upload') {data.upload[2]='failed';data.checked[2]=false;data.opened[2]=false;for(let t=0;t<2;t++)for(const p of students)delete data.scores[`2-${t}-${p.id}`];}
      if(preset==='published') {data.published=true;data.publishVersion=1;data.publication=snapshot(data);}
    }
    if(preset==='signed') Object.assign(data,{checkin:true,checkinAt:'10:24',checkinCount:1});
    return data;
  }
  function read(){try{const saved=JSON.parse(localStorage.getItem(KEY));return saved?.version===2?saved:seed(fixtureName||'start')}catch{return seed(fixtureName||'start')}}
  let state=read();
  const listeners=new Set();
  const emit=()=>listeners.forEach(fn=>fn());
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}emit();if(parent!==window)parent.postMessage({type:'yf-state'},'*')}
  function edit(fn){state=read();fn(state);persist();return state}
  function reset(preset='start'){state=seed(preset);persist()}
  function project(data,actorId){
    const actor=RolePolicy.get(actorId),group=actor.group;
    const shared=['version','examName','date','offline','saveFail','networkFail','permission','published','publishVersion'];
    const result=Object.fromEntries(shared.map(k=>[k,structuredClone(data[k])]));
    result.actor=actor.id;result.actorGroup=group;
    if(group==='admin') return {...structuredClone(data),actor:actor.id,actorGroup:group,people:structuredClone(students)};
    if(group==='academic') {
      for(const k of ['roster','identity','paper18','papersSelected','assigned','prepared','device','local','upload','checked','opened','materialSub','examDrafts']) result[k]=structuredClone(data[k]);
      result.people=structuredClone(students);return result;
    }
    if(group==='teacher') {
      const pointer=data.teacherViews[actor.id]||{scoreSub:0,student:'A'};
      result.teacher=actor.teacher;result.scoreSub=actor.subjects.includes(pointer.scoreSub)?pointer.scoreSub:actor.subjects[0];
      result.student=students.some(p=>p.id===pointer.student)?pointer.student:'A';result.opened=structuredClone(data.opened);
      result.people=students.map(({id,code})=>({id,code}));
      for(const k of ['scores','drafts','scoreIssue']) result[k]=Object.fromEntries(Object.entries(data[k]).filter(([key])=>+key.split('-')[1]===actor.teacher));
      result.scoreRev=data.scoreRev;result.reviewRev=data.reviewRev;return result;
    }
    if(group==='invigilator'||group==='recorder') {
      for(const k of ['accountActive','roleMonitor','roleRecord','scope','accountRevision'])result[k]=structuredClone(data[k]);
      for(const k of ['checkin','checkinAt','draw','handoff','onsiteEnded']) result[k]=structuredClone(data[k]);
      if(group==='invigilator') result.people=structuredClone(students);
      else {
        result.people=[structuredClone(students[0])];
        for(const k of ['device','stage','subject','started','local','upload','checked','abnormal','interruptReason']) if(data[k]!==undefined)result[k]=structuredClone(data[k]);
      }
      return result;
    }
    if(group==='student') {
      for(const k of ['checkin','checkinAt','checkinCount','draw','drawPending','handoff','onsiteEnded']) result[k]=structuredClone(data[k]);
      result.person=structuredClone(students.find(p=>p.id===actor.studentId));result.people=[result.person];
      if(data.published&&data.publication) result.publication={version:data.publication.version,examName:data.publication.examName,date:data.publication.date,publishedAt:data.publication.publishedAt,result:structuredClone(data.publication.results[actor.studentId])};
      return result;
    }
    return {actor:'unknown',actorGroup:'unknown',people:[]};
  }
  const fields={
    admin:['examName','date','roster','identity','paper18','papersSelected','assigned','prepared','checked','opened','published','publishVersion','publication','reviewRev','materialSub','accountActive','roleMonitor','roleRecord','scope','accountRevision','examDrafts'],
    academic:['examName','date','roster','identity','paper18','papersSelected','assigned','prepared','checked','opened','materialSub','examDrafts'],
    invigilator:['handoff'],
    recorder:['device','stage','subject','started','local','upload','abnormal','interruptReason','handoff','onsiteEnded'],
    student:['checkin','checkinAt','checkinCount','draw','drawPending']
  };
  function editAs(actorId,fn){
    const actor=RolePolicy.get(actorId);if(actor.group==='unknown')return;
    return edit(data=>{
      const scoped=project(data,actorId);fn(scoped);
      if(actor.group==='teacher'){
        const own=key=>{const [q,t,p]=key.split('-');return actor.subjects.includes(+q)&&+t===actor.teacher&&students.some(x=>x.id===p)};
        for(const k of ['scores','drafts','scoreIssue']){
          for(const key of Object.keys(data[k]))if(own(key)&&!(key in scoped[k]))delete data[k][key];
          for(const [key,value] of Object.entries(scoped[k]))if(own(key))data[k][key]=value;
        }
        data.teacherViews[actor.id]={scoreSub:actor.subjects.includes(scoped.scoreSub)?scoped.scoreSub:0,student:students.some(p=>p.id===scoped.student)?scoped.student:'A'};
        const changed=data.scoreRev!==scoped.scoreRev;data.scoreRev=scoped.scoreRev;data.reviewRev=scoped.reviewRev;if(data.published&&changed)data.resultChanged=true;
      }else for(const k of fields[actor.group]||[])if(scoped[k]!==undefined)data[k]=structuredClone(scoped[k]);
    });
  }
  const complete=q=>students.every(p=>[0,1].every(t=>Number.isFinite(state.scores[`${q}-${t}-${p.id}`])));
  const readyPublish=()=>{state=read();return [0,1,2].every(q=>complete(q)&&state.opened[q]&&state.checked[q]&&state.upload[q]==='received')};
  function publish(actorId,expectedRev){
    if(RolePolicy.get(actorId).group!=='admin')return {ok:false,reason:'只有管理员可以发布全场成绩。'};
    state=read();if(!readyPublish()||state.scoreRev!==expectedRev)return {ok:false,reason:'评分或材料发生变化，请重新核对。'};
    edit(data=>{data.published=true;data.publishVersion++;data.publication=snapshot(data);data.reviewRev=data.scoreRev;data.resultChanged=false});return {ok:true};
  }
  addEventListener('storage',e=>{if(e.key===KEY){state=read();emit()}});
  addEventListener('message',e=>{if(e.data?.type==='yf-refresh'){state=read();emit()}});
  window.YF={get state(){state=read();return state},subjects,students,edit,reset,seed,view:actor=>project(read(),actor),editAs,publish,complete,readyPublish,mean:(q,p)=>average(read(),q,p),subscribe:fn=>listeners.add(fn),KEY,fixture:fixtureName};
})();
