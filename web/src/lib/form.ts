import { AnyFieldApi } from "@tanstack/solid-form";

export function isInvalid(field: AnyFieldApi) {
  return field.meta.isTouched && !field.meta.isValid;
}
