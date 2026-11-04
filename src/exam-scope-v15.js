/* One exam contains batches and rooms. Each room has its own live work and device state. */
(()=>{'use strict';const bound=new WeakMap(),runtimeFields=['current','lastEnded','deviceChecked','captureDevice'];
 const staffRole=a=>['invigilator','recorder'].includes(a.group);
 const roomList=e=>RoomStaffV14.rooms(e);
 function members(e,key){if(!e.schedule)return [...e.roster];return e.roster.filter(id=>{const a=e.schedule.assignments[id];return a&&a.batchId+'|'+a.roomId===key;});}
 function tasks(e,a){return staffRole(a)?roomList(e).filter(r=>e.roomStaff?.[r.key]?.[a.group]===a.staffId):[];}
 function decorate(e){e.roomSessions??={};for(const [i,s] of roomList(e).entries())e.roomSessions[s.key]??={current:i===0?e.current:null,lastEnded:i===0?e.lastEnded:null,deviceChecked:i===0?!!e.deviceChecked:false,captureDevice:structuredClone(e.captureDevice||ExamSpec.captureDefaults)};return e;}
 function select(e,a,key=''){decorate(e);const mine=tasks(e,a);if(key)return mine.find(s=>s.key===key)||roomList(e).find(r=>r.key===key&&e.transfers.some(t=>t.role===a.group&&(t.from===a.staffId||t.to===a.staffId)&&(t.roomKey||roomList(e)[0].key)===r.key))||null;return mine[0]||roomList(e).find(r=>e.transfers.some(t=>t.role===a.group&&(t.from===a.staffId||t.to===a.staffId)&&(t.roomKey||roomList(e)[0].key)===r.key))||null;}
 function owned(a,e,key=''){if(bound.has(e))return e.staff?.[a.group]===a.staffId;const s=select(e,a,key);return !!s&&e.roomStaff[s.key]?.[a.group]===a.staffId;}
 function apply(e,s){decorate(e);Object.assign(e,e.roomSessions[s.key]);e.staff={...e.roomStaff[s.key]};e.site=s.site;e.date=s.date;e.batchLabel=s.batch;e.room=s.room;e.slot=s.start+'–'+s.end;e.scope={...s,assigned:true};e.queue=e.queue.filter(id=>members(e,s.key).includes(id));}
 function begin(e,a,key=''){const s=select(e,a,key);if(!s)return false;const original={};for(const k of [...runtimeFields,'staff','site','date','batchLabel','room','slot','queue','scope'])original[k]=e[k];bound.set(e,{s,original});apply(e,s);e.scope.assigned=e.staff[a.group]===a.staffId;return true;}
 function beginForPerson(e,id){const a=e.schedule?.assignments?.[id],key=a?a.batchId+'|'+a.roomId:roomList(e)[0].key,s=roomList(e).find(r=>r.key===key);if(!s)return false;const original={};for(const k of [...runtimeFields,'staff','site','date','batchLabel','room','slot','queue','scope'])original[k]=e[k];bound.set(e,{s,original});apply(e,s);return true;}
 function restore(d){for(const e of Object.values(d.exams)){const m=bound.get(e);if(!m)continue;const session=e.roomSessions[m.s.key];for(const k of runtimeFields)session[k]=e[k];e.roomStaff[m.s.key]={...e.staff};const activeIds=new Set(members(e,m.s.key)),newQueue=[...e.queue];const queue=m.original.queue.map(id=>activeIds.has(id)?newQueue.shift():id);const first=roomList({...e,site:m.original.site,room:m.original.room,date:m.original.date})[0];Object.assign(e,m.original);e.queue=queue;e.staff={...e.roomStaff[first.key]};Object.assign(e,e.roomSessions[first.key]);if(m.original.scope===undefined)delete e.scope;bound.delete(e);}}
 function project(e,a,key=''){const s=select(e,a,key);if(!s)return null;apply(e,s);e.scope.assigned=e.staff[a.group]===a.staffId;e.roster=members(e,s.key);delete e.roomSessions;return s;}
 function batches(e){return e.schedule?.batches?.length?e.schedule.batches.map(b=>({id:b.id,label:b.label,date:b.date,ids:e.roster.filter(id=>e.schedule.assignments[id]?.batchId===b.id)})):[{id:'legacy',label:e.batchLabel||'本场',date:e.date,ids:[...e.roster]}];}
 function personBatch(e,id){return e.schedule?.assignments?.[id]?.batchId||'legacy';}
 function release(e,id){const key=personBatch(e,id);return e.studentVideoReleases?.[key]||(!e.schedule?e.studentVideoRelease:null)||{enabled:false,at:''};}
 function fileOwner(e,id){const a=e.schedule?.assignments?.[id],key=a?a.batchId+'|'+a.roomId:roomList(e)[0].key;return e.roomStaff[key]?.recorder||e.staff.recorder;}
 function isMember(e,id){return !bound.has(e)||members(e,e.scope.key).includes(id);}
 window.ExamScopeV15={staffRole,roomList,members,tasks,decorate,select,owned,begin,beginForPerson,restore,project,batches,personBatch,release,fileOwner,isMember};
})();
