import { login, logout } from "./auth";
import { deploy } from "./deploy";
import { deployments, rollback } from "./deployments";
import { sites } from "./sites";
import { validate } from "./validate";

export const commands = {
  login,
  logout,
  sites,
  deployments,
  rollback,
  validate,
  deploy,
};
