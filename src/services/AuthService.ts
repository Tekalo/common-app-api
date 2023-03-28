import CAPPError from '@App/resources/shared/CAPPError.js';
import { Auth0UserBody, Auth0Config } from '@App/resources/types/auth0.js';
import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';
import { randomBytes } from 'node:crypto';
import configLoader from './configLoader.js';

class AuthService {
  private auth0Client: ManagementClient | undefined;

  getClient(): ManagementClient {
    if (!this.auth0Client) {
      const { auth0 }: { auth0: Auth0Config } = configLoader.loadConfig();
      this.auth0Client = new ManagementClient({
        domain: auth0.domain,
        clientId: auth0.clientId,
        clientSecret: auth0.clientSecret,
        scope: 'create:users',
      });
    }
    return this.auth0Client;
  }

  async createUser(data: {
    name: string;
    email: string;
  }): Promise<User<AppMetadata, UserMetadata>> {
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
      console.log('catching');
      console.log(e);
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
}

export default AuthService;
