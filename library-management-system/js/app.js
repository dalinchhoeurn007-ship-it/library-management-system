/* Libra app controller. Beginner note: each page is rendered from the arrays in storage.js. */
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
let currentUser = null;
let editing = null;
let confirmAction = null;

function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function toast(message, type="success") {
  const el=document.createElement("div"); el.className=`toast ${type}`; el.textContent=message;
  $("#toast-container").appendChild(el); setTimeout(()=>el.remove(),3000);
}
function initials(name="User"){return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();}
function findBook(id){return getBooks().find(x=>x.id===id);}
function findStudent(id){return getStudents().find(x=>x.id===id);}
function formatDate(date){return date?new Date(date+"T12:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}):"—";}
function emptyRow(cols,message="No records found yet."){return `<tr><td colspan="${cols}"><div class="empty-state">${message}</div></td></tr>`;}
function statusPill(status){const cls=status.toLowerCase();return `<span class="status ${cls}">${status}</span>`;}
function isAdmin(){return currentUser?.role==="admin";}

function startApp(user) {
  currentUser=user; $("#login-screen").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#side-name").textContent=user.name; $("#side-role").textContent=isAdmin()?"Administrator":"Student";
  $("#side-avatar").textContent=initials(user.name); $("#top-avatar").textContent=initials(user.name);
  $("#welcome-name").textContent=user.name.split(" ")[0]; $("#today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  $$(".admin-only").forEach(el=>el.classList.toggle("hidden",!isAdmin()));
  if(!isAdmin()){
    ["students","categories","borrowings","returns","reports"].forEach(p=>{const n=$(`[data-page="${p}"]`);if(n)n.classList.add("hidden");});
  } else $$(".nav-item").forEach(n=>n.classList.remove("hidden"));
  showPage("dashboard"); renderAll();
}
function showLogin(){
  $("#app").classList.add("hidden");$("#login-screen").classList.remove("hidden");
}
function showPage(page) {
  if(!isAdmin() && !["dashboard","books"].includes(page)) page="dashboard";
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $("#page-breadcrumb").textContent=page.charAt(0).toUpperCase()+page.slice(1);
  $("#sidebar").classList.remove("open"); window.scrollTo({top:0,behavior:"smooth"});
  renderAll();
}
function renderAll(){renderDashboard();renderBooks();renderStudents();renderCategories();renderBorrowings();renderReturns();renderReports();}

function renderDashboard(){
  const books=getBooks(), students=getStudents(), loans=getBorrowings();
  const copies=books.reduce((s,b)=>s+Number(b.quantity),0), available=books.reduce((s,b)=>s+Number(b.available),0), borrowed=copies-available;
  const overdue=loans.filter(l=>currentStatus(l)==="Overdue").length;
  $("#stat-books").textContent=copies;$("#stat-students").textContent=students.length;$("#stat-available").textContent=available;$("#stat-borrowed").textContent=borrowed;$("#stat-overdue-label").textContent=`${overdue} overdue`;
  $("#legend-available").textContent=available;$("#legend-borrowed").textContent=borrowed;
  const percent=copies?Math.round(available/copies*100):0;$("#donut-percent").textContent=`${percent}%`;$("#availability-donut").style.background=`conic-gradient(#7185ff ${percent}%,#f0a34d ${percent}% 100%)`;
  const recent=[...loans].sort((a,b)=>b.borrowDate.localeCompare(a.borrowDate)).slice(0,5);
  $("#recent-transactions").innerHTML=recent.length?recent.map(l=>{const s=findStudent(l.studentId),b=findBook(l.bookId),st=currentStatus(l);return `<tr><td>${escapeHTML(l.id)}</td><td><div class="person-cell"><span class="person-avatar">${initials(s?.name||"NA")}</span>${escapeHTML(s?.name||"Unknown")}</div></td><td>${escapeHTML(b?.title||"Deleted book")}</td><td>${formatDate(l.borrowDate)}</td><td>${formatDate(l.dueDate)}</td><td>${statusPill(st)}</td></tr>`}).join(""):emptyRow(6);
  const latest=[...books].slice(-3).reverse();
  $("#recent-books").innerHTML=latest.length?latest.map(b=>`<div class="recent-book"><div class="book-cover">▤</div><div><strong>${escapeHTML(b.title)}</strong><small>${escapeHTML(b.author)} · ${b.available} available</small></div></div>`).join(""):`<div class="empty-state">No books added yet.</div>`;
  const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString(undefined,{month:"short"})});}
  const max=Math.max(1,...months.map(m=>loans.filter(l=>l.borrowDate.startsWith(m.key)).length));
  $("#activity-chart").innerHTML=months.map(m=>{const n=loans.filter(l=>l.borrowDate.startsWith(m.key)).length,r=loans.filter(l=>l.returnDate?.startsWith(m.key)).length;return `<div class="chart-bar-group"><div class="bar" style="height:${Math.max(2,n/max*85)}%"></div><div class="bar returned" style="height:${Math.max(2,r/max*85)}%"></div><span class="bar-label">${m.label}</span></div>`}).join("");
}

function renderBooks(){
  const query=($("#book-search")?.value||"").toLowerCase(), filter=$("#book-filter")?.value||"all";
  let books=getBooks().filter(b=>[b.title,b.author,b.isbn,b.category].join(" ").toLowerCase().includes(query));
  if(filter==="available")books=books.filter(b=>b.available>0);if(filter==="unavailable")books=books.filter(b=>b.available===0);
  $("#books-table").innerHTML=books.length?books.map(b=>`<tr><td><div class="book-cell"><span class="book-cover">▤</span><span>${escapeHTML(b.title)}<small class="cell-sub">${escapeHTML(b.publisher||"")}</small></span></div></td><td>${escapeHTML(b.isbn)}</td><td>${escapeHTML(b.category)}</td><td>${escapeHTML(b.author)}</td><td>${b.quantity}</td><td>${b.available}</td><td class="admin-only"><div class="row-actions"><button class="small-action" data-edit="book" data-id="${b.id}">Edit</button><button class="small-action" data-delete="book" data-id="${b.id}">Delete</button></div></td></tr>`).join(""):emptyRow(7);
}
function renderStudents(){
  const q=($("#student-search")?.value||"").toLowerCase();
  const students=getStudents().filter(s=>[s.name,s.id,s.email,s.department].join(" ").toLowerCase().includes(q));
  $("#students-table").innerHTML=students.length?students.map(s=>{const count=getBorrowings().filter(l=>l.studentId===s.id&&l.status!=="Returned").length;return `<tr><td><div class="person-cell"><span class="person-avatar">${initials(s.name)}</span>${escapeHTML(s.name)}</div></td><td>${escapeHTML(s.id)}</td><td>${escapeHTML(s.department)}</td><td>${escapeHTML(s.email)}</td><td>${escapeHTML(s.phone)}</td><td>${count}</td><td class="admin-only"><div class="row-actions"><button class="small-action" data-edit="student" data-id="${s.id}">Edit</button><button class="small-action" data-delete="student" data-id="${s.id}">Delete</button></div></td></tr>`}).join(""):emptyRow(7);
}
function renderCategories(){
  const cats=getCategories(),books=getBooks();
  $("#category-grid").innerHTML=cats.length?cats.map((c,i)=>`<article class="category-card"><div class="category-symbol">${["▤","⌘","▦","⌁","✧","∑","文","◇"][i%8]}</div><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.description||"Book collection")}</p><footer><span>${books.filter(b=>b.category===c.name).length} book titles</span><span class="row-actions admin-only"><button class="small-action" data-edit="category" data-id="${c.id}">Edit</button><button class="small-action" data-delete="category" data-id="${c.id}">Delete</button></span></footer></article>`).join(""):`<div class="empty-state">No categories yet.</div>`;
}
function renderBorrowings(){
  const q=($("#borrowing-search")?.value||"").toLowerCase(),filter=$("#borrowing-filter")?.value||"all";
  let rows=getBorrowings().filter(l=>{const s=findStudent(l.studentId),b=findBook(l.bookId);return `${l.id} ${s?.name||""} ${b?.title||""}`.toLowerCase().includes(q)});
  if(filter!=="all")rows=rows.filter(l=>filter==="active"?currentStatus(l)==="Borrowed":filter==="overdue"?currentStatus(l)==="Overdue":l.status==="Returned");
  $("#borrowings-table").innerHTML=rows.length?rows.map(l=>{const s=findStudent(l.studentId),b=findBook(l.bookId),st=currentStatus(l);return `<tr><td>${l.id}</td><td>${escapeHTML(s?.name||"Unknown")}</td><td>${escapeHTML(b?.title||"Deleted book")}</td><td>${formatDate(l.borrowDate)}</td><td>${formatDate(l.dueDate)}</td><td>${statusPill(st)}</td><td class="admin-only">${l.status==="Returned"?"—":`<button class="small-action" data-return="${l.id}">Return book</button>`}</td></tr>`}).join(""):emptyRow(7);
}
function renderReturns(){
  const q=($("#return-search")?.value||"").toLowerCase();
  const rows=getBorrowings().filter(l=>{const s=findStudent(l.studentId),b=findBook(l.bookId);return `${l.id} ${s?.name||""} ${b?.title||""}`.toLowerCase().includes(q)});
  $("#returns-table").innerHTML=rows.length?rows.map(l=>{const s=findStudent(l.studentId),b=findBook(l.bookId),days=l.returnDate?Math.max(0,Math.floor((new Date(l.returnDate)-new Date(l.dueDate))/86400000)):Math.max(0,Math.floor((new Date(todayISO())-new Date(l.dueDate))/86400000));return `<tr><td>${l.id}</td><td>${escapeHTML(s?.name||"Unknown")}</td><td>${escapeHTML(b?.title||"Deleted book")}</td><td>${formatDate(l.dueDate)}</td><td>${formatDate(l.returnDate)}</td><td>${days}</td><td>${statusPill(currentStatus(l))}</td><td class="admin-only">${l.status==="Returned"?"—":`<button class="small-action" data-return="${l.id}">Process return</button>`}</td></tr>`}).join(""):emptyRow(8);
}
function renderReports(){
  const books=getBooks(),loans=getBorrowings(),copies=books.reduce((s,b)=>s+b.quantity,0);
  $("#report-copies").textContent=copies;$("#report-loans").textContent=loans.length;$("#report-returns").textContent=loans.filter(l=>l.status==="Returned").length;$("#report-overdue").textContent=loans.filter(l=>currentStatus(l)==="Overdue").length;
  const popular=books.map(b=>({name:b.title,count:loans.filter(l=>l.bookId===b.id).length})).sort((a,b)=>b.count-a.count).slice(0,5);
  $("#popular-books").innerHTML=popular.length?popular.map((x,i)=>`<div class="rank-row"><span class="rank-number">${i+1}</span><div class="rank-info"><strong>${escapeHTML(x.name)}</strong><small>Book title</small></div><span class="rank-count">${x.count} loans</span></div>`).join(""):`<div class="empty-state">No book data.</div>`;
  const active=getStudents().map(s=>({name:s.name,count:loans.filter(l=>l.studentId===s.id).length})).sort((a,b)=>b.count-a.count).slice(0,5);
  $("#active-students").innerHTML=active.length?active.map((x,i)=>`<div class="rank-row"><span class="rank-number">${i+1}</span><div class="rank-info"><strong>${escapeHTML(x.name)}</strong><small>Library member</small></div><span class="rank-count">${x.count} loans</span></div>`).join(""):`<div class="empty-state">No student data.</div>`;
  $("#report-history").innerHTML=loans.length?[...loans].reverse().map(l=>`<tr><td>${l.id}</td><td>${escapeHTML(findStudent(l.studentId)?.name||"Unknown")}</td><td>${escapeHTML(findBook(l.bookId)?.title||"Deleted book")}</td><td>${formatDate(l.borrowDate)}</td><td>${formatDate(l.returnDate)}</td><td>${statusPill(currentStatus(l))}</td></tr>`).join(""):emptyRow(6);
}

const field=(name,label,type="text",value="",required=true,wide=false,options=null)=>({name,label,type,value,required,wide,options});
function formFields(kind,item={}){
 const cats=getCategories().map(c=>c.name);
 if(kind==="book")return [field("isbn","ISBN","text",item.isbn),field("title","Book title","text",item.title),field("author","Author","text",item.author),field("category","Category","select",item.category||cats[0],true,false,cats),field("publisher","Publisher","text",item.publisher||"",false),field("year","Publication year","number",item.year||new Date().getFullYear()),field("quantity","Total quantity","number",item.quantity??1),field("description","Description","textarea",item.description||"",false,true)];
 if(kind==="student")return [field("id","Student ID","text",item.id||makeId("STU")),field("name","Full name","text",item.name),field("gender","Gender","select",item.gender||"Female",true,false,["Female","Male","Other"]),field("email","Email","email",item.email),field("phone","Phone","text",item.phone),field("department","Department","text",item.department),field("className","Class","text",item.className||"",false),field("registered","Registration date","date",item.registered||todayISO())];
 if(kind==="category")return [field("name","Category name","text",item.name),field("description","Description","text",item.description||"",false,true)];
 if(kind==="borrow")return [field("studentId","Student","select",item.studentId||"",true,false,getStudents().map(s=>({value:s.id,label:`${s.name} (${s.id})`}))),field("bookId","Book","select",item.bookId||"",true,false,getBooks().filter(b=>b.available>0).map(b=>({value:b.id,label:`${b.title} — ${b.available} available`}))),field("borrowDate","Borrow date","date",todayISO()),field("dueDate","Due date","date",addDays(todayISO(),14))];
 return [];
}
function openModal(kind,id=null){
 if(!isAdmin()&&kind!=="book")return;
 editing={kind,id};const item=id?getCollection(kind).find(x=>x.id===id)||{}:{};
 $("#modal-title").textContent=(id?"Edit ":"Add ")+kind;
 const fields=formFields(kind,item);
 $("#modal-fields").innerHTML=fields.map(f=>{const value=escapeHTML(f.value??"");let input="";
 if(f.type==="select"){const opts=(f.options||[]).map(o=>{const v=typeof o==="string"?o:o.value,l=typeof o==="string"?o:o.label;return `<option value="${escapeHTML(v)}" ${String(v)===String(f.value)?"selected":""}>${escapeHTML(l)}</option>`}).join("");input=`<select name="${f.name}" ${f.required?"required":""}>${opts}</select>`}
 else if(f.type==="textarea")input=`<textarea name="${f.name}" rows="3" ${f.required?"required":""}>${value}</textarea>`;
 else input=`<input name="${f.name}" type="${f.type}" value="${value}" ${f.required?"required":""} ${f.type==="number"?'min="0"':""}>`;
 return `<label class="${f.wide?"wide":""}">${f.label}${input}</label>`}).join("");
 $("#modal-backdrop").classList.remove("hidden");
}
function getCollection(kind){return kind==="book"?getBooks():kind==="student"?getStudents():kind==="category"?getCategories():[]}
function setCollection(kind,items){if(kind==="book")setBooks(items);if(kind==="student")setStudents(items);if(kind==="category")setCategories(items)}
function saveModal(event){
 event.preventDefault();if(!editing)return;
 const {kind,id}=editing,form=new FormData(event.target),data=Object.fromEntries(form.entries());
 if(kind==="book"){
  data.year=Number(data.year);data.quantity=Number(data.quantity);
  if(data.quantity<0)return toast("Quantity cannot be negative.","error");
  const old=id?findBook(id):null;data.id=id||makeId("BK");data.available=old?Math.min(old.available,data.quantity):data.quantity;
  const duplicate=getBooks().some(b=>b.isbn===data.isbn&&b.id!==id);if(duplicate)return toast("This ISBN already exists.","error");
 }
 if(kind==="student"){
  const duplicate=getStudents().some(s=>s.id===data.id&&s.id!==id);if(duplicate)return toast("Student ID already exists.","error");
  const emailDuplicate=getStudents().some(s=>s.email.toLowerCase()===data.email.toLowerCase()&&s.id!==id);if(emailDuplicate)return toast("Email already exists.","error");
 }
 if(kind==="category"){
  const duplicate=getCategories().some(c=>c.name.toLowerCase()===data.name.toLowerCase()&&c.id!==id);if(duplicate)return toast("Category already exists.","error");
  data.id=id||makeId("CAT");
 }
 if(kind==="borrow"){
  const book=findBook(data.bookId);if(!book||book.available<1)return toast("No available copies of this book.","error");
  if(data.dueDate<data.borrowDate)return toast("Due date must be after borrow date.","error");
  book.available--;setBooks(getBooks().map(b=>b.id===book.id?book:b));
  const loans=getBorrowings();loans.push({id:makeId("TRX"),studentId:data.studentId,bookId:data.bookId,borrowDate:data.borrowDate,dueDate:data.dueDate,returnDate:null,status:"Borrowed"});setBorrowings(loans);
  closeModal();renderAll();toast("Borrowing record created.");return;
 }
 const items=getCollection(kind);if(id){const index=items.findIndex(x=>x.id===id);items[index]={...items[index],...data};}else items.push(data);
 setCollection(kind,items);closeModal();renderAll();toast(`${kind[0].toUpperCase()+kind.slice(1)} saved successfully.`);
}
function closeModal(){$("#modal-backdrop").classList.add("hidden");$("#modal-form").reset();editing=null;}
function askConfirm(message,action){$("#confirm-message").textContent=message;confirmAction=action;$("#confirm-backdrop").classList.remove("hidden");}
function deleteItem(kind,id){
 askConfirm(`Delete this ${kind}? This action cannot be undone.`,()=>{
  if(kind==="book"&&getBorrowings().some(l=>l.bookId===id&&l.status!=="Returned"))return toast("This book has an active borrowing record.","error");
  if(kind==="student"&&getBorrowings().some(l=>l.studentId===id&&l.status!=="Returned"))return toast("This student has an active borrowing record.","error");
  if(kind==="category"&&getBooks().some(b=>b.category===getCategories().find(c=>c.id===id)?.name))return toast("Move the books to another category before deleting.","error");
  setCollection(kind,getCollection(kind).filter(x=>x.id!==id));renderAll();toast(`${kind} deleted.`);
 });
}
function processReturn(id){
 const loans=getBorrowings(),loan=loans.find(l=>l.id===id);if(!loan||loan.status==="Returned")return toast("This book has already been returned.","error");
 loan.status="Returned";loan.returnDate=todayISO();setBorrowings(loans);
 const book=findBook(loan.bookId);if(book){book.available=Math.min(book.quantity,book.available+1);setBooks(getBooks().map(b=>b.id===book.id?book:b));}
 renderAll();toast("Book return processed successfully.");
}

document.addEventListener("DOMContentLoaded",()=>{
 seedDatabase();
 const saved=readData(DB_KEYS.user,null);if(saved)startApp(saved);
 $("#login-form").addEventListener("submit",e=>{e.preventDefault();const role=$("#login-role").value,email=$("#login-email").value.trim();const user=role==="admin"?{name:"Library Admin",email,role}:{name:"Sokha Chan",email,role,studentId:"STU-001"};saveData(DB_KEYS.user,user);startApp(user);});
 $$("[data-demo]").forEach(b=>b.addEventListener("click",()=>{const role=b.dataset.demo;$("#login-email").value=role==="admin"?"admin@library.com":"student@library.com";$("#login-password").value="demo123";$("#login-role").value=role;}));
 $("#logout-btn").addEventListener("click",()=>{localStorage.removeItem(DB_KEYS.user);currentUser=null;showLogin();});
 $("#main-nav").addEventListener("click",e=>{const btn=e.target.closest("[data-page]");if(btn)showPage(btn.dataset.page);});
 document.body.addEventListener("click",e=>{
  const open=e.target.closest("[data-open]");if(open)openModal(open.dataset.open);
  const goto=e.target.closest("[data-goto]");if(goto)showPage(goto.dataset.goto);
  const edit=e.target.closest("[data-edit]");if(edit)openModal(edit.dataset.edit,edit.dataset.id);
  const del=e.target.closest("[data-delete]");if(del)deleteItem(del.dataset.delete,del.dataset.id);
  const ret=e.target.closest("[data-return]");if(ret)processReturn(ret.dataset.return);
 });
 $("#modal-form").addEventListener("submit",saveModal);$("#modal-close").addEventListener("click",closeModal);$("#modal-cancel").addEventListener("click",closeModal);
 $("#modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")closeModal();});
 $("#confirm-cancel").addEventListener("click",()=>{$("#confirm-backdrop").classList.add("hidden");confirmAction=null;});
 $("#confirm-yes").addEventListener("click",()=>{const action=confirmAction;$("#confirm-backdrop").classList.add("hidden");confirmAction=null;if(action)action();});
 $("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
 ["book-search","book-filter","student-search","borrowing-search","borrowing-filter","return-search"].forEach(id=>{$("#"+id)?.addEventListener("input",renderAll);$("#"+id)?.addEventListener("change",renderAll);});
 $("#print-report").addEventListener("click",()=>window.print());
});
