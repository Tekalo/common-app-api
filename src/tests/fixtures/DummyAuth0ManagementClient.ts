import { ManagementClient } from 'auth0';
import DummyAuth0UsersByEmailManager from './DummyAuth0UsersByEmailManager.js';
import DummyAuth0UsersManager from './DummyAuth0UsersManager.js';

class DummyAuth0ManagementClient extends ManagementClient {
  users: DummyAuth0UsersManager = new DummyAuth0UsersManager(
    this.configuration,
  );

  usersByEmail: DummyAuth0UsersByEmailManager =
    new DummyAuth0UsersByEmailManager(this.configuration);
}

export default DummyAuth0ManagementClient;
