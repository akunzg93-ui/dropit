"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PERFIL_FISCAL_INICIAL = {
  nombre_perfil: "",
  rfc: "",
  razon_social: "",
  codigo_postal: "",
  regimen_fiscal: "",
  uso_cfdi: "",
  email: "",
  es_predeterminado: true,
};

export default function useBilling({
  pedidoSeleccionado,
  setPedidoSeleccionado,
}) {
  const [modalFacturaAbierto, setModalFacturaAbierto] =
    useState(false);

  const [pedidoFacturacion, setPedidoFacturacion] =
    useState(null);

  const [perfilesFiscales, setPerfilesFiscales] =
    useState([]);

  const [
    perfilFiscalSeleccionado,
    setPerfilFiscalSeleccionado,
  ] = useState("");

  const [cargandoPerfiles, setCargandoPerfiles] =
    useState(false);

  const [errorFacturacion, setErrorFacturacion] =
    useState("");

  const [modoPerfilFiscal, setModoPerfilFiscal] =
    useState("lista");

  const [solicitandoFactura, setSolicitandoFactura] =
    useState(false);

  const [solicitudFactura, setSolicitudFactura] =
    useState(null);

  const [
    cargandoEstadoFacturacion,
    setCargandoEstadoFacturacion,
  ] = useState(false);

  const [
    solicitudFacturaExitosa,
    setSolicitudFacturaExitosa,
  ] = useState(false);

  const [
    nuevoPerfilFiscal,
    setNuevoPerfilFiscal,
  ] = useState(PERFIL_FISCAL_INICIAL);

  const [
    guardandoPerfilFiscal,
    setGuardandoPerfilFiscal,
  ] = useState(false);

  async function consultarEstadoFacturacion(
    pedidoId
  ) {
    if (!pedidoId) {
      setSolicitudFactura(null);
      return;
    }

    try {
      setCargandoEstadoFacturacion(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setSolicitudFactura(null);
        return;
      }

      const res = await fetch(
        `/api/orders/billing/invoice-requests?pedido_id=${pedidoId}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        console.error(
          "Error consultando estado de facturación:",
          json
        );

        setSolicitudFactura(null);
        return;
      }

      setSolicitudFactura(
        json.invoice_request || null
      );
    } catch (error) {
      console.error(
        "Error consultando estado de facturación:",
        error
      );

      setSolicitudFactura(null);
    } finally {
      setCargandoEstadoFacturacion(false);
    }
  }

  useEffect(() => {
    if (!pedidoSeleccionado?.id) {
      setSolicitudFactura(null);
      return;
    }

    consultarEstadoFacturacion(
      pedidoSeleccionado.id
    );
  }, [pedidoSeleccionado?.id]);

  async function abrirSolicitudFactura() {
    try {
      setModoPerfilFiscal("lista");
      setCargandoPerfiles(true);
      setErrorFacturacion("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorFacturacion(
          "No se pudo validar tu sesión."
        );
        return;
      }

      if (
        session.user?.email &&
        !nuevoPerfilFiscal.email
      ) {
        setNuevoPerfilFiscal((actual) => ({
          ...actual,
          email: session.user.email,
        }));
      }

      const res = await fetch(
        "/api/orders/billing/fiscal-profiles",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setErrorFacturacion(
          json.error ||
            "No se pudieron cargar los datos fiscales."
        );
        return;
      }

      const perfiles = json.profiles || [];

      setPerfilesFiscales(perfiles);

      const predeterminado = perfiles.find(
        (perfil) =>
          perfil.es_predeterminado
      );

      if (predeterminado) {
        setPerfilFiscalSeleccionado(
          predeterminado.id
        );
      } else if (perfiles.length === 1) {
        setPerfilFiscalSeleccionado(
          perfiles[0].id
        );
      } else {
        setPerfilFiscalSeleccionado("");
      }

      setPedidoFacturacion(
        pedidoSeleccionado
      );

      // Cerramos primero el Drawer.
      setPedidoSeleccionado(null);

      // Vaul necesita liberar pointer-events
      // antes de mostrar el modal.
      setTimeout(() => {
        setModalFacturaAbierto(true);
      }, 350);
    } catch (error) {
      console.error(
        "Error cargando perfiles fiscales:",
        error
      );

      setErrorFacturacion(
        "Ocurrió un error al cargar tus datos fiscales."
      );
    } finally {
      setCargandoPerfiles(false);
    }
  }

  async function crearPerfilFiscal() {
    try {
      setGuardandoPerfilFiscal(true);
      setErrorFacturacion("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorFacturacion(
          "No se pudo validar tu sesión."
        );
        return;
      }

      const res = await fetch(
        "/api/orders/billing/fiscal-profiles",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(
            nuevoPerfilFiscal
          ),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setErrorFacturacion(
          json.error ||
            "No se pudo crear el perfil fiscal."
        );
        return;
      }

      const perfilCreado = json.profile;

      setPerfilesFiscales(
        (actuales) => [
          ...actuales,
          perfilCreado,
        ]
      );

      setPerfilFiscalSeleccionado(
        perfilCreado.id
      );

      setNuevoPerfilFiscal({
        ...PERFIL_FISCAL_INICIAL,
        es_predeterminado: false,
      });

      setModoPerfilFiscal("lista");
    } catch (error) {
      console.error(
        "Error creando perfil fiscal:",
        error
      );

      setErrorFacturacion(
        "Ocurrió un error al guardar tus datos fiscales."
      );
    } finally {
      setGuardandoPerfilFiscal(false);
    }
  }

  async function solicitarFactura() {
    if (!pedidoFacturacion?.id) {
      setErrorFacturacion(
        "No se pudo identificar el pedido."
      );
      return;
    }

    if (!perfilFiscalSeleccionado) {
      setErrorFacturacion(
        "Selecciona un perfil fiscal para continuar."
      );
      return;
    }

    try {
      setSolicitandoFactura(true);
      setErrorFacturacion("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorFacturacion(
          "No se pudo validar tu sesión."
        );
        return;
      }

      const res = await fetch(
        "/api/orders/billing/invoice-requests",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            pedido_id:
              pedidoFacturacion.id,
            fiscal_profile_id:
              perfilFiscalSeleccionado,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setErrorFacturacion(
          json.error ||
            "No se pudo crear la solicitud de factura."
        );
        return;
      }

      /*
        Reflejo inmediato en UI.
        Después el GET confirma el estado real
        desde invoice_requests.
      */
      setSolicitudFactura({
        id: json.invoice_request_id,
        estado: "solicitada",
      });

      setModalFacturaAbierto(false);
      setModoPerfilFiscal("lista");
      setErrorFacturacion("");

      setSolicitudFacturaExitosa(true);

      /*
        No limpiamos pedidoFacturacion todavía.
        Se necesita cuando el usuario pulse
        "Aceptar" en el popup de éxito.
      */
    } catch (error) {
      console.error(
        "Error solicitando factura:",
        error
      );

      setErrorFacturacion(
        "Ocurrió un error al enviar la solicitud de factura."
      );
    } finally {
      setSolicitandoFactura(false);
    }
  }

  function cerrarModalFactura() {
    setModalFacturaAbierto(false);
    setModoPerfilFiscal("lista");
    setErrorFacturacion("");
  }

  async function aceptarSolicitudExitosa() {
    setSolicitudFacturaExitosa(false);

    if (pedidoFacturacion?.id) {
      /*
        Consultamos explícitamente la BD
        antes de volver a mostrar el Drawer.
      */
      await consultarEstadoFacturacion(
        pedidoFacturacion.id
      );

      setPedidoSeleccionado(
        pedidoFacturacion
      );
    }

    setPedidoFacturacion(null);
  }

  return {
    modalFacturaAbierto,
    pedidoFacturacion,

    perfilesFiscales,
    perfilFiscalSeleccionado,
    setPerfilFiscalSeleccionado,

    cargandoPerfiles,
    errorFacturacion,

    modoPerfilFiscal,
    setModoPerfilFiscal,

    solicitandoFactura,

    solicitudFactura,
    cargandoEstadoFacturacion,
    solicitudFacturaExitosa,

    nuevoPerfilFiscal,
    setNuevoPerfilFiscal,

    guardandoPerfilFiscal,

    abrirSolicitudFactura,
    crearPerfilFiscal,
    solicitarFactura,
    cerrarModalFactura,
    aceptarSolicitudExitosa,
  };
}