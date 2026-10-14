import * as z from "zod";

export class ApiError {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.fields = fields;
  }
}

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.optional(z.record(z.string(), z.string())),
});
