"use client";

import Image from "next/image";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        {/* LOGO */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <Image
            src="/brand/logo-dropit.png"
            alt="Dropit"
            width={120}
            height={120}
            priority
          />

          <h1 className="text-3xl font-bold text-slate-800">
            Términos y Condiciones de Uso
          </h1>

          <p className="text-sm text-slate-500">
            Última actualización: Julio 2026
          </p>
        </div>

        {/* CONTENIDO */}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            1. Introducción
          </h2>

          <p className="text-slate-600">
            Bienvenido a Dropit. Estos Términos y Condiciones regulan el acceso
            y uso de la plataforma Dropit, que conecta a vendedores, clientes y
            establecimientos para facilitar la entrega, resguardo temporal,
            recolección y, cuando corresponda, devolución de paquetes.
          </p>

          <p className="text-slate-600">
            Al registrarse, crear un pedido, seleccionar un establecimiento,
            recibir, resguardar o recoger un paquete mediante la plataforma, el
            usuario manifiesta que conoce y acepta estos términos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            2. Modelo de funcionamiento
          </h2>

          <p className="text-slate-600">
            Dropit es una plataforma tecnológica que facilita la coordinación
            logística entre los participantes del servicio.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>Vendedores que registran y entregan paquetes.</li>

            <li>
              Clientes que seleccionan un punto de entrega y recogen sus
              paquetes.
            </li>

            <li>
              Establecimientos afiliados que actúan como puntos de recepción,
              resguardo temporal, entrega y devolución.
            </li>
          </ul>

          <p className="text-slate-600">
            Dropit no transporta físicamente los paquetes ni actúa como empresa
            de mensajería, paquetería, almacenamiento permanente o compraventa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            3. Responsabilidad del vendedor
          </h2>

          <p className="text-slate-600">
            El vendedor es responsable del contenido, procedencia, descripción,
            valor declarado, embalaje y legalidad del paquete registrado.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>El paquete debe estar correctamente cerrado y sellado.</li>

            <li>
              La información proporcionada en la plataforma debe ser completa y
              verídica.
            </li>

            <li>No deben enviarse artículos prohibidos o restringidos.</li>

            <li>
              El tamaño seleccionado debe corresponder razonablemente con las
              dimensiones del paquete.
            </li>

            <li>
              El vendedor debe conservar y proteger los códigos de entrega o
              devolución asociados con el pedido.
            </li>
          </ul>

          <p className="text-slate-600">
            Una vez que el establecimiento acepte el pedido, el vendedor contará
            con un plazo máximo de 24 horas para entregar físicamente el paquete
            en el punto seleccionado.
          </p>

          <p className="text-slate-600">
            Si el paquete no es entregado dentro de ese plazo, el pedido podrá
            cancelarse automáticamente conforme a las reglas operativas de
            Dropit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            4. Responsabilidad del cliente
          </h2>

          <p className="text-slate-600">
            El cliente es responsable de proporcionar información correcta,
            seleccionar el establecimiento disponible y recoger el paquete
            dentro del plazo indicado en la plataforma.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              Debe presentar el código, QR o mecanismo de validación
              correspondiente.
            </li>

            <li>
              Debe revisar el estado del pedido y las notificaciones enviadas
              por Dropit.
            </li>

            <li>
              No debe compartir sus códigos de recolección con personas no
              autorizadas.
            </li>

            <li>
              Es responsable de recoger el paquete dentro del periodo de
              resguardo temporal.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            5. Responsabilidad del establecimiento
          </h2>

          <p className="text-slate-600">
            Los establecimientos afiliados actúan únicamente como puntos de
            recepción, resguardo temporal, entrega y devolución de paquetes
            registrados en Dropit.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              No son responsables de verificar el contenido interno del
              paquete.
            </li>

            <li>
              No son responsables de la legalidad, procedencia o autenticidad de
              los artículos enviados.
            </li>

            <li>
              Pueden rechazar paquetes sospechosos, dañados, abiertos, mal
              embalados o que no correspondan con la información registrada.
            </li>

            <li>
              Deben validar los códigos correspondientes antes de recibir o
              entregar un paquete.
            </li>

            <li>
              Deben mantener un cuidado razonable del paquete únicamente durante
              los periodos de custodia establecidos.
            </li>
          </ul>

          <p className="text-slate-600">
            La participación del establecimiento no implica que sea vendedor,
            comprador, transportista, asegurador ni propietario de los artículos
            resguardados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            6. Bienes prohibidos
          </h2>

          <p className="text-slate-600">
            Está prohibido utilizar Dropit para enviar, recibir o resguardar:
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>Drogas, narcóticos o sustancias ilegales.</li>

            <li>Armas, municiones o accesorios restringidos.</li>

            <li>Explosivos, materiales inflamables o sustancias peligrosas.</li>

            <li>Dinero en efectivo, valores o documentos negociables.</li>

            <li>Animales vivos o restos biológicos.</li>

            <li>Artículos robados, falsificados o de procedencia ilícita.</li>

            <li>
              Productos cuyo transporte, posesión o comercialización esté
              prohibido por la legislación aplicable.
            </li>
          </ul>

          <p className="text-slate-600">
            Dropit y los establecimientos podrán rechazar, cancelar o reportar
            pedidos cuando existan indicios razonables de que contienen bienes
            prohibidos, sin perjuicio de las acciones que procedan conforme a la
            legislación aplicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            7. Entrega y recepción en el establecimiento
          </h2>

          <p className="text-slate-600">
            Después de que el cliente seleccione un punto de entrega, el
            establecimiento deberá revisar y aceptar el pedido antes de recibir
            físicamente el paquete.
          </p>

          <p className="text-slate-600">
            Una vez aceptado, el vendedor tendrá hasta 24 horas para llevar el
            paquete al establecimiento y validar la entrega mediante el código
            correspondiente.
          </p>

          <p className="text-slate-600">
            El periodo de recolección del cliente comenzará cuando el
            establecimiento confirme en la plataforma que recibió físicamente
            el paquete.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            8. Plazo de recolección del cliente
          </h2>

          <p className="text-slate-600">
            Una vez que el establecimiento confirme la recepción, el cliente
            contará con un plazo máximo de 48 horas para recoger el paquete.
          </p>

          <p className="text-slate-600">
            La plataforma mostrará el tiempo restante de manera informativa. El
            plazo se calcula a partir de la fecha y hora de recepción registradas
            en el sistema.
          </p>

          <p className="text-slate-600">
            Si el cliente no recoge el paquete dentro de las 48 horas, Dropit
            podrá iniciar automáticamente el proceso de devolución al vendedor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            9. Devolución de paquetes no recogidos
          </h2>

          <p className="text-slate-600">
            Cuando el cliente no recoja el paquete dentro del plazo establecido,
            el pedido podrá cambiar al estado de devolución pendiente.
          </p>

          <p className="text-slate-600">
            A partir del inicio de la devolución, el vendedor contará con un
            plazo máximo adicional de 48 horas para recoger el paquete en el
            mismo establecimiento.
          </p>

          <p className="text-slate-600">
            El vendedor deberá presentar el código o mecanismo de validación
            correspondiente para completar la devolución.
          </p>

          <p className="text-slate-600">
            La devolución se considerará completada cuando el establecimiento
            valide la entrega del paquete al vendedor mediante la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            10. Custodia vencida
          </h2>

          <p className="text-slate-600">
            Si el vendedor no recoge el paquete dentro de las 48 horas
            posteriores al inicio de la devolución, el pedido podrá cambiar al
            estado de custodia vencida.
          </p>

          <p className="text-slate-600">
            Una vez vencido este plazo, el establecimiento dejará de estar
            obligado a continuar con el resguardo ordinario del paquete bajo las
            condiciones del servicio Dropit.
          </p>

          <p className="text-slate-600">
            El vendedor deberá comunicarse con Dropit y, cuando corresponda, con
            el establecimiento para conocer la situación del paquete y coordinar
            las acciones procedentes.
          </p>

          <p className="text-slate-600">
            El vencimiento de la custodia no transfiere la propiedad del paquete
            al establecimiento ni autoriza automáticamente su venta, uso,
            destrucción o disposición fuera de lo permitido por la legislación
            aplicable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            11. Códigos y validaciones
          </h2>

          <p className="text-slate-600">
            Los códigos, folios y códigos QR generados por Dropit funcionan como
            mecanismos de validación operativa para la recepción y entrega de
            paquetes.
          </p>

          <p className="text-slate-600">
            Cada usuario es responsable de proteger sus códigos y evitar
            compartirlos con personas no autorizadas. Dropit podrá solicitar
            información adicional cuando existan inconsistencias o cuando sea
            necesario aplicar un procedimiento de contingencia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            12. Notificaciones y actualización de estados
          </h2>

          <p className="text-slate-600">
            Dropit podrá enviar notificaciones por correo electrónico o mostrar
            avisos dentro de la plataforma para informar sobre cambios de
            estado, plazos, cancelaciones, recepción, recolección o devolución.
          </p>

          <p className="text-slate-600">
            Los cambios automáticos de estado pueden ejecutarse mediante
            procesos periódicos, por lo que puede existir un breve intervalo
            entre el vencimiento visible de un plazo y la actualización
            definitiva del pedido.
          </p>

          <p className="text-slate-600">
            Los usuarios son responsables de mantener actualizada su información
            de contacto y consultar el seguimiento del pedido.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            13. Cancelaciones
          </h2>

          <p className="text-slate-600">
            Los pedidos podrán ser cancelados en los casos permitidos por el
            flujo operativo de Dropit, incluyendo la falta de entrega del paquete
            dentro del plazo correspondiente.
          </p>

          <p className="text-slate-600">
            Las consecuencias de la cancelación, incluyendo posibles
            restituciones de créditos o Coins, se sujetarán al estado del pedido
            y a las reglas vigentes mostradas en la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            14. Limitación de responsabilidad
          </h2>

          <p className="text-slate-600">
            Dropit actúa como intermediario tecnológico y no es responsable de
            los acuerdos de compraventa celebrados entre vendedores y clientes,
            ni de la calidad, autenticidad, funcionamiento o legalidad de los
            productos comercializados.
          </p>

          <p className="text-slate-600">
            Dropit no será responsable por daños causados por embalaje
            inadecuado, información falsa, artículos prohibidos, códigos
            compartidos indebidamente, incumplimientos de los usuarios o hechos
            fuera del control razonable de la plataforma.
          </p>

          <p className="text-slate-600">
            Nada de lo establecido en estos términos deberá interpretarse como
            una renuncia a derechos que, conforme a la legislación aplicable,
            sean irrenunciables.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            15. Modificaciones
          </h2>

          <p className="text-slate-600">
            Dropit podrá actualizar estos Términos y Condiciones para reflejar
            cambios operativos, tecnológicos o legales.
          </p>

          <p className="text-slate-600">
            La fecha de la última actualización se mostrará al inicio del
            documento. Cuando corresponda, los cambios relevantes podrán
            comunicarse mediante la plataforma o por correo electrónico.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            16. Contacto
          </h2>

          <p className="text-slate-600">
            Para consultas, aclaraciones o reportes relacionados con estos
            términos puede contactarnos en:
          </p>

          <p className="font-medium text-slate-700">
            soporte@dropit.com
          </p>
        </section>
      </div>
    </div>
  );
}