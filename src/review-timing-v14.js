/* Browser-local active review time. No server telemetry or identity service. */
(()=>{'use strict';let H=null,current=null;const records=new Map();
 const storageKey=(h,p,q)=>YF.KEY+':reviewTime:'+h.examId+':'+q+':'+h.actor.teacher+':'+p;
 function flush(){if(!current)return;const at=Date.now(),s=current.value,video=document.querySelector('.review-video-card video'),playing=video&&!video.paused&&!video.ended;
  if(H?.screen==='W06'&&!H.preview&&!H.saving&&!document.hidden&&H.exam()?.batches?.[H.qValue()+'-'+H.actor.teacher]?.status!=='submitted'){
   const end=playing?at:Math.min(at,s.activity+60000);s.totalMs+=Math.max(0,end-s.last);if(playing)s.activity=at;
  }s.last=at;try{localStorage.setItem(current.key,JSON.stringify(s));}catch{}
 }
 function bind(h){if(h.screen!=='W06'||h.preview||h.actor.group!=='teacher')return;const key=storageKey(h,h.personId(),h.qValue());if(current?.key===key){flush();H=h;return;}flush();H=h;let value=records.get(key);if(!value){try{value=JSON.parse(localStorage.getItem(key));}catch{}const score=h.exam().scores[`${h.qValue()}-${h.actor.teacher}-${h.personId()}`],saved=score?.timeSource==='browser'?score.reviewMs:null;if(!value)value={totalMs:Number.isFinite(saved)?saved:0,last:Date.now(),activity:Date.now()};value.totalMs=Math.max(value.totalMs||0,saved||0);value.last=Date.now();value.activity=Date.now();records.set(key,value);}current={key,value};}
 function snapshot(examId,p,q){flush();if(!H||H.examId!==examId||current?.key!==storageKey(H,p,q))return null;return Math.round(current.value.totalMs);}
 function activity(){if(!current)return;flush();current.value.activity=Date.now();}
 document.addEventListener('pointerdown',activity,true);document.addEventListener('keydown',activity,true);document.addEventListener('input',activity,true);document.addEventListener('play',activity,true);document.addEventListener('visibilitychange',()=>{flush();if(current){current.value.last=Date.now();current.value.activity=Date.now();}});window.addEventListener('pagehide',flush);setInterval(flush,1000);
 window.ReviewTimingV14={bind,snapshot,clearScope:scope=>{for(const k of records.keys())if(k.startsWith(scope+':reviewTime:'))records.delete(k);if(current?.key.startsWith(scope+':reviewTime:'))current=null;}};
})();
