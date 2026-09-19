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
            Última actualización: Septiembre 2026
          </p>
        </div>

        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            1. Identidad y aceptación
          </h2>

          <p className="text-slate-600">
            Estos Términos y Condiciones regulan el acceso y uso de la
            plataforma Dropit, operada por DROPIT GLOBAL, S.A. DE C.V., en
            adelante “Dropit”, con domicilio en Villa de los Duraznos #1,
            Paseos del Bosque, Naucalpan de Juárez, Estado de México,
            C.P. 53297.
          </p>

          <p className="text-slate-600">
            Dropit conecta a vendedores, clientes y establecimientos para
            facilitar la recepción, resguardo temporal, recolección y, cuando
            corresponda, devolución de paquetes.
          </p>

          <p className="text-slate-600">
            Al registrarse, utilizar la plataforma, crear o confirmar un
            pedido, seleccionar o aceptar un establecimiento, recibir,
            resguardar, entregar o recoger un paquete, o utilizar cualquier
            otra funcionalidad de Dropit, la persona usuaria manifiesta que
            conoce y acepta estos Términos y Condiciones.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            2. Modelo de funcionamiento
          </h2>

          <p className="text-slate-600">
            Dropit es una plataforma tecnológica que facilita la coordinación
            logística entre los participantes del servicio.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              Los vendedores registran pedidos y entregan los paquetes en los
              establecimientos seleccionados y aceptados.
            </li>

            <li>
              Los clientes seleccionan, entre las opciones disponibles para el
              pedido, el establecimiento en el cual desean recoger su paquete.
            </li>

            <li>
              Los establecimientos afiliados actúan como puntos de recepción,
              resguardo temporal, entrega y devolución.
            </li>
          </ul>

          <p className="text-slate-600">
            Dropit no transporta físicamente los paquetes ni actúa como empresa
            de mensajería, paquetería, almacenamiento permanente o como parte
            de la compraventa celebrada entre vendedor y cliente.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            3. Registro y cuentas
          </h2>

          <p className="text-slate-600">
            Las personas usuarias deberán proporcionar información completa,
            correcta y actualizada cuando ésta sea necesaria para utilizar las
            funcionalidades de Dropit.
          </p>

          <p className="text-slate-600">
            Cada persona usuaria es responsable de mantener la seguridad de los
            mecanismos utilizados para acceder a su cuenta y de las acciones
            realizadas desde ésta, salvo cuando resulte aplicable alguna
            excepción prevista por la legislación.
          </p>

          <p className="text-slate-600">
            Dropit podrá restringir o suspender el acceso a funcionalidades
            cuando existan indicios razonables de fraude, uso indebido,
            incumplimiento de estos Términos o riesgos para la seguridad de la
            plataforma o de sus participantes.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            4. Creación del pedido y selección del establecimiento
          </h2>

          <p className="text-slate-600">
            El vendedor deberá registrar la información solicitada para crear
            un pedido, incluyendo las características necesarias para operar el
            servicio y los establecimientos que podrán ser considerados por el
            cliente.
          </p>

          <p className="text-slate-600">
            El cliente podrá seleccionar un establecimiento entre las opciones
            disponibles para el pedido.
          </p>

          <p className="text-slate-600">
            La selección de un establecimiento estará sujeta a disponibilidad,
            capacidad y aceptación conforme al flujo operativo de Dropit.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            5. Responsabilidad del vendedor
          </h2>

          <p className="text-slate-600">
            El vendedor es responsable del contenido, procedencia, descripción,
            embalaje y legalidad del paquete registrado, así como de la
            información proporcionada respecto del pedido.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              El paquete deberá encontrarse correctamente cerrado y embalado.
            </li>

            <li>
              La información proporcionada deberá ser completa y verídica.
            </li>

            <li>
              No podrán enviarse artículos prohibidos o restringidos.
            </li>

            <li>
              El tamaño seleccionado deberá corresponder razonablemente con el
              paquete entregado.
            </li>

            <li>
              El vendedor deberá proteger los códigos y mecanismos de
              validación asociados con el pedido.
            </li>
          </ul>

          <p className="text-slate-600">
            Una vez que el establecimiento correspondiente acepte el pedido,
            el vendedor contará con el plazo indicado por Dropit para entregar
            físicamente el paquete. Actualmente dicho plazo es de hasta
            24 horas.
          </p>

          <p className="text-slate-600">
            Si el paquete no es entregado dentro del plazo correspondiente,
            Dropit podrá cancelar automáticamente el pedido conforme a las
            reglas operativas vigentes.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            6. Responsabilidad del cliente
          </h2>

          <p className="text-slate-600">
            El cliente deberá proporcionar la información necesaria para la
            operación, seleccionar el establecimiento correspondiente y recoger
            el paquete dentro del plazo indicado.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              Deberá utilizar el código o mecanismo de validación
              correspondiente para recoger el paquete.
            </li>

            <li>
              Deberá consultar el estado del pedido y las comunicaciones
              relacionadas con éste.
            </li>

            <li>
              No deberá compartir códigos de recolección con personas no
              autorizadas.
            </li>

            <li>
              Deberá recoger el paquete dentro del periodo de resguardo
              aplicable.
            </li>
          </ul>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            7. Responsabilidad del establecimiento
          </h2>

          <p className="text-slate-600">
            Los establecimientos afiliados participan como puntos de recepción,
            resguardo temporal, entrega y devolución de paquetes registrados
            mediante Dropit.
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>
              No están obligados a verificar el contenido interno del paquete.
            </li>

            <li>
              No determinan la legalidad, procedencia o autenticidad de los
              artículos comercializados entre vendedor y cliente.
            </li>

            <li>
              Podrán rechazar paquetes dañados, abiertos, mal embalados,
              sospechosos o que no correspondan razonablemente con la
              información registrada.
            </li>

            <li>
              Deberán utilizar los mecanismos de validación establecidos por
              Dropit antes de registrar la recepción o entrega de un paquete.
            </li>

            <li>
              Deberán mantener un cuidado razonable del paquete durante el
              periodo de custodia correspondiente.
            </li>
          </ul>

          <p className="text-slate-600">
            La participación del establecimiento no implica que éste sea
            vendedor, comprador, transportista, asegurador ni propietario de
            los artículos resguardados.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            8. Bienes prohibidos o restringidos
          </h2>

          <p className="text-slate-600">
            No podrá utilizarse Dropit para enviar, recibir o resguardar bienes
            cuya posesión, comercialización, entrega o resguardo resulte ilegal
            o represente un riesgo no compatible con el servicio, incluyendo:
          </p>

          <ul className="list-disc space-y-1 pl-6 text-slate-600">
            <li>Drogas, narcóticos o sustancias ilegales.</li>
            <li>Armas, municiones o artículos restringidos.</li>
            <li>
              Explosivos, materiales inflamables o sustancias peligrosas.
            </li>
            <li>Dinero en efectivo, valores o documentos negociables.</li>
            <li>Animales vivos o restos biológicos.</li>
            <li>
              Artículos robados, falsificados o de procedencia ilícita.
            </li>
            <li>
              Cualquier otro producto prohibido por la legislación aplicable o
              incompatible con las condiciones del servicio.
            </li>
          </ul>

          <p className="text-slate-600">
            Dropit y los establecimientos podrán rechazar o cancelar pedidos
            cuando existan indicios razonables de que contienen bienes
            prohibidos o representan un riesgo para personas, instalaciones u
            otros paquetes, sin perjuicio de las acciones legalmente
            procedentes.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            9. Recepción del paquete
          </h2>

          <p className="text-slate-600">
            Una vez seleccionado y aceptado el establecimiento, el vendedor
            deberá entregar físicamente el paquete dentro del plazo
            correspondiente.
          </p>

          <p className="text-slate-600">
            El establecimiento registrará la recepción utilizando los
            mecanismos de validación establecidos por Dropit. A partir de esa
            confirmación comenzará el periodo de recolección del cliente.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            10. Plazo de recolección del cliente
          </h2>

          <p className="text-slate-600">
            Una vez que el establecimiento confirme la recepción física del
            paquete, el cliente contará con hasta 24 horas para recogerlo,
            conforme al plazo registrado en la plataforma.
          </p>

          <p className="text-slate-600">
            Si el paquete no es recogido dentro de dicho periodo, Dropit podrá
            iniciar automáticamente el proceso de devolución al vendedor.
          </p>

          <p className="text-slate-600">
            Los procesos automáticos de Dropit pueden ejecutarse
            periódicamente, por lo que podrá existir un breve intervalo entre
            el vencimiento del plazo y la actualización del estado del pedido
            en la plataforma.
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            11. Devolución y custodia vencida
          </h2>

          <p className="text-slate-600">
            Cuando el cliente no recoja el paquete dentro del plazo aplicable,
            Dropit podrá cambiar el pedido al estado de devolución pendiente y
            notificar a los participantes correspondientes.
          </p>

          <p className="text-slate-600">
            El vendedor deberá recoger el paquete utilizando el mecanismo de
            validación correspondiente.
          </p>

          <p className="text-slate-600">
            Si transcurren 48 horas adicionales sin que el vendedor recoja el
            paquete, éste podrá pasar al estado de custodia vencida.
          </p>

          <p className="text-slate-600">
            Una vez vencida la custodia, el establecimiento dejará de estar
            obligado a continuar con el resguardo ordinario bajo las condiciones
            estándar del servicio Dropit. El vendedor deberá contactar a Dropit
            para conocer la situación del paquete y coordinar las acciones
            procedentes.
          </p>

          <p className="text-slate-600">
            La custodia vencida no transfiere la propiedad del paquete al
            establecimiento ni autoriza automáticamente su venta, uso,
            destrucción o disposición fuera de lo permitido por la legislación
            aplicable.
          </p>
        </section>

        {/* 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            12. Códigos y mecanismos de validación
          </h2>

          <p className="text-slate-600">
            Los folios, códigos, enlaces u otros mecanismos generados por
            Dropit funcionan como herramientas de validación operativa para
            confirmar distintas etapas del pedido.
          </p>

          <p className="text-slate-600">
            Cada participante deberá proteger los códigos que reciba y evitar
            compartirlos con personas no autorizadas.
          </p>

          <p className="text-slate-600">
            Dropit podrá solicitar verificaciones adicionales cuando existan
            inconsistencias, riesgos de seguridad o sea necesario aplicar un
            procedimiento de contingencia.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            13. Coins, precios y contratación de servicios
          </h2>

          <p className="text-slate-600">
            Dropit podrá utilizar créditos digitales denominados “Coins” como
            mecanismo para contratar determinados servicios dentro de la
            plataforma.
          </p>

          <p className="text-slate-600">
            El precio, tipo de Coin, cantidad requerida y cualquier descuento
            aplicable serán informados al vendedor en la plataforma antes de la
            compra o contratación correspondiente.
          </p>

          <p className="text-slate-600">
            Al crear un pedido sujeto al uso de Coins, la cantidad
            correspondiente podrá descontarse del saldo disponible del
            vendedor.
          </p>

          <p className="text-slate-600">
            Los Coins no constituyen moneda de curso legal, depósito bancario,
            instrumento de inversión ni generan intereses.
          </p>

          <p className="text-slate-600">
            Los reintegros de Coins procederán únicamente en los supuestos
            establecidos por Dropit para el flujo correspondiente, incluyendo
            las cancelaciones en las que expresamente se contemple dicho
            reintegro.
          </p>
        </section>

        {/* 14 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            14. Cancelaciones y reintegros
          </h2>

          <p className="text-slate-600">
            Los pedidos podrán cancelarse en los supuestos permitidos por el
            flujo operativo de Dropit, incluyendo la falta de entrega del
            paquete dentro del plazo aplicable.
          </p>

          <p className="text-slate-600">
            Cuando conforme a las reglas del servicio proceda un reintegro de
            Coins, éste se acreditará al saldo correspondiente del vendedor.
          </p>

          <p className="text-slate-600">
            La procedencia de una cancelación o reintegro dependerá del estado
            del pedido, de las acciones realizadas por los participantes y de
            las condiciones aplicables a la operación.
          </p>
        </section>

        {/* 15 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            15. Compensación a establecimientos
          </h2>

          <p className="text-slate-600">
            Los establecimientos podrán generar saldos a su favor por los
            servicios efectivamente realizados conforme al flujo operativo de
            Dropit.
          </p>

          <p className="text-slate-600">
            El importe correspondiente, las comisiones aplicables, impuestos y
            demás conceptos se determinarán conforme a las condiciones
            económicas vigentes y a la información mostrada en la plataforma.
          </p>

          <p className="text-slate-600">
            Los saldos y movimientos mostrados en la plataforma estarán sujetos
            a validación y al cumplimiento de las obligaciones aplicables antes
            de su liquidación definitiva.
          </p>
        </section>

        {/* 16 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            16. Retiros y datos bancarios
          </h2>

          <p className="text-slate-600">
            Para solicitar retiros, la persona titular deberá registrar los
            datos bancarios requeridos por Dropit y otorgar, cuando resulte
            aplicable, el consentimiento correspondiente para su tratamiento.
          </p>

          <p className="text-slate-600">
            Los retiros únicamente podrán solicitarse respecto de saldos
            elegibles conforme al estado de los movimientos correspondientes.
          </p>

          <p className="text-slate-600">
            Cada solicitud conservará los datos bancarios asociados al momento
            de su creación. Una modificación posterior de la cuenta bancaria
            aplicará únicamente a futuras solicitudes y no modificará las ya
            creadas.
          </p>

          <p className="text-slate-600">
            Dropit podrá revisar, aprobar, rechazar o revertir una solicitud
            cuando existan inconsistencias, movimientos no elegibles,
            duplicidades, errores o cualquier otra circunstancia que impida
            procesar correctamente el retiro.
          </p>
        </section>

        {/* 17 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            17. Facturación
          </h2>

          <p className="text-slate-600">
            Los participantes deberán proporcionar la información fiscal
            necesaria cuando soliciten o deban emitir comprobantes fiscales
            relacionados con los servicios prestados mediante Dropit.
          </p>

          <p className="text-slate-600">
            Conforme al modelo de operación de Dropit, Dropit emitirá el
            comprobante fiscal correspondiente a los conceptos que le
            correspondan y el establecimiento deberá emitir el comprobante
            fiscal correspondiente a los servicios que éste preste al vendedor,
            cuando resulte aplicable.
          </p>

          <p className="text-slate-600">
            El establecimiento es responsable de proporcionar información
            fiscal correcta y cumplir las obligaciones de facturación que le
            correspondan.
          </p>

          <p className="text-slate-600">
            Cuando un establecimiento esté obligado a emitir el comprobante
            fiscal correspondiente y no lo haga dentro del plazo aplicable,
            Dropit podrá reembolsar al vendedor el importe correspondiente al
            servicio del establecimiento y dicho servicio no será liquidado al
            establecimiento.
          </p>

          <p className="text-slate-600">
            La facturación estará sujeta a los requisitos, plazos y demás
            disposiciones fiscales aplicables.
          </p>
        </section>

        {/* 18 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            18. Notificaciones y comunicaciones
          </h2>

          <p className="text-slate-600">
            Dropit podrá enviar comunicaciones por correo electrónico y mostrar
            avisos dentro de la plataforma relacionados con pedidos, recepción,
            recolección, devolución, cancelaciones, pagos, retiros, facturación,
            seguridad y demás aspectos necesarios para prestar el servicio.
          </p>

          <p className="text-slate-600">
            Las personas usuarias son responsables de mantener actualizada su
            información de contacto y de consultar el seguimiento disponible
            en la plataforma.
          </p>
        </section>

        {/* 19 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            19. Privacidad y datos personales
          </h2>

          <p className="text-slate-600">
            El tratamiento de datos personales realizado por Dropit se regirá
            por el Aviso de Privacidad vigente disponible en la plataforma.
          </p>

          <p className="text-slate-600">
            Cuando determinada información requiera consentimiento expreso,
            Dropit podrá solicitarlo mediante los mecanismos electrónicos
            correspondientes.
          </p>

          <p className="text-slate-600">
            El Aviso de Privacidad forma parte de la información legal
            aplicable al uso de la plataforma, sin perjuicio de los derechos
            reconocidos por la legislación aplicable.
          </p>
        </section>

        {/* 20 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            20. Responsabilidad y alcance del servicio
          </h2>

          <p className="text-slate-600">
            Dropit proporciona infraestructura tecnológica para coordinar el
            servicio y no forma parte de los acuerdos de compraventa celebrados
            entre vendedores y clientes.
          </p>

          <p className="text-slate-600">
            En consecuencia, Dropit no determina la calidad, autenticidad,
            funcionamiento, procedencia o características de los productos
            comercializados entre vendedor y cliente.
          </p>

          <p className="text-slate-600">
            Cada participante será responsable de los daños o incumplimientos
            que le sean atribuibles conforme a su intervención en la operación
            y a la legislación aplicable.
          </p>

          <p className="text-slate-600">
            Dropit no será responsable por consecuencias derivadas de
            información falsa proporcionada por usuarios, embalaje inadecuado,
            artículos prohibidos, uso indebido de códigos o hechos fuera de su
            control razonable, salvo cuando la responsabilidad corresponda a
            Dropit conforme a la legislación aplicable.
          </p>

          <p className="text-slate-600">
            Ninguna disposición de estos Términos deberá interpretarse como
            exclusión, limitación o renuncia de derechos o responsabilidades
            que conforme a la legislación aplicable tengan carácter
            irrenunciable.
          </p>
        </section>

        {/* 21 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            21. Uso indebido y suspensión
          </h2>

          <p className="text-slate-600">
            Dropit podrá investigar operaciones cuando existan indicios
            razonables de fraude, manipulación del sistema, uso de información
            falsa, abuso de promociones o Coins, intento de obtener pagos
            indebidos, utilización de bienes prohibidos o cualquier conducta
            que comprometa la seguridad de la plataforma o de sus
            participantes.
          </p>

          <p className="text-slate-600">
            Cuando resulte razonablemente necesario, Dropit podrá limitar
            temporalmente determinadas funcionalidades mientras se revisa la
            situación, sin perjuicio de los derechos que correspondan a las
            personas usuarias conforme a la legislación aplicable.
          </p>
        </section>

        {/* 22 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            22. Modificaciones a los Términos
          </h2>

          <p className="text-slate-600">
            Dropit podrá modificar estos Términos y Condiciones para reflejar
            cambios legales, regulatorios, tecnológicos, operativos o en los
            servicios ofrecidos.
          </p>

          <p className="text-slate-600">
            La versión vigente estará disponible en la plataforma y mostrará la
            fecha de su última actualización.
          </p>

          <p className="text-slate-600">
            Cuando la naturaleza de una modificación lo requiera, Dropit podrá
            comunicarla mediante la plataforma, correo electrónico u otros
            medios razonables.
          </p>
        </section>

        {/* 23 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            23. Legislación aplicable y controversias
          </h2>

          <p className="text-slate-600">
            Estos Términos y Condiciones se interpretarán conforme a la
            legislación aplicable en los Estados Unidos Mexicanos.
          </p>

          <p className="text-slate-600">
            En caso de inconformidad, las personas usuarias podrán contactar a
            Dropit para solicitar una aclaración o buscar una solución a la
            controversia.
          </p>

          <p className="text-slate-600">
            Lo anterior no limita los derechos ni los mecanismos de reclamación
            o defensa que correspondan a consumidores, usuarios o participantes
            conforme a la legislación aplicable.
          </p>
        </section>

        {/* 24 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            24. Contacto
          </h2>

          <p className="text-slate-600">
            Para consultas, aclaraciones o reportes relacionados con estos
            Términos y Condiciones puede contactarse a Dropit en:
          </p>

          <p className="font-medium text-slate-700">
            contacto@dropitt.net
          </p>

          <div className="text-slate-600">
            <p className="font-medium text-slate-700">
              DROPIT GLOBAL, S.A. DE C.V.
            </p>
            <p>Villa de los Duraznos #1, Paseos del Bosque</p>
            <p>Naucalpan de Juárez, Estado de México</p>
            <p>C.P. 53297</p>
          </div>
        </section>

      </div>
    </div>
  );
}