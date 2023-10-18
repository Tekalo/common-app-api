import { GetUsers200ResponseOneOfInner, UsersManager } from 'auth0';
import { ApiResponse } from 'node_modules/auth0/dist/esm/lib/runtime.js';
import auth0ResponseGenerator from './auth0ManagementAPIResponseGenerator.js';

class DummyAuth0UsersManager extends UsersManager {
  // eslint-disable-next-line class-methods-use-this
  create(): Promise<ApiResponse<GetUsers200ResponseOneOfInner>> {
    return Promise.resolve({
      data: auth0ResponseGenerator.getMockUserCreateResponse('auth0|12345'),
      status: 200,
      statusText: '',
      headers: '',
    });
  }
}

export default DummyAuth0UsersManager;
