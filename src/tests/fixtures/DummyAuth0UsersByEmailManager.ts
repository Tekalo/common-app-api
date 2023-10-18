// import { UsersByEmailManager } from 'auth0';

import { GetUsers200ResponseOneOfInner, UsersByEmailManager } from 'auth0';
import { ApiResponse } from 'node_modules/auth0/dist/esm/lib/runtime.js';
import auth0ResponseGenerator from './auth0ResponseGenerator.js';

class DummyAuth0UsersByEmailManager extends UsersByEmailManager {
  // eslint-disable-next-line class-methods-use-this
  getByEmail(): Promise<ApiResponse<GetUsers200ResponseOneOfInner[]>> {
    return Promise.resolve({
      data: [auth0ResponseGenerator.getMockUserCreateResponse('auth0|1234')],
      status: 200,
      statusText: '',
      headers: '',
    });
  }
}

export default DummyAuth0UsersByEmailManager;
