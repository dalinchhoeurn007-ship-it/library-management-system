/* LocalStorage data layer. This file keeps browser storage operations in one place. */
const DB_KEYS = {
  books: "libra_books", students: "libra_students", categories: "libra_categories",
  borrowings: "libra_borrowings", user: "libra_current_user", seeded: "libra_seeded"
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (date, days) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); };
const makeId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*900+100)}`;

function readData(key, fallback = []) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch (error) { console.warn("Could not read LocalStorage key:", key, error); return fallback; }
}
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getBooks(){ return readData(DB_KEYS.books); }
function setBooks(v){ saveData(DB_KEYS.books,v); }
function getStudents(){ return readData(DB_KEYS.students); }
function setStudents(v){ saveData(DB_KEYS.students,v); }
function getCategories(){ return readData(DB_KEYS.categories); }
function setCategories(v){ saveData(DB_KEYS.categories,v); }
function getBorrowings(){ return readData(DB_KEYS.borrowings); }
function setBorrowings(v){ saveData(DB_KEYS.borrowings,v); }

function seedDatabase() {
  if (localStorage.getItem(DB_KEYS.seeded)) return;
  const categories = ["Programming","Web Development","Database","Networking","Computer Science","Mathematics","English","Business"].map((name,i)=>({id:`CAT-${i+1}`,name,description:`Books about ${name.toLowerCase()}.`}));
  const students = [
    {id:"STU-001",name:"Sokha Chan",gender:"Female",email:"sokha@example.com",phone:"012 345 678",department:"Information Technology",className:"Web A 2027",registered:todayISO()},
    {id:"STU-002",name:"Dara Kim",gender:"Male",email:"dara@example.com",phone:"098 222 111",department:"Computer Science",className:"CS A 2027",registered:todayISO()},
    {id:"STU-003",name:"Malis Heng",gender:"Female",email:"malis@example.com",phone:"096 333 444",department:"Information Technology",className:"Web B 2027",registered:todayISO()}
  ];
  const books = [
    {id:"BK-001",isbn:"9780131103627",title:"The C Programming Language",author:"Brian W. Kernighan",category:"Programming",publisher:"Prentice Hall",year:1988,quantity:5,available:4,description:"A classic introduction to C programming."},
    {id:"BK-002",isbn:"9781491950296",title:"Learning JavaScript",author:"Ethan Brown",category:"Web Development",publisher:"O'Reilly",year:2016,quantity:4,available:3,description:"A practical guide to modern JavaScript."},
    {id:"BK-003",isbn:"9780132350884",title:"Clean Code",author:"Robert C. Martin",category:"Programming",publisher:"Prentice Hall",year:2008,quantity:6,available:6,description:"A handbook of agile software craftsmanship."},
    {id:"BK-004",isbn:"9780321765723",title:"Database System Concepts",author:"Abraham Silberschatz",category:"Database",publisher:"McGraw-Hill",year:2019,quantity:3,available:2,description:"Database design and system concepts."},
    {id:"BK-005",isbn:"9780134685991",title:"Effective Java",author:"Joshua Bloch",category:"Programming",publisher:"Addison-Wesley",year:2018,quantity:2,available:2,description:"Best practices for Java programming."}
  ];
  const borrowings = [
    {id:"TRX-1001",studentId:"STU-001",bookId:"BK-001",borrowDate:addDays(todayISO(),-3),dueDate:addDays(todayISO(),7),returnDate:null,status:"Borrowed"},
    {id:"TRX-1002",studentId:"STU-002",bookId:"BK-002",borrowDate:addDays(todayISO(),-18),dueDate:addDays(todayISO(),-4),returnDate:null,status:"Borrowed"},
    {id:"TRX-1003",studentId:"STU-003",bookId:"BK-004",borrowDate:addDays(todayISO(),-12),dueDate:addDays(todayISO(),-2),returnDate:addDays(todayISO(),-1),status:"Returned"}
  ];
  saveData(DB_KEYS.categories,categories); saveData(DB_KEYS.students,students);
  saveData(DB_KEYS.books,books); saveData(DB_KEYS.borrowings,borrowings);
  localStorage.setItem(DB_KEYS.seeded,"yes");
}
function currentStatus(record) {
  if (record.status === "Returned") return "Returned";
  return record.dueDate < todayISO() ? "Overdue" : "Borrowed";
}
