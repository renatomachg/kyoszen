import PageHero from "@/components/ui/PageHero";

export const metadata = { title: "Politica de Cookies | Kyoszen" };

export default function PoliticaDeCookiesPage() {
  return (
    <>
      <PageHero
        chip="Legal"
        title="Politica de Cookies"
        description="Informacion sobre el uso de cookies y tecnologias similares en kyoszen.com"
      />

      <section className="py-16 px-5 md:px-10 xl:px-20 bg-[var(--color-bg)]">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted)] mb-10">Ultima actualizacion: mayo 2026</p>

          <div className="prose-legal">

            <h2>1. ¿Que son las cookies?</h2>
            <p>Las cookies son pequenos archivos de texto que los sitios web almacenan en su dispositivo (computadora, telefono o tableta) cuando los visita. Permiten que el sitio recuerde sus preferencias y mejoren su experiencia de navegacion. <strong>Integradores Kyoszen SA de CV</strong> (en adelante, "Kyoszen") utiliza cookies y tecnologias similares en el sitio <strong>kyoszen.com</strong> conforme a lo descrito en esta politica.</p>

            <h2>2. Tipos de cookies que utilizamos</h2>

            <h3>Cookies tecnicas o estrictamente necesarias</h3>
            <p>Son indispensables para el funcionamiento basico del Sitio. Permiten la navegacion y el uso de funciones esenciales, como el acceso a formularios y la transmision de informacion en la red. Sin estas cookies, el Sitio no puede operar correctamente. No requieren su consentimiento previo.</p>

            <h3>Cookies analiticas</h3>
            <p>Nos permiten conocer como los visitantes interactuan con el Sitio: paginas visitadas, tiempo de permanencia, errores encontrados y rutas de navegacion. Esta informacion se utiliza de forma agregada y anonima para mejorar el rendimiento del Sitio. Utilizamos <strong>Google Analytics</strong> como herramienta de analisis. Puede consultar la politica de privacidad de Google en <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.</p>

            <h3>Cookies de preferencias</h3>
            <p>Recuerdan sus elecciones (como idioma o region) para ofrecerle una experiencia personalizada en visitas posteriores.</p>

            <h3>Cookies de terceros</h3>
            <p>Algunas funcionalidades del Sitio pueden integrar servicios de terceros (como redes sociales o herramientas de chat) que instalan sus propias cookies. Kyoszen no controla estas cookies y le recomendamos revisar las politicas de privacidad de dichos proveedores.</p>

            <h2>3. Tecnologias similares</h2>
            <p>Ademas de cookies, podemos utilizar:</p>
            <ul>
              <li><strong>Balizas web (web beacons):</strong> imagenes de 1x1 pixel que registran si una pagina fue visitada.</li>
              <li><strong>Registros del servidor:</strong> informacion tecnica como direccion IP, tipo de navegador, sistema operativo, paginas visitadas y fecha y hora de acceso.</li>
              <li><strong>Almacenamiento local del navegador:</strong> similar a las cookies, permite guardar datos en su dispositivo.</li>
            </ul>

            <h2>4. Finalidades del uso de cookies</h2>
            <p>Kyoszen utiliza la informacion recopilada mediante cookies para:</p>
            <ul>
              <li>Garantizar el funcionamiento tecnico del Sitio.</li>
              <li>Analizar el comportamiento de navegacion y mejorar la experiencia del usuario.</li>
              <li>Recordar preferencias de navegacion.</li>
              <li>Medir la efectividad de nuestras comunicaciones digitales.</li>
              <li>Prevenir fraudes y garantizar la seguridad del Sitio.</li>
            </ul>

            <h2>5. Base legal</h2>
            <p>El uso de cookies tecnicas se fundamenta en el interes legitimo de Kyoszen para operar el Sitio correctamente. El uso de cookies analiticas y de preferencias se basa en su consentimiento, el cual puede otorgar o revocar en cualquier momento mediante la configuracion de su navegador.</p>

            <h2>6. Como gestionar o desactivar las cookies</h2>
            <p>Puede configurar su navegador para aceptar, rechazar o eliminar cookies. A continuacion encontrara instrucciones para los navegadores mas comunes:</p>
            <ul>
              <li><strong>Google Chrome:</strong> Configuracion → Privacidad y seguridad → Cookies y otros datos de sitios.</li>
              <li><strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio.</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos del sitio web.</li>
              <li><strong>Microsoft Edge:</strong> Configuracion → Privacidad, busqueda y servicios → Cookies.</li>
            </ul>
            <p>Tenga en cuenta que deshabilitar ciertas cookies puede afectar el funcionamiento de algunas secciones del Sitio.</p>
            <p>Para optar por no participar en el seguimiento de Google Analytics, puede instalar el complemento de inhabilitacion disponible en <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">tools.google.com/dlpage/gaoptout</a>.</p>

            <h2>7. Actualizaciones a esta politica</h2>
            <p>Kyoszen puede actualizar esta Politica de Cookies periodicamente para reflejar cambios tecnicos, legales o en nuestras practicas. Le recomendamos revisar esta pagina con regularidad. Los cambios entran en vigor en el momento de su publicacion.</p>

            <h2>8. Contacto</h2>
            <p>Si tiene dudas sobre el uso de cookies en nuestro Sitio, puede contactarnos en:</p>
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
