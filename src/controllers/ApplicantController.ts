import { ApplicantBody } from '@App/resources/types/apiRequestBodies.js';
import { ApplicantQueryParams } from '@App/resources/types/apiRequestParams.js';
import ApplicantBodySchema from '@App/resources/zodSchemas/apiRequestBodySchemas.js';
import CappAuth0Client from '@App/services/CappAuth0Client.js';

class ApplicantController {
  private auth0Client: CappAuth0Client;

  constructor(auth0Client: CappAuth0Client) {
    this.auth0Client = auth0Client;
  }

  // eslint-disable-next-line class-methods-use-this
  async createApplicant(data: ApplicantBody, query: ApplicantQueryParams = { auth0: 'true' } ) {
    if (query.auth0 !== 'false') {
      console.log('callin it');
        const validatedData = ApplicantBodySchema.parse(data); // Zod validate
       await this.auth0Client.createApplicant(validatedData);
    }
    return { success: true };
    // TODO: Create user in our Prisma DB
  }
}

export default ApplicantController;
