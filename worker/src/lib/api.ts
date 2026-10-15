import { createClient } from "@dockside/api-client";
import { env } from "./env";

const apiBaseUrl = `http://localhost:${env.API_PORT}`;
export const api = createClient(apiBaseUrl, { agentToken: env.AGENT_TOKEN });
