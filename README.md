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
   - **Solo lectura** (un botón, sin clave): ve los clientes y descarga
     sus PDF, como siempre.

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
