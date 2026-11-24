// Rename regression checks that run without a database or real email delivery.
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { DataSource } = require('typeorm');
const { Coordinator, CoordinatorEmailChallenge } = require('../dist/coordinators/coordinator.entity');
const { CoordinatorGuard, coordinatorSecret } = require('../dist/coordinators/coordinator.guard');
const { CoordinatorsController } = require('../dist/coordinators/coordinators.controller');
const { CoordinatorsService } = require('../dist/coordinators/coordinators.service');
const { User } = require('../dist/users/user.entity');
const { CoinTransaction } = require('../dist/users/coin-transaction.entity');
const { PayoutAccount } = require('../dist/payouts/payout-account.entity');
const { PayoutsService } = require('../dist/payouts/payouts.service');
const { DirectCallsService } = require('../dist/direct-calls/direct-calls.service');

async function run() {
  const storage = new DataSource({ type: 'mysql', database: 'contract_test', entities: [Coordinator, CoordinatorEmailChallenge, User, CoinTransaction, PayoutAccount] });
  await storage.buildMetadatas();
  assert.equal(storage.getMetadata(Coordinator).tableName, 'agents');
  assert.equal(storage.getMetadata(User).findColumnWithPropertyName('createdByCoordinatorId').databaseName, 'createdByAgentId');
  assert.equal(storage.getMetadata(User).findColumnWithPropertyName('coordinatorEmailChangedAt').databaseName, 'agentEmailChangedAt');
  assert.equal(storage.getMetadata(CoinTransaction).findColumnWithPropertyName('coordinatorId').databaseName, 'agentId');
  const payoutTransformer = storage.getMetadata(PayoutAccount).findColumnWithPropertyName('ownerType').transformer;
  assert.equal(payoutTransformer.to('coordinator'), 'agent');
  assert.equal(payoutTransformer.from('agent'), 'coordinator');
  const sql = storage.getRepository(CoinTransaction).createQueryBuilder('tx')
    .select('SUM(tx.coordinatorCoins)', 'coins').where('tx.coordinatorId = :id', { id: 'test' }).getSql();
  assert.match(sql, /`tx`\.`agentCoins`/);
  assert.match(sql, /`tx`\.`agentId`/);
  const payoutSql = storage.getRepository(PayoutAccount).createQueryBuilder('p').where({ ownerType: 'coordinator' }).getQueryAndParameters();
  assert.deepEqual(payoutSql[1], ['agent']);
  const calls = new DirectCallsService(null, { findOne: async () => ({ value: { agentPercent: 17 } }) });
  const settings = await calls.settings();
  assert.equal(settings.coordinatorPercent, 17);
  assert.equal('agentPercent' in settings, false);

  process.env.JWT_SECRET = 'coordinator-contract-test-only';
  const jwt = new JwtService();
  const coordinator = { id: 'test-coordinator', name: 'Test Coordinator', email: 'coordinator@example.invalid', status: 'active', sessionVersion: 0 };
  const token = jwt.sign({ sub: coordinator.id, version: 0 }, { secret: coordinatorSecret(), audience: 'coordinator' });
  class ContractModule {}
  Module({
    controllers: [CoordinatorsController],
    providers: [
      CoordinatorGuard,
      { provide: JwtService, useValue: jwt },
      { provide: getRepositoryToken(Coordinator), useValue: { findOneBy: async ({ id }) => id === coordinator.id ? coordinator : null } },
      { provide: CoordinatorsService, useValue: {
        throttle() {}, publicCoordinator: value => ({ id: value.id, name: value.name, email: value.email }),
        login: async () => ({ coordinator: { id: coordinator.id, name: coordinator.name, email: coordinator.email }, token }),
        earnings: async () => ({ balance: 40 }),
      } },
      { provide: PayoutsService, useValue: { listAccounts: async (ownerType, ownerId) => {
        assert.equal(ownerType, 'coordinator'); assert.equal(ownerId, coordinator.id); return [];
      } } },
    ],
  })(ContractModule);
  const app = await NestFactory.create(ContractModule, { logger: false });
  try {
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const origin = await app.getUrl();
    const login = await fetch(`${origin}/coordinators/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: coordinator.email, password: 'test-password' }),
    });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).coordinator.id, coordinator.id);
    assert.equal((await fetch(`${origin}/coordinators/me`)).status, 401);
    const headers = { Authorization: `Bearer ${token}` };
    const me = await fetch(`${origin}/coordinators/me`, { headers });
    assert.equal(me.status, 200); assert.equal((await me.json()).coordinator.id, coordinator.id);
    assert.equal((await fetch(`${origin}/coordinators/payout-accounts`, { headers })).status, 200);
    coordinator.status = 'banned';
    assert.equal((await fetch(`${origin}/coordinators/me`, { headers })).status, 401);
    assert.equal((await fetch(`${origin}/agents/me`, { headers })).status, 404);
    console.log('PASS: coordinator API routes, session authorization, banned-account denial, existing account/coin/payout storage and saved call-share compatibility.');
  } finally { await app.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
