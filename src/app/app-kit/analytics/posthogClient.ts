import { PostHog } from "posthog-node";

const posthogClient = new PostHog(
  "phc_UwiyXYPQoTaBeQtuLsW5Qlw9Oa2gunkpVi6f6eXzYP9",

  { host: "https://app.posthog.com" }
);

export default posthogClient;
