const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const SECRET_KEY = 'clave_secreta_para_jwt_cambiar_en_produccion';

// Middleware
app.use(cors());
app.use(express.json());

// =============================================
// Middleware para verificar token
// =============================================
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// =============================================
// Middleware para verificar acceso a almacén
// =============================================
function verificarAccesoAlmacen(req, res, next) {
  const { almacen_id } = req.params;
  const usuario = req.usuario;

  if (usuario.rol === 'super_admin') {
    next(); // Super admin puede acceder a todo
  } else if (usuario.almacen_id === parseInt(almacen_id)) {
    next(); // Admin puede acceder solo a su almacén
  } else {
    res.status(403).json({ error: 'No tienes acceso a este almacén' });
  }
}

// =============================================
// Ruta de login
// =============================================
app.post('/api/login', async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { almacen: true }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        almacen_id: usuario.almacen_id
      },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        almacen: usuario.almacen
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// =============================================
// Ruta para obtener inventario de un almacén
// =============================================
app.get('/api/inventario/:almacen_id', verificarToken, verificarAccesoAlmacen, async (req, res) => {
  const { almacen_id } = req.params;

  try {
    const inventario = await prisma.inventario.findMany({
      where: { almacen_id: parseInt(almacen_id) },
      include: {
        material: {
          include: { categoria: true }
        },
        almacen: true
      }
    });
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// =============================================
// Ruta para obtener todos los almacenes (solo super_admin)
// =============================================
app.get('/api/almacenes', verificarToken, async (req, res) => {
  if (req.usuario.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  try {
    const almacenes = await prisma.almacen.findMany();
    res.json(almacenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener almacenes' });
  }
});

// =============================================
// Ruta para registrar movimiento (entrada/salida)
// =============================================
app.post('/api/movimiento', verificarToken, async (req, res) => {
  const { 
    almacen_id, 
    material_id, 
    tipo, 
    cantidad, 
    motivo,
    persona_nombre,
    persona_identidad,
    persona_cargo,
    obra_destino,
    proveedor_nombre,
    comprobante_numero,
    observaciones
  } = req.body;
  
  const usuario_id = req.usuario.id;

  if (req.usuario.rol !== 'super_admin' && req.usuario.almacen_id !== almacen_id) {
    return res.status(403).json({ error: 'No tienes acceso a este almacén' });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear movimiento con todos los campos
      const movimiento = await tx.movimiento.create({
        data: {
          almacen_id,
          material_id,
          usuario_id,
          tipo,
          cantidad,
          motivo,
          persona_nombre,
          persona_identidad,
          persona_cargo,
          obra_destino: tipo === 'salida' ? obra_destino : null,
          proveedor_nombre: tipo === 'entrada' ? proveedor_nombre : null,
          comprobante_numero,
          observaciones
        }
      });

      // Actualizar inventario
      if (tipo === 'entrada') {
        await tx.inventario.upsert({
          where: {
            almacen_id_material_id: {
              almacen_id,
              material_id
            }
          },
          update: {
            cantidad: { increment: cantidad }
          },
          create: {
            almacen_id,
            material_id,
            cantidad
          }
        });
      } else {
        const inventarioActual = await tx.inventario.findUnique({
          where: {
            almacen_id_material_id: {
              almacen_id,
              material_id
            }
          }
        });

        if (!inventarioActual || inventarioActual.cantidad < cantidad) {
          throw new Error('Stock insuficiente');
        }

        await tx.inventario.update({
          where: {
            almacen_id_material_id: {
              almacen_id,
              material_id
            }
          },
          data: {
            cantidad: { decrement: cantidad }
          }
        });
      }

      return movimiento;
    });

    res.json({ success: true, movimiento: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al registrar movimiento' });
  }
});

// Obtener todos los materiales (para el formulario)
app.get('/api/materiales', verificarToken, async (req, res) => {
  try {
    const materiales = await prisma.material.findMany({
      include: { 
        categoria: true 
      },
      orderBy: { id: 'desc' } // Los más nuevos primero
    });
    res.json(materiales);
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// Crear nuevo material
app.post('/api/materiales', verificarToken, async (req, res) => {
  const { codigo, nombre, categoria_id, unidad_medida, stock_minimo } = req.body;
  
  if (!codigo || !nombre || !categoria_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  try {
    const existing = await prisma.material.findUnique({
      where: { codigo }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un material con ese código' });
    }
    
    // Crear el material
    const material = await prisma.material.create({
      data: {
        codigo,
        nombre,
        descripcion: req.body.descripcion || '',
        categoria_id: parseInt(categoria_id),
        unidad_medida: unidad_medida || 'unidad',
        stock_minimo: stock_minimo || 5
      }
    });
    
    // Crear inventario para los 4 almacenes con cantidad 0
    const almacenes = await prisma.almacen.findMany();
    
    for (const almacen of almacenes) {
      await prisma.inventario.upsert({
        where: {
          almacen_id_material_id: {
            almacen_id: almacen.id,
            material_id: material.id
          }
        },
        update: {},
        create: {
          almacen_id: almacen.id,
          material_id: material.id,
          cantidad: 0
        }
      });
    }
    
    res.json({ success: true, material });
    
  } catch (error) {
    console.error('Error al crear material:', error);
    res.status(500).json({ error: 'Error al crear material' });
  }
});


// =============================================
// Obtener todos los materiales
// =============================================
app.get('/api/materiales', verificarToken, async (req, res) => {
  try {
    const materiales = await prisma.material.findMany({
      include: { 
        categoria: true 
      }
    });
    res.json(materiales);
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// =============================================
// Crear nuevo material
// =============================================
app.post('/api/materiales', verificarToken, async (req, res) => {
  const { codigo, nombre, categoria_id, unidad_medida, stock_minimo } = req.body;
  
  // Validar campos requeridos
  if (!codigo || !nombre || !categoria_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  try {
    // Verificar si ya existe un material con el mismo código
    const existing = await prisma.material.findUnique({
      where: { codigo }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un material con ese código' });
    }
    
    const material = await prisma.material.create({
      data: {
        codigo,
        nombre,
        descripcion: req.body.descripcion || '',
        categoria_id: parseInt(categoria_id),
        unidad_medida: unidad_medida || 'unidad',
        stock_minimo: stock_minimo || 5
      }
    });
    
    res.json({ success: true, material });
  } catch (error) {
    console.error('Error al crear material:', error);
    res.status(500).json({ error: 'Error al crear material' });
  }
});

// =============================================
// Obtener inventario de un almacén (ya la tienes)
// =============================================
// ... (la ruta GET /api/inventario/:almacen_id ya existe)

// =============================================
// Registrar movimiento (ya la tienes)
// =============================================
// ... (la ruta POST /api/movimiento ya existe)

// =============================================
// Iniciar servidor
// =============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});