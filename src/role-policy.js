/* Reviewer identities and prototype page access; real login is outside this static demo. */
(()=>{
 const groups={admin:['U01','U02','U03','U04','W01','W02','W03','W04','W07','W08','W09','W10','W11','W12','W13','W14','W15','W18','W19','W24','W25','W26','T01','T02','X01','X02'],academic:['U01','U02','U03','U04','W01','W02','W03','W04','W11','W12','W14','W15','X01','X02'],teacher:['U01','U02','W05','W06','W15','W16','W17','W24','W25','X01','X02'],invigilator:['U01','U02','M00','M01','M02','M03','M04','M05','T01','T02','X01','X02'],recorder:['U01','U02','A00','A01','A02','A03','A04','A05','A06','T01','T02','X01','X02'],student:['S00','S01','S02','S03','S04','S05','S06','D01']};
 const actors={
 admin:{id:'admin',label:'管理员',name:'管理员丙',group:'admin',home:'U02'},
 academic:{id:'academic',label:'教务',name:'教务员丁',group:'academic',home:'U02'},
 teacher1:{id:'teacher1',label:'评卷老师1',name:'评卷老师1',group:'teacher',teacher:0,home:'W05'},
 teacher2:{id:'teacher2',label:'评卷老师2',name:'评卷老师2',group:'teacher',teacher:1,home:'W05'},
 invigilator:{id:'invigilator',label:'监考员甲',name:'工作人员甲',group:'invigilator',staffId:'staff1',home:'M00'},
 invigilator2:{id:'invigilator2',label:'监考员乙',name:'工作人员乙',group:'invigilator',staffId:'staff2',home:'M00'},
 recorder:{id:'recorder',label:'录制员甲',name:'工作人员甲',group:'recorder',staffId:'staff1',home:'A00'},
 recorder2:{id:'recorder2',label:'录制员乙',name:'工作人员乙',group:'recorder',staffId:'staff2',home:'A00'},
 studentA:{id:'studentA',label:'学生A',name:'示例学员A',group:'student',studentId:'A',home:'S00'},
 studentB:{id:'studentB',label:'学生B',name:'示例学员B',group:'student',studentId:'B',home:'S00'},
 studentC:{id:'studentC',label:'学生C',name:'示例学员C',group:'student',studentId:'C',home:'S00'}
 };Object.values(actors).forEach(a=>a.pages=groups[a.group]);
 const get=id=>actors[id]||{id:'unknown',name:'未识别身份',label:'未识别身份',group:'unknown',home:'U02',pages:[]};
 window.RolePolicy={actors,get,canOpen:(id,p)=>get(id).pages.includes(p),defaultActor:p=>/^S|^D/.test(p)?'studentA':/^A/.test(p)?'recorder':/^M/.test(p)?'invigilator':['W05','W06','W16','W17'].includes(p)?'teacher1':'admin'};
})();
