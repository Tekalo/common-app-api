import CAPPError from '@App/resources/shared/CAPPError.js';
import { Auth0UserBody, Auth0ApiConfig } from '@App/resources/types/auth0.js';
import { ManagementClient } from 'auth0';
import { randomBytes } from 'node:crypto';
import configLoader from './configLoader.js';

class AuthService {
  private auth0Client: ManagementClient | undefined;

  getClient(): ManagementClient {
    if (!this.auth0Client) {
      const { api }: { api: Auth0ApiConfig } = configLoader.loadConfig().auth0;
      this.auth0Client = new ManagementClient({
        domain: api.domain,
        clientId: api.clientId,
        clientSecret: api.clientSecret,
        scope: 'create:users',
      });
    }
    return this.auth0Client;
  }

  async createUser(data: { name: string; email: string }) {
    const auth0Client: ManagementClient = this.getClient();
    const payload: Auth0UserBody = {
      ...data,
      connection: 'Username-Password-Authentication',
      password: randomBytes(20).toString('base64'),
    };
    let responseBody;
    try {
      responseBody = await auth0Client.createUser(payload);
    } catch (e) {
      if (e instanceof Error && e.message === 'The user already exists.') {
        throw new CAPPError({
          title: 'User Creation Error',
          detail: 'User already exists',
          status: 409,
        });
      }
      throw e;
    }
    return responseBody;
  }

  async generatePasswordReset(auth0Id: string) {
    const auth0Client: ManagementClient = this.getClient();
    const params = {
      result_url: configLoader.loadConfig().webUrl, // Redirect after using the ticket.
      user_id: auth0Id,
      mark_email_as_verified: true,
    };
    try {
      return await auth0Client.createPasswordChangeTicket(params);
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Auth0 Error',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  async deleteUser(id: string) {
    const auth0Client: ManagementClient = this.getClient();
    let responseBody;
    try {
      responseBody = await auth0Client.deleteUser({ id });
    } catch (e) {
      if (e instanceof Error) {
        throw new CAPPError(
          {
            title: 'User Deletion Error',
            detail: 'Problem deleting user from Auth0',
          },
          { cause: e },
        );
      }
      throw e;
    }
    return responseBody;
  }
}

export default AuthService;
