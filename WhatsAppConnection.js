// WhatsAppConnection.js - Maneja la conexión con WhatsApp
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

class WhatsAppConnection {
  constructor(messageProcessor) {
    this.messageProcessor = messageProcessor;
    this.sock = null;
    this.qrCodeData = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.miNumero = null;
  }

  async conectar() {
    if (this.isConnecting) {
      console.log('⚠️ Ya hay una conexión en proceso...');
      return;
    }
    
    if (this.isConnected) {
      console.log('⚠️ Ya está conectado a WhatsApp');
      return;
    }
    
    this.isConnecting = true;
    
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: undefined,
        browser: ['Chrome (Linux)', '', ''],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        emitOwnEvents: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        await this.manejarActualizacionConexion(update);
      });

      this.sock.ev.on('messages.upsert', async (m) => {
        await this.manejarMensajesEntrantes(m);
      });

    } catch (error) {
      console.error('❌ Error en conexión:', error.message);
      this.isConnecting = false;
    }
  }

  async manejarActualizacionConexion(update) {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      this.qrCodeData = qr;
      console.log('\n📱 Código QR disponible en: http://localhost:3000');
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      await this.manejarDesconexion(lastDisconnect);
    } else if (connection === 'open') {
      await this.manejarConexionExitosa();
    }
  }

  async manejarDesconexion(lastDisconnect) {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
    
    console.log(`❌ Conexión cerrada. Status: ${statusCode}`);
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCodeData = null;
    this.miNumero = null;
    
    if (shouldReconnect) {
      console.log('🔄 Reconectando en 5 segundos...');
      setTimeout(() => this.conectar(), 5000);
    } else {
      console.log('\n⛔ SESIÓN CERRADA');
      console.log('🌐 Ve a http://localhost:3000 para limpiar sesión\n');
    }
  }

  async manejarConexionExitosa() {
    console.log('✅ ¡Conectado a WhatsApp!');
    
    try {
      const user = this.sock.user;
      if (user && user.id) {
        this.miNumero = user.id.split(':')[0];
        console.log(`📱 Mi número: ${this.miNumero}`);
      }
    } catch (e) {
      console.log('⚠️ No se pudo obtener el número');
    }
    
    console.log('🌐 Panel de control: http://localhost:3000');
    console.log('📝 Editor de mensajes: http://localhost:3000/editor.html\n');
    this.isConnected = true;
    this.isConnecting = false;
    this.qrCodeData = null;
  }

  async manejarMensajesEntrantes(m) {
    try {
      if (m.type !== 'notify') return;
      
      const msg = m.messages[0];
      if (!msg.message) return;
      
      await this.messageProcessor.procesarMensaje(msg, this.miNumero);
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error.message);
    }
  }

  async cerrarSesion() {
    if (this.sock && this.isConnected) {
      await this.sock.logout();
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCodeData = null;
      this.miNumero = null;
      console.log('✅ Sesión cerrada');
      return true;
    }
    return false;
  }

  forzarCierre() {
    if (this.sock) {
      try {
        this.sock.end();
      } catch (e) {
        console.log('⚠️ Socket cerrado forzadamente');
      }
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCodeData = null;
    this.miNumero = null;
  }

  obtenerEstado() {
    return {
      conectado: this.isConnected,
      conectando: this.isConnecting,
      qrDisponible: this.qrCodeData !== null,
      miNumero: this.miNumero
    };
  }

  obtenerQR() {
    return this.qrCodeData;
  }

  obtenerSock() {
    return this.sock;
  }
}

module.exports = WhatsAppConnection;