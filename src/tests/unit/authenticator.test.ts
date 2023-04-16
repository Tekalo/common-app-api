import {
  verifyJwtOrCookie,
  verifyCookie,
} from '@App/middleware/authenticator.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { NextFunction, Request, Response } from 'express';
import { jest } from '@jest/globals';

type MockRequestWithParams = Request & {
  params: { id: string };
};

describe('Authenticator', () => {
  test('should throw error for no valid cookie', () => {
    const mockRequest = {
      session: {},
    } as Request;
    const mockNext: NextFunction = jest.fn();
    verifyCookie(mockRequest, {} as Response, mockNext);
    expect(mockNext).toBeCalledWith(
      new CAPPError({
        title: 'Cannot verify applicant request',
        detail: 'Applicant cannot be verified',
        status: 401,
      }),
    );
  });

  test('should throw error with no cookie or JWT', () => {
    const mockRequest = {
      session: {},
    } as Request;
    const mockNext: NextFunction = jest.fn();
    verifyJwtOrCookie(mockRequest, {} as Response, mockNext);
    expect(mockNext).toBeCalledWith(
      new CAPPError({
        title: 'Cannot verify applicant request',
        detail: 'Applicant cannot be verified',
        status: 401,
      }),
    );
  });

  test('should not throw error with valid cookie and no valid JWT', () => {
    const mockRequest = {
      body: {},
      session: { applicant: { id: 1 } },
      params: { id: '1' },
    } as MockRequestWithParams;
    const mockNext = jest.fn();
    verifyJwtOrCookie(mockRequest, {} as Response, mockNext);
    // we expect the request to go through to next() without passing an error
    expect(mockNext).toBeCalledWith();
  });
});
