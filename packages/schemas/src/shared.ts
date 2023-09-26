import { z } from 'zod';

const UTMPayload = z.object({
  utm_source: z.string().nullish(),
  utm_medium: z.string().nullish(),
  utm_campaign: z.string().nullish(),
  utm_term: z.string().nullish(),
  utm_content: z.string().nullish(),
  utm_id: z.string().nullish(),
  utm_source_platform: z.string().nullish(),
  ga_client_id: z.string().nullish(),
  ga_session_id: z.string().nullish(),
});

export default UTMPayload;
