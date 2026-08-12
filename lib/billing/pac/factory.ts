import { PacProvider } from "./provider";
import { SwPacProvider } from "./sw";

export function getPacProvider(): PacProvider {
  const provider =
    process.env.BILLING_PAC_PROVIDER || "sw";

  switch (provider) {
    case "sw":
      return new SwPacProvider(
        process.env.NODE_ENV === "production"
          ? "production"
          : "test"
      );

    default:
      throw new Error(
        `PAC_PROVIDER_NOT_SUPPORTED:${provider}`
      );
  }
}