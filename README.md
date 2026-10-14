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

## 5. Entregas, reposición y promotores

### Clientes desde el sistema (Excel)
En el **Panel general** → **Importar clientes (Excel)**: elegí el Excel de
clientes que exporta el sistema. Muestra un resumen y recién guarda cuando
confirmás. Trae dirección, ubicación, horario de recepción, vendedor, rutas,
días de visita, RUT, condición de pago y estado de cuenta. Se puede repetir
para actualizar: no duplica (usa el código del cliente) y no pisa lo cargado
a mano (acuerdos, espacios, logística, prioridad, ubicación corregida).

### Configuración
1. En **Usuarios** creá los camioneros y promotores (eligiendo el rol).
2. **Operaciones → Asignación masiva**: elegí clientes por ruta, vendedor o
   departamento y asignales camionero, promotor, días de entrega, días de
   reposición, prioridad (1 = máxima) y tiempo asignado. También se puede
   cliente por cliente en el formulario («Datos de visita» y «Logística»).
3. **Tareas**: tareas para los promotores (ej.: foto de las cabeceras). Las
   fotos se sellan con el nombre del cliente, la fecha y la hora.

### Cada día
- **Camionero / entregador** (*Mi ruta de entregas*): ruta ordenada por
  distancia, horario de recepción y prioridad; Waze o Google Maps; puede
  cambiar el orden (▲ ▼, «Ir ahora»). En cada cliente marca **Llegué** y
  después el resultado: entregado, local cerrado, no recibió el pedido o
  pasar en otro momento. Ve el importe a entregar si el administrador lo cargó.
- **Promotor / reponedor** (*Mi ruta de reposición*): tarjetero (inicio de
  actividad en el primer cliente, descansos y fin); solo ve los locales ya
  entregados (o con reposición sin entrega ese día); marca la reposición
  (terminado, parcial o sin reponer) estando en el local — máximo 2 cuadras;
  hace las tareas con foto; ve dónde está el camionero.
- **Administrador**: *Operaciones* (en vivo, mapa del equipo, importes, ver
  la ruta de cada uno, anular marcas, historial por fecha), *Tarjetero*
  (horas trabajadas y descansos por mes, con Excel) y *Tareas* (fotos hechas).
- Todos los usuarios ven los clientes en la pestaña *Clientes*.

La ubicación del equipo se comparte mientras tienen la web abierta en el
celular (el navegador pide permiso). Es una página web: con la pantalla
apagada el celular deja de enviar la ubicación.

### Datos (no hace falta cambiar las reglas de Firestore)
- `clientes/_jornada`: el día en curso (se reinicia solo cada día).
- `clientes/{id}.operaciones`: historial permanente de entregas y reposiciones.
- `clientes/_pos_{usuario}`: última ubicación de cada usuario.
- `clientes/_tarjetero_AAAA-MM`: marcas del tarjetero de cada mes.
- `clientes/_tareas` y `clientes/{id}.tareasHechas`: tareas y fotos
  (las fotos van a Storage, en `clientes/{id}/tareas/`).

### Rutas
Se calculan en la página (distancia, horario de recepción y prioridad), sin
servicios externos ni claves. Waze y Google Maps se abren sin API key. El
cálculo está separado en `MOTOR_RUTAS` dentro de `index.html`; si en el futuro
se quieren tiempos reales de tránsito (Google Routes, Mapbox,
OpenRouteService), se haría con una función de Vercel y la clave en una
variable de entorno, nunca en el código.
