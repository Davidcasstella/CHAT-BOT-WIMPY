// server.js - Servidor con Fotos del Catálogo General - PARTE 1 de 2

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Importar clases personalizadas
const ConfigManager = require('./ConfigManager');
const CooldownManager = require('./CooldownManager');
const MenuHandler = require('./MenuHandler');
const MessageProcessor = require('./MessageProcessor');
const WhatsAppConnection = require('./WhatsAppConnection');

// ==================== CONFIGURACIÓN DEL SERVIDOR ====================

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Servir archivos de audio e imágenes
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// ==================== CONFIGURACIÓN DE MULTER PARA AUDIO ====================

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const audioDir = path.join(__dirname, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    // Preservar la extensión original del archivo
    const extension = path.extname(file.originalname).toLowerCase() || '.ogg';
    cb(null, `saludo-daniela${extension}`);
  }
});

const uploadAudio = multer({ 
  storage: audioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['audio/ogg', 'audio/mpeg', 'audio/mp3', 'application/octet-stream'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.ogg') || file.originalname.endsWith('.mp3')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de audio no permitido. Usa OGG o MP3.'));
    }
  }
});

// ==================== CONFIGURACIÓN DE MULTER PARA FOTOS DEL CATÁLOGO ====================

// ==================== CONFIGURACIÓN DE MULTER PARA FOTOS DEL CATÁLOGO ====================

const catalogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const catalogoDir = path.join(__dirname, 'imagenes', 'catalogo');
    if (!fs.existsSync(catalogoDir)) {
      fs.mkdirSync(catalogoDir, { recursive: true });
    }
    cb(null, catalogoDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `catalogo-${timestamp}${extension}`);
  }
});

const uploadCatalogo = multer({
  storage: catalogoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo para subir
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, GIF o WEBP.'));
    }
  }
});

// ==================== CONFIGURACIÓN DE MULTER PARA PDFs DEL CATÁLOGO ====================

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const pdfDir = path.join(__dirname, 'imagenes', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    cb(null, pdfDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `pdf-${timestamp}${extension}`);
  }
});

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB máximo para PDFs
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo se aceptan archivos PDF.'));
    }
  }
});

// ==================== INICIALIZACIÓN DE CLASES ====================

const configManager = new ConfigManager();
const cooldownManager = new CooldownManager(configManager.obtenerConfig().cooldown);

let whatsappConnection = null;
let menuHandler = null;
let messageProcessor = null;

// ==================== FUNCIONES DE INICIALIZACIÓN ====================

async function inicializarBot() {
  messageProcessor = new MessageProcessor(null, configManager, cooldownManager, null);
  whatsappConnection = new WhatsAppConnection(messageProcessor);
  messageProcessor.sock = whatsappConnection.sock;
  menuHandler = new MenuHandler(null, configManager, cooldownManager);
  messageProcessor.menuHandler = menuHandler;
  
  await whatsappConnection.conectar();
  
  const intervalo = setInterval(() => {
    if (whatsappConnection.obtenerSock()) {
      messageProcessor.sock = whatsappConnection.obtenerSock();
      menuHandler.sock = whatsappConnection.obtenerSock();
    }
  }, 1000);
}

// ==================== ENDPOINTS API ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/editor.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.get('/status', (req, res) => {
  const config = configManager.obtenerConfig();
  const estado = whatsappConnection ? whatsappConnection.obtenerEstado() : { conectado: false };
  const estadisticas = cooldownManager.obtenerEstadisticas();
  const usuariosActivos = cooldownManager.obtenerUsuariosActivos();

  res.json({ 
    status: estado.conectado ? 'conectado' : 'desconectado',
    empresa: config.empresa_nombre,
    cooldownMinutos: config.cooldown,
    mensajesProcesados: estadisticas.mensajesProcesados,
    usuariosEnCooldown: usuariosActivos,
    miNumero: estado.miNumero || 'No disponible'
  });
});

app.post('/update-config', (req, res) => {
  try {
    const newConfig = req.body;
    const guardado = configManager.guardarConfiguracion(newConfig);
    
    if (guardado) {
      cooldownManager.actualizarCooldownMinutos(newConfig.cooldown);
      console.log('✅ Configuración actualizada en tiempo real');
      res.json({ 
        message: 'Configuración actualizada en tiempo real',
        success: true 
      });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/get-config', (req, res) => {
  res.json(configManager.obtenerConfig());
});

// ==================== ENDPOINTS PARA AUDIO ====================

app.post('/upload-audio', uploadAudio.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Eliminar audios antiguos con otras extensiones
    const audioDir = path.join(__dirname, 'audio');
    const extensiones = ['.ogg', '.mp3'];
    const extensionActual = path.extname(req.file.filename).toLowerCase();

    extensiones.forEach(ext => {
      if (ext !== extensionActual) {
        const rutaAntigua = path.join(audioDir, `saludo-daniela${ext}`);
        if (fs.existsSync(rutaAntigua)) {
          fs.unlinkSync(rutaAntigua);
          console.log(`🗑️ Audio antiguo eliminado: saludo-daniela${ext}`);
        }
      }
    });

    console.log('✅ Audio subido correctamente:', req.file.filename);
    res.json({
      message: 'Audio actualizado correctamente',
      filename: req.file.filename,
      size: req.file.size,
      success: true
    });
  } catch (error) {
    console.error('❌ Error subiendo audio:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/check-audio', (req, res) => {
  const audioDir = path.join(__dirname, 'audio');
  const extensiones = ['.ogg', '.mp3'];

  let archivoEncontrado = null;

  for (const ext of extensiones) {
    const rutaAudio = path.join(audioDir, `saludo-daniela${ext}`);
    if (fs.existsSync(rutaAudio)) {
      archivoEncontrado = {
        path: rutaAudio,
        filename: `saludo-daniela${ext}`,
        extension: ext
      };
      break;
    }
  }

  if (archivoEncontrado) {
    const stats = fs.statSync(archivoEncontrado.path);
    res.json({
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      filename: archivoEncontrado.filename,
      extension: archivoEncontrado.extension
    });
  } else {
    res.json({ exists: false });
  }
});

// ==================== NUEVOS ENDPOINTS PARA FOTOS DEL CATÁLOGO ====================

// ==================== ENDPOINT CON COMPRESIÓN AUTOMÁTICA ====================

app.post('/upload-foto-catalogo', uploadCatalogo.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }
    
    const descripcion = req.body.descripcion || '';
    const archivoOriginal = req.file.path;
    const pesoOriginal = req.file.size;
    
    console.log(`📸 Imagen recibida: ${req.file.filename} (${(pesoOriginal / 1024).toFixed(2)} KB)`);
    
    // ========== COMPRESIÓN AUTOMÁTICA CON SHARP ==========
    const sharp = require('sharp');
    
    try {
      // Comprimir imagen manteniendo buena calidad
      await sharp(archivoOriginal)
        .resize(1200, 1200, {
          fit: 'inside',           // Mantiene proporciones
          withoutEnlargement: true // No agranda imágenes pequeñas
        })
        .jpeg({ 
          quality: 80,             // Calidad 80% (buen balance)
          progressive: true,       // Carga progresiva
          mozjpeg: true           // Mejor compresión
        })
        .toFile(archivoOriginal + '.optimized');
      
      // Reemplazar archivo original con el optimizado
      fs.unlinkSync(archivoOriginal);
      fs.renameSync(archivoOriginal + '.optimized', archivoOriginal);
      
      // Obtener nuevo tamaño
      const stats = fs.statSync(archivoOriginal);
      const pesoComprimido = stats.size;
      const porcentajeReduccion = ((pesoOriginal - pesoComprimido) / pesoOriginal * 100).toFixed(1);
      
      console.log(`✅ Imagen comprimida:`);
      console.log(`   - Original: ${(pesoOriginal / 1024).toFixed(2)} KB`);
      console.log(`   - Comprimida: ${(pesoComprimido / 1024).toFixed(2)} KB`);
      console.log(`   - Reducción: ${porcentajeReduccion}% 📉`);
      
    } catch (compressError) {
      console.warn('⚠️ Error al comprimir, usando original:', compressError.message);
    }
    
    // ========== GUARDAR EN CONFIGURACIÓN ==========
    configManager.recargarConfiguracion();
    const config = configManager.obtenerConfig();
    
    if (!config.fotos_catalogo) {
      config.fotos_catalogo = { habilitado: false, fotos: [] };
    }
    if (!Array.isArray(config.fotos_catalogo.fotos)) {
      config.fotos_catalogo.fotos = [];
    }
    
    config.fotos_catalogo.fotos.push({
      filename: req.file.filename,
      descripcion: descripcion,
      path: `/imagenes/catalogo/${req.file.filename}`,
      timestamp: Date.now(),
      pesoKB: (fs.statSync(archivoOriginal).size / 1024).toFixed(2)
    });
    
    const guardado = configManager.guardarConfiguracion(config);
    
    if (guardado) {
      const stats = fs.statSync(archivoOriginal);
      console.log(`📸 Total de fotos en catálogo: ${config.fotos_catalogo.fotos.length}`);
      
      res.json({ 
        message: 'Foto del catálogo subida y comprimida correctamente',
        filename: req.file.filename,
        path: `/imagenes/catalogo/${req.file.filename}`,
        pesoOriginal: (pesoOriginal / 1024).toFixed(2) + ' KB',
        pesoFinal: (stats.size / 1024).toFixed(2) + ' KB',
        reduccion: ((pesoOriginal - stats.size) / pesoOriginal * 100).toFixed(1) + '%',
        totalFotos: config.fotos_catalogo.fotos.length,
        success: true
      });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('❌ Error subiendo foto del catálogo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/delete-foto-catalogo/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const config = configManager.obtenerConfig();
    
    if (config.fotos_catalogo && config.fotos_catalogo.fotos) {
      const rutaFoto = path.join(__dirname, 'imagenes', 'catalogo', filename);
      
      // Eliminar archivo físico
      if (fs.existsSync(rutaFoto)) {
        fs.unlinkSync(rutaFoto);
      }
      
      // Eliminar de configuración
      config.fotos_catalogo.fotos = config.fotos_catalogo.fotos.filter(
        foto => foto.filename !== filename
      );
      
      configManager.guardarConfiguracion(config);
      
      console.log(`✅ Foto del catálogo eliminada: ${filename}`);
      res.json({ message: 'Foto eliminada correctamente', success: true });
    } else {
      res.status(404).json({ error: 'Foto no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error eliminando foto del catálogo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/toggle-fotos-catalogo', (req, res) => {
  try {
    // CORREGIDO: Recargar antes de modificar
    configManager.recargarConfiguracion();
    const config = configManager.obtenerConfig();
    
    if (!config.fotos_catalogo) {
      config.fotos_catalogo = { habilitado: false, fotos: [] };
    }
    
    config.fotos_catalogo.habilitado = !config.fotos_catalogo.habilitado;
    
    const guardado = configManager.guardarConfiguracion(config);
    
    if (guardado) {
      console.log(`✅ Fotos del catálogo ${config.fotos_catalogo.habilitado ? 'activadas' : 'desactivadas'}`);
      res.json({ 
        habilitado: config.fotos_catalogo.habilitado,
        message: `Fotos del catálogo ${config.fotos_catalogo.habilitado ? 'activadas' : 'desactivadas'}`,
        success: true 
      });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/list-fotos-catalogo', (req, res) => {
  const config = configManager.obtenerConfig();
  res.json(config.fotos_catalogo || { habilitado: false, fotos: [] });
});

// ==================== ENDPOINTS PARA PDFs DEL CATÁLOGO ====================

app.post('/upload-pdf-catalogo', uploadPDF.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo PDF' });
    }

    const descripcion = req.body.descripcion || '';
    const nombreOriginal = req.file.originalname;
    const pesoKB = (req.file.size / 1024).toFixed(2);

    console.log(`📄 PDF recibido: ${req.file.filename} (${pesoKB} KB)`);

    // Guardar en configuración
    configManager.recargarConfiguracion();
    const config = configManager.obtenerConfig();

    if (!config.pdfs_catalogo) {
      config.pdfs_catalogo = { habilitado: false, pdfs: [] };
    }
    if (!Array.isArray(config.pdfs_catalogo.pdfs)) {
      config.pdfs_catalogo.pdfs = [];
    }

    config.pdfs_catalogo.pdfs.push({
      filename: req.file.filename,
      nombreOriginal: nombreOriginal,
      descripcion: descripcion,
      path: `/imagenes/pdfs/${req.file.filename}`,
      timestamp: Date.now(),
      pesoKB: pesoKB
    });

    const guardado = configManager.guardarConfiguracion(config);

    if (guardado) {
      console.log(`📄 Total de PDFs en catálogo: ${config.pdfs_catalogo.pdfs.length}`);

      res.json({
        message: 'PDF subido correctamente',
        filename: req.file.filename,
        nombreOriginal: nombreOriginal,
        path: `/imagenes/pdfs/${req.file.filename}`,
        pesoKB: pesoKB + ' KB',
        totalPdfs: config.pdfs_catalogo.pdfs.length,
        success: true
      });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('❌ Error subiendo PDF del catálogo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/delete-pdf-catalogo/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const config = configManager.obtenerConfig();

    if (config.pdfs_catalogo && config.pdfs_catalogo.pdfs) {
      const rutaPdf = path.join(__dirname, 'imagenes', 'pdfs', filename);

      // Eliminar archivo físico
      if (fs.existsSync(rutaPdf)) {
        fs.unlinkSync(rutaPdf);
      }

      // Eliminar de configuración
      config.pdfs_catalogo.pdfs = config.pdfs_catalogo.pdfs.filter(
        pdf => pdf.filename !== filename
      );

      configManager.guardarConfiguracion(config);

      console.log(`✅ PDF del catálogo eliminado: ${filename}`);
      res.json({ message: 'PDF eliminado correctamente', success: true });
    } else {
      res.status(404).json({ error: 'PDF no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error eliminando PDF del catálogo:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/toggle-pdfs-catalogo', (req, res) => {
  try {
    configManager.recargarConfiguracion();
    const config = configManager.obtenerConfig();

    if (!config.pdfs_catalogo) {
      config.pdfs_catalogo = { habilitado: false, pdfs: [] };
    }

    config.pdfs_catalogo.habilitado = !config.pdfs_catalogo.habilitado;

    const guardado = configManager.guardarConfiguracion(config);

    if (guardado) {
      console.log(`✅ PDFs del catálogo ${config.pdfs_catalogo.habilitado ? 'activados' : 'desactivados'}`);
      res.json({
        habilitado: config.pdfs_catalogo.habilitado,
        message: `PDFs del catálogo ${config.pdfs_catalogo.habilitado ? 'activados' : 'desactivados'}`,
        success: true
      });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/list-pdfs-catalogo', (req, res) => {
  const config = configManager.obtenerConfig();
  res.json(config.pdfs_catalogo || { habilitado: false, pdfs: [] });
});

// ==================== CONTINÚA EN PARTE 2... ====================
// server.js - PARTE 2 de 2
// CONTINÚA DESDE LA PARTE 1... (El resto es igual que antes)

// ==================== ENDPOINTS ORIGINALES ====================

app.get('/qr', (req, res) => {
  if (!whatsappConnection) {
    res.json({ qr: null, connected: false });
    return;
  }

  const estado = whatsappConnection.obtenerEstado();
  const qr = whatsappConnection.obtenerQR();
  
  if (qr) {
    res.json({ qr: qr, connected: false });
  } else if (estado.conectado) {
    res.json({ qr: null, connected: true });
  } else {
    res.json({ qr: null, connected: false });
  }
});

app.post('/reset-cooldown/:telefono', (req, res) => {
  const telefono = req.params.telefono + '@s.whatsapp.net';
  cooldownManager.resetearCooldown(telefono);
  
  res.json({ 
    message: `Cooldown eliminado para ${req.params.telefono}`,
    puedeResponder: true 
  });
});

app.post('/reset-all-cooldowns', (req, res) => {
  const cantidad = cooldownManager.resetearTodosCooldowns();
  res.json({ 
    message: `${cantidad} cooldowns eliminados correctamente` 
  });
});

app.post('/clear-cache', (req, res) => {
  cooldownManager.limpiarCache();
  res.json({ message: 'Cache limpiado correctamente' });
});

app.post('/force-reconnect', async (req, res) => {
  try {
    console.log('🔄 Reconexión forzada');
    
    if (!whatsappConnection) {
      res.json({ 
        message: 'Inicializando conexión...',
        success: true
      });
      await inicializarBot();
      return;
    }

    const estado = whatsappConnection.obtenerEstado();
    
    if (estado.conectado) {
      return res.json({ 
        message: 'Ya está conectado a WhatsApp',
        success: false,
        connected: true
      });
    }
    
    whatsappConnection.forzarCierre();
    
    setTimeout(async () => {
      await whatsappConnection.conectar();
    }, 1000);
    
    res.json({ 
      message: 'Reconexión forzada',
      success: true
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/logout', async (req, res) => {
  try {
    if (whatsappConnection) {
      const cerrado = await whatsappConnection.cerrarSesion();
      
      if (cerrado) {
        setTimeout(() => {
          whatsappConnection.conectar();
        }, 2000);
        
        res.json({ message: 'Sesión cerrada correctamente' });
      } else {
        res.json({ message: 'No hay sesión activa' });
      }
    } else {
      res.json({ message: 'Bot no inicializado' });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/clear-session', async (req, res) => {
  try {
    const authFolder = path.join(__dirname, 'auth_info');
    
    if (whatsappConnection) {
      try {
        await whatsappConnection.cerrarSesion();
      } catch (e) {
        console.log('⚠️ Forzando cierre...');
      }
      whatsappConnection.forzarCierre();
    }
    
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log('✅ Sesión limpiada');
    }
    
    setTimeout(() => {
      if (whatsappConnection) {
        whatsappConnection.conectar();
      } else {
        inicializarBot();
      }
    }, 3000);
    
    res.json({ 
      message: 'Sesión limpiada - Generando nuevo QR',
      needsRestart: false,
      autoReconnect: true
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  const config = configManager.obtenerConfig();
  
  console.log(`\n📱 BOT DE WHATSAPP - ${config.empresa_nombre} 🎯`);
  console.log(`🌐 Panel: http://localhost:${PORT}`);
  console.log(`📝 Editor: http://localhost:${PORT}/editor.html`);
  console.log(`📊 API: http://localhost:${PORT}/status\n`);
  
  console.log('⚡ CARACTERÍSTICAS:');
  console.log('   • 🎤 Audio de saludo: ✅');
  console.log('   • 📸 Fotos del catálogo: ✅');
  console.log('   • 📄 PDFs del catálogo: ✅');
  console.log('   • 📱 Catálogos dinámicos: ✅');
  console.log('   • 🔄 Actualización en tiempo real: ✅');
  console.log('   • 👤 Derivación a asesor: ✅');
  console.log('   • 🚫 Números bloqueados: ✅');
  console.log(`   • ⏰ Cooldown: ${config.cooldown} minutos\n`);

  // Crear carpetas necesarias
  const carpetas = ['public', 'audio', path.join('imagenes', 'catalogo'), path.join('imagenes', 'pdfs')];
  carpetas.forEach(carpeta => {
    const ruta = path.join(__dirname, carpeta);
    if (!fs.existsSync(ruta)) {
      fs.mkdirSync(ruta, { recursive: true });
      console.log(`📁 Carpeta "${carpeta}" creada`);
    }
  });
  
  console.log('');
  
  // Inicializar bot
  inicializarBot();
});

// ==================== MANEJO DE ERRORES ====================

process.on('unhandledRejection', (err) => {
  console.error('❌ Error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción:', err.message);
});