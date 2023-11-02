import { ApiResponse, GetUsers200ResponseOneOfInner, UsersManager } from 'auth0';
import auth0ResponseGenerator from './auth0ManagementAPIResponseGenerator.js';

class DummyAuth0UsersManager extends UsersManager {
  // eslint-disable-next-line class-methods-use-this
  create(): Promise<ApiResponse<GetUsers200ResponseOneOfInner>> {
    return Promise.resolve({
      data: auth0ResponseGenerator.getMockUserCreateResponse('auth0|12345'),
      status: 200,
      statusText: '',
      headers: new Headers(),
    });
  }
}

export default DummyAuth0UsersManager;
