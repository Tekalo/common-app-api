import {
  ApplicantQueryParams,
  ApplicantResponseBody,
  ApplicantRequestBody,
} from '@App/resources/types/applicants.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';

class ApplicantController {
  private auth0Client: CappAuth0Client;

  constructor(auth0Client: CappAuth0Client) {
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
