import { describe,it,expect } from 'vitest';
import { planQuestion,questionSchema,answerQuestion } from '../src/engine.js';
describe('safe analytics engine',()=>{
 it('rejects destructive requests',()=>expect(planQuestion('delete all transactions')).toBeNull());
 it('uses a bound parameter for region filtering',()=>{const p=planQuestion('transaction volume by branch in west region');expect(p?.sql).toContain('lower(b.region)=?');expect(p?.params).toEqual(['west']);});
 it('validates question length',()=>expect(questionSchema.safeParse({question:'x'}).success).toBe(false));
 it('returns a real seeded monthly trend',()=>{const r=answerQuestion('monthly transaction trend');expect(r?.chart).toBe('line');expect(r?.rows.length).toBeGreaterThan(0);});
});
