import * as z from "zod";

export class ApiError {
  status: number;
  code: string;
  message: string;
  fields: Record<string, string> | null;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string> | null,
  ) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.fields = fields ?? null;
  }
}

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.string()).nullable().optional(),
});
