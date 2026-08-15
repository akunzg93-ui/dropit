export type SwCertificateInfo = {
  issuerRfc: string;
  issuerBusinessName: string;
  certificateNumber: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

type SwCertificateResponse = {
  status?: string;
  message?: string;
  messageDetail?: string;
  data?: {
    issuer_rfc?: string;
    issuer_business_name?: string;
    certificate_number?: string;
    valid_from?: string;
    valid_to?: string;
    is_active?: boolean;
  } | null;
};

async function getSwToken() {
  const baseUrl =
    process.env.SW_BASE_URL ||
    "https://services.test.sw.com.mx";

  const user = process.env.SW_USER;
  const password = process.env.SW_PASSWORD;

  if (!user || !password) {
    throw new Error("SW_CREDENTIALS_MISSING");
  }

  const response = await fetch(
    `${baseUrl}/v2/security/authenticate`,
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

  const data = await response.json();

  if (
    !response.ok ||
    data?.status !== "success" ||
    !data?.data?.token
  ) {
    throw new Error("SW_AUTH_ERROR");
  }

  return data.data.token as string;
}

export async function getSwCertificateByNumber(
  certificateNumber: string
): Promise<SwCertificateInfo> {
  const baseUrl =
    process.env.SW_BASE_URL ||
    "https://services.test.sw.com.mx";

  const token = await getSwToken();

  const response = await fetch(
    `${baseUrl}/certificates/${certificateNumber}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as SwCertificateResponse;

  if (
    !response.ok ||
    data.status !== "success" ||
    !data.data
  ) {
    console.error(
      "Error consultando certificado SW:",
      data
    );

    throw new Error(
      data.messageDetail ||
        data.message ||
        "SW_CERTIFICATE_QUERY_FAILED"
    );
  }

  return {
    issuerRfc: data.data.issuer_rfc || "",
    issuerBusinessName:
      data.data.issuer_business_name || "",
    certificateNumber:
      data.data.certificate_number || "",
    validFrom: data.data.valid_from || "",
    validTo: data.data.valid_to || "",
    isActive:
      data.data.is_active === true,
  };
}