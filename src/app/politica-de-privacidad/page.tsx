import PageHero from "@/components/ui/PageHero";

export const metadata = { title: "Politica de Privacidad | Kyoszen" };

export default function PoliticaDePrivacidadPage() {
  return (
    <>
      <PageHero
        chip="Legal"
        title="Politica de Privacidad"
        description="Aviso de privacidad integral de Integradores Kyoszen SA de CV conforme a la LFPDPPP"
      />

      <section className="py-16 px-5 md:px-10 xl:px-20 bg-[var(--color-bg)]">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted)] mb-10">Ultima actualizacion: mayo 2026</p>

          <div className="prose-legal">

            <h2>1. Identidad y domicilio del responsable</h2>
            <p><strong>Integradores Kyoszen SA de CV</strong> (en adelante, "Kyoszen"), con domicilio en Ciudad de Mexico, Mexico, es la empresa responsable del tratamiento de sus datos personales recabados a traves del sitio web <strong>kyoszen.com</strong> y de los servicios que presta.</p>
            <p>Para cualquier consulta relacionada con el tratamiento de sus datos personales, puede contactar a nuestro responsable de privacidad en:</p>
            <ul>
              <li>Correo electronico: <a href="mailto:rsalazar@kyoszen.com.mx">rsalazar@kyoszen.com.mx</a></li>
              <li>Telefono: 56 4004 5414</li>
              <li>Horario de atencion: Lunes a Viernes, 9:00 a 18:00 hrs</li>
            </ul>

            <h2>2. Datos personales que recabamos</h2>
            <p>Kyoszen puede recabar las siguientes categorias de datos personales segun el servicio que usted solicite:</p>

            <h3>Datos de contacto general</h3>
            <ul>
              <li>Nombre completo</li>
              <li>Correo electronico</li>
              <li>Numero de telefono</li>
              <li>Empresa u organizacion a la que pertenece</li>
            </ul>

            <h3>Datos para candidatos a vacantes</h3>
            <ul>
              <li>Historial laboral y academico</li>
              <li>Habilidades y competencias profesionales</li>
              <li>Ubicacion o zona de residencia</li>
              <li>Documentacion laboral (disponibilidad, referencias)</li>
              <li>Curriculum vitae</li>
            </ul>

            <h3>Datos para empresas o clientes</h3>
            <ul>
              <li>Nombre del contacto y cargo</li>
              <li>Razon social y giro de la empresa</li>
              <li>Necesidades especificas de reclutamiento o capacitacion</li>
            </ul>

            <h3>Datos recabados automaticamente</h3>
            <p>Al navegar por el Sitio podemos recabar de forma automatica: direccion IP, tipo de navegador, sistema operativo, paginas visitadas y duracion de la visita, conforme a nuestra <a href="/politica-de-cookies">Politica de Cookies</a>.</p>

            <h2>3. Finalidades del tratamiento</h2>
            <p>Sus datos personales son tratados para las siguientes finalidades:</p>

            <h3>Finalidades primarias (necesarias para la prestacion del servicio)</h3>
            <ul>
              <li>Brindar servicios de reclutamiento y seleccion de personal.</li>
              <li>Gestionar su solicitud de informes sobre cursos y capacitacion.</li>
              <li>Responder consultas enviadas a traves del formulario de contacto.</li>
              <li>Evaluar la idoneidad de candidatos para puestos de trabajo.</li>
              <li>Administrar la relacion comercial con empresas clientes.</li>
              <li>Cumplir obligaciones legales y reglamentarias aplicables.</li>
            </ul>

            <h3>Finalidades secundarias (puede oponerse en cualquier momento)</h3>
            <ul>
              <li>Enviarle informacion sobre nuevas vacantes, cursos y servicios de Kyoszen.</li>
              <li>Invitarle a eventos, webinars o actividades relacionadas con el desarrollo profesional.</li>
              <li>Realizar encuestas de satisfaccion y mejora continua.</li>
            </ul>
            <p>Si no desea que sus datos sean utilizados para las finalidades secundarias, puede comunicarlo en cualquier momento a <a href="mailto:rsalazar@kyoszen.com.mx">rsalazar@kyoszen.com.mx</a>.</p>

            <h2>4. Fundamento legal del tratamiento</h2>
            <p>El tratamiento de sus datos personales se basa en:</p>
            <ul>
              <li><strong>Consentimiento:</strong> para finalidades secundarias y datos sensibles.</li>
              <li><strong>Ejecucion de un contrato:</strong> cuando es necesario para prestar el servicio solicitado.</li>
              <li><strong>Obligacion legal:</strong> cuando la ley nos exige conservar o reportar informacion.</li>
              <li><strong>Interes legitimo:</strong> para la seguridad del Sitio, prevencion de fraudes y mejora de nuestros servicios.</li>
            </ul>

            <h2>5. Transferencia de datos personales</h2>
            <p>Kyoszen no vende ni renta sus datos personales a terceros. Podemos compartirlos unicamente en los siguientes supuestos:</p>
            <ul>
              <li>Con empresas clientes, exclusivamente cuando usted aplica a una vacante especifica y con su conocimiento.</li>
              <li>Con proveedores de servicios tecnologicos que actuan en nuestro nombre, sujetos a obligaciones de confidencialidad.</li>
              <li>Cuando lo exija una autoridad competente mediante requerimiento legal.</li>
              <li>En caso de fusion, adquisicion o reestructura empresarial, en cuyo caso le notificaremos previamente.</li>
            </ul>

            <h2>6. Tiempo de conservacion</h2>
            <p>Sus datos seran conservados durante el tiempo necesario para cumplir con las finalidades descritas, o bien hasta que usted ejerza su derecho de supresion. En todo caso, se conservaran por el tiempo que la legislacion mexicana aplicable lo requiera.</p>

            <h2>7. Medidas de seguridad</h2>
            <p>Kyoszen implementa medidas tecnicas, administrativas y fisicas para proteger sus datos personales contra acceso no autorizado, perdida, alteracion o destruccion. Entre estas medidas se incluyen cifrado de datos en transito, controles de autenticacion y monitoreo de accesos.</p>

            <h2>8. Derechos ARCO y derechos adicionales</h2>
            <p>Conforme a la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP) y su Reglamento, usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> conocer que datos personales tenemos sobre usted y como los tratamos.</li>
              <li><strong>Rectificacion:</strong> solicitar la correccion de datos inexactos o incompletos.</li>
              <li><strong>Cancelacion:</strong> pedir la eliminacion de sus datos cuando no sean necesarios para las finalidades del tratamiento.</li>
              <li><strong>Oposicion:</strong> oponerse al tratamiento de sus datos para finalidades especificas.</li>
              <li><strong>Revocacion del consentimiento:</strong> retirar el consentimiento otorgado previamente.</li>
              <li><strong>Limitacion del uso o divulgacion:</strong> restringir el tratamiento de sus datos en casos especificos.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso comun.</li>
            </ul>

            <h2>9. Como ejercer sus derechos</h2>
            <p>Para ejercer cualquiera de sus derechos ARCO, envie una solicitud a <a href="mailto:rsalazar@kyoszen.com.mx">rsalazar@kyoszen.com.mx</a> indicando:</p>
            <ul>
              <li>Nombre completo y datos de contacto.</li>
              <li>Descripcion clara del derecho que desea ejercer.</li>
              <li>Documento que acredite su identidad.</li>
            </ul>
            <p>Daremos respuesta a su solicitud en un plazo maximo de 20 dias habiles. Si la solicitud es procedente, la haremos efectiva en un plazo de 15 dias habiles adicionales.</p>

            <h2>10. Uso de cookies y tecnologias similares</h2>
            <p>El Sitio utiliza cookies y otras tecnologias de rastreo. Para informacion detallada, consulte nuestra <a href="/politica-de-cookies">Politica de Cookies</a>.</p>

            <h2>11. Modificaciones a esta politica</h2>
            <p>Kyoszen se reserva el derecho de actualizar esta Politica de Privacidad en cualquier momento. Los cambios seran publicados en esta pagina. Le recomendamos revisarla periodicamente. Cuando los cambios sean significativos, le notificaremos a traves del Sitio o por correo electronico.</p>

            <h2>12. Autoridad competente</h2>
            <p>Si considera que sus derechos han sido vulnerados, tiene derecho a presentar una queja ante el <strong>Instituto Nacional de Transparencia, Acceso a la Informacion y Proteccion de Datos Personales (INAI)</strong>, en <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer">www.inai.org.mx</a>.</p>

          </div>
        </div>
      </section>
    </>
  );
}
