import request from 'supertest';
import sentryTestkit from 'sentry-testkit';
import { Transport } from '@sentry/types';
import getApp from '@App/app.js';
import { getRandomString } from '@App/tests/util/helpers.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import configLoader from '@App/services/configLoader.js';
import MonitoringService from '@App/services/MonitoringService.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';
import DummyEmailService from '../fixtures/DummyEmailService.js';
import DummySESService from '../fixtures/DummySesService.js';

const { testkit, sentryTransport } = sentryTestkit();

// This is less than ideal, but the error / trace collection by Sentry is async
function sleep(timeMillis: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, timeMillis));
}

afterAll(async () => {
  await MonitoringService.exitHandler();
});

afterEach(() => testkit.reset());

describe('Monitoring Service', () => {
  const appConfig = configLoader.loadConfig();

  const dummyAuthService = new DummyAuthService();
  const dummyEmailService = new DummyEmailService(
    new DummySESService(),
    appConfig,
  );

  const monitoringService = new MonitoringService(
    sentryTransport as () => Transport,
    1.0,
  );

  // We need to use the same app for all tests.
  // There is an error if sentryInit is called more than once on the same prisma client.
  const dummyAuthApp = getApp(
    dummyAuthService,
    monitoringService,
    dummyEmailService,
    appConfig,
  );

  it('should collect performance events', async () => {
    await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Robert Boberson',
        pronoun: 'he/his',
        email: `rboberson${getRandomString()}@gmail.com`,
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(200);

    await sleep(100);

    expect(testkit.reports()).toHaveLength(0);
    expect(testkit.transactions()).toHaveLength(1);
    const transaction = testkit.transactions()[0];
    expect(transaction.name).toContain('applicants');
  });

  it('should collect error events for 500 error', async () => {
    await request(dummyAuthApp).post('/opportunities/batch').expect(400);

    await sleep(100);

    expect(testkit.transactions()).toHaveLength(1);
    const transaction = testkit.transactions()[0];
    expect(transaction.name).toContain('opportunities');
    expect(testkit.reports()).toHaveLength(1);
    const report = testkit.reports()[0];
    expect(report).toHaveProperty('error');
  });

  it('should not collect data for health check events', async () => {
    await request(dummyAuthApp).get('/health').expect(200);

    await sleep(100);

    expect(testkit.transactions()).toHaveLength(0);
  });

  it('should be able to get status from a CAPPError', () => {
    const error = new CAPPError({
      title: 'Auth0 User Creation Error',
      detail: 'Invalid email provided',
      status: 400,
    });

    expect(error.status).toBe(error.problem.status);
  });
});
