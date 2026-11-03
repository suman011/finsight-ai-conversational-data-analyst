import { z } from 'zod';
import { db } from './db.js';
export const questionSchema=z.object({question:z.string().trim().min(3).max(500)});
export type Result={id:string;question:string;answer:string;dataset:string;sql:string;columns:string[];rows:Record<string,string|number>[];chart:'bar'|'line'|'none';xKey?:string;yKey?:string;metric?:{label:string;value:string};suggestions:string[]};
type Plan={pattern:RegExp;dataset:string;sql:string;params?:unknown[];chart:'bar'|'line'|'none';x?:string;y?:string;description:string};
// Deliberately no LLM-to-SQL execution. Each intent maps to a reviewed, read-only, parameterized template.
export function planQuestion(q:string):Plan|null {
 const s=q.toLowerCase();
 if(/(delete|drop|truncate|update|insert|alter|password|secret|ssn|account number)/i.test(s)) return null;
 const region=s.match(/\b(west|east|north|south)\b/i)?.[1];
 if(/(transaction|volume|credit|debit|revenue|amount|spend)/.test(s)) {
  if(/(month|monthly|trend|over time|line)/.test(s)) return {pattern:/.*/,dataset:'Transactions',sql:`SELECT substr(occurred_at,1,7) AS month, ROUND(SUM(amount),2) AS volume FROM transactions GROUP BY month ORDER BY month`,chart:'line',x:'month',y:'volume',description:'Monthly transaction volume'};
  if(/(branch|region)/.test(s)) return {pattern:/.*/,dataset:'Transactions · Branches',sql:`SELECT b.name AS branch, ROUND(SUM(t.amount),2) AS volume FROM transactions t JOIN customers c ON c.id=t.customer_id JOIN branches b ON b.id=c.branch_id ${region?'WHERE lower(b.region)=?':''} GROUP BY b.id ORDER BY volume DESC LIMIT 10`,params:region?[region]:[],chart:'bar',x:'branch',y:'volume',description:'Transaction volume by branch'};
  if(/(type|kind|credit|debit)/.test(s)) return {pattern:/.*/,dataset:'Transactions',sql:'SELECT kind, COUNT(*) AS transactions, ROUND(SUM(amount),2) AS volume FROM transactions GROUP BY kind ORDER BY volume DESC',chart:'bar',x:'kind',y:'volume',description:'Transactions by type'};
  return {pattern:/.*/,dataset:'Transactions',sql:'SELECT COUNT(*) AS transactions, ROUND(SUM(amount),2) AS total_volume, ROUND(AVG(amount),2) AS average_amount FROM transactions',chart:'none',description:'Transaction overview'};
 }
 if(/(application|approval|onboarding|rejection|pending)/.test(s)) {
  if(/(month|monthly|trend|over time)/.test(s)) return {pattern:/.*/,dataset:'Applications',sql:'SELECT substr(applied_at,1,7) AS month, COUNT(*) AS applications FROM applications GROUP BY month ORDER BY month',chart:'line',x:'month',y:'applications',description:'Monthly onboarding applications'};
  if(/(product)/.test(s)) return {pattern:/.*/,dataset:'Applications',sql:'SELECT product, COUNT(*) AS applications FROM applications GROUP BY product ORDER BY applications DESC',chart:'bar',x:'product',y:'applications',description:'Applications by product'};
  if(/(rate|percentage)/.test(s)) return {pattern:/.*/,dataset:'Applications',sql:"SELECT COUNT(*) AS total, SUM(CASE WHEN status='Approved' THEN 1 ELSE 0 END) AS approved, ROUND(100.0*SUM(CASE WHEN status='Approved' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1) AS approval_rate_pct FROM applications",chart:'none',description:'Application approval rate'};
  return {pattern:/.*/,dataset:'Applications',sql:'SELECT status, COUNT(*) AS applications FROM applications GROUP BY status ORDER BY applications DESC',chart:'bar',x:'status',y:'applications',description:'Application status breakdown'};
 }
 if(/(customer|segment|branch|region)/.test(s)) {
  if(/(segment)/.test(s)) return {pattern:/.*/,dataset:'Customers',sql:'SELECT segment, COUNT(*) AS customers FROM customers GROUP BY segment ORDER BY customers DESC',chart:'bar',x:'segment',y:'customers',description:'Customers by segment'};
  if(/(region)/.test(s)) return {pattern:/.*/,dataset:'Customers · Branches',sql:`SELECT b.region AS region, COUNT(*) AS customers FROM customers c JOIN branches b ON b.id=c.branch_id ${region?'WHERE lower(b.region)=?':''} GROUP BY b.region ORDER BY customers DESC`,params:region?[region]:[],chart:'bar',x:'region',y:'customers',description:'Customers by region'};
  if(/(branch|top)/.test(s)) return {pattern:/.*/,dataset:'Customers · Branches',sql:'SELECT b.name AS branch, COUNT(*) AS customers FROM customers c JOIN branches b ON b.id=c.branch_id GROUP BY b.id ORDER BY customers DESC',chart:'bar',x:'branch',y:'customers',description:'Customers by branch'};
  return {pattern:/.*/,dataset:'Customers',sql:'SELECT COUNT(*) AS total_customers, COUNT(DISTINCT branch_id) AS active_branches FROM customers',chart:'none',description:'Customer overview'};
 }
 return null;
}
const suggestions=['Show monthly transaction trends','Compare transaction volume by branch','What is the application approval rate?','Show customers by segment'];
export function answerQuestion(question:string):Result|null {
 const plan=planQuestion(question); if(!plan)return null;
 const rows=db.prepare(plan.sql).all(...(plan.params??[])) as Record<string,string|number>[];
 const columns=rows.length?Object.keys(rows[0]):[];
 const first=rows[0];
 const summary=rows.length===1 && columns.length<=3?columns.map(k=>`${k.replaceAll('_',' ')}: ${Number.isFinite(first[k] as number)?Number(first[k]).toLocaleString('en-IN'):first[k]}`).join(' · '):`${plan.description}: ${rows.length} ${rows.length===1?'result':'groups'} returned.`;
 const key=columns.find(k=>typeof first?.[k]==='number');
 return {id:crypto.randomUUID(),question,answer:summary,dataset:plan.dataset,sql:plan.sql,columns,rows,chart:plan.chart,xKey:plan.x,yKey:plan.y,metric:key?{label:key.replaceAll('_',' '),value:Number(first[key]).toLocaleString('en-IN')}:undefined,suggestions};
}
