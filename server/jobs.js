import crypto from 'node:crypto';

export function createJobQueue() {
  const jobs = new Map();
  const enqueue = (type, payload = {}) => {
    const job = { id: crypto.randomUUID(), type, payload, status: 'queued', createdAt: new Date().toISOString() };
    jobs.set(job.id, job);
    queueMicrotask(() => {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      queueMicrotask(() => { job.status = 'completed'; job.result = { type, generatedAt: new Date().toISOString(), payload }; job.completedAt = new Date().toISOString(); });
    });
    return job;
  };
  return { enqueue, get: (id) => jobs.get(id), list: () => [...jobs.values()] };
}
