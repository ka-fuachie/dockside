import { auth } from "./auth";
import { deploy } from "./deploy";
import { deployments, rollback } from "./deployments";
import { sites } from "./sites";
import { validate } from "./validate";

export const commands = {
  auth,
  sites,
  deployments,
  rollback,
  validate,
  deploy,
};
