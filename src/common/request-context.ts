import { AsyncLocalStorage } from 'async_hooks';

/** The staff member behind the current request (set by StaffActivityInterceptor). */
export type StaffActor = { userId: string; name: string; email: string; role: string; ip: string; device: string };
type Context = { actor?: StaffActor; audited?: boolean };

const storage = new AsyncLocalStorage<Context>();

export const requestContext = {
  run<T>(context: Context, fn: () => T): T { return storage.run(context, fn); },
  actor(): StaffActor | undefined { return storage.getStore()?.actor; },
  /** Called when a handler writes its own descriptive log, so the generic entry is skipped. */
  markAudited() { const store = storage.getStore(); if (store) store.audited = true; },
  audited(): boolean { return Boolean(storage.getStore()?.audited); },
};
