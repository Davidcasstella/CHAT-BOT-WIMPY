// WhatsAppConnection.js - Maneja la conexión con WhatsApp
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion // Importar para versión dinámica
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

class WhatsAppConnection {
  constructor(messageProcessor) {
    this.messageProcessor = messageProcessor;
    this.sock = null;
    this.qrCodeData = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.miNumero = null;
    this.reconnectAttempts = 0; // Manejar reintentos
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
      console.log('🔄 Obteniendo última versión de WhatsApp Web...');
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`✅ Usando versión WA Web: ${version.join('.')} (Latest: ${isLatest})`);

      const { state, saveCreds } = await useMultiFileAuthState('auth_info');

      this.sock = makeWASocket({
        auth: state,
        version, // Usar versión dinámica detectada
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        browser: ['Windows', 'Chrome', '22.0.1'], // Identidad estable
        syncFullHistory: false,
        markOnlineOnConnect: false,
        emitOwnEvents: false,
        retryRequestDelayMs: 5000
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
      this.isConnected = false;
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

    // Identificar fallos de autenticación o bloqueos (401, 405, loggedOut)
    const isAuthFailure =
      statusCode === DisconnectReason.loggedOut ||
      statusCode === 401 ||
      statusCode === 405;

    console.log(`❌ Conexión cerrada. Status: ${statusCode || 'Desconocido'}`);
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCodeData = null;
    this.miNumero = null;

    if (!isAuthFailure) {
      this.reconnectAttempts++;
      // Backoff exponencial: 5s, 10s, 20s... hasta 2 minutos
      const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 120000);

      console.log(`🔄 Reconectando en ${(delay / 1000).toFixed(0)} segundos... (Intento ${this.reconnectAttempts})`);
      setTimeout(() => this.conectar(), delay);
    } else {
      console.log('\n⛔ SESIÓN CERRADA O BLOQUEADA (Error 405/401)');
      console.log('🌐 El sistema se detendrá para evitar bloqueos mayores.');
      console.log('🌐 Ve a http://localhost:3000 para volver a generar el QR si es necesario.\n');
      this.reconnectAttempts = 0;
    }
  }

  async manejarConexionExitosa() {
    console.log('✅ ¡Conectado a WhatsApp!');
    this.reconnectAttempts = 0; // Resetear intentos al conectar con éxito

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