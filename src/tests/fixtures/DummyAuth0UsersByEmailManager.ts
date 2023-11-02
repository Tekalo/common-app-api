import { ApiResponse, GetUsers200ResponseOneOfInner, UsersByEmailManager } from 'auth0';
import auth0ResponseGenerator from './auth0ManagementAPIResponseGenerator.js';

class DummyAuth0UsersByEmailManager extends UsersByEmailManager {
  // eslint-disable-next-line class-methods-use-this
  getByEmail(): Promise<ApiResponse<GetUsers200ResponseOneOfInner[]>> {
    return Promise.resolve({
      data: [auth0ResponseGenerator.getMockUserCreateResponse('auth0|1234')],
      status: 200,
      statusText: '',
      headers: new Headers(),
    });
  }
}

export default DummyAuth0UsersByEmailManager;
