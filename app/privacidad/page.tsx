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
            Aviso de Privacidad Integral
          </h1>

          <p className="text-sm text-slate-500">
            Última actualización: Septiembre 2026
          </p>
        </div>

        {/* 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            1. Responsable del tratamiento de los datos personales
          </h2>

          <p className="text-slate-600">
            DROPIT GLOBAL, S.A. DE C.V., en adelante “Dropit”, con domicilio en
            Villa de los Duraznos #1, Paseos del Bosque, Naucalpan de Juárez,
            Estado de México, C.P. 53297, es responsable del tratamiento de los
            datos personales recabados a través de la plataforma Dropit.
          </p>

          <p className="text-slate-600">
            Para cualquier asunto relacionado con privacidad y protección de
            datos personales puede contactarnos en:
          </p>

          <p className="font-medium text-slate-700">
            contacto@dropitt.net
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            2. Datos personales que podemos recabar
          </h2>

          <p className="text-slate-600">
            Dependiendo del tipo de usuario y de las funcionalidades utilizadas,
            Dropit podrá recabar y tratar las siguientes categorías de datos
            personales:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>
              Datos de identificación y contacto, incluyendo nombre y correo
              electrónico.
            </li>

            <li>
              Datos de autenticación y cuenta necesarios para acceder a la
              plataforma.
            </li>

            <li>
              Información relacionada con vendedores, clientes y titulares de
              establecimientos.
            </li>

            <li>
              Direcciones, códigos postales y datos de ubicación relacionados
              con establecimientos y operaciones realizadas mediante la
              plataforma.
            </li>

            <li>
              Información relacionada con pedidos, entregas, recolecciones,
              devoluciones, cancelaciones y eventos asociados.
            </li>

            <li>
              Evaluaciones, comentarios e interacciones realizadas dentro de la
              plataforma.
            </li>

            <li>
              Datos fiscales necesarios para procesos de facturación, incluyendo
              RFC, razón social, régimen fiscal, código postal fiscal, uso de
              CFDI y correo electrónico de facturación.
            </li>

            <li>
              Información contenida en comprobantes fiscales y documentos
              relacionados con procesos de facturación.
            </li>

            <li>
              Datos financieros o patrimoniales proporcionados para recibir
              liquidaciones o retiros, incluyendo nombre del titular de la
              cuenta, CLABE interbancaria y banco.
            </li>

            <li>
              Información relacionada con pagos, movimientos, saldos,
              liquidaciones, retiros, referencias de pago y reembolsos
              realizados mediante la plataforma.
            </li>

            <li>
              Información técnica y de seguridad generada durante el uso de la
              plataforma cuando resulte necesaria para su funcionamiento,
              seguridad y prevención de fraude.
            </li>
          </ul>

          <p className="text-slate-600">
            Dropit no solicita intencionalmente datos personales sensibles para
            la prestación ordinaria de sus servicios.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            3. Finalidades del tratamiento
          </h2>

          <h3 className="text-lg font-semibold text-slate-700">
            Finalidades necesarias
          </h3>

          <p className="text-slate-600">
            Dropit utilizará los datos personales para las finalidades necesarias
            para prestar y operar sus servicios, incluyendo:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Crear, administrar y autenticar cuentas de usuario.</li>

            <li>
              Identificar y administrar el rol del usuario dentro de la
              plataforma.
            </li>

            <li>
              Registrar, administrar y dar seguimiento a pedidos.
            </li>

            <li>
              Coordinar la operación entre vendedores, clientes y
              establecimientos participantes.
            </li>

            <li>
              Gestionar la selección, aceptación, recepción, resguardo,
              recolección, devolución y cancelación de pedidos.
            </li>

            <li>
              Generar y validar folios, códigos y otros mecanismos de
              verificación operativa.
            </li>

            <li>
              Administrar Coins, pagos, movimientos, saldos, reembolsos,
              liquidaciones y retiros.
            </li>

            <li>
              Procesar solicitudes y operaciones relacionadas con los servicios
              contratados mediante la plataforma.
            </li>

            <li>
              Gestionar procesos de facturación y documentación fiscal.
            </li>

            <li>
              Realizar pagos y liquidaciones a los titulares correspondientes.
            </li>

            <li>
              Enviar comunicaciones relacionadas con pedidos, pagos,
              facturación, seguridad y funcionamiento de la plataforma.
            </li>

            <li>
              Atender solicitudes de soporte, aclaraciones, incidencias y
              controversias.
            </li>

            <li>
              Prevenir fraudes, usos indebidos y actividades contrarias a los
              Términos y Condiciones.
            </li>

            <li>
              Cumplir obligaciones legales, fiscales y administrativas, así
              como requerimientos de autoridades competentes.
            </li>

            <li>
              Mantener la seguridad, integridad y correcto funcionamiento de la
              plataforma.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-700 pt-2">
            Tratamientos sujetos a consentimiento expreso
          </h3>

          <p className="text-slate-600">
            Cuando Dropit recabe datos financieros o patrimoniales para procesar
            retiros o liquidaciones, solicitará el consentimiento expreso de la
            persona titular mediante los mecanismos electrónicos disponibles en
            la plataforma.
          </p>

          <p className="text-slate-600">
            El otorgamiento de dicho consentimiento quedará asociado a la cuenta
            de la persona titular y podrá conservarse evidencia de su
            otorgamiento, incluyendo la fecha y la versión del Aviso de
            Privacidad aceptada.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            4. Datos financieros y patrimoniales
          </h2>

          <p className="text-slate-600">
            Para procesar retiros y liquidaciones, Dropit podrá tratar
            información bancaria como:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>Nombre del titular de la cuenta.</li>
            <li>CLABE interbancaria.</li>
            <li>Institución bancaria.</li>
            <li>
              Información relacionada con el retiro o liquidación
              correspondiente.
            </li>
          </ul>

          <p className="text-slate-600">
            Estos datos serán utilizados para administrar y realizar los pagos o
            liquidaciones correspondientes y para mantener evidencia de las
            operaciones realizadas.
          </p>

          <p className="text-slate-600">
            Al solicitar un retiro, Dropit podrá conservar en la operación
            correspondiente una referencia de los datos bancarios vigentes al
            momento de la solicitud. Esto permite conservar la trazabilidad de
            la cuenta a la cual correspondía realizar el pago, aun cuando
            posteriormente la persona titular modifique sus datos bancarios.
          </p>

          <p className="text-slate-600">
            La modificación posterior de una cuenta bancaria no modifica los
            datos asociados a solicitudes de retiro previamente generadas.
          </p>

          <p className="text-slate-600">
            Cuando resulte legalmente necesario, Dropit solicitará
            consentimiento expreso antes de tratar estos datos.
          </p>

          <p className="text-slate-600">
            Dropit no almacena directamente los datos completos de tarjetas
            bancarias utilizados para pagos procesados por proveedores externos
            de servicios de pago.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            5. Proveedores y encargados del tratamiento
          </h2>

          <p className="text-slate-600">
            Para operar la plataforma, Dropit utiliza proveedores tecnológicos
            que pueden tratar datos personales por cuenta de Dropit conforme a
            los servicios que prestan.
          </p>

          <p className="text-slate-600">
            Estos servicios pueden incluir infraestructura tecnológica,
            alojamiento, bases de datos, autenticación, procesamiento de pagos,
            correo electrónico, mapas, geolocalización, facturación y otros
            servicios necesarios para la operación de la plataforma.
          </p>

          <p className="text-slate-600">
            Dropit procurará que dichos proveedores traten la información
            únicamente conforme a las finalidades correspondientes y a las
            obligaciones aplicables en materia de protección de datos
            personales.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            6. Comunicación de información entre participantes
          </h2>

          <p className="text-slate-600">
            Para ejecutar los servicios solicitados, determinada información
            podrá ser comunicada entre vendedores, clientes y establecimientos
            cuando resulte necesaria para gestionar un pedido, validar una
            entrega, realizar una recolección, gestionar una devolución, atender
            una incidencia o cumplir obligaciones relacionadas con la operación.
          </p>

          <p className="text-slate-600">
            Dropit procurará limitar la información comunicada a aquella
            razonablemente necesaria para cumplir la finalidad correspondiente.
          </p>

          <p className="text-slate-600">
            Los datos bancarios destinados a retiros o liquidaciones no serán
            compartidos con otros participantes de la operación salvo cuando
            resulte necesario para ejecutar el pago correspondiente o exista
            otra causa legal que lo permita.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            7. Transferencias de datos personales
          </h2>

          <p className="text-slate-600">
            Dropit podrá realizar transferencias de datos personales cuando
            resulten necesarias o estén permitidas conforme a la legislación
            aplicable, incluyendo aquellas necesarias para cumplir obligaciones
            legales, fiscales o contractuales, atender requerimientos de
            autoridades competentes o ejercer o defender derechos.
          </p>

          <p className="text-slate-600">
            Cuando una transferencia requiera consentimiento conforme a la
            legislación aplicable, Dropit solicitará dicho consentimiento
            previamente.
          </p>

          <p className="text-slate-600">
            Los proveedores que traten datos personales por cuenta de Dropit
            para prestar servicios tecnológicos u operativos actuarán conforme a
            las obligaciones que resulten aplicables a su participación en el
            tratamiento.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            8. Conservación de la información
          </h2>

          <p className="text-slate-600">
            Los datos personales serán conservados durante el tiempo necesario
            para cumplir las finalidades para las cuales fueron recabados y,
            posteriormente, durante los periodos necesarios para cumplir
            obligaciones legales, fiscales o contractuales, atender posibles
            responsabilidades, resolver controversias y proteger los derechos de
            Dropit y de sus usuarios.
          </p>

          <p className="text-slate-600">
            La información relacionada con operaciones, pagos, retiros,
            facturación y movimientos financieros podrá conservarse durante los
            periodos necesarios para mantener trazabilidad y cumplir las
            obligaciones aplicables.
          </p>

          <p className="text-slate-600">
            Una solicitud de cancelación de datos no implica necesariamente su
            eliminación inmediata cuando exista una obligación o causa legal que
            requiera conservar determinada información.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            9. Seguridad de los datos personales
          </h2>

          <p className="text-slate-600">
            Dropit mantiene medidas administrativas, técnicas y organizativas
            razonables orientadas a proteger los datos personales contra daño,
            pérdida, alteración, destrucción, acceso, uso o tratamiento no
            autorizado.
          </p>

          <p className="text-slate-600">
            El acceso a datos personales y financieros se limitará a las
            personas, sistemas y proveedores que razonablemente requieran dicha
            información para desempeñar las funciones correspondientes.
          </p>

          <p className="text-slate-600">
            No obstante, ningún sistema tecnológico o mecanismo de transmisión
            de información puede garantizar seguridad absoluta.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            10. Derechos ARCO
          </h2>

          <p className="text-slate-600">
            Las personas titulares podrán ejercer sus derechos de Acceso,
            Rectificación, Cancelación y Oposición (ARCO) respecto de sus datos
            personales.
          </p>

          <p className="text-slate-600">
            Para ejercer cualquiera de estos derechos deberá enviarse una
            solicitud a:
          </p>

          <p className="font-medium text-slate-700">
            contacto@dropitt.net
          </p>

          <p className="text-slate-600">
            La solicitud deberá contener, cuando menos:
          </p>

          <ul className="list-disc pl-6 text-slate-600 space-y-1">
            <li>
              Nombre de la persona titular y elementos que permitan identificar
              su cuenta.
            </li>

            <li>
              Medio o correo electrónico para comunicar la respuesta.
            </li>

            <li>
              Descripción clara del derecho ARCO que desea ejercer.
            </li>

            <li>
              Descripción de los datos personales respecto de los cuales solicita
              ejercer el derecho.
            </li>

            <li>
              Información que permita localizar los datos correspondientes.
            </li>

            <li>
              Cuando resulte necesario, documentos o información que permitan
              acreditar la identidad de la persona titular o de su
              representante.
            </li>
          </ul>

          <p className="text-slate-600">
            En solicitudes de rectificación deberán indicarse además los datos
            que se desean corregir y, cuando corresponda, proporcionar
            documentación que sustente la modificación.
          </p>

          <p className="text-slate-600">
            Dropit atenderá las solicitudes dentro de los plazos y conforme a
            los procedimientos previstos por la legislación aplicable.
          </p>

          <p className="text-slate-600">
            El ejercicio de los derechos ARCO podrá estar sujeto a las
            excepciones y limitaciones establecidas legalmente.
          </p>
        </section>

        {/* 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            11. Limitación del uso o divulgación
          </h2>

          <p className="text-slate-600">
            Las personas titulares podrán solicitar la limitación del uso o
            divulgación de sus datos personales enviando una solicitud a:
          </p>

          <p className="font-medium text-slate-700">
            contacto@dropitt.net
          </p>

          <p className="text-slate-600">
            La solicitud deberá identificar a la persona titular y describir
            claramente la limitación solicitada.
          </p>

          <p className="text-slate-600">
            Dropit atenderá la solicitud cuando resulte legal y técnicamente
            procedente y siempre que ésta no impida el cumplimiento de
            obligaciones necesarias para prestar los servicios solicitados o de
            obligaciones legales aplicables.
          </p>
        </section>

        {/* 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            12. Revocación del consentimiento
          </h2>

          <p className="text-slate-600">
            Cuando el tratamiento de datos personales se base en el
            consentimiento de la persona titular, ésta podrá solicitar su
            revocación mediante:
          </p>

          <p className="font-medium text-slate-700">
            contacto@dropitt.net
          </p>

          <p className="text-slate-600">
            La solicitud deberá identificar a la persona titular, los datos o
            tratamientos respecto de los cuales desea revocar el consentimiento
            y proporcionar información suficiente para localizar la cuenta
            correspondiente.
          </p>

          <p className="text-slate-600">
            Dropit comunicará la respuesta utilizando los datos de contacto
            proporcionados por la persona solicitante.
          </p>

          <p className="text-slate-600">
            La revocación del consentimiento no tendrá efectos retroactivos y
            podrá estar limitada cuando Dropit deba continuar tratando
            determinada información para cumplir obligaciones derivadas de una
            relación jurídica, obligaciones legales o para ejercer o defender
            derechos.
          </p>

          <p className="text-slate-600">
            La revocación del consentimiento para tratar datos bancarios puede
            impedir que Dropit procese nuevos retiros o liquidaciones mientras
            no exista información y, cuando corresponda, consentimiento válido
            para realizar dichas operaciones.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            13. Cambios al Aviso de Privacidad
          </h2>

          <p className="text-slate-600">
            Dropit podrá modificar o actualizar este Aviso de Privacidad como
            consecuencia de cambios legales, regulatorios, tecnológicos,
            operativos o relacionados con los servicios ofrecidos.
          </p>

          <p className="text-slate-600">
            Las modificaciones estarán disponibles en la plataforma Dropit y se
            indicará la fecha de última actualización.
          </p>

          <p className="text-slate-600">
            Cuando la naturaleza del cambio lo requiera, Dropit podrá utilizar
            medios adicionales de comunicación, incluyendo el correo electrónico
            registrado por la persona usuaria.
          </p>

          <p className="text-slate-600">
            Cuando una modificación implique nuevas finalidades o tratamientos
            para los cuales la legislación requiera consentimiento, Dropit
            solicitará el consentimiento correspondiente cuando resulte
            aplicable.
          </p>
        </section>

        {/* 14 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            14. Contacto
          </h2>

          <p className="text-slate-600">
            Para cualquier duda relacionada con este Aviso de Privacidad, el
            tratamiento de datos personales, el ejercicio de derechos ARCO, la
            limitación del uso o divulgación de datos o la revocación del
            consentimiento, puede comunicarse con Dropit en:
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