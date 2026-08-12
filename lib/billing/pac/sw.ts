import {
  PacCfdiValidationResult,
  PacProvider,
} from "./provider";

type SwEnvironment = "test" | "production";

type SwAuthResponse = {
  status?: string;
  message?: string;
  messageDetail?: string;
  data?: {
    token?: string;
    expires_in?: number;
  } | null;
};

export class SwPacProvider implements PacProvider {
  private baseUrl: string;

  constructor(
    private environment: SwEnvironment = "test"
  ) {
    this.baseUrl =
      environment === "production"
        ? "https://services.sw.com.mx"
        : "https://services.test.sw.com.mx";
  }

  private async getToken() {
    const user = process.env.SW_USER;
    const password = process.env.SW_PASSWORD;

    if (!user || !password) {
      throw new Error("SW_CREDENTIALS_MISSING");
    }

    const response = await fetch(
      `${this.baseUrl}/v2/security/authenticate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          password,
        }),
        cache: "no-store",
      }
    );

    const data =
      (await response.json()) as SwAuthResponse;

    if (
      !response.ok ||
      data.status !== "success" ||
      !data.data?.token
    ) {
      console.error(
        "Error autenticando con SW:",
        data
      );

      throw new Error("SW_AUTH_ERROR");
    }

    return data.data.token;
  }

  async validateCfdi(
    xml: string
  ): Promise<PacCfdiValidationResult> {
    const token = await this.getToken();

    const formData = new FormData();

    formData.append(
      "xml",
      new Blob([xml], {
        type: "application/xml",
      }),
      "cfdi.xml"
    );

    const response = await fetch(
      `${this.baseUrl}/validate/cfdi`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      }
    );

    let data: any;

    try {
      data = await response.json();
    } catch {
      throw new Error("SW_INVALID_RESPONSE");
    }

    if (!response.ok) {
      console.error(
        "Error validando CFDI con SW:",
        data
      );

      return {
        valid: false,
        status: "error",
        raw: data,
        errors: [
          data?.message ||
            data?.messageDetail ||
            "SW rechazó la validación del CFDI",
        ],
      };
    }

    /*
      Todavía NO inferimos aquí cuál campo exacto
      representa "vigente".

      Primero guardaremos y veremos la respuesta
      real del sandbox de SW para mapearla
      correctamente sin asumir su estructura.
    */

    return {
      valid: true,
      status: data?.status,
      raw: data,
      errors: [],
    };
  }
}