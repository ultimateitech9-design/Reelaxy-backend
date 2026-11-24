// Local ownership/pagination regression test. All test data is rolled back.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const ds = require('../dist/data-source').default;
const { User } = require('../dist/users/user.entity');
const { Coordinator } = require('../dist/coordinators/coordinator.entity');
const { CoordinatorsService } = require('../dist/coordinators/coordinators.service');
(async () => {
  if (!['localhost', '127.0.0.1', '::1'].includes(ds.options.host)) throw Error('Local DB required');
  await ds.initialize();
  const runner = ds.createQueryRunner(); await runner.connect(); await runner.startTransaction();
  try {
    const makeCoordinator = name => runner.manager.save(Coordinator, runner.manager.create(Coordinator, { name, email: randomUUID() + '@example.invalid', password: 'test-only-hash' }));
    const coordinator = await makeCoordinator('Export test coordinator'), other = await makeCoordinator('Other coordinator');
    const users = runner.manager.getRepository(User);
    const makeUser = (name, coordinatorId) => users.save(users.create({ name, email: randomUUID() + '@example.invalid', password: 'never-export-this-hash', createdByCoordinatorId: coordinatorId, phone: '9302135055', birthDate: new Date('2001-01-02'), gender: 'male', city: 'gwalior', profession: 'doctor', bio: 'reelaxy coordinator user', role: 'user', status: 'active', photos: [] }));
    const expected = [];
    for (let index = 0; index < 7; index++) expected.push(await makeUser(index ? 'Export user ' + index : 'suraj dhakad', coordinator.id));
    const outsider = await makeUser('Other coordinator user', other.id);
    // Bulk-created users can share a timestamp with microsecond precision.
    await runner.query('UPDATE users SET createdAt = ? WHERE createdByAgentId = ?', ['2026-11-18 10:30:00.123456', coordinator.id]);
    const service = Object.create(CoordinatorsService.prototype); service.users = users;
    let cursor; const records = [];
    do { const result = await service.exportUsers(coordinator.id, cursor); records.push(...result.users); cursor = result.nextCursor; } while (cursor);
    assert.equal(records.length, 7); assert.equal(new Set(records.map(user => user.id)).size, 7);
    assert(!records.some(user => user.id === outsider.id));
    const suraj = records.find(user => user.id === expected[0].id);
    assert.equal(suraj.name, 'suraj dhakad'); assert.equal(suraj.city, 'gwalior'); assert.equal(suraj.profession, 'doctor'); assert.equal(suraj.phone, '9302135055');
    assert(records.every(user => user.password === undefined));
    const empty = await service.exportUsers(randomUUID());
    assert.equal(empty.users.length, 0);
    console.log('Passed: actual registered rows, account/phone/city/profession fields, multi-page export, other-coordinator exclusion and no password hashes.');
  } finally { await runner.rollbackTransaction(); await runner.release(); console.log('Test data rolled back.'); }
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => ds.isInitialized ? ds.destroy() : undefined);
