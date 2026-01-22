// MenuHandler.js - Muestra menú automáticamente después de cada opción
const path = require('path');
const fs = require('fs');

class MenuHandler {
  constructor(sock, configManager, cooldownManager) {
    this.sock = sock;
    this.configManager = configManager;
    this.cooldownManager = cooldownManager;
  }

  async enviarAudioSaludo(from) {
    try {
      const audioDir = path.join(__dirname, 'audio');
      const extensiones = ['.ogg', '.mp3'];

      let archivoAudio = null;
      let mimetype = 'audio/ogg; codecs=opus';

      for (const ext of extensiones) {
        const rutaAudio = path.join(audioDir, `saludo-daniela${ext}`);
        if (fs.existsSync(rutaAudio)) {
          archivoAudio = rutaAudio;
          mimetype = ext === '.mp3' ? 'audio/mpeg' : 'audio/ogg; codecs=opus';
          break;
        }
      }

      if (archivoAudio) {
        const audioBuffer = fs.readFileSync(archivoAudio);

        await this.sock.sendMessage(from, {
          audio: audioBuffer,
          mimetype: mimetype,
          ptt: true
        });

        console.log(`🎤 Audio enviado a ${from.split('@')[0]}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } else {
        console.log(`⚠️ No se encontró archivo de audio`);
      }
    } catch (error) {
      console.error('❌ Error enviando audio:', error.message);
    }
    return false;
  }

  async enviarFotosCatalogoNuevaConversacion(from) {
    try {
      if (!this.configManager.estaHabilitadoFotosCatalogo()) {
        console.log(`📸 Fotos del catálogo deshabilitadas`);
        return false;
      }

      const fotos = this.configManager.obtenerFotosCatalogo();

      if (fotos.length === 0) {
        console.log(`📸 No hay fotos para enviar`);
        return false;
      }

      console.log(`📸 NUEVA CONVERSACIÓN - Enviando ${fotos.length} fotos del catálogo...`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      for (const foto of fotos) {
        const rutaFoto = path.join(__dirname, 'imagenes', 'catalogo', foto.filename);

        if (fs.existsSync(rutaFoto)) {
          const imageBuffer = fs.readFileSync(rutaFoto);

          await this.sock.sendMessage(from, {
            image: imageBuffer,
            caption: foto.descripcion || ''
          });

          console.log(`  ✅ Foto enviada: ${foto.filename}`);
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          console.log(`  ⚠️ Foto no encontrada: ${foto.filename}`);
        }
      }

      console.log(`✅ Fotos del catálogo enviadas completamente`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando fotos del catálogo:', error.message);
      return false;
    }
  }

  async enviarPdfsCatalogoNuevaConversacion(from) {
    try {
      if (!this.configManager.estaHabilitadoPdfsCatalogo()) {
        console.log(`📄 PDFs del catálogo deshabilitados`);
        return false;
      }

      const pdfs = this.configManager.obtenerPdfsCatalogo();

      if (pdfs.length === 0) {
        console.log(`📄 No hay PDFs para enviar`);
        return false;
      }

      console.log(`📄 NUEVA CONVERSACIÓN - Enviando ${pdfs.length} PDFs del catálogo...`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      for (const pdf of pdfs) {
        const rutaPdf = path.join(__dirname, 'imagenes', 'pdfs', pdf.filename);

        if (fs.existsSync(rutaPdf)) {
          const pdfBuffer = fs.readFileSync(rutaPdf);

          await this.sock.sendMessage(from, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: pdf.nombreOriginal || pdf.filename,
            caption: pdf.descripcion || ''
          });

          console.log(`  ✅ PDF enviado: ${pdf.nombreOriginal || pdf.filename}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`  ⚠️ PDF no encontrado: ${pdf.filename}`);
        }
      }

      console.log(`✅ PDFs del catálogo enviados completamente`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando PDFs del catálogo:', error.message);
      return false;
    }
  }

  async mostrarMenuPrincipal(from, telefono) {
    const config = this.configManager.obtenerConfig();
    const estado = this.cooldownManager.obtenerEstado(from);

    const esNuevaConversacion = (estado === 'inicial');

    console.log(`📋 Mostrando menú a ${telefono}`);
    console.log(`📸 Nueva conversación: ${esNuevaConversacion ? 'SÍ' : 'NO'}`);

    // 1. Enviar audio de saludo SOLO en nueva conversación
    if (esNuevaConversacion) {
      await this.enviarAudioSaludo(from);
    }

    // 2. Enviar menú principal
    await this.sock.sendMessage(from, { text: config.menu_principal });

    // 3. Enviar fotos SOLO en nueva conversación
    if (esNuevaConversacion) {
      await this.enviarFotosCatalogoNuevaConversacion(from);
    } else {
      console.log(`📸 Conversación activa - Fotos omitidas`);
    }

    // 4. Enviar PDFs SOLO en nueva conversación
    if (esNuevaConversacion) {
      await this.enviarPdfsCatalogoNuevaConversacion(from);
    } else {
      console.log(`📄 Conversación activa - PDFs omitidos`);
    }

    // 5. Establecer estado menu_principal
    this.cooldownManager.establecerEstado(from, 'menu_principal');

    console.log(`✅ Menú completo enviado a ${telefono}`);
  }

  // ========== NUEVO: Mostrar SOLO el menú (sin audio ni fotos) ==========
  async mostrarMenuSolo(from) {
    const config = this.configManager.obtenerConfig();
    await this.sock.sendMessage(from, { text: config.menu_principal });
    this.cooldownManager.establecerEstado(from, 'menu_principal');
    console.log(`📋 Menú reenviado`);
  }

  async procesarOpcionMenu(from, opcion, telefono) {
    const config = this.configManager.obtenerConfig();

    try {
      await this.sock.sendPresenceUpdate('composing', from);

      switch(opcion) {
        case '1': // Listado de iPhones
          await this.sock.sendMessage(from, { text: config.catalogo_iphones });
          console.log(`✅ Catálogo iPhone enviado a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

       case '2': // Accesorios iPhone
          await this.sock.sendMessage(from, { text: config.accesorios_iphone });
          console.log(`✅ Accesorios iPhone enviados a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        case '3': // Listado MacBooks
          await this.sock.sendMessage(from, { text: config.catalogo_macbooks });
          console.log(`✅ Catálogo MacBook enviado a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        case '4': // Ubicación
          await this.enviarUbicacion(from, config);
          console.log(`✅ Ubicación enviada a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        case '5': // Para llevar
          await this.sock.sendMessage(from, { text: config.para_llevar });
          console.log(`✅ Info para llevar enviada a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        case '6': // Métodos de pago
          await this.sock.sendMessage(from, { text: config.metodos_pago });
          console.log(`✅ Métodos de pago enviados a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        case '7': // Garantía
          await this.sock.sendMessage(from, { text: config.garantia });
          console.log(`✅ Información de garantía enviada a ${telefono}`);
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          break;

        default:
          await this.sock.sendMessage(from, {
            text: `⚠️ Opción no válida.\n\n${config.menu_principal}`
          });
          break;
      }

      await this.sock.sendPresenceUpdate('paused', from);
    } catch (error) {
      console.error('❌ Error procesando opción:', error.message);
    }
  }

  async enviarUbicacion(from, config) {
    // Mensaje de texto con dirección
    await this.sock.sendMessage(from, { 
      text: `📍 *${config.empresa_nombre}*\n\n${config.empresa_direccion}\n\n${config.horario}` 
    });
    
    // Ubicación GPS
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.sock.sendMessage(from, {
      location: {
        degreesLatitude: 5.703065466839204,
        degreesLongitude: -72.94070205181986
      }
    });
    
    // Link de Google Maps
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.sock.sendMessage(from, { 
      text: `🗺️ También puedes verlo aquí:\n${config.empresa_maps}\n\n📞 Teléfono: ${config.empresa_telefono}` 
    });
  }

  esComandoInicio(text) {
    // Solo detectar si el mensaje es EXACTAMENTE un comando de inicio
    // o es muy corto y contiene el comando (ej: "hola!", "hola?", "buenas!")
    const textoLimpio = text.toLowerCase().trim().replace(/[!?.,]+$/, '');
    const comandosInicio = ['hola', 'menu', 'inicio', 'ola', 'hi', 'hello', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches'];
    return comandosInicio.includes(textoLimpio);
  }

  esOpcionMenu(text) {
    // Solo aceptar números puros del 0-7, sin texto adicional
    const textoLimpio = text.trim();
    return ['1', '2', '3', '4', '5', '6', '7', '0'].includes(textoLimpio) && /^[0-7]$/.test(textoLimpio);
  }

  esOpcionValida(text) {
    const textoLimpio = text.trim();
    return ['1', '2', '3', '4', '5', '6', '7'].includes(textoLimpio) && /^[1-7]$/.test(textoLimpio);
  }
}

module.exports = MenuHandler;