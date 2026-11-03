import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const file = resolve(process.env.DATABASE_PATH || './server/banking.db');
mkdirSync(dirname(file), { recursive: true });
export const db = new Database(file);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS branches (id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, segment TEXT NOT NULL, branch_id INTEGER NOT NULL REFERENCES branches(id), joined_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL, product TEXT NOT NULL, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), amount REAL NOT NULL, kind TEXT NOT NULL, occurred_at TEXT NOT NULL);`);
const count = (db.prepare('SELECT COUNT(*) as n FROM branches').get() as {n:number}).n;
if (!count) {
 const seed = db.transaction(() => {
  const branches = [['Central Mumbai','West'],['Pune City','West'],['Bengaluru Tech','South'],['Delhi Connaught','North'],['Hyderabad Hub','South'],['Kolkata Main','East']];
  const addBranch=db.prepare('INSERT INTO branches(name,region) VALUES (?,?)'); branches.forEach(b=>addBranch.run(...b));
  const addCustomer=db.prepare('INSERT INTO customers(name,segment,branch_id,joined_at) VALUES (?,?,?,?)');
  const addApp=db.prepare('INSERT INTO applications(customer_id,status,product,applied_at) VALUES (?,?,?,?)');
  const addTx=db.prepare('INSERT INTO transactions(customer_id,amount,kind,occurred_at) VALUES (?,?,?,?)');
  const names=['Aarav','Diya','Kabir','Ananya','Ishaan','Meera','Vihaan','Sana','Rohan','Tara','Arjun','Aisha'];
  for(let i=1;i<=240;i++) {
   const branch=(i%6)+1, segment=['Retail','Premium','Business'][i%3];
   addCustomer.run(`${names[i%names.length]} ${['Shah','Patil','Rao','Singh','Mehta'][i%5]}`,segment,branch,`2025-${String((i%12)+1).padStart(2,'0')}-${String((i%27)+1).padStart(2,'0')}`);
   for(let j=0;j<(i%3)+1;j++) addApp.run(i,['Approved','Pending','Rejected','In Review'][(i+j*3)%4],['Savings','Credit Card','Personal Loan'][(i+j)%3],`2026-${String(((i+j)%10)+1).padStart(2,'0')}-${String(((i+j)%27)+1).padStart(2,'0')}`);
   for(let j=0;j<8;j++) addTx.run(i,Math.round((250+(i*73+j*197)%19000)*100)/100,(i+j)%4===0?'Debit':'Credit',`2026-${String(((i+j)%10)+1).padStart(2,'0')}-${String(((i*3+j)%27)+1).padStart(2,'0')}`);
  }
 }); seed();
}
