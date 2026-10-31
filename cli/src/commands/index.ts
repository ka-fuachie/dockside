import { login, logout, whoami } from "./auth";
import { deploy } from "./deploy";
import { deployments, rollback } from "./deployments";
import { sites } from "./sites";
import { users } from "./users";
import { validate } from "./validate";

export const commands = {
  login,
  logout,
  whoami,
  sites,
  users,
  deployments,
  rollback,
  validate,
  deploy,
};
