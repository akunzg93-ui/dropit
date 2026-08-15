import {
  PacCfdiValidationResult,
  PacProvider,
  PacPaymentData,
} from "./provider";

import type {
  CfdiIssuePayload,
  IssuedInvoice,
} from "../invoice";

import {
  mapCfdiToSwJson,
  type SwPaymentData,
} from "./swMapper";

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

type SwIssueResponse = {
  status?: string;

  message?: string;
  messageDetail?: string;

  data?: {
    uuid?: string;
    fechaTimbrado?: string;
    cfdi?: string;

    cadenaOriginalSAT?: string;
    noCertificadoSAT?: string;
    noCertificadoCFDI?: string;
    selloSAT?: string;
    selloCFDI?: string;

    pdf?: string;
  } | null;
};

export class SwPacProvider
  implements PacProvider
{
  private baseUrl: string;

  constructor(
    private environment: SwEnvironment = "test"
  ) {
    this.baseUrl =
      environment === "production"
        ? "https://services.sw.com.mx"
        : "https://services.test.sw.com.mx";
  }

  // ========================================================
  // AUTENTICACIÓN
  // ========================================================

  private async getToken(): Promise<string> {
    const user =
      process.env.SW_USER;

    const password =
      process.env.SW_PASSWORD;

    if (!user || !password) {
      throw new Error(
        "SW_CREDENTIALS_MISSING"
      );
    }

    const response = await fetch(
      `${this.baseUrl}/v2/security/authenticate`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          user,
          password,
        }),

        cache: "no-store",
      }
    );

    let data: SwAuthResponse;

    try {
      data =
        (await response.json()) as SwAuthResponse;
    } catch {
      throw new Error(
        "SW_AUTH_INVALID_RESPONSE"
      );
    }

    if (
      !response.ok ||
      data.status !== "success" ||
      !data.data?.token
    ) {
      console.error(
        "Error autenticando con SW:",
        data
      );

      throw new Error(
        data.messageDetail ||
          data.message ||
          "SW_AUTH_ERROR"
      );
    }

    return data.data.token;
  }

  // ========================================================
  // VALIDACIÓN DE CFDI EXISTENTE
  // ========================================================

  async validateCfdi(
    xml: string
  ): Promise<PacCfdiValidationResult> {
    const token =
      await this.getToken();

    const formData =
      new FormData();

    formData.append(
      "xml",
      new Blob(
        [xml],
        {
          type: "application/xml",
        }
      ),
      "cfdi.xml"
    );

    const response =
      await fetch(
        `${this.baseUrl}/validate/cfdi`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,

          cache: "no-store",
        }
      );

    let data: any;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        "SW_INVALID_RESPONSE"
      );
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
      Seguimos sin interpretar todavía
      semánticamente el estado fiscal
      devuelto por /validate/cfdi.

      Solo confirmamos que SW aceptó
      y procesó la solicitud.
    */
    return {
      valid: true,

      status:
        data?.status,

      raw: data,

      errors: [],
    };
  }

  // ========================================================
  // EMISIÓN / TIMBRADO
  // ========================================================

  async issueInvoice(
  payload: CfdiIssuePayload,
  payment: PacPaymentData
): Promise<IssuedInvoice> {
    const token =
      await this.getToken();

    // ------------------------------------------------------
    // Forma y método de pago
    // ------------------------------------------------------
    //
    // Temporalmente los recibimos de configuración.
    // Después el servicio de facturación los obtendrá
    // desde pagos → coin_lotes → coin_movimientos.
    //
    // FormaPago debe venir de la compra real.
    // MetodoPago para este flujo será PUE.
    // ------------------------------------------------------

    const swPayload = mapCfdiToSwJson(
  payload,
  {
    formaPago: payment.formaPago,
    metodoPago: payment.metodoPago,
  }
);

console.log(
  "SW ISSUE PAYLOAD:",
  JSON.stringify(swPayload, null, 2)
);

    // ------------------------------------------------------
    // Endpoint
    // ------------------------------------------------------
    //
    // SW actualmente muestra distintas versiones
    // del path en documentación oficial.
    // Lo hacemos configurable para evitar acoplar
    // Dropit al número del path.
    // ------------------------------------------------------

    const issuePath =
      process.env
        .SW_ISSUE_JSON_PATH ||
      "/v3/cfdi33/issue/json/v4";

    const response =
      await fetch(
        `${this.baseUrl}${issuePath}`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/jsontoxml",
          },

          body:
            JSON.stringify(
              swPayload
            ),

          cache: "no-store",
        }
      );

    let data: SwIssueResponse;

    try {
      data =
        (await response.json()) as SwIssueResponse;
    } catch {
      throw new Error(
        "SW_ISSUE_INVALID_RESPONSE"
      );
    }

    // ------------------------------------------------------
    // Error SW
    // ------------------------------------------------------

    if (
      !response.ok ||
      data.status !== "success" ||
      !data.data
    ) {
      console.error(
        "Error timbrando CFDI con SW:",
        data
      );

      throw new Error(
        data.messageDetail ||
          data.message ||
          "SW_ISSUE_ERROR"
      );
    }

    // ------------------------------------------------------
    // Validar campos mínimos de respuesta
    // ------------------------------------------------------

    const uuid =
      data.data.uuid;

    const xml =
      data.data.cfdi;

    if (!uuid || !xml) {
      console.error(
        "Respuesta incompleta de SW:",
        data
      );

      throw new Error(
        "SW_ISSUE_RESPONSE_INCOMPLETE"
      );
    }

    // ------------------------------------------------------
    // Respuesta normalizada Dropit
    // ------------------------------------------------------

    return {
      uuid:
        uuid.toUpperCase(),

      xml,

      pdf:
        data.data.pdf,

      pacReference:
        uuid,

      raw: data,
    };
  }
}