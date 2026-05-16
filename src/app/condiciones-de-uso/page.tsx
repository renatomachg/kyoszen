import PageHero from "@/components/ui/PageHero";

export const metadata = { title: "Condiciones de Uso | Kyoszen" };

export default function CondicionesDeUsoPage() {
  return (
    <>
      <PageHero
        chip="Legal"
        title="Condiciones de Uso"
        description="Terminos y condiciones que rigen el uso del sitio web kyoszen.com"
      />

      <section className="py-16 px-5 md:px-10 xl:px-20 bg-[var(--color-bg)]">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted)] mb-10">Ultima actualizacion: mayo 2026</p>

          <div className="prose-legal">

            <h2>1. Aceptacion de los terminos</h2>
            <p>Al acceder y utilizar el sitio web <strong>kyoszen.com</strong> (en adelante, "el Sitio"), usted acepta quedar vinculado por las presentes Condiciones de Uso. Si no esta de acuerdo con alguno de estos terminos, le solicitamos que se abstenga de utilizar el Sitio. El responsable del Sitio es <strong>Integradores Kyoszen SA de CV</strong> (en adelante, "Kyoszen"), con domicilio en Ciudad de Mexico, Mexico.</p>

            <h2>2. Capacidad legal</h2>
            <p>Al utilizar el Sitio, usted declara que es mayor de edad conforme a la legislacion mexicana aplicable, que tiene capacidad legal para celebrar acuerdos vinculantes y que, en caso de actuar en representacion de una persona moral, cuenta con las facultades necesarias para hacerlo.</p>

            <h2>3. Uso del Sitio y su contenido</h2>
            <p>Todo el contenido publicado en el Sitio —incluyendo textos, graficos, logotipos, imagenes, videos y codigo fuente— es propiedad exclusiva de Kyoszen o de sus licenciantes, y esta protegido por la legislacion mexicana e internacional en materia de derechos de autor y propiedad intelectual.</p>
            <p>Queda expresamente prohibido:</p>
            <ul>
              <li>Copiar, reproducir, distribuir o modificar el contenido del Sitio sin autorizacion escrita previa de Kyoszen.</li>
              <li>Utilizar el contenido con fines comerciales no autorizados.</li>
              <li>Realizar ingenieria inversa sobre cualquier componente del Sitio.</li>
              <li>Publicar o transmitir informacion falsa, difamatoria, fraudulenta o que vulnere derechos de terceros.</li>
              <li>Interferir con el funcionamiento tecnico del Sitio o intentar acceder a sistemas no autorizados.</li>
              <li>Suplantar identidades o proporcionar datos de terceros sin su consentimiento.</li>
            </ul>

            <h2>4. Informacion sobre vacantes y cursos</h2>
            <p>Las vacantes publicadas en el Sitio son informativas y no constituyen una oferta de trabajo vinculante. Kyoszen realiza esfuerzos razonables para mantener la informacion actualizada, pero no garantiza la disponibilidad de los puestos en todo momento. Del mismo modo, la disponibilidad y fechas de los cursos estan sujetas a cambios sin previo aviso.</p>

            <h2>5. Informacion personal</h2>
            <p>La informacion personal que usted proporcione a traves del Sitio —mediante formularios de contacto, solicitud de vacantes o registro de cursos— sera tratada conforme a nuestra <a href="/politica-de-privacidad">Politica de Privacidad</a>. Usted es responsable de la veracidad y exactitud de los datos que proporcione.</p>

            <h2>6. Enlaces a sitios de terceros</h2>
            <p>El Sitio puede contener enlaces a sitios web de terceros. Kyoszen no revisa ni controla dichos sitios y no asume responsabilidad alguna por su contenido, disponibilidad o practicas de privacidad. La inclusion de un enlace no implica aprobacion ni respaldo por parte de Kyoszen.</p>

            <h2>7. Descargo de responsabilidad</h2>
            <p>El Sitio se proporciona "tal cual" y "segun disponibilidad". Kyoszen no otorga garantias expresas ni implicitas respecto a la exactitud, integridad, oportunidad o adecuacion del contenido para un fin especifico. Asimismo, no garantiza que el Sitio opere sin interrupciones, errores o sin presencia de elementos daninos para los sistemas informaticos del usuario.</p>

            <h2>8. Limitacion de responsabilidad</h2>
            <p>En la maxima medida permitida por la legislacion aplicable, Kyoszen no sera responsable por danos directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del Sitio, incluyendo perdida de datos, perdida de ingresos o interrupcion del negocio. El unico recurso del usuario ante cualquier inconformidad es dejar de utilizar el Sitio. Cualquier accion legal derivada del uso del Sitio debera iniciarse dentro de los seis meses siguientes al surgimiento de la causa.</p>

            <h2>9. Indemnizacion</h2>
            <p>Usted acepta indemnizar, defender y mantener indemne a Kyoszen, sus socios, directivos, empleados y proveedores, frente a cualquier reclamacion, perdida, responsabilidad o gasto —incluidos honorarios legales— que resulten del incumplimiento de las presentes Condiciones de Uso o del uso indebido del Sitio.</p>

            <h2>10. Modificaciones</h2>
            <p>Kyoszen se reserva el derecho de modificar estas Condiciones de Uso en cualquier momento. Los cambios entraran en vigor a partir de su publicacion en el Sitio. El uso continuado del Sitio despues de dicha publicacion implica la aceptacion de las nuevas condiciones.</p>

            <h2>11. Jurisdiccion y ley aplicable</h2>
            <p>Las presentes Condiciones de Uso se rigen por las leyes vigentes en los Estados Unidos Mexicanos. Para la resolucion de cualquier controversia derivada del uso del Sitio, las partes se someten expresamente a la competencia de los tribunales competentes de la Ciudad de Mexico, renunciando a cualquier otro fuero que pudiera corresponderles.</p>

            <h2>12. Contacto</h2>
            <p>Para cualquier consulta relacionada con estas Condiciones de Uso, puede comunicarse con nosotros a traves de:</p>
            <ul>
              <li>Correo electronico: <a href="mailto:rsalazar@kyoszen.com.mx">rsalazar@kyoszen.com.mx</a></li>
              <li>Telefono: 56 4004 5414</li>
              <li>Horario de atencion: Lunes a Viernes, 9:00 a 18:00 hrs</li>
            </ul>

          </div>
        </div>
      </section>
    </>
  );
}
