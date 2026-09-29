const KEY="gymnow_v1";
let data=JSON.parse(localStorage.getItem(KEY)||"null")||{
  theme:"dark",unit:"kg",goal:null,weights:[],templates:[
    {id:1,name:"Push Day",zone:"CHEST • SHOULDERS • TRICEPS",exercises:["Bench Press","Incline Dumbbell Press","Lateral Raises","Tricep Pushdown"]},
    {id:2,name:"Pull Day",zone:"BACK • BICEPS",exercises:["Lat Pulldown","Barbell Row","Seated Cable Row","Dumbbell Curl"]},
    {id:3,name:"Leg Day",zone:"QUADS • HAMSTRINGS • GLUTES",exercises:["Squat","Leg Press","Romanian Deadlift","Leg Curl"]}
  ],plan:{},food:[],burns:[],streak:0
};
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>Number(n).toFixed(1).replace(".0","");
function toKg(v,unit){return unit==="lb"?v/2.20462:v}
function fromKg(v,unit){return unit==="lb"?v*2.20462:v}
function unitLabel(){return data.unit.toUpperCase()}
function showPage(id){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  const names={dashboard:"Dashboard",weight:"Weight Tracker",workouts:"Workouts",plan:"My Plan",calories:"Calories",profile:"Settings"};
  $("#pageTitle").textContent=names[id]||"Dashboard";
  window.scrollTo({top:0,behavior:"smooth"});
  if(id==="weight")renderWeight();
  if(id==="workouts")renderTemplates();
  if(id==="plan")renderPlan();
  if(id==="calories")renderCalories();
}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>{showPage(b.dataset.page);$(".sidebar").classList.remove("open")}));
$$("[data-page-link]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.pageLink)));
$("#mobileMenu").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));

function applyTheme(){
  document.body.classList.toggle("light",data.theme==="light");
  $("#themeToggle").textContent=data.theme==="light"?"☀":"☾";
  if($("#unitSelect"))$("#unitSelect").value=data.unit;
  drawChart();
}
function toggleTheme(){data.theme=data.theme==="dark"?"light":"dark";save();applyTheme()}
$("#themeToggle").onclick=toggleTheme; $("#themeToggle2").onclick=toggleTheme;

function renderDashboard(){
  const ws=data.weights;
  const cur=ws.length?ws[ws.length-1].kg:null, start=ws.length?ws[0].kg:null;
  $("#dashWeight").textContent=cur==null?"—":`${fmt(fromKg(cur,data.unit))} ${unitLabel()}`;
  $("#dashGoal").textContent=data.goal==null?"—":`${fmt(fromKg(data.goal,data.unit))} ${unitLabel()}`;
  $("#dashWeightDelta").textContent=ws.length>1?`${fmt(start-cur)} kg change`:"Add another measurement";
  if(data.goal!=null&&start!=null){
    const pct=Math.max(0,Math.min(100,((start-cur)/(start-data.goal))*100));
    $("#dashGoalProgress").textContent=`${fmt(pct)}% toward goal`;
  } else $("#dashGoalProgress").textContent="Set a goal";
  $("#dashCalories").textContent=data.food.reduce((a,x)=>a+x.cal,0).toLocaleString();
  $("#dashWorkout").textContent=data.plan[new Date().getDay()]||"Rest";
  $("#dashWorkoutStatus").textContent=data.plan[new Date().getDay()]?"Scheduled today":"Plan your day";
  $("#dashStreak").textContent=data.streak||0;
}
function renderWeight(){
  const ws=data.weights, cur=ws.at(-1)?.kg, start=ws[0]?.kg;
  $("#currentWeight").textContent=cur==null?"—":`${fmt(fromKg(cur,data.unit))} ${unitLabel()}`;
  $("#startingWeight").textContent=start==null?"—":`${fmt(fromKg(start,data.unit))} ${unitLabel()}`;
  $("#weightGoalCard").textContent=data.goal==null?"—":`${fmt(fromKg(data.goal,data.unit))} ${unitLabel()}`;
  $("#goalDisplay").textContent=data.goal==null?"Not set":`${fmt(fromKg(data.goal,data.unit))} ${unitLabel()}`;
  let pct=0;
  if(data.goal!=null&&start!=null&&start!==data.goal)pct=Math.max(0,Math.min(100,((start-cur)/(start-data.goal))*100));
  $("#weightProgressPct").textContent=`${fmt(pct)}%`;
  $("#goalBar").style.width=pct+"%";$("#goalBarText").textContent=`${fmt(pct)}%`;
  $("#chartSummary").textContent=ws.length?`${ws.length} measurement${ws.length===1?"":"s"} • goal ${fmt(fromKg(data.goal??0,data.unit))} ${data.goal==null?"":" "+unitLabel()}`:"Add measurements to see your progress.";
  const hist=$("#weightHistory");hist.innerHTML=ws.slice().reverse().map((x,i)=>`<div class="history-item"><b>${fmt(fromKg(x.kg,data.unit))} ${unitLabel()}</b><small>${new Date(x.date).toLocaleDateString()}</small><button class="danger" onclick="deleteWeight(${ws.length-1-i})">Delete</button></div>`).join("")||'<div style="color:var(--muted);font-size:12px">No measurements yet.</div>';
  drawChart();
}
window.deleteWeight=i=>{data.weights.splice(i,1);save();renderWeight();renderDashboard()};
function addWeight(){
  openModal(`<h2>Add weight</h2><div class="modal-form"><label>Weight (${unitLabel()})<input id="mWeight" type="number" step=".1" autofocus></label><label>Date<input id="mDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveWeight()">Save measurement</button></div></div>`);
}
window.saveWeight=()=>{
  const v=parseFloat($("#mWeight").value);if(!v)return alert("Enter a weight.");
  data.weights.push({kg:toKg(v,data.unit),date:$("#mDate").value});data.weights.sort((a,b)=>a.date.localeCompare(b.date));save();closeModal();renderWeight();renderDashboard();
};
function setGoal(){
  openModal(`<h2>Set weight goal</h2><div class="modal-form"><label>Goal weight (${unitLabel()})<input id="mGoal" type="number" step=".1" value="${data.goal?fmt(fromKg(data.goal,data.unit)):""}"></label><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveGoal()">Save goal</button></div></div>`);
}
window.saveGoal=()=>{const v=parseFloat($("#mGoal").value);if(!v)return alert("Enter a goal.");data.goal=toKg(v,data.unit);save();closeModal();renderWeight();renderDashboard()};
$("#addWeightBtn").onclick=addWeight;$("#editGoalBtn").onclick=setGoal;

function drawChart(){
  const c=$("#weightChart");if(!c)return;
  const ctx=c.getContext("2d"), rect=c.getBoundingClientRect(), dpr=devicePixelRatio||1,w=rect.width||600,h=250;
  c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const ws=data.weights.slice(), range=$("#chartRange")?.value||"all", pts=range==="all"?ws:ws.slice(-Number(range));
  if(!pts.length){ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="13px Inter";ctx.fillText("Your weight chart will appear here.",20,60);return}
  const vals=pts.map(x=>fromKg(x.kg,data.unit)), min=Math.min(...vals),max=Math.max(...vals),pad=(max-min||2)*.2;
  const lo=min-pad,hi=max+pad, left=45,right=w-18,top=20,bottom=h-40;
  ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--line");ctx.lineWidth=1;
  for(let i=0;i<4;i++){let y=top+(bottom-top)*i/3;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="10px Inter";ctx.fillText(fmt(hi-(hi-lo)*i/3),4,y+3)}
  const x=i=>pts.length===1?(left+right)/2:left+(right-left)*i/(pts.length-1);
  const y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(x(i),y(vals[i])):ctx.moveTo(x(i),y(vals[i])));ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--accent");ctx.lineWidth=3;ctx.stroke();
  pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(i),y(vals[i]),4,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--accent");ctx.fill();});
}
$("#chartRange").onchange=drawChart;

function renderTemplates(){
  $("#templateGrid").innerHTML=data.templates.map(t=>`<div class="template-card"><div class="template-top"><span class="zone">${t.zone}</span><button class="danger" onclick="deleteTemplate(${t.id})">×</button></div><h3>${t.name}</h3><small>${t.exercises.length} exercises</small><div class="exercise-list">${t.exercises.map(e=>`<div class="exercise">${e}</div>`).join("")}</div></div>`).join("");
}
function newTemplate(){
  openModal(`<h2>Create workout template</h2><div class="modal-form"><label>Template name<input id="tName" placeholder="e.g. Push Day"></label><label>Workout zone<input id="tZone" placeholder="e.g. Chest • Shoulders • Triceps"></label><label>Exercises <textarea id="tExercises" placeholder="One exercise per line"></textarea></label><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveTemplate()">Create</button></div></div>`);
}
window.saveTemplate=()=>{let name=$("#tName").value.trim(),zone=$("#tZone").value.trim(),ex=$("#tExercises").value.split("\n").map(x=>x.trim()).filter(Boolean);if(!name||!ex.length)return alert("Add a name and at least one exercise.");data.templates.push({id:Date.now(),name,zone:zone||"CUSTOM WORKOUT",exercises:ex});save();closeModal();renderTemplates()};
window.deleteTemplate=id=>{data.templates=data.templates.filter(t=>t.id!==id);Object.keys(data.plan).forEach(k=>{if(!data.templates.some(t=>t.name===data.plan[k]))delete data.plan[k]});save();renderTemplates();renderPlan()};
$("#newTemplateBtn").onclick=newTemplate;

const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function renderPlan(){
  $("#weekGrid").innerHTML=days.map((d,i)=>`<div class="day-card"><h4>${d.toUpperCase()}</h4><select onchange="setPlan(${i},this.value)"><option value="">Rest</option>${data.templates.map(t=>`<option ${data.plan[i]===t.name?"selected":""}>${t.name}</option>`).join("")}</select>${data.plan[i]?`<div class="day-workout">${data.plan[i]}</div>`:"<div style='color:var(--muted);font-size:10px;margin-top:14px'>Recovery day</div>"}</div>`).join("");
}
window.setPlan=(day,name)=>{if(name)data.plan[day]=name;else delete data.plan[day];save();renderDashboard()};

function renderCalories(){
  const total=data.food.reduce((a,x)=>a+x.cal,0),p=data.food.reduce((a,x)=>a+x.p,0),c=data.food.reduce((a,x)=>a+x.c,0),f=data.food.reduce((a,x)=>a+x.f,0),burn=data.burns.reduce((a,x)=>a+x.cal,0);
  $("#intakeTotal").textContent=total.toLocaleString();$("#proteinTotal").textContent=`${fmt(p)}g`;$("#carbsTotal").textContent=`${fmt(c)}g`;$("#fatTotal").textContent=`${fmt(f)}g`;$("#burnTotal").textContent=`${burn.toLocaleString()} kcal`;
  $("#burnList").innerHTML=data.burns.map((x,i)=>`<div class="simple-item"><span>${x.name}</span><span>${x.cal} kcal <button class="danger" onclick="deleteBurn(${i})">×</button></span></div>`).join("")||'<small style="color:var(--muted)">No activities logged.</small>';
}
$("#calcCaloriesBtn").onclick=()=>{
  const age=+$("#age").value,h=+$("#height").value,w=+$("#calcWeight").value,a=+$("#activity").value;
  if(!age||!h||!w)return alert("Enter age, height and weight.");
  const bmr=$("#sex").value==="male"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
  $("#calorieNeed").textContent=Math.round(bmr*a).toLocaleString()+" kcal";
};
$("#addFoodBtn").onclick=()=>openModal(`<h2>Add food</h2><div class="modal-form"><label>Food / meal<input id="foodName" placeholder="Chicken & rice"></label><div class="row"><label>Calories<input id="foodCal" type="number"></label><label>Protein (g)<input id="foodP" type="number" value="0"></label></div><div class="row"><label>Carbs (g)<input id="foodC" type="number" value="0"></label><label>Fat (g)<input id="foodF" type="number" value="0"></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveFood()">Add food</button></div></div>`);
window.saveFood=()=>{const name=$("#foodName").value.trim(),cal=+$("#foodCal").value;if(!name||!cal)return alert("Enter food and calories.");data.food.push({name,cal,p:+$("#foodP").value||0,c:+$("#foodC").value||0,f:+$("#foodF").value||0});save();closeModal();renderCalories();renderDashboard()};
$("#addBurnBtn").onclick=()=>{const n=$("#burnName").value.trim(),c=+$("#burnCalories").value;if(!n||!c)return;data.burns.push({name:n,cal:c});$("#burnName").value="";$("#burnCalories").value="";save();renderCalories()};
window.deleteBurn=i=>{data.burns.splice(i,1);save();renderCalories()};

let seconds=60,timer=null;
function updateTimer(){const m=String(Math.floor(seconds/60)).padStart(2,"0"),s=String(seconds%60).padStart(2,"0");$("#timerDisplay").textContent=`${m}:${s}`}
$("#timerStart").onclick=()=>{if(timer){clearInterval(timer);timer=null;$("#timerStart").textContent="Start"}else{timer=setInterval(()=>{if(seconds>0){seconds--;updateTimer()}else{clearInterval(timer);timer=null;$("#timerStart").textContent="Start";document.title="GymNow — REST COMPLETE!"}},1000);$("#timerStart").textContent="Pause"}};
$("#timerPlus").onclick=()=>{seconds+=30;updateTimer()};$("#timerMinus").onclick=()=>{seconds=Math.max(0,seconds-30);updateTimer()};$("#timerReset").onclick=()=>{clearInterval(timer);timer=null;seconds=60;$("#timerStart").textContent="Start";updateTimer()};

function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.add("open")}
function closeModal(){$("#modal").classList.remove("open")}
$("#modalClose").onclick=closeModal;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
$("#unitSelect").onchange=e=>{data.unit=e.target.value;save();renderWeight();renderDashboard()};
$("#resetData").onclick=()=>{if(confirm("Reset all GymNow data?")){localStorage.removeItem(KEY);location.reload()}};

applyTheme();renderDashboard();renderWeight();renderTemplates();renderPlan();renderCalories();updateTimer();
window.addEventListener("resize",drawChart);
