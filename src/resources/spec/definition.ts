import { Applicants, Opportunities, Uploads } from '@capp/schemas';
import { z } from 'zod';
import { createDocument, extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const {
  ApplicantCreateRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantCreateResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantGetSubmissionsResponseBodySchema,
  ApplicantStateResponseBodySchema,
  ApplicantGetResponseBodySchema,
} = Applicants;

const {
  OpportunityBatchRequestBodySchema,
  OpportunityBatchResponseBodySchema,
} = Opportunities;

const {
  UploadRequestBodySchema,
  UploadResponseBodySchema,
  UploadStateRequestBodySchema,
  UploadStateResponseBodySchema,
} = Uploads;

const specJson = createDocument({
  openapi: '3.0.0',
  info: {
    title: 'Common App API',
    description: 'Documentation for Common App REST API endpoints',
    version: '1.0.1',
  },
  paths: {
    '/health': {
      get: {
        description: 'Gets health status',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    healthy: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/applicants': {
      post: {
        description: 'Create a new applicant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ApplicantCreateRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantCreateResponseBodySchema,
              },
            },
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '409': {
            description: 'Resource Exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/applicants/me': {
      delete: {
        description: 'Delete current applicant',
        responses: {
          '200': {
            description: 'Success',
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
      get: {
        description: 'Get current applicant info',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantGetResponseBodySchema,
              },
            },
          },
          '404': {
            description: 'Applicant Not Found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/applicants/me/state': {
      put: {
        description: 'Pause an existing applicant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ApplicantStateRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'applicantion/json': {
                schema: ApplicantStateResponseBodySchema,
              },
            },
          },
          '404': {
            description: 'Not Found',
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/applicants/me/submissions': {
      get: {
        description: "Get current applicant's submission",
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantGetSubmissionsResponseBodySchema,
              },
            },
          },
        },
      },
      post: {
        description: 'Create a new applicant submission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ApplicantCreateSubmissionRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantCreateSubmissionResponseBodySchema,
              },
            },
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
      put: {
        description: 'Update an existing applicant submission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ApplicantCreateSubmissionRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantCreateSubmissionResponseBodySchema,
              },
            },
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/applicants/me/submissions/draft': {
      post: {
        description: 'Create a new applicant draft submission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ApplicantDraftSubmissionRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: ApplicantDraftSubmissionResponseBodySchema,
              },
            },
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/opportunities/batch': {
      post: {
        description: 'Create a new opportunity',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: OpportunityBatchRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: OpportunityBatchResponseBodySchema,
              },
            },
          },
        },
      },
    },
    '/applicants/me/resume': {
      post: {
        description: 'Initiate a resume upload',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: UploadRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: UploadResponseBodySchema,
              },
            },
          },
        },
      },
    },
    '/applicants/me/uploads/:id/complete': {
      post: {
        parameters: [
          {
            in: 'path',
            name: 'id',
            schema: {
              type: 'integer',
            },
          },
        ],
        description: 'Mark an upload as completed',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: UploadStateRequestBodySchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: UploadStateResponseBodySchema,
              },
            },
          },
        },
      },
    },
    '/applicants/:id/resume': {
      get: {
        parameters: [
          {
            in: 'path',
            name: 'id',
            schema: {
              type: 'integer',
            },
          },
        ],
        description: 'Get resume download URL for a given applicant',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: UploadResponseBodySchema,
              },
            },
          },
        },
      },
    },
    '/cleanup/testapplicants': {
      delete: {
        description: 'Delete all test applicants',
        responses: {
          '200': {
            description: 'Success',
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/cleanup/testopportunities': {
      delete: {
        description: 'Delete all test opportunities',
        responses: {
          '200': {
            description: 'Success',
          },
          '400': {
            description: 'Bad Input',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '500': {
            description: 'Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  },
});

export default specJson;
