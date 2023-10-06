import errorHandler from '@App/middleware/errorHandler.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { NextFunction, Request, Response } from 'express';
import { jest } from '@jest/globals';
import pino from 'pino';

const { env } = process;

beforeEach(() => {
  process.env = { ...env };
});

afterEach(() => {
  process.env = env;
});

describe('Error Handler', () => {
  test('Generated error should include exception and stacktrace in dev environment', () => {
    process.env.APP_ENV = 'dev';
    const error = new CAPPError(
      {
        title: 'Original Error',
        detail: 'Foo Error Message',
        status: 500,
      },
      { cause: new Error('Original Error Cause') },
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
      title: 'Original Error',
      status: 500,
      detail: 'Foo Error Message',
      stack: expect.stringMatching(/Error: Original Error/),
    });
  });
  test('Generated error should not include exception and stacktrace in production environment', () => {
    process.env.APP_ENV = 'prod';
    const error = new CAPPError(
      {
        title: 'Original Error',
        detail: 'Foo Error Message',
        status: 500,
      },
      { cause: new Error('Original Error Cause') },
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
      title: 'Original Error',
      status: 500,
      detail: 'Foo Error Message',
    });
  });
});
