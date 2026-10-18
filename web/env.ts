import "zod/compile";
import * as z from "zod";

export default {
  server: {
    API_URL: z.url(),
    SITES_BASE_URL: z.url(),
    WEB_SESSION_SECRET: z.string().min(32),
  },
};
