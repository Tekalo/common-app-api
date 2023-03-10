import {
  ApplicantQueryParams,
  ApplicantResponseBody,
  ApplicantRequestBody,
} from '@App/resources/types/applicants.js';
import AuthService from '@App/services/AuthService.js';

class ApplicantController {
  private auth0Client: AuthService;

  constructor(auth0Client: AuthService) {
    this.auth0Client = auth0Client;
  }

  // eslint-disable-next-line class-methods-use-this
  async createApplicant(
    data: ApplicantRequestBody,
    query: ApplicantQueryParams = { auth0: 'true' },
  ): Promise<ApplicantResponseBody> {
    let auth0User;
    if (query.auth0 !== 'false') {
      auth0User = await this.auth0Client.createUser(data);
    }
    return {
      auth0Id: auth0User?.user_id || null,
      email: data.email,
    };
  }
}

export default ApplicantController;
