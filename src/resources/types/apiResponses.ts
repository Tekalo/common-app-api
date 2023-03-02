export type Problem = {
  title?: string; // HTTP error name e.g. "Unauthorized"
  status?: number; // HTTP status code
  detail?: string; // The detailed error message
  type?: string;
  instance?: string;
};
