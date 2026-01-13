// CooldownManager.js - Gestiona cooldowns y estados de usuarios
class CooldownManager {
  constructor(cooldownMinutos = 60) {
    this.cooldownMinutos = cooldownMinutos;
    this.usuariosCooldown = new Map();
    this.estadoUsuarios = new Map();
    this.mensajesProcesados = new Set();
    
    // Limpiar mensajes antiguos cada 5 minutos
    this.iniciarLimpiezaAutomatica();
  }

  iniciarLimpiezaAutomatica() {
    setInterval(() => {
      this.mensajesProcesados.clear();
      console.log('🧹 Cache de mensajes limpiado');
    }, 300000);
  }

  esMensajeDuplicado(from, messageId) {
    const idUnico = `${from}-${messageId}`;
    
    if (this.mensajesProcesados.has(idUnico)) {
      console.log('⛔ Mensaje ya procesado');
      return true;
    }
    
    this.mensajesProcesados.add(idUnico);
    return false;
  }

  estaEnCooldown(telefono) {
    const COOLDOWN_MS = this.cooldownMinutos * 60 * 1000;
    
    if (!this.usuariosCooldown.has(telefono)) {
      return false;
    }
    
    const ultimaRespuesta = this.usuariosCooldown.get(telefono);
    const tiempoTranscurrido = Date.now() - ultimaRespuesta;
    
    if (tiempoTranscurrido < COOLDOWN_MS) {
      const minutosRestantes = Math.ceil((COOLDOWN_MS - tiempoTranscurrido) / 60000);
      return minutosRestantes;
    }
    
    // ========== IMPORTANTE: Cuando el cooldown expira naturalmente ==========
    // Resetear estado a 'inicial' para que se envíen fotos de nuevo
    this.usuariosCooldown.delete(telefono);
    this.estadoUsuarios.delete(telefono);
    console.log(`⏰ Cooldown expirado para ${telefono.split('@')[0]} - Estado reseteado`);
    
    return false;
  }

  obtenerEstado(telefono) {
    return this.estadoUsuarios.get(telefono) || 'inicial';
  }

  establecerEstado(telefono, nuevoEstado) {
    this.estadoUsuarios.set(telefono, nuevoEstado);
    console.log(`📊 Estado de ${telefono.split('@')[0]}: ${nuevoEstado}`);
  }

  registrarRespuesta(telefono) {
    this.usuariosCooldown.set(telefono, Date.now());
    console.log(`✅ Cooldown iniciado para ${telefono.split('@')[0]}`);
  }

  // ========== RESETEAR COOLDOWN - VOLVER A ESTADO INICIAL ==========
  resetearCooldown(telefono) {
    this.usuariosCooldown.delete(telefono);
    this.estadoUsuarios.delete(telefono); // ← Importante: Volver a 'inicial'
    console.log(`✅ Cooldown eliminado para ${telefono.split('@')[0]}`);
    console.log(`📸 Usuario volverá a recibir fotos en próximo contacto`);
  }

  // ========== RESETEAR TODOS - VOLVER TODOS A ESTADO INICIAL ==========
  resetearTodosCooldowns() {
    const cantidad = this.usuariosCooldown.size;
    this.usuariosCooldown.clear();
    this.estadoUsuarios.clear(); // ← Importante: Todos vuelven a 'inicial'
    console.log(`✅ ${cantidad} cooldowns eliminados`);
    console.log(`📸 Todos los usuarios volverán a recibir fotos`);
    return cantidad;
  }

  obtenerUsuariosActivos() {
    return Array.from(this.usuariosCooldown.entries()).map(([telefono, timestamp]) => {
      const COOLDOWN_MS = this.cooldownMinutos * 60 * 1000;
      const tiempoRestante = Math.max(0, COOLDOWN_MS - (Date.now() - timestamp));
      const minutosRestantes = Math.ceil(tiempoRestante / 60000);
      
      return {
        telefono: telefono.split('@')[0],
        ultimaRespuesta: new Date(timestamp).toLocaleString('es-CO'),
        minutosRestantes: minutosRestantes > 0 ? minutosRestantes : 0,
        puedeResponder: minutosRestantes === 0,
        estado: this.estadoUsuarios.get(telefono) || 'inicial'
      };
    });
  }

  actualizarCooldownMinutos(nuevosCooldownMinutos) {
    this.cooldownMinutos = nuevosCooldownMinutos;
    console.log(`⏱️ Cooldown actualizado a ${nuevosCooldownMinutos} minutos`);
  }

  obtenerEstadisticas() {
    return {
      mensajesProcesados: this.mensajesProcesados.size,
      usuariosEnCooldown: this.usuariosCooldown.size,
      estadosActivos: this.estadoUsuarios.size,
      cooldownMinutos: this.cooldownMinutos
    };
  }

  limpiarCache() {
    this.mensajesProcesados.clear();
    console.log('✅ Cache limpiado manualmente');
  }
}

module.exports = CooldownManager;