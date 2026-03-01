import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTRPC } from '@trpc/server';
import { exceptionsRouter } from '../src/trpc/exceptions';
import * as dbClient from '../src/db/client';
import * as services from '../src/services/llm';

const t = initTRPC.create();

const ctxAuthed = {
  user: { id: 1, name: 'Tester', email: 'tester@example.com' },
};
const ctxAnon = {} as any;

// Helpers to call procedures
const caller = (ctx: any) => exceptionsRouter.createCaller(ctx);

describe('tRPC exceptions router', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers NullReferenceException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 101 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('NullReferenceException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(101);
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it('triggers DivideByZeroException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 102 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('DivideByZeroException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(102);
  });

  it('triggers ArgumentException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 103 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('ArgumentException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(103);
  });

  it('triggers IndexOutOfRangeException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 104 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('IndexOutOfRangeException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(104);
  });

  it('triggers InvalidOperationException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 105 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('InvalidOperationException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(105);
  });

  it('triggers FileNotFoundException', async () => {
    const insertMock = vi.fn().mockResolvedValue([{ insertId: 106 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ insert: () => ({ values: insertMock }) } as any);
    const res = await caller(ctxAuthed).trigger('FileNotFoundException');
    expect(res.success).toBe(true);
    expect(res.exceptionId).toBe(106);
  });

  it('lists exceptions with pagination', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ query: { exceptions: { findMany } } } as any);
    const res = await caller(ctxAnon).list({ limit: 2, offset: 0 });
    expect(res).toHaveLength(2);
    expect(findMany).toHaveBeenCalledWith({ limit: 2, offset: 0, orderBy: [expect.anything()] });
  });

  it('gets latest exception with analysis', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 5, analysisResults: [] });
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ query: { exceptions: { findFirst } } } as any);
    const res = await caller(ctxAnon).latest();
    expect(res?.id).toBe(5);
  });

  it('gets exception by id', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 7, analysisResults: [{ id: 1 }] });
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ query: { exceptions: { findFirst } } } as any);
    const res = await caller(ctxAnon).getById(7);
    expect(res?.id).toBe(7);
  });

  it('analyzes latest exception successfully', async () => {
    const latest = { id: 9, exceptionType: 'NullReferenceException', message: 'm', stackTrace: 's', simulatedCode: 'code' };
    const findFirst = vi.fn().mockResolvedValue(latest);
    const insertAnalysis = vi.fn().mockResolvedValue([{ insertId: 77 }]);
    const insertEmail = vi.fn().mockResolvedValue([{ insertId: 88 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({
      query: { exceptions: { findFirst } },
      insert: (table: any) => ({ values: table?.name === 'email_logs' ? insertEmail : insertAnalysis }),
    } as any);

    vi.spyOn(services, 'invokeLLM').mockResolvedValueOnce(JSON.stringify({
      rootCause: 'r', solutions: ['a','b','c'], bestPractices: 'bp'
    }));
    vi.spyOn(services, 'notifyOwner').mockResolvedValueOnce({ success: true } as any);

    const res = await caller(ctxAuthed).analyzeLatest();
    expect(res.success).toBe(true);
    expect(res.analysis.rootCause).toBe('r');
  });

  it('analyzeLatest throws when no latest', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({ query: { exceptions: { findFirst } } } as any);
    await expect(caller(ctxAuthed).analyzeLatest()).rejects.toThrow();
  });

  it('analyzeLatest logs failed email', async () => {
    const latest = { id: 10, exceptionType: 'InvalidOperationException', message: 'm', stackTrace: 's', simulatedCode: 'code' };
    const findFirst = vi.fn().mockResolvedValue(latest);
    const insertAnalysis = vi.fn().mockResolvedValue([{ insertId: 99 }]);
    const insertEmail = vi.fn().mockResolvedValue([{ insertId: 100 }]);
    vi.spyOn(dbClient, 'db', 'get').mockReturnValue({
      query: { exceptions: { findFirst } },
      insert: (table: any) => ({ values: table?.name === 'email_logs' ? insertEmail : insertAnalysis }),
    } as any);

    vi.spyOn(services, 'invokeLLM').mockResolvedValueOnce(JSON.stringify({
      rootCause: 'root', solutions: ['x','y','z'], bestPractices: 'bp'
    }));
    vi.spyOn(services, 'notifyOwner').mockRejectedValueOnce(new Error('smtp down'));

    const res = await caller(ctxAuthed).analyzeLatest();
    expect(res.success).toBe(true);
    expect(insertEmail).toHaveBeenCalled();
  });
});
