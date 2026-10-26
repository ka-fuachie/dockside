import { Submission } from "@solidjs/router";
import { isServerError } from "@/lib/server/error";

export function isInvalid(issues: Record<string, string> | null, name: string) {
  if (issues == null) return false;
  if (name in issues) return issues[name].trim() != "";
  return false;
}

export function useSubmissionsError<T, U>(submissions: Submission<T, U>[]) {
  const error = () => {
    const error = submissions.at(-1)?.error;
    if (error == null) return null;
    if (isServerError(error)) {
      return error;
    }
    return { code: "", message: (error as Error).message, fields: null };
  };
  const issues = () => error()?.fields ?? null;
  const errorMessage = () => {
    if (error()?.code == "BAD_CREDENTIALS") return "Invalid username or password";
    return error()?.message ?? null;
  };
  const clearErrors = () => {
    for (const s of submissions) s.clear();
  };

  return { error, issues, errorMessage, clearErrors };
}
