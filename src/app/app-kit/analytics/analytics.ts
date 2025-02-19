import posthog from "posthog-js";
import { logger } from "../supabase/utils/logger";


if (typeof window !== 'undefined') {
posthog.init("phc_UwiyXYPQoTaBeQtuLsW5Qlw9Oa2gunkpVi6f6eXzYP9", {
  api_host: "https://us.posthog.com",
});
}

export const capture = (name: string, meta?: Record<string, any>) => {
  logger("Analytics capture:", name, meta);
  const res = posthog.capture(name, {
    ...meta,
  });
};

export const identify = (
  id: string,
  email?: string,
  meta?: Record<string, any>
) => {
  logger("Analytics identify:", id);
  posthog.identify(
    id
    // { email: "max@hedgehogmail.com", name: "Max Hedgehog" }, // $set, optional
  );
};

export const identityReset = () => {
  posthog.reset();
};
