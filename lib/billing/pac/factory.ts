import { PacProvider } from "./provider";
import { SwPacProvider } from "./sw";

export function getPacProvider(): PacProvider {
  const provider =
    process.env.BILLING_PAC_PROVIDER || "sw";

  const environment =
    process.env.BILLING_PAC_ENV;

  if (
    environment !== "test" &&
    environment !== "production"
  ) {
    throw new Error(
      "BILLING_PAC_ENV_NOT_CONFIGURED"
    );
  }

  switch (provider) {
    case "sw":
      return new SwPacProvider(environment);

    default:
      throw new Error(
        `PAC_PROVIDER_NOT_SUPPORTED:${provider}`
      );
  }
}