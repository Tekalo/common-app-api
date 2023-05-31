import Authenticator from '@App/middleware/authenticator.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { NextFunction, Request, Response } from 'express';
import { jest } from '@jest/globals';
import prisma from '@App/resources/client.js';
import configLoader from '@App/services/configLoader.js';
import { Prisma } from '@prisma/client';
import { createMockContext } from '../util/context.js';

type MockRequestWithParams = Request & {
  params: { id: string };
};

const authenticator = new Authenticator(
  prisma,
  configLoader.loadConfig().auth0.express,
);

describe('Authenticator', () => {
  test('validateCookie should throw error for no valid cookie', () => {
    const mockRequest = {
      session: {},
    } as Request;
    const mockNext: NextFunction = jest.fn();
    Authenticator.validateCookie(mockRequest, {} as Response, mockNext);
    expect(mockNext).toBeCalledWith(
      new CAPPError({
        title: 'Cannot authenticate request',
        detail: 'Applicant cannot be authenticated',
        status: 401,
      }),
    );
  });
});

test('should throw error with no cookie or JWT', async () => {
  const mockRequest = {
    session: {},
  } as Request;
  const mockNext: NextFunction = jest.fn();
  await authenticator.verifyJwtOrCookie(mockRequest, {} as Response, mockNext);
  expect(mockNext).toBeCalledWith(
    new CAPPError({
      title: 'Cannot authenticate request',
      detail: 'Applicant cannot be authenticated',
      status: 401,
    }),
  );
});

test('verifyJwtOrCookie should not throw error with valid cookie and no valid JWT', async () => {
  const mockRequest = {
    body: {},
    session: { applicant: { id: 1 } },
  } as MockRequestWithParams;
  const mockNext: NextFunction = jest.fn();
  await authenticator.verifyJwtOrCookie(mockRequest, {} as Response, mockNext);
  // we expect the request to go through to next() without passing an error
  expect(mockNext).toBeCalledWith();
});

test('validateJwt should throw error if we cannot find an applicant with a given email in the database', async () => {
  const mockRequest = {
    body: {},
    auth: {
      header: {},
      token: '',
      payload: { 'auth0.capp.com/email': 'fredsburgers@gmail.com' },
    },
  } as Request;

  const mockCtx = createMockContext();
  mockCtx.prisma.applicant.findFirstOrThrow.mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError('ERROR', {
      code: 'P2025',
      clientVersion: '1.0',
    }),
  );
  const authenticatorWithMockPrisma = new Authenticator(
    mockCtx.prisma,
    configLoader.loadConfig().auth0.express,
  );
  const mockNext: NextFunction = jest.fn();

  await authenticatorWithMockPrisma.validateJwt(
    mockRequest,
    {} as Response,
    mockNext,
  );
  expect(mockNext).toBeCalledWith(
    new CAPPError({
      title: 'Not Found',
      detail: 'Applicant cannot be found',
      status: 404,
    }),
  );
});

test('validateJwtOfUnregisteredUser should not throw error if we cannot find an applicant with a given email in the database', async () => {
  const mockRequest = {
    body: {},
    auth: {
      header: {},
      token: '',
      payload: { 'auth0.capp.com/email': 'fredsburgers@gmail.com' },
    },
  } as Request;
  const mockCtx = createMockContext();
  mockCtx.prisma.applicant.findFirstOrThrow.mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError('ERROR', {
      code: 'P2025',
      clientVersion: '1.0',
    }),
  );
  const authenticatorWithMockPrisma = new Authenticator(
    mockCtx.prisma,
    configLoader.loadConfig().auth0.express,
  );
  const mockNext: NextFunction = jest.fn();

  await authenticatorWithMockPrisma.validateJwtOfUnregisteredUser(
    mockRequest,
    {} as Response,
    mockNext,
  );
  expect(mockNext).toBeCalledWith();
});
