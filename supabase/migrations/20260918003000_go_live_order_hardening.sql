-- ============================================================================
-- Dropit — Go Live Order Hardening
-- 2026-09-18
--
-- Baseline reproducible del flujo crítico de pedidos validado en QA y PROD.
--
-- Reglas principales:
--   - Crear pedido + consumir Coin + asociar candidatos es transaccional.
--   - Los establecimientos candidatos NO reservan capacidad.
--   - La capacidad se reserva cuando el cliente selecciona establecimiento.
--   - Rechazo/cancelación liberan la reserva correspondiente.
--   - RPCs SECURITY DEFINER tienen permisos explícitos.
-- ============================================================================


-- ============================================================================
-- 1. IDEMPOTENCIA DE CREACIÓN DE PEDIDOS
-- ============================================================================

ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS pedidos_vendedor_idempotency_key_unique
ON public.pedidos (vendedor_id, idempotency_key);


-- ============================================================================
-- 2. CREAR PEDIDO + CONSUMIR COIN ATÓMICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crear_pedido_con_coin(
  p_producto text,
  p_tipo_paquete text,
  p_email_comprador text,
  p_folio text,
  p_declaracion_legal boolean,
  p_establecimiento_ids bigint[],
  p_idempotency_key uuid
)
RETURNS public.pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email_vendedor text := auth.jwt() ->> 'email';
  v_pedido public.pedidos%ROWTYPE;
BEGIN
  -- Usuario autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Idempotencia obligatoria
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'idempotency_key es obligatorio';
  END IF;

  -- Validaciones mínimas del pedido
  IF p_tipo_paquete NOT IN ('small', 'medium') THEN
    RAISE EXCEPTION 'Tipo de paquete no válido';
  END IF;

  IF NULLIF(BTRIM(p_producto), '') IS NULL THEN
    RAISE EXCEPTION 'Producto es obligatorio';
  END IF;

  IF NULLIF(BTRIM(p_email_comprador), '') IS NULL THEN
    RAISE EXCEPTION 'Email del cliente es obligatorio';
  END IF;

  IF NULLIF(BTRIM(p_folio), '') IS NULL THEN
    RAISE EXCEPTION 'Folio es obligatorio';
  END IF;

  IF p_declaracion_legal IS NOT TRUE THEN
    RAISE EXCEPTION 'La declaración legal es obligatoria';
  END IF;

  IF COALESCE(cardinality(p_establecimiento_ids), 0) = 0 THEN
    RAISE EXCEPTION 'Debe seleccionarse al menos un establecimiento';
  END IF;

  /*
   * Serializa únicamente reintentos del mismo usuario +
   * idempotency_key. Esto evita dos ejecuciones simultáneas
   * consumiendo dos Coins.
   */
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  -- Si este intento ya fue procesado, devolver el pedido existente.
  SELECT *
  INTO v_pedido
  FROM public.pedidos
  WHERE vendedor_id = v_user_id
    AND idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    RETURN v_pedido;
  END IF;

  -- Crear pedido
  INSERT INTO public.pedidos (
    vendedor_id,
    email_vendedor,
    email_comprador,
    comprador_id,
    producto,
    tipo_paquete,
    estado,
    folio,
    declaracion_legal,
    idempotency_key
  )
  VALUES (
    v_user_id,
    v_email_vendedor,
    BTRIM(p_email_comprador),
    NULL,
    BTRIM(p_producto),
    p_tipo_paquete,
    'creado',
    BTRIM(p_folio),
    p_declaracion_legal,
    p_idempotency_key
  )
  RETURNING *
  INTO v_pedido;

  -- Consumir Coin FIFO.
  -- Esta RPC existente usa FOR UPDATE y registra:
  -- referencia = pedido:<id>
  PERFORM public.consume_coin_for_order(
    v_user_id,
    p_tipo_paquete::public.coin_tipo,
    v_pedido.id
  );

  /*
   * Asociar establecimientos candidatos.
   *
   * IMPORTANTE:
   * Los candidatos NO descuentan capacidad.
   * La reserva ocurre únicamente cuando el cliente selecciona
   * un establecimiento mediante confirmar_establecimiento_pedido().
   *
   * Cualquier fallo aquí revierte también pedido y Coin.
   */
  INSERT INTO public.pedido_establecimientos (
    pedido_id,
    establecimiento_id
  )
  SELECT
    v_pedido.id,
    establecimiento_id
  FROM (
    SELECT DISTINCT unnest(p_establecimiento_ids) AS establecimiento_id
  ) ids;

  RETURN v_pedido;
END;
$function$;


-- ============================================================================
-- 3. CLIENTE SELECCIONA ESTABLECIMIENTO + RESERVA CAPACIDAD
-- ============================================================================

CREATE OR REPLACE FUNCTION public.confirmar_establecimiento_pedido(
  p_pedido_id bigint,
  p_establecimiento_id bigint
)
RETURNS public.pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
  v_establecimiento public.establecimientos%ROWTYPE;
BEGIN
  SELECT *
  INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_pedido.estado <> 'creado' THEN
    RAISE EXCEPTION 'El pedido no está disponible para seleccionar establecimiento';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.pedido_establecimientos
    WHERE pedido_id = p_pedido_id
      AND establecimiento_id = p_establecimiento_id
  ) THEN
    RAISE EXCEPTION 'El establecimiento no es candidato para este pedido';
  END IF;

  SELECT *
  INTO v_establecimiento
  FROM public.establecimientos
  WHERE id = p_establecimiento_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Establecimiento no encontrado';
  END IF;

  IF v_establecimiento.activo IS NOT TRUE THEN
    RAISE EXCEPTION 'El establecimiento no está activo';
  END IF;

  IF v_pedido.tipo_paquete = 'small' THEN

    UPDATE public.establecimientos
    SET capacidad_small = capacidad_small - 1
    WHERE id = p_establecimiento_id
      AND capacidad_small > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay capacidad SMALL disponible';
    END IF;

  ELSIF v_pedido.tipo_paquete = 'medium' THEN

    UPDATE public.establecimientos
    SET capacidad_medium = capacidad_medium - 1
    WHERE id = p_establecimiento_id
      AND capacidad_medium > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No hay capacidad MEDIUM disponible';
    END IF;

  ELSE
    RAISE EXCEPTION 'Tipo de paquete no soportado';
  END IF;

  UPDATE public.pedidos
  SET
    estado = 'pendiente_aprobacion_establecimiento',
    establecimiento_nombre = v_establecimiento.nombre,
    establecimiento_uuid = v_establecimiento.uuid,
    establecimiento_notificado_at = now(),
    establecimiento_notificado = true
  WHERE id = p_pedido_id
  RETURNING *
  INTO v_pedido;

  RETURN v_pedido;
END;
$function$;


-- ============================================================================
-- 4. ESTABLECIMIENTO RECHAZA → LIBERAR CAPACIDAD
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rechazar_establecimiento_pedido(
  p_pedido_id bigint
)
RETURNS public.pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
  v_establecimiento_id bigint;
BEGIN
  SELECT *
  INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  -- Idempotencia básica
  IF v_pedido.estado <> 'pendiente_aprobacion_establecimiento' THEN
    RETURN v_pedido;
  END IF;

  IF v_pedido.establecimiento_uuid IS NULL THEN
    RAISE EXCEPTION 'El pedido no tiene establecimiento asignado';
  END IF;

  SELECT id
  INTO v_establecimiento_id
  FROM public.establecimientos
  WHERE uuid = v_pedido.establecimiento_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Establecimiento asignado no encontrado';
  END IF;

  IF v_pedido.tipo_paquete = 'small' THEN

    UPDATE public.establecimientos
    SET capacidad_small = capacidad_small + 1
    WHERE id = v_establecimiento_id;

  ELSIF v_pedido.tipo_paquete = 'medium' THEN

    UPDATE public.establecimientos
    SET capacidad_medium = capacidad_medium + 1
    WHERE id = v_establecimiento_id;

  ELSE
    RAISE EXCEPTION 'Tipo de paquete no soportado';
  END IF;

  UPDATE public.pedidos
  SET
    estado = 'creado',
    establecimiento_nombre = NULL,
    establecimiento_uuid = NULL,
    establecimiento_acepto = false,
    establecimiento_notificado = false,
    establecimiento_notificado_at = NULL,
    establecimiento_aceptado_at = NULL
  WHERE id = p_pedido_id
  RETURNING *
  INTO v_pedido;

  RETURN v_pedido;
END;
$function$;


-- ============================================================================
-- 5. CANCELACIÓN MANUAL DEL VENDEDOR
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_order_by_vendor(
  p_pedido_id bigint,
  p_vendedor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
  v_establecimiento_id bigint;
BEGIN
  SELECT *
  INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_pedido.vendedor_id IS DISTINCT FROM p_vendedor_id THEN
    RAISE EXCEPTION 'No tienes autorización para cancelar este pedido';
  END IF;

  IF v_pedido.estado NOT IN (
    'creado',
    'pendiente_aprobacion_establecimiento',
    'en_transito'
  ) THEN
    RAISE EXCEPTION 'El pedido no se puede cancelar en su estado actual';
  END IF;

  -- Solo existe reserva si ya hay establecimiento elegido
  IF v_pedido.establecimiento_uuid IS NOT NULL THEN

    SELECT id
    INTO v_establecimiento_id
    FROM public.establecimientos
    WHERE uuid = v_pedido.establecimiento_uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Establecimiento asignado no encontrado';
    END IF;

    IF v_pedido.tipo_paquete = 'small' THEN
      UPDATE public.establecimientos
      SET capacidad_small = capacidad_small + 1
      WHERE id = v_establecimiento_id;

    ELSIF v_pedido.tipo_paquete = 'medium' THEN
      UPDATE public.establecimientos
      SET capacidad_medium = capacidad_medium + 1
      WHERE id = v_establecimiento_id;

    ELSE
      RAISE EXCEPTION 'Tipo de paquete no soportado';
    END IF;

  END IF;

  PERFORM public.restore_coin_for_cancelation(p_pedido_id);

  UPDATE public.pedidos
  SET
    estado = 'cancelado',
    cancelacion_motivo = 'solicitud_cliente',
    cancelado_at = now()
  WHERE id = p_pedido_id;
END;
$function$;


-- ============================================================================
-- 6. CANCELACIÓN AUTOMÁTICA POR NO ENTREGA EN 24 HORAS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_order_automatic(
  p_pedido_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
  v_establecimiento_id bigint;
BEGIN
  SELECT *
  INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_pedido.estado <> 'en_transito' THEN
    RAISE EXCEPTION 'El pedido no está en tránsito';
  END IF;

  IF v_pedido.establecimiento_aceptado_at IS NULL THEN
    RAISE EXCEPTION 'El pedido no tiene fecha de aceptación';
  END IF;

  IF v_pedido.establecimiento_aceptado_at > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'El pedido todavía no ha vencido';
  END IF;

  IF v_pedido.establecimiento_uuid IS NULL THEN
    RAISE EXCEPTION 'El pedido no tiene establecimiento asignado';
  END IF;

  SELECT id
  INTO v_establecimiento_id
  FROM public.establecimientos
  WHERE uuid = v_pedido.establecimiento_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Establecimiento asignado no encontrado';
  END IF;

  IF v_pedido.tipo_paquete = 'small' THEN
    UPDATE public.establecimientos
    SET capacidad_small = capacidad_small + 1
    WHERE id = v_establecimiento_id;

  ELSIF v_pedido.tipo_paquete = 'medium' THEN
    UPDATE public.establecimientos
    SET capacidad_medium = capacidad_medium + 1
    WHERE id = v_establecimiento_id;

  ELSE
    RAISE EXCEPTION 'Tipo de paquete no soportado';
  END IF;

  PERFORM public.restore_coin_for_cancelation(p_pedido_id);

  UPDATE public.pedidos
  SET
    estado = 'cancelado',
    cancelacion_motivo = 'vendedor_no_entrego_24h',
    cancelado_at = now()
  WHERE id = p_pedido_id;
END;
$function$;


-- ============================================================================
-- 7. PERMISOS EXPLÍCITOS
-- ============================================================================

-- Ninguna de estas RPC debe quedar accesible por PUBLIC por defecto.
REVOKE ALL ON FUNCTION public.crear_pedido_con_coin(
  text, text, text, text, boolean, bigint[], uuid
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.confirmar_establecimiento_pedido(
  bigint, bigint
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.rechazar_establecimiento_pedido(
  bigint
) FROM PUBLIC;


-- Crear pedido sí es invocado directamente por el vendedor autenticado.
GRANT EXECUTE ON FUNCTION public.crear_pedido_con_coin(
  text, text, text, text, boolean, bigint[], uuid
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.crear_pedido_con_coin(
  text, text, text, text, boolean, bigint[], uuid
) TO service_role;


-- Confirmación y rechazo pasan por backend/service role.
REVOKE EXECUTE ON FUNCTION public.confirmar_establecimiento_pedido(
  bigint, bigint
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.rechazar_establecimiento_pedido(
  bigint
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.confirmar_establecimiento_pedido(
  bigint, bigint
) TO service_role;

GRANT EXECUTE ON FUNCTION public.rechazar_establecimiento_pedido(
  bigint
) TO service_role;