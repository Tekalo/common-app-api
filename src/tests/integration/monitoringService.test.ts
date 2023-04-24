import request from 'supertest';
import getApp from '@App/app.js';
import sentryTestkit from 'sentry-testkit';
import { Transport } from '@sentry/types';
import configLoader from '@App/services/configLoader.js';
import MonitoringService from '../../services/MonitoringService.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';

const { testkit, sentryTransport } = sentryTestkit();

// This is less than ideal, but the error / trace collection by Sentry is async
function sleep(timeMillis: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, timeMillis));
}

afterAll(async () => {
  await MonitoringService.exitHandler();
});

describe('Monitoring Service', () => {
  const dummyAuthService = new DummyAuthService();

  const monitoringService = new MonitoringService(
    sentryTransport as () => Transport,
  );
  const appConfig = configLoader.loadConfig();

  // it('should collect performance events', async () => {
  //   const dummyAuthApp = getApp(dummyAuthService, monitoringService, appConfig);

  //   await request(dummyAuthApp)
  //     .post('/applicants')
  //     .send({
  //       name: 'Robert Boberson',
  //       pronoun: 'he/his',
  //       email: 'rboberson666@gmail.com',
  //       preferredContact: 'email',
  //       searchStatus: 'active',
  //       acceptedTerms: true,
  //       acceptedPrivacy: true,
  //     })
  //     .expect(200);

  //   await sleep(100);

  //   expect(testkit.transactions()).toHaveLength(1);
  //   const transaction = testkit.transactions()[0];
  //   expect(transaction.name).toContain('applicants');
  // });

  // it('should collect error events for 500 error', async () => {
  //   const dummyAuthApp = getApp(dummyAuthService, monitoringService, appConfig);

  //   await request(dummyAuthApp).post('/opportunities/batch').expect(400);

  //   await sleep(100);

  //   expect(testkit.transactions()).toHaveLength(2);
  //   const transaction = testkit.transactions()[1];
  //   expect(transaction.name).toContain('opportunities');
  //   expect(testkit.reports()).toHaveLength(1);
  //   const report = testkit.reports()[0];
  //   expect(report).toHaveProperty('error');
  // });

  // it('should not collect data for health check events', async () => {
  //   const dummyAuthApp = getApp(
  //     new DummyAuthService(),
  //     monitoringService,
  //     appConfig,
  //   );

  //   await request(dummyAuthApp).get('/health').expect(200);

  //   await sleep(100);

  //   expect(testkit.transactions()).toHaveLength(2);
  // });
});
