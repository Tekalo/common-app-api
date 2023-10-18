import {
  GetUsers200ResponseOneOfInner,
  GetUsers200ResponseOneOfInnerAppMetadata,
  GetUsers200ResponseOneOfInnerCreatedAt,
} from 'auth0';

/**
 * Get mock response body from a call to Auth0's users.create().
 * @param options
 * @returns
 */
function getMockUserCreateResponse(
  auth0Id: string,
  overrides?: Partial<GetUsers200ResponseOneOfInner>,
) {
  const mockUser = {
    user_id: auth0Id,
    email: 'mockemail@schmidtfutures.com',
    name: 'Mock TestUser',
    email_verified: false,
    username: '',
    phone_verified: false,
    phone_number: '',
    verified_at: null,
    created_at: '' as GetUsers200ResponseOneOfInnerCreatedAt,
    updated_at: '',
    identities: [],
    app_metadata: {} as GetUsers200ResponseOneOfInnerAppMetadata,
    user_metadata: {} as GetUsers200ResponseOneOfInnerAppMetadata,
    picture: '',
    nickname: '',
    multifactor: [],
    last_ip: '',
    last_login: '',
    logins_count: 1,
    blocked: false,
    given_name: '',
    family_name: '',
    ...overrides,
  };
  return mockUser;
}

const auth0ResponseGenerator = {
  getMockUserCreateResponse,
};

export default auth0ResponseGenerator;
