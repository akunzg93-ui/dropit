"use client";

import Image from "next/image";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-10 space-y-8">

        {/* LOGO */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Image
            src="/brand/logo-dropit.png"
            alt="Dropit"
            width={120}
            height={120}
          />

          <h1 className="text-3xl font-bold text-slate-800">
            Aviso de Privacidad
          </h1>

          <p className="text-sm text-slate-500">
            Última actualización: Mayo 2026
          </p>
        </div>

        {/* CONTENIDO */}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            1. Información que recopilamos
          </h2>

          <p className="text-slate-600">
            Dropit puede recopilar información proporcionada por los usuarios
            al utilizar la plataforma.
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Nombre y correo electrónico.</li>
            <li>Información de acceso mediante Google OAuth.</li>
            <li>Direcciones y datos relacionados con pedidos.</li>
            <li>Información de establecimientos registrados.</li>
            <li>Datos de geolocalización relacionados con entregas.</li>
            <li>Información de pagos y transacciones.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            2. Uso de la información
          </h2>

          <p className="text-slate-600">
            La información recopilada se utiliza para:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Permitir el funcionamiento de la plataforma.</li>
            <li>Gestionar pedidos y entregas.</li>
            <li>Procesar pagos y transacciones.</li>
            <li>Enviar notificaciones y correos relacionados con pedidos.</li>
            <li>Mejorar la experiencia del usuario.</li>
            <li>Prevenir fraudes y mantener la seguridad del sistema.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            3. Servicios de terceros
          </h2>

          <p className="text-slate-600">
            Dropit puede utilizar servicios de terceros para operar la plataforma.
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Google OAuth para autenticación.</li>
            <li>Stripe para procesamiento de pagos.</li>
            <li>Supabase para autenticación y almacenamiento seguro.</li>
            <li>Servicios de mapas y geolocalización.</li>
          </ul>

          <p className="text-slate-600">
            Estos servicios pueden procesar información conforme a sus propias
            políticas de privacidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            4. Seguridad
          </h2>

          <p className="text-slate-600">
            Dropit implementa medidas razonables de seguridad para proteger la
            información de los usuarios. Sin embargo, ningún sistema puede
            garantizar seguridad absoluta en internet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            5. Conservación de datos
          </h2>

          <p className="text-slate-600">
            La información podrá conservarse mientras sea necesaria para la
            operación de la plataforma, cumplimiento legal, prevención de
            fraude o resolución de disputas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            6. Derechos del usuario
          </h2>

          <p className="text-slate-600">
            Los usuarios pueden solicitar acceso, actualización o eliminación
            de su información escribiendo al correo de contacto indicado en
            este aviso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            7. Cambios al aviso de privacidad
          </h2>

          <p className="text-slate-600">
            Dropit podrá actualizar este aviso de privacidad en cualquier
            momento. Las modificaciones serán publicadas dentro de la
            plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            8. Contacto
          </h2>

          <p className="text-slate-600">
            Para dudas relacionadas con privacidad o manejo de información,
            puedes contactarnos en:
          </p>

          <p className="text-slate-700 font-medium">
            akunzg93@gmail.com
          </p>
        </section>

      </div>
    </div>
  );
}