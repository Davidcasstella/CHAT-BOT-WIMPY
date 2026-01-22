// MessageProcessor.js - Procesa y clasifica mensajes entrantes (CORREGIDO)
class MessageProcessor {
  constructor(sock, configManager, cooldownManager, menuHandler) {
    this.sock = sock;
    this.configManager = configManager;
    this.cooldownManager = cooldownManager;
    this.menuHandler = menuHandler;
  }

  async procesarMensaje(msg, miNumero) {
    try {
      if (msg.key.fromMe) return;
      
      const from = msg.key.remoteJid;
      const messageId = msg.key.id;
      
      if (from === 'status@broadcast') return;
      
      // Validar que no sea mi propio número
      const remitente = from.split('@')[0];
      if (miNumero && remitente === miNumero) {
        console.log('⛔ Ignorando mensaje de mi propio número');
        return;
      }
      
      // Verificar duplicados
      if (this.cooldownManager.esMensajeDuplicado(from, messageId)) {
        return;
      }
      
      // ========== DETECTAR AUDIO ==========
      const esAudio = !!(msg.message.audioMessage || msg.message.ptt);
      
      if (esAudio) {
        const telefono = from.split('@')[0];
        console.log(`\n🎤 Audio recibido de ${telefono}`);
        
        // Recargar configuración
        this.configManager.recargarConfiguracion();
        
        // Verificar si está bloqueado
        if (this.configManager.esNumeroBloqueado(telefono)) {
          console.log(`🚫 Número bloqueado: ${telefono}`);
          return;
        }
        
        // Enviar mensaje de derivación a asesor
        await this.derivarAsesor(from, telefono);
        return;
      }
      
      // Extraer texto del mensaje
      const text = (msg.message.conversation ||
                   msg.message.extendedTextMessage?.text || '').trim();

      const telefono = from.split('@')[0];
      console.log(`\n📩 Mensaje de ${telefono}: ${text}`);

      // ========== DETECTAR SI ES RESPUESTA/CITA A UN MENSAJE ==========
      const esRespuestaAMensaje = !!(msg.message.extendedTextMessage?.contextInfo?.quotedMessage);

      if (esRespuestaAMensaje) {
        console.log(`💬 Es una respuesta a un mensaje citado`);

        // Recargar configuración
        this.configManager.recargarConfiguracion();

        // Verificar si está bloqueado
        if (this.configManager.esNumeroBloqueado(telefono)) {
          console.log(`🚫 Número bloqueado: ${telefono}`);
          return;
        }

        // Derivar a asesor cuando responden/citan cualquier mensaje
        await this.derivarAsesor(from, telefono);
        return;
      }

      // Recargar configuración antes de procesar
      this.configManager.recargarConfiguracion();

      // Verificar si el número está bloqueado
      if (this.configManager.esNumeroBloqueado(telefono)) {
        console.log(`🚫 Número bloqueado (familiar/personal): ${telefono}`);
        console.log('⭕️ Bot no responderá a este número\n');
        return;
      }

      await this.manejarMensaje(from, text, telefono);

    } catch (error) {
      console.error('❌ Error procesando mensaje:', error.message);
    }
  }

  async manejarMensaje(from, text, telefono) {
    try {
      const estadoActual = this.cooldownManager.obtenerEstado(from);
      
      console.log(`📊 Estado: ${estadoActual}`);

      await this.sock.sendPresenceUpdate('composing', from);

      const esNuevoUsuario = estadoActual === 'inicial';
      const esComandoInicio = this.menuHandler.esComandoInicio(text);
      const esOpcionMenu = this.menuHandler.esOpcionMenu(text);

      const minutosRestantes = this.cooldownManager.estaEnCooldown(from);
      const estaEnMenuActivo = estadoActual === 'menu_principal' || estadoActual === 'viendo_productos';
      
      const esNumeroSolo = /^[0-9]+$/.test(text.trim());
      const comandosReactivar = ['menu', 'inicio', 'hola'];
      const quiereReactivar = esNumeroSolo || comandosReactivar.some(cmd => text.toLowerCase().includes(cmd));
      const estaEsperandoAsesor = estadoActual === 'esperando_asesor';

      // Verificar cooldown
      if (minutosRestantes && !estaEnMenuActivo && !esComandoInicio && !(estaEsperandoAsesor && quiereReactivar)) {
        console.log(`⏳ Cooldown: ${minutosRestantes} min\n`);
        await this.sock.sendPresenceUpdate('paused', from);
        return;
      }

      // Nuevo usuario - mostrar menú
      if (esNuevoUsuario) {
        if (!minutosRestantes) {
          this.cooldownManager.registrarRespuesta(from);
        }

        await this.menuHandler.mostrarMenuPrincipal(from, telefono);
        await this.sock.sendPresenceUpdate('paused', from);
        return;
      }

      // Comando de inicio SOLO si NO está ya en menú principal
      if (esComandoInicio && estadoActual !== 'menu_principal') {
        if (!minutosRestantes) {
          this.cooldownManager.registrarRespuesta(from);
        }

        await this.menuHandler.mostrarMenuPrincipal(from, telefono);
        await this.sock.sendPresenceUpdate('paused', from);
        return;
      }

      // ========== USUARIO EN MENÚ PRINCIPAL ==========
      if (estadoActual === 'menu_principal') {

        // ========== SI ES UNA OPCIÓN DEL MENÚ (1-7) PURA (sin texto adicional) ==========
        if (esOpcionMenu) {
          const opcionId = parseInt(text.trim());
          if (this.configManager.esOpcionActiva(opcionId)) {
            // Procesar la opción
            await this.menuHandler.procesarOpcionMenu(from, text, telefono);
          } else {
            await this.sock.sendMessage(from, {
              text: `⚠️ Esa opción no está disponible.\n\n${this.configManager.obtenerConfig().menu_principal}`
            });
          }
        }
        // ========== SI ESCRIBIÓ TEXTO LIBRE ==========
        else {
          const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ']/.test(text);
          const esInterrogante = text.trim() === '?';
          const esNumeroConTexto = /[0-9]/.test(text) && tieneLetras;

          if (esNumeroConTexto) {
            // ========== NÚMERO CON TEXTO - NO RESPONDER NADA ==========
            console.log(`🔇 Mensaje ignorado (número con texto): "${text}"`);
          } else if (tieneLetras || esInterrogante) {
            // ========== TEXTO LIBRE O INTERROGANTE - DERIVAR A ASESOR ==========
            await this.derivarAsesor(from, telefono);
          } else {
            // Es un número pero no válido (ej: 8, 9, 10, etc)
            const opcionesActivas = this.configManager.obtenerOpcionesActivas();
            const numerosValidos = opcionesActivas.map(op => op.id).join(', ');
            await this.sock.sendMessage(from, {
              text: `⚠️ Por favor escribe una opción válida (${numerosValidos}):\n\n${this.configManager.obtenerConfig().menu_principal}`
            });
          }
        }

        await this.sock.sendPresenceUpdate('paused', from);
        return;
      } 
      
      // ========== USUARIO VIENDO PRODUCTOS (por compatibilidad) ==========
      else if (estadoActual === 'viendo_productos') {
        if (text === '0') {
          await this.sock.sendMessage(from, { 
            text: this.configManager.obtenerConfig().menu_principal 
          });
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          console.log(`✅ Usuario regresó al menú`);
        } else if (esOpcionMenu) {
          const opcionId = parseInt(text.trim());
          if (this.configManager.esOpcionActiva(opcionId)) {
            await this.menuHandler.procesarOpcionMenu(from, text, telefono);
          } else {
            await this.sock.sendMessage(from, { 
              text: `⚠️ Esa opción no está disponible.\n\n${this.configManager.obtenerConfig().menu_principal}` 
            });
          }
        } else {
          // ========== TEXTO LIBRE - DERIVAR SIN REPETIR MENÚ ==========
          await this.derivarAsesor(from, telefono);
        }
        await this.sock.sendPresenceUpdate('paused', from);
        return;
      } 
      
      // Usuario esperando asesor
      else if (estadoActual === 'esperando_asesor') {
        const quiereMenu = comandosReactivar.some(cmd => text.toLowerCase().includes(cmd));
        const esNumeroSolo = /^[0-9]+$/.test(text.trim());
        
        if (quiereMenu || esNumeroSolo) {
          this.cooldownManager.establecerEstado(from, 'menu_principal');
          await this.sock.sendMessage(from, { 
            text: this.configManager.obtenerConfig().menu_principal 
          });
          console.log(`✅ Bot reactivado`);
        } else {
          console.log(`🤖 Esperando asesor humano - No se responde`);
        }
      }

      await this.sock.sendPresenceUpdate('paused', from);

    } catch (error) {
      console.error('❌ Error manejando mensaje:', error.message);
    }
  }

  async derivarAsesor(from, telefono) {
    this.cooldownManager.establecerEstado(from, 'esperando_asesor');
    await this.sock.sendMessage(from, { 
      text: this.configManager.obtenerConfig().msg_texto_libre
    });
    console.log(`👤 Bot detenido - Usuario será atendido por asesor`);
  }
}

module.exports = MessageProcessor;