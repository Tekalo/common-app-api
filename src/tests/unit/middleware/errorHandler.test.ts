import errorHandler from '@App/middleware/errorHandler.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { NextFunction, Request, Response } from 'express';
import { jest } from '@jest/globals';
import pino from 'pino';

describe('Error Handler', () => {
  test('Generated error should include exception and stacktrace in dev environment', () => {
    const mockError = new Error('Something went wrong');
    const error = new CAPPError(
      {
        title: 'Foo Error',
        detail: 'Bar Error Message',
        status: 500,
      },
      { cause: mockError },
    );
    const mockRequest = {
      session: {},
      log: { error: (() => {}) as pino.LogFn },
    } as Request;

    const mockResponse = {} as Response;
    mockResponse.json = jest.fn(() => mockResponse);
    mockResponse.status = jest.fn(() => mockResponse); // chained
    mockResponse.setHeader = jest.fn(() => mockResponse);

    const mockNext: NextFunction = jest.fn();
    errorHandler(error, mockRequest, mockResponse, mockNext);
    expect(mockResponse.json).toBeCalledWith({
      title: 'Foo Error',
      detail: expect.stringMatching(/test123/i),
    });
  });
});
