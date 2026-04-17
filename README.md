# Sistema de Gestión de Inventario - Almacenes Obras Públicas

Sistema web para la gestión centralizada de inventario de 4 almacenes (Norte, Sur, Este, Oeste) de materiales de construcción y mantenimiento de obras públicas.

## Tecnologías utilizadas

- **Backend**: Node.js + Express + Prisma ORM
- **Frontend**: React.js
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **PDF**: @react-pdf/renderer

## Requisitos previos

- Node.js (versión 22 LTS o superior)
- PostgreSQL (versión 15 o superior)
- npm o pnpm

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventario-almacenes

2. Configurar la base de datos PostgreSQL
Inicia PostgreSQL y crea una base de datos vacía (opcional, Prisma puede crearla automáticamente):

CREATE DATABASE inventario_almacenes;

2 Configura las credenciales en el archivo .env:

DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/inventario_almacenes"
3. Configurar el backend




cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

El backend correrá en http://localhost:3000

4. Configurar el frontend
cd ../frontend
npm install
npm start


El frontend correrá en http://localhost:3001

Credenciales de acceso
Usuario	Email	Contraseña	Rol
Admin Norte	norte@inventario.com	123456	admin_almacen
Admin Sur	sur@inventario.com	123456	admin_almacen
Admin Este	este@inventario.com	123456	admin_almacen
Admin Oeste	oeste@inventario.com	123456	admin_almacen
Super Admin	super@inventario.com	123456	super_admin


Funcionalidades del sistema
Gestión de usuarios y roles
Admin de almacén: Solo puede ver y gestionar el inventario de su almacén asignado

Super Admin: Puede ver y gestionar los 4 almacenes

Gestión de materiales
Crear materiales: Registrar nuevos materiales con código, nombre, categoría, unidad de medida y stock mínimo

Ver inventario: Visualizar todos los materiales de un almacén con su stock actual

Alertas de stock: Sistema de colores y etiquetas para bajo stock (⚠️) y sin stock (❌)

Movimientos de inventario
Entrada de materiales: Registrar ingreso de materiales con:

Cantidad

Proveedor

Número de comprobante

Nombre de quien entrega

Motivo

Salida de materiales: Registrar egreso de materiales con:

Cantidad

Obra destino

Nombre de quien recibe

Cargo de la persona

Motivo

Constancias PDF
Generación automática de constancia en PDF después de cada movimiento

Incluye: datos del material, persona involucrada, firmas, y detalles específicos según entrada o salida

Seguridad
Autenticación mediante JWT

Middleware de verificación de acceso por rol y almacén

Contraseñas hasheadas con bcrypt


Estructura de la base de datos

Almacen (id, nombre, ubicacion)
Usuario (id, nombre, email, contrasena, rol, almacen_id)
Categoria (id, nombre, descripcion)
Material (id, codigo, nombre, categoria_id, unidad_medida, stock_minimo)
Inventario (id, almacen_id, material_id, cantidad)
Movimiento (id, almacen_id, material_id, usuario_id, tipo, cantidad, motivo, persona_nombre, persona_identidad, persona_cargo, obra_destino, proveedor_nombre, comprobante_numero, observaciones)


Scripts disponibles
Backend (/backend)

Comando	Descripción
npm run dev	Inicia el servidor con auto-reinicio
npm start	Inicia el servidor en producción
npx prisma studio	Abre interfaz visual para ver la base de datos
npx prisma migrate dev	Ejecuta migraciones pendientes
node prisma/seed.js	Ejecuta los datos iniciales



***********************


Frontend (/frontend)

Comando	Descripción
npm start	Inicia la aplicación React
npm run build	Genera build para producción


Login
https://screenshots/login.png

Dashboard - Super Admin
https://screenshots/dashboard-superadmin.png

Dashboard - Admin Almacén
https://screenshots/dashboard-admin.png

Registrar movimiento
https://screenshots/movimiento.png

Constancia PDF
https://screenshots/pdf.png



Posibles problemas y soluciones

# Windows
sc query | findstr /i "postgres"

# Linux/Mac
sudo systemctl status postgresql

Error de migración de Prisma

npx prisma migrate reset
npx prisma migrate dev --name init
npx prisma db seed

El frontend no carga los materiales
Verifica que el backend esté corriendo en el puerto 3000

Revisa que el token JWT sea válido

Limpia la caché del navegador (Ctrl + Shift + R)

Mejoras futuras
Reportes estadísticos de consumo por obra

Códigos de barras para materiales

Historial de movimientos por material

Exportar inventario a Excel

Notificaciones por correo para stock bajo


Licencia
Uso educativo - No comercial
