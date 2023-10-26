// const applicantPath = `${process.cwd()}/packages/schemas/src/applicants.js`;

import { Applicants, Opportunities, Uploads } from '@capp/schemas';
import { z } from 'zod';
import { createDocument, extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const {
  ApplicantRequestBodySchema,
  ApplicantStateRequestBodySchema,
  ApplicantResponseBodySchema,
  ApplicantCreateSubmissionRequestBodySchema,
  ApplicantCreateSubmissionResponseBodySchema,
  ApplicantDraftSubmissionRequestBodySchema,
  ApplicantDraftSubmissionResponseBodySchema,
  ApplicantGetSubmissionsResponseBodySchema,
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
              schema: z.object({ ApplicantRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ ApplicantResponseBodySchema }),
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
              schema: z.object({ ApplicantStateRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
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
                schema: z.object({ ApplicantGetSubmissionsResponseBodySchema }),
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
              schema: z.object({ ApplicantCreateSubmissionRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  ApplicantCreateSubmissionResponseBodySchema,
                }),
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
              schema: z.object({ ApplicantCreateSubmissionRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  ApplicantCreateSubmissionResponseBodySchema,
                }),
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
              schema: z.object({ ApplicantDraftSubmissionRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({
                  ApplicantDraftSubmissionResponseBodySchema,
                }),
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
              schema: z.object({ OpportunityBatchRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ OpportunityBatchResponseBodySchema }),
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
              schema: z.object({ UploadRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ UploadResponseBodySchema }),
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
              schema: z.object({ UploadStateRequestBodySchema }),
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: z.object({ UploadStateResponseBodySchema }),
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
                schema: z.object({ UploadResponseBodySchema }),
              },
            },
          },
        },
      },
    },
  },
});

export default specJson;
