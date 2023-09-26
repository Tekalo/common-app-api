import { z } from 'zod';

const UTMPayload = z.object({
  utm_source: z.string().max(200).nullish(),
  utm_medium: z.string().max(200).nullish(),
  utm_campaign: z.string().max(200).nullish(),
  utm_term: z.string().max(200).nullish(),
  utm_content: z.string().max(200).nullish(),
  utm_id: z.string().max(200).nullish(),
  utm_source_platform: z.string().max(200).nullish(),
  ga_client_id: z.string().max(200).nullish(),
  ga_session_id: z.string().max(200).nullish(),
});

export default UTMPayload;
