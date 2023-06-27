import * as jose from 'jose';
import crypto from 'crypto';
import configLoader from '@App/services/configLoader.js';
import CAPPError from '@App/resources/shared/CAPPError.js';
import { BaseConfig } from '@App/resources/types/shared.js';

type TokenOptions = {
  auth0Id?: string;
  roles?: Array<string>;
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
  const emailKey = `${configLoader.loadConfig().auth0.express.audience}/email`;
  const rolesKey = `${configLoader.loadConfig().auth0.express.audience}/roles`;
  const token = await new jose.SignJWT({
    [emailKey]: userEmail || '',
    [rolesKey]: tokenOptions?.roles || [],
    'urn:example:claim': true,
  })
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
