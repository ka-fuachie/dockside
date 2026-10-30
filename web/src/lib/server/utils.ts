import { getRequestEvent, respond } from "@solidjs/web";
import "zod/compile";
import * as z from "zod";
import { formatError } from "./error";

export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): asserts data is z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    throw respond(
      formatError(
        "BAD_REQUEST",
        "validation failed",
        Object.fromEntries(
          Object.entries(flattened.fieldErrors).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value,
          ]),
        ),
      ),
      { status: 400 },
    );
  }
}

export function event() {
  const ev = getRequestEvent();
  if (ev == null) throw new Error("Missing request event");
  return ev;
}

export const PageableSchema = z
  .object({
    page: z.number().optional(),
    size: z.number().optional(),
  })
  .optional();
