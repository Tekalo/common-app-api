import request from 'supertest';
import getApp from '@App/app.js';
import sentryTestkit from 'sentry-testkit';
import { Transport } from '@sentry/types';
import MonitoringService from '../../services/MonitoringService.js';
import DummyAuthService from '../fixtures/DummyAuthService.js';

const { testkit, sentryTransport } = sentryTestkit();

// This is less than ideal, but the error / trace collection by Sentry is async
function sleep(timeMillis: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, timeMillis));
}

describe('Error Handling', () => {
  const dummyAuthService = new DummyAuthService();
  dummyAuthService.createUser = () => {
    throw new Error('Auth0 Creation Error');
  };

  it('should collect error events for 500 error', async () => {
    const dummyAuthApp = getApp(
      dummyAuthService,
      new MonitoringService(sentryTransport as () => Transport),
    );

    await request(dummyAuthApp)
      .post('/applicants')
      .send({
        name: 'Robert Boberson',
        pronoun: 'he/his',
        email: 'rboberson666@gmail.com',
        preferredContact: 'email',
        searchStatus: 'active',
        acceptedTerms: true,
        acceptedPrivacy: true,
      })
      .expect(500);

    await sleep(100);

    expect(testkit.transactions()).toHaveLength(1);
    expect(testkit.reports()).toHaveLength(1);
    const report = testkit.reports()[0];
    expect(report).toHaveProperty('error');
  });

  it('should collect performance events', async () => {
    const dummyAuthApp = getApp(
      new DummyAuthService(),
      new MonitoringService(sentryTransport as () => Transport),
    );

    await request(dummyAuthApp).get('/health').expect(200);

    await sleep(100);

    expect(testkit.transactions()).toHaveLength(2);
    const transaction = testkit.transactions()[1];
    expect(transaction.name).toContain('health');
  });
});
