import { randomBytes } from 'node:crypto';
import { ManagementClient, ApiResponse } from 'auth0';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { Auth0UserBody, Auth0ApiConfig } from '@App/resources/types/auth0.js';
// TODO - is this import right?
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
      responseBody = await auth0Client.users.create(payload);
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
      return await auth0Client.tickets.changePassword(params);
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Auth0 Error',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  /**
   * Returns user with the given auth0 id or undefined if user does not exist
   * @param auth0Id
   * @returns
   */
  async getUser(auth0Id: string) {
    const auth0Client: ManagementClient = this.getClient();
    const params = {
      id: auth0Id,
    };
    try {
      // return await auth0Client.getUser(params);
      return await auth0Client.users.get(params);
    } catch (e) {
      throw new CAPPError(
        {
          title: 'Auth0 Error',
          detail: 'Unable to delete Auth0 user',
        },
        e instanceof Error ? { cause: e } : undefined,
      );
    }
  }

  /**
   * Returns all users with given email or undefined if user does not exist
   * Multiple users with same email but different 'connection' types may exist
   * @param email
   * @returns
   */
  async userExists(email: string): Promise<boolean> {
    const auth0Client: ManagementClient = this.getClient();
    // Auth0 stores all emails as lower case, but if auth0 is not the IDP we store as case-sensitive.
    // Google and Linkedin both case in-sensitive, this should be updated if we add case-sensitive IDPs in the future.
    const { data: users } = await auth0Client.usersByEmail.getByEmail({
      email: email.toLowerCase(),
    });
    return users.length > 0;
  }

  static getSignInLink(): string {
    return `${configLoader.loadConfig().webUrl}/sign-in`;
  }

  /**
   * Delete all Auth0 users that have a given email.
   * Typically should only be 1, unless there are users with a given email who have multiple connection types.
   * @param email
   * @returns
   */
  async deleteUsers(email: string, auth0Id: string) {
    const auth0Client: ManagementClient = this.getClient();
    let responseBody;
    try {
      // TODO: When we have account linking setup, we won't need to do the double delete
      // Delete #1: Delete Auth0 User by ID
      await auth0Client.users.delete({ id: auth0Id });
      // Auth0 stores all emails as lower case, but if auth0 is not the IDP we store as case-sensitive.
      // Google and Linkedin both case in-sensitive, this should be updated if we add case-sensitive IDPs in the future.
      const { data: allUsers } = await auth0Client.usersByEmail.getByEmail({
        email: email.toLowerCase(),
      });
      const deletionRequests: Array<Promise<ApiResponse<void>>> = [];
      allUsers.forEach((user) => {
        if (user.user_id) {
          deletionRequests.push(auth0Client.users.delete({ id: user.user_id }));
        }
      });
      // Delete #2: In case there is a mismatch between email and auth0ID, also attempt to delete by auth0 ID
      responseBody = await Promise.all(deletionRequests);
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
