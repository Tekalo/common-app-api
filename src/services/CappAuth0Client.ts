import { ApplicantBody } from '@App/resources/types/apiRequestBodies.js';
import { Auth0UserBody, Auth0Config } from '@App/resources/types/auth0Types.js';
import { ManagementClient } from 'auth0';
import { randomUUID } from 'node:crypto';
import configLoader from './configLoader.js';

class CappAuth0Client {
  private auth0Client: ManagementClient | undefined;

  getClient(): ManagementClient {
    if (!this.auth0Client) {
      const { auth0 }: Auth0Config = configLoader.loadConfig();
      this.auth0Client = new ManagementClient({
        domain: auth0.domain, // 'sf-capp-dev.us.auth0.com',
        clientId: auth0.clientId, // 'AzRVLnVmcru9u0hR5dl5VW84c21GLNEM',
        clientSecret: auth0.clientSecret,
          // 'CaIlDbCe1j8oN2-qPXKGvV1i7KU8fsxyIaIhgxg9UPgShTNtT0SnKCdDvV4Yf6ex', // TODO CONFIG ME
        scope: 'create:users',
      });
    }
    return this.auth0Client;
  }

  async createUser(data: ApplicantBody) {
    const auth0Client: ManagementClient = this.getClient();
    const password = randomUUID();
    const payload: Auth0UserBody = { connection: 'Username-Password-Authentication', password, ...data };
    const response = await auth0Client.createUser(payload);
    return response;
  }
}

export default CappAuth0Client;
