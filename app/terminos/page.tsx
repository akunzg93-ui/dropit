"use client";

import Image from "next/image";

export default function TerminosPage() {
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
            Términos y Condiciones de Uso
          </h1>

          <p className="text-sm text-slate-500">
            Última actualización: Marzo 2026
          </p>
        </div>

        {/* CONTENIDO */}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            1. Introducción
          </h2>

          <p className="text-slate-600">
            Bienvenido a Dropit. Estos Términos y Condiciones regulan el uso de
            la plataforma Dropit, que conecta a vendedores, compradores y
            establecimientos para facilitar la entrega y recolección de paquetes.
          </p>

          <p className="text-slate-600">
            Al utilizar la plataforma, usted acepta estos términos en su totalidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            2. Modelo de funcionamiento
          </h2>

          <p className="text-slate-600">
            Dropit es una plataforma tecnológica que facilita la coordinación
            logística entre usuarios.
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Vendedores que envían paquetes.</li>
            <li>Compradores que recogen paquetes.</li>
            <li>Establecimientos que actúan como puntos de entrega.</li>
          </ul>

          <p className="text-slate-600">
            Dropit no transporta paquetes ni actúa como empresa de mensajería.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            3. Responsabilidad del vendedor
          </h2>

          <p className="text-slate-600">
            El vendedor es responsable del contenido del paquete y declara que
            los artículos enviados cumplen con la legislación aplicable.
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>El paquete debe estar correctamente sellado.</li>
            <li>La información proporcionada debe ser verídica.</li>
            <li>No deben enviarse artículos prohibidos.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            4. Responsabilidad del comprador
          </h2>

          <p className="text-slate-600">
            El comprador es responsable de recoger el paquete dentro del plazo
            establecido y presentar el código o QR correspondiente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            5. Responsabilidad del establecimiento
          </h2>

          <p className="text-slate-600">
            Los establecimientos afiliados a Dropit actúan únicamente como puntos
            de recepción y resguardo temporal de paquetes.
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>No son responsables del contenido del paquete.</li>
            <li>No son responsables de la legalidad de los artículos enviados.</li>
            <li>Pueden rechazar paquetes sospechosos o mal embalados.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            6. Bienes prohibidos
          </h2>

          <p className="text-slate-600">
            Está prohibido utilizar Dropit para enviar:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Drogas o sustancias ilegales</li>
            <li>Armas o municiones</li>
            <li>Explosivos</li>
            <li>Dinero en efectivo</li>
            <li>Animales</li>
            <li>Artículos robados o ilegales</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            7. Paquetes no recogidos
          </h2>

          <p className="text-slate-600">
            Los paquetes permanecerán en el establecimiento por un máximo de
            72 horas desde su recepción.
          </p>

          <p className="text-slate-600">
            Si el paquete no es recogido dentro de este plazo, Dropit podrá
            autorizar su devolución al remitente o su disposición final.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            8. Limitación de responsabilidad
          </h2>

          <p className="text-slate-600">
            Dropit actúa únicamente como intermediario tecnológico y no es
            responsable del contenido de los paquetes ni de acuerdos entre usuarios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            9. Contacto
          </h2>

          <p className="text-slate-600">
            Para consultas relacionadas con estos términos puede contactarnos en:
          </p>

          <p className="text-slate-700 font-medium">
            soporte@dropit.com
          </p>
        </section>

      </div>
    </div>
  );
}