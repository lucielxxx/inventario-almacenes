const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding...');

  // 1. Crear Almacenes
  const almacenes = [
    { nombre: 'Norte', ubicacion: 'Zona Norte - Bodega Central' },
    { nombre: 'Sur', ubicacion: 'Zona Sur - Depósito Sur' },
    { nombre: 'Este', ubicacion: 'Zona Este - Almacén Oriente' },
    { nombre: 'Oeste', ubicacion: 'Zona Oeste - Depósito Occidente' },
  ];

  for (const almacen of almacenes) {
    await prisma.almacen.upsert({
      where: { nombre: almacen.nombre },
      update: {},
      create: almacen,
    });
  }
  console.log('✅ 4 Almacenes creados');

  // 2. Crear Categorías
  const categorias = [
    { nombre: 'Cemento y Morteros', descripcion: 'Cemento gris, blanco, mortero' },
    { nombre: 'Bloques y Ladrillos', descripcion: 'Materiales de mampostería' },
    { nombre: 'Acero y Hierro', descripcion: 'Varillas, mallas, perfiles' },
    { nombre: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas' },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: {},
      create: categoria,
    });
  }
  console.log('✅ 4 Categorías creadas');

  // 3. Crear Usuarios (contraseña: 123456)
  const hash = await bcrypt.hash('123456', 10);
  
  const usuarios = [
    { nombre: 'Admin Norte', email: 'norte@inventario.com', contrasena: hash, rol: 'admin_almacen', almacen_id: 1 },
    { nombre: 'Admin Sur', email: 'sur@inventario.com', contrasena: hash, rol: 'admin_almacen', almacen_id: 2 },
    { nombre: 'Admin Este', email: 'este@inventario.com', contrasena: hash, rol: 'admin_almacen', almacen_id: 3 },
    { nombre: 'Admin Oeste', email: 'oeste@inventario.com', contrasena: hash, rol: 'admin_almacen', almacen_id: 4 },
    { nombre: 'Super Admin', email: 'super@inventario.com', contrasena: hash, rol: 'super_admin', almacen_id: null },
  ];

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: usuario,
    });
  }
  console.log('✅ 5 Usuarios creados (contraseña: 123456)');

  console.log('🎉 Seeding completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });