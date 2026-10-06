# Espacios & Condiciones por Cliente

App para cargar las condiciones y espacios acordados por cliente, con acceso
compartido para todo el equipo de ventas.

## 1. Creá la base de datos (Firebase, gratis)

1. Andá a https://console.firebase.google.com y creá un proyecto nuevo.
2. En el menú lateral: **Compilación → Firestore Database → Crear base de datos**.
   - Elegí **modo de producción**.
   - Región: la más cercana (ej. `southamerica-east1`).
3. Andá a **Configuración del proyecto** (ícono de engranaje) → pestaña
   **General** → sección "Tus apps" → **Agregar app → Web (`</>`)**.
   - Ponele un nombre (ej. "condiciones-clientes") y creá la app.
   - Firebase te va a mostrar un objeto `firebaseConfig` con valores como
     `apiKey`, `authDomain`, `projectId`, etc. **Copialos**.
4. Abrí `index.html` en este proyecto, buscá el bloque que dice:
   ```js
   var firebaseConfig = {
     apiKey: "PEGA_TU_API_KEY",
     ...
   };
   ```
   y pegá ahí los valores reales que te dio Firebase.
5. En el mismo archivo, cambiá:
   ```js
   var EDIT_PASSCODE = "CAMBIAR_ESTA_CLAVE";
   ```
   por la contraseña del administrador (el usuario está en `ADMIN_USER`,
   por defecto `admin`). Al abrir la web aparece una pantalla de ingreso:
   - **Administrador** (usuario + contraseña): puede cargar, editar y
     eliminar clientes, y es el único que ve y sube el **acuerdo firmado**.
   - **Vendedores** (solo lectura): entran con el usuario y contraseña que
     les crea el administrador desde el botón **Usuarios** (arriba a la
     derecha). Ven los clientes y descargan sus PDF, pero no editan ni ven
     los acuerdos firmados. Los usuarios se guardan en el documento
     `clientes/_usuarios` (la contraseña nunca se guarda, solo un hash).
   - Al crear (o después, en la lista) cada usuario tiene un **rol**:
     Vendedor, **Camionero / Repartidor**, **Reponedor** o Administrador.
     Los usuarios creados antes de esto quedan como Vendedor.

   Es un filtro simple, no seguridad fuerte: la clave está en el código y
   los datos se leen con las reglas públicas de Firestore. Si más adelante
   necesitás login real por usuario, se puede agregar Firebase Authentication.

6. **Reglas de seguridad de Firestore** (para que funcione desde la web):
   En Firestore → pestaña **Reglas**, pegá esto y publicá:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /clientes/{docId} {
         allow read: if true;
         allow write: if true;
       }
     }
   }
   ```
   Esto es intencionalmente simple (cualquiera con el link puede leer y
   escribir vía la app). Si en el futuro querés reglas más estrictas
   (por ejemplo atadas a un login), avisame y te las ajusto.

## 2. Subilo a GitHub

1. Creá un repositorio nuevo en https://github.com/new (puede ser privado).
2. Subí los archivos de esta carpeta (`index.html`, este `README.md`) al
   repo — desde la web de GitHub podés arrastrar los archivos directamente
   con "Add file → Upload files".

## 3. Publicalo con Vercel

1. Andá a https://vercel.com y entrá con tu cuenta de GitHub.
2. **Add New → Project**, elegí el repositorio que acabás de crear.
3. No hace falta tocar ninguna configuración de build (es HTML plano) →
   **Deploy**.
4. En un minuto Vercel te da una URL pública (tipo
   `https://tu-proyecto.vercel.app`) — ese es el link que le pasás a
   los vendedores.

## Actualizaciones futuras

Cada vez que cambies algo en `index.html` y lo subas a GitHub (commit),
Vercel vuelve a publicar la app sola, automáticamente.

## 4. Envío automático de acuerdos por email (Resend)

El botón "Enviar ahora desde Distrishop" usa la función `api/enviar-acuerdo.js`,
que Vercel publica sola junto con la página.

1. En https://resend.com → **API Keys** creá una key (o usá la del onboarding).
2. En Vercel → tu proyecto → **Settings → Environment Variables** agregá:
   - `RESEND_API_KEY` = la key de Resend (**nunca** la pongas en el código).
   - `RESEND_FROM` = el remitente, ej. `Distrishop <acuerdos@tudominio.com.uy>`.
     Mientras no verifiques un dominio usá `Distrishop <onboarding@resend.dev>`
     (así solo se puede enviar al email de tu cuenta de Resend, para probar).
   - `RESEND_REPLY_TO` (opcional) = el email donde querés recibir los acuerdos
     firmados cuando el cliente responde.
3. En Vercel → **Deployments** → los tres puntitos del último → **Redeploy**
   (las variables nuevas se aplican recién en el próximo deploy).
4. Para enviarle a clientes: en Resend → **Domains → Add Domain**, poné el
   dominio de la empresa y cargá los registros DNS que te muestra en donde
   esté administrado el dominio. Cuando figure "Verified", cambiá
   `RESEND_FROM` a una dirección de ese dominio y hacé Redeploy.

## 5. Entregas y reposición (camioneros y reponedores)

1. En **Usuarios** creá los camioneros y reponedores (eligiendo el rol).
2. Editá cada cliente → sección **Logística**: camionero, reponedor
   (o "Cualquier reponedor") y los **días de entrega**. Para la ruta, el
   cliente tiene que estar ubicado en el mapa.
3. Cada día:
   - Todos los usuarios ven los clientes (como el vendedor). Arriba hay
     **pestañas** para pasar a lo de cada rol: el camionero y el reponedor
     tienen *Mi ruta* y *Clientes*; el administrador *Clientes* y *Operaciones*.
   - El **camionero** entra y ve *Mi ruta de entregas*: el próximo destino,
     los siguientes en orden y el mapa. Toca **Marcar como entregado**.
   - El local pasa a *Mercadería entregada · pendiente de reposición* y
     aparece solo en la ruta del **reponedor**, que se reordena sin cambiarle
     el destino actual. Toca **Marcar reposición como completada**.
   - El **administrador** ve todo en vivo en **Operaciones** (y el historial
     de días anteriores eligiendo la fecha); puede anular una acción marcada
     por error. El **vendedor** ve el estado de hoy en la ficha del cliente.

Datos (no hace falta cambiar las reglas de Firestore): la jornada del día
está en `clientes/_jornada` y se reinicia sola cada día; el historial
permanente queda en cada cliente (`operaciones`).

Rutas: se calculan en la página con distancia geográfica (sin servicios
externos ni claves). "Cómo llegar" y "Abrir toda la ruta" abren Google Maps
sin necesidad de API key. El cálculo está separado en `MOTOR_RUTAS` dentro
de `index.html`; si en el futuro se quiere usar tiempos reales de tránsito
(Google Routes, Mapbox, OpenRouteService), se haría con una función de
Vercel y la clave en una variable de entorno, nunca en el código.
