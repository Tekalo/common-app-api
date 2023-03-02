import { ApplicantBody } from '@App/resources/types/apiRequestBodies.js';
import { Auth0UserBody } from '@App/resources/types/auth0Types.js';
import { ManagementClient } from 'auth0';

class CappAuth0Client {
  private auth0Client: ManagementClient | undefined;

  getClient(): ManagementClient {
    if (!this.auth0Client) {
      this.auth0Client = new ManagementClient({
        domain: 'sf-capp-dev.us.auth0.com',
        clientId: 'AzRVLnVmcru9u0hR5dl5VW84c21GLNEM',
        clientSecret:
          'CaIlDbCe1j8oN2-qPXKGvV1i7KU8fsxyIaIhgxg9UPgShTNtT0SnKCdDvV4Yf6ex', // TODO CONFIG ME
        scope: 'create:users',
      });
    }
    return this.auth0Client;
  }

  async createApplicant(data: ApplicantBody) {
    const auth0Client: ManagementClient = this.getClient();
    const payload: Auth0UserBody = { connection: 'email', ...data };
    const response = await auth0Client.createUser(payload);
    return response;
  }
}

export default CappAuth0Client;
