/* eslint-disable class-methods-use-this */
import { ManagementClient } from 'auth0';

class DummyAuth0ManagementClient extends ManagementClient {
  // eslint-disable-next-line
  getUsersByEmail(email: string): Promise<Array<Object>> {
    return Promise.resolve([]);
  }
}

export default DummyAuth0ManagementClient;