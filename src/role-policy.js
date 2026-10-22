/* Review identities, page access, and allowed actions. Production authorization belongs on the server. */
(() => {
  const actors = {
    admin: { id: 'admin', label: '管理员', name: '管理员乙', group: 'admin', home: 'U01', pages: ['U01','U02','U03','W01','W02','W03','W04','W07','W08','W09','W10','W11','W12','W13','W14','W15','W18','W19'] },
    academic: { id: 'academic', label: '教务', name: '教务员丙', group: 'academic', home: 'U01', pages: ['U01','U02','U03','W01','W02','W03','W04','W11','W12','W14','W15'] },
    teacher1: { id: 'teacher1', label: '评卷老师1', name: '评卷老师1', group: 'teacher', teacher: 0, home: 'U01', subjects: [0,1,2], pages: ['U01','W05','W06','W15','W16','W17'] },
    teacher2: { id: 'teacher2', label: '评卷老师2', name: '评卷老师2', group: 'teacher', teacher: 1, home: 'U01', subjects: [0,1,2], pages: ['U01','W05','W06','W15','W16','W17'] },
    invigilator: { id: 'invigilator', label: '监考员', name: '工作人员甲', group: 'invigilator', home: 'M00', pages: ['U01','M00','M01','M02','M03','M04'] },
    recorder: { id: 'recorder', label: '录制员', name: '工作人员甲', group: 'recorder', home: 'A00', pages: ['U01','A00','A01','A02','A03','A04','A05'] },
    studentA: { id: 'studentA', label: '学生A', name: '示例学员A', group: 'student', studentId: 'A', home: 'S00', pages: ['S00','S01','S02','S03','S04','S05','S06','D01'] }
  };
  const get = id => actors[id] || {id:'unknown',label:'未识别身份',name:'未识别身份',group:'unknown',home:'U01',pages:[]};
  const canOpen = (id,screen) => get(id).pages.includes(screen);
  const defaultActor = screen => /^S|^D/.test(screen)?'studentA':/^A/.test(screen)?'recorder':screen.startsWith('M')?'invigilator':['W05','W06','W16','W17'].includes(screen)?'teacher1':['W01','W02','W03','W04','W11','W12','W14','W15'].includes(screen)?'academic':'admin';
  const sets = {
    academic: ['new-exam','create-exam-draft','save-exam-draft','draft-copy','draft-copy-confirm','clear-filter','save-prep','check-prep','copy-config','copy-confirm','identity','identity-confirm','import','download-issues','paper-fill','paper-confirm','paper-preview','confirm-video','open-subject','view-staff','play'],
    admin: ['export','check-publish','publish-confirm','publish-final','preview-account','account-save','disable-account','disable-confirm','admin-score-filter'],
    teacher: ['save-score','save-next','report-video','report-confirm','play','switch-grade'],
    invigilator: ['qr','handoff','handoff-confirm','query-handoff','monitor-filter','switch-post'],
    recorder: ['device','accept','back-recorder','start-record','finish','verify-local','next-subject','end-candidate','interrupt','interrupt-confirm','play','switch-post'],
    student: ['checkin','checkin-query','draw','draw-query','refresh-results','scan-again']
  };
  function actionAllowed(id, action) {
    const a=get(id), group=a.group;
    if (['close-dialog','permission-back'].includes(action)) return true;
    if (action.startsWith('flow:')) { const key=action.split(':')[1];return ({'incident-update':['admin'],'assignment-save':['admin'],'mapping-save':['academic','admin'],'resolve-issue':['academic','admin'],'queue-filter':['teacher'],'choose-grade':['teacher'],'material-select':['academic','admin'],'monitor-person':['invigilator'],'receipt-query':['invigilator'],'file-select':['recorder'],'resume-subject':['recorder'],'query-upload':['recorder'],'query-local-save':['recorder']}[key]||[]).includes(group); }
    if (action.startsWith('go:')||action.startsWith('leave:')) return canOpen(id,action.split(':')[1]);
    if (action.startsWith('post:')) return ['invigilator','recorder'].includes(group);
    if (action.startsWith('edit-draft:')||action.startsWith('paper-tab:')||action.startsWith('material-tab:')) return ['academic','admin'].includes(group);
    if (action.startsWith('grade-subject:')||action.startsWith('grade-person:')||action.startsWith('grade-list:')) return group==='teacher';
    if (action.startsWith('upload:')) return group==='recorder';
    if (action.startsWith('missing:')) return group==='admin';
    return (sets[group]||[]).includes(action)||(group==='admin'&&sets.academic.includes(action));
  }
  window.RolePolicy = {actors,get,canOpen,defaultActor,actionAllowed};
})();
