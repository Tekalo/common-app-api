import crypto from 'crypto';
import * as jose from 'jose';
import { JWTPayload } from 'express-oauth2-jwt-bearer';
import configLoader from '@App/services/configLoader.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';
import { Claims } from '@App/resources/types/auth0.js';

export type TokenOptions = {
  auth0Id?: string;
  roles?: Array<string>;
  scope?: string;
};

const getToken = async (
  userEmail?: string,
  tokenOptions?: TokenOptions,
): Promise<string> => {
  const config: BaseConfig = configLoader.loadConfig();
  const { issuer, audience, tokenSigningAlg, secret } = config.auth0.express;
  if (!issuer || !audience || !tokenSigningAlg || !secret) {
    throw new CAPPError({
      title: 'Invalid Config',
      detail: 'Missing auth config values',
    });
  }

  const secretKey: crypto.KeyObject = crypto.createSecretKey(
    Buffer.from(secret),
  );
  const payload: JWTPayload = {};
  if (userEmail) {
    payload[Claims.email] = userEmail;
  }
  if (tokenOptions?.roles) {
    payload[Claims.roles] = tokenOptions?.roles;
  }
  if (tokenOptions?.scope) {
    payload.scope = tokenOptions.scope;
  }
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: tokenSigningAlg })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('1h')
    .setSubject(tokenOptions?.auth0Id || 'auth|12345')
    .sign(secretKey);

  return token;
};

const authHelper = {
  getToken,
};

export default authHelper;
