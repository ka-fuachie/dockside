import { createClient } from "@dockside/api-client";
import { env } from "./env";

export const api = createClient(env.API_URL, { agentToken: env.AGENT_TOKEN });
