/* Reviewer identities and prototype page access; real login is outside this static demo. */
(()=>{
 const groups={admin:['U01','U02','U03','U04','W01','W02','W03','W09','W11','W12','W13','W19','T01','T02','X01','X02'],academic:['U01','U02','U03','U04','W09','W01','W02','W03','W04','W07','W08','W10','W11','W12','W13','W14','W15','W18','W26','W27','P01','X01','X02'],teacher:['U01','U02','W05','W06','W15','W16','W17','X01','X02'],invigilator:['U01','U02','M00','M01','M02','M03','M04','M05','M06','M07','T01','T02','X01','X02'],recorder:['U01','U02','A00','A01','A02','A03','A04','A05','A06','A07','T01','T02','X01','X02'],student:['S00','S01','S03','S04','S06','S07','S08','D01']};
 const actors={
 admin:{id:'admin',label:'管理员',name:'管理员丙',group:'admin',home:'U02'},
 academic:{id:'academic',label:'教务',name:'教务员丁',group:'academic',home:'U02'},
 teacher1:{id:'teacher1',label:'评卷老师1',name:'评卷老师1',group:'teacher',teacher:0,home:'W05'},
 teacher2:{id:'teacher2',label:'评卷老师2',name:'评卷老师2',group:'teacher',teacher:1,home:'W05'},
 teacher3:{id:'teacher3',label:'评卷老师3',name:'评卷老师3',group:'teacher',teacher:2,home:'W05'},
 teacher4:{id:'teacher4',label:'评卷老师4',name:'评卷老师4',group:'teacher',teacher:3,home:'W05'},
 teacher5:{id:'teacher5',label:'评卷老师5',name:'评卷老师5',group:'teacher',teacher:4,home:'W05'},
 teacher6:{id:'teacher6',label:'评卷老师6',name:'评卷老师6',group:'teacher',teacher:5,home:'W05'},
 invigilator:{id:'invigilator',label:'监考员甲',name:'工作人员甲',group:'invigilator',staffId:'staff1',home:'M00'},
 invigilator2:{id:'invigilator2',label:'监考员乙',name:'工作人员乙',group:'invigilator',staffId:'staff2',home:'M00'},
 recorder:{id:'recorder',label:'录制员乙',name:'工作人员乙',group:'recorder',staffId:'staff2',home:'A00'},
 recorder2:{id:'recorder2',label:'录制员甲',name:'工作人员甲',group:'recorder',staffId:'staff1',home:'A00'},
 studentA:{id:'studentA',label:'学生A',name:'示例学员A',group:'student',studentId:'A',home:'S00'},
 studentB:{id:'studentB',label:'学生B',name:'示例学员B',group:'student',studentId:'B',home:'S00'},
 studentC:{id:'studentC',label:'学生C',name:'示例学员C',group:'student',studentId:'C',home:'S00'}
 };const staffLabels=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','十一','十二'];for(let i=3;i<=12;i++)for(const role of ['invigilator','recorder']){const id=role+'-staff'+i;actors[id]={id,label:(role==='invigilator'?'监考员':'录制员')+staffLabels[i-1],name:'工作人员'+staffLabels[i-1],group:role,staffId:'staff'+i,home:role==='invigilator'?'M00':'A00'};}Object.values(actors).forEach(a=>a.pages=groups[a.group]);
 const get=id=>actors[id]||{id:'unknown',name:'未识别身份',label:'未识别身份',group:'unknown',home:'U02',pages:[]};
 let directorySignature='';
 function register(staff,reviewers) {
   const signature=JSON.stringify([staff,reviewers]);if(signature===directorySignature)return;directorySignature=signature;
   for(const actor of Object.values(actors))if(['invigilator','recorder','teacher'].includes(actor.group))actor.active=false;
   function put(id,group,person,extra,home) {
     const actor=actors[id]||{id,group,home,pages:groups[group]};
     Object.assign(actor,extra,{name:person.name,label:group==='teacher'?person.name:(group==='invigilator'?'监考 · ':'录制 · ')+person.name,active:person.active});
     actors[id]=actor;
   }
   for(const p of reviewers)put('teacher'+(p.id+1),'teacher',p,{teacher:p.id},'W05');
   for(const p of Object.values(staff))for(const role of ['invigilator','recorder']){
     const first=p.id==='staff1',second=p.id==='staff2';
     const id=first||second?role+((role==='invigilator'?first:second)?'':'2'):role+'-'+p.id;
     put(id,role,p,{staffId:p.id},role==='recorder'?'A00':'M00');
   }
 }
 window.RolePolicy={actors,get,register,canOpen:(id,p)=>get(id).pages.includes(p),defaultActor:p=>/^S|^D/.test(p)?'studentA':/^A/.test(p)?'recorder':/^M/.test(p)?'invigilator':['W05','W06','W16','W17'].includes(p)?'teacher1':['U03','W01','W04','W07','W08','W10','W11','W12','W14','W18','W26','W27','P01'].includes(p)?'academic':'admin'};
})();
