import { ApplicantBody } from '@App/resources/types/apiRequestBodies.js';
import { ApplicantQueryParams } from '@App/resources/types/apiRequestParams.js';
import ApplicantBodySchema from '@App/resources/zodSchemas/apiRequestBodySchemas.js';
import { ApplicantResponse } from '@App/resources/types/apiResponses.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';

class ApplicantController {
  private auth0Client: CappAuth0Client;

  constructor(auth0Client: CappAuth0Client) {
    this.auth0Client = auth0Client;
  }

  // eslint-disable-next-line class-methods-use-this
  async createApplicant(
    data: ApplicantBody,
    query: ApplicantQueryParams = { auth0: 'true' },
  ): Promise<ApplicantResponse> {
    let auth0User;
    if (query.auth0 !== 'false') {
      const validatedData = ApplicantBodySchema.parse(data); // Zod validate
      auth0User = await this.auth0Client.createUser(validatedData);
    }
    return {
      auth0Id: auth0User?.user_id,
      email: data.email,
    };
  }
}

export default ApplicantController;