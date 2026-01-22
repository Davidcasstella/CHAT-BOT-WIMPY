// ConfigManager.js - CORREGIDO: Con persistencia de fotos del catálogo
const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.configFile = path.join(__dirname, 'bot-config.json');
    this.config = this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(data);
        console.log('✅ Configuración cargada desde archivo');
        
        this.verificarEstructura(config);
        
        return config;
      }
    } catch (error) {
      console.log('⚠️ Error cargando configuración:', error.message);
    }
    
    return this.obtenerConfiguracionPorDefecto();
  }

  verificarEstructura(config) {
    // Verificar opciones del menú
    if (!config.opciones_menu) {
      console.log('⚠️ Estructura desactualizada - Regenerando opciones del menú');
      config.opciones_menu = this.obtenerOpcionesPorDefecto();
    }

    // Verificar números bloqueados
    if (!config.numeros_bloqueados) {
      console.log('⚠️ Agregando lista de números bloqueados');
      config.numeros_bloqueados = [];
    }

    // CORREGIDO: Sistema de fotos generales - NO sobrescribir si ya existe
    if (!config.fotos_catalogo) {
      console.log('⚠️ Agregando sistema de fotos del catálogo');
      config.fotos_catalogo = {
        habilitado: false,
        fotos: []
      };
    } else {
      // Asegurar que tenga la estructura correcta
      if (typeof config.fotos_catalogo.habilitado !== 'boolean') {
        config.fotos_catalogo.habilitado = false;
      }
      if (!Array.isArray(config.fotos_catalogo.fotos)) {
        config.fotos_catalogo.fotos = [];
      }
    }

    // Sistema de PDFs del catálogo - NO sobrescribir si ya existe
    if (!config.pdfs_catalogo) {
      console.log('⚠️ Agregando sistema de PDFs del catálogo');
      config.pdfs_catalogo = {
        habilitado: false,
        pdfs: []
      };
    } else {
      // Asegurar que tenga la estructura correcta
      if (typeof config.pdfs_catalogo.habilitado !== 'boolean') {
        config.pdfs_catalogo.habilitado = false;
      }
      if (!Array.isArray(config.pdfs_catalogo.pdfs)) {
        config.pdfs_catalogo.pdfs = [];
      }
    }

    // Asegurar métodos de pago, garantía y para llevar
    if (!config.metodos_pago) {
      config.metodos_pago = this.obtenerMetodosPago(config);
    }

    if (!config.garantia) {
      config.garantia = this.obtenerGarantia(config);
    }

    if (!config.para_llevar) {
      config.para_llevar = this.obtenerParaLlevar();
    }

    // Regenerar menú basado en opciones activas
    config.menu_principal = this.generarMenuPrincipal(config);
  }

  obtenerOpcionesPorDefecto() {
    return [
      {
        id: 1,
        nombre: "Listado de iPhone",
        emoji: "📱",
        activa: true,
        campo_config: "catalogo_iphones"
      },
      {
        id: 2,
        nombre: "Accesorios para iPhone",
        emoji: "📌",
        activa: true,
        campo_config: "accesorios_iphone"
      },
      {
        id: 3,
        nombre: "Listado de MacBook",
        emoji: "💻",
        activa: true,
        campo_config: "catalogo_macbooks"
      },
      {
        id: 4,
        nombre: "Ubicación del negocio",
        emoji: "📍",
        activa: true,
        campo_config: "ubicacion"
      },
      {
        id: 5,
        nombre: "Para llevar",
        emoji: "📦",
        activa: true,
        campo_config: "para_llevar"
      },
      {
        id: 6,
        nombre: "Métodos de pago",
        emoji: "💳",
        activa: true,
        campo_config: "metodos_pago"
      },
      {
        id: 7,
        nombre: "Garantía",
        emoji: "🛡️",
        activa: true,
        campo_config: "garantia"
      }
    ];
  }

  generarMenuPrincipal(config) {
    // Usar saludo_inicial si existe, sino generar uno por defecto
    let saludoInicial;
    if (config.saludo_inicial) {
      saludoInicial = config.saludo_inicial;
    } else {
      const nombre = config.nombre_asesor || "Johana";
      const empresa = config.empresa_nombre || "Outlet Tech Boyacá";
      saludoInicial = `Soy ${nombre} de ${empresa}, ¿en qué puedo ayudarte? 😊`;
    }

    let menu = `${saludoInicial}\n\n`;

    // Filtrar solo opciones activas
    const opcionesActivas = config.opciones_menu.filter(op => op.activa);

    opcionesActivas.forEach(opcion => {
      menu += `${opcion.id}. ${opcion.emoji} ${opcion.nombre}\n`;
    });

    menu += `\nEscribe el número de tu opción`;

    return menu;
  }

  obtenerConfiguracionPorDefecto() {
    const config = {
      // Información de la empresa
      empresa_nombre: "Outlet Tech Boyacá",
      empresa_telefono: "305 2707907",
      empresa_direccion: "Calle 11a # 9-27, Tunja, Boyacá",
      empresa_maps: "https://maps.app.goo.gl/tGE9JvRz49DyYrAk7",
      
      // Nombre del asesor virtual
      nombre_asesor: "Johana",
      
      // Configuración del bot
      cooldown: 60,
      msg_texto_libre: "Vale ya te respondo",
      
      // Números bloqueados (familiares, etc)
      numeros_bloqueados: [],
      
      // Sistema de fotos del catálogo
      fotos_catalogo: {
        habilitado: false,
        fotos: []
      },
      
      // Opciones del menú
      opciones_menu: this.obtenerOpcionesPorDefecto(),
      
      // Contenidos
      catalogo_iphones: this.obtenerCatalogoiPhones(),
      accesorios_iphone: this.obtenerAccesoriosiPhone(),
      catalogo_macbooks: this.obtenerCatalogoMacBooks(),
      accesorios_macbook: this.obtenerAccesoriosMacBook(),
      compatibilidad: this.obtenerCompatibilidad(),
      horario: this.obtenerHorario(),
      para_llevar: this.obtenerParaLlevar()
    };
    
    // Generar métodos de pago y garantía
    config.metodos_pago = this.obtenerMetodosPago(config);
    config.garantia = this.obtenerGarantia(config);
    
    // Generar menú principal
    config.menu_principal = this.generarMenuPrincipal(config);
    
    return config;
  }

  // Método para verificar si un número está bloqueado
  esNumeroBloqueado(telefono) {
    const numeroLimpio = telefono.replace(/\D/g, '');
    return this.config.numeros_bloqueados.some(bloqueado => {
      const bloqueadoLimpio = bloqueado.replace(/\D/g, '');
      return numeroLimpio.includes(bloqueadoLimpio) || bloqueadoLimpio.includes(numeroLimpio);
    });
  }

  // Obtener opciones activas del menú
  obtenerOpcionesActivas() {
    return this.config.opciones_menu.filter(op => op.activa);
  }

  // Verificar si una opción está activa
  esOpcionActiva(id) {
    const opcion = this.config.opciones_menu.find(op => op.id === id);
    return opcion ? opcion.activa : false;
  }

  // Obtener campo de configuración de una opción
  obtenerCampoConfigOpcion(id) {
    const opcion = this.config.opciones_menu.find(op => op.id === id);
    return opcion ? opcion.campo_config : null;
  }

  // Métodos para gestionar fotos del catálogo
  estaHabilitadoFotosCatalogo() {
    return this.config.fotos_catalogo && this.config.fotos_catalogo.habilitado;
  }

  obtenerFotosCatalogo() {
    if (!this.config.fotos_catalogo || !this.config.fotos_catalogo.fotos) {
      return [];
    }
    return this.config.fotos_catalogo.fotos;
  }

  // Métodos para gestionar PDFs del catálogo
  estaHabilitadoPdfsCatalogo() {
    return this.config.pdfs_catalogo && this.config.pdfs_catalogo.habilitado;
  }

  obtenerPdfsCatalogo() {
    if (!this.config.pdfs_catalogo || !this.config.pdfs_catalogo.pdfs) {
      return [];
    }
    return this.config.pdfs_catalogo.pdfs;
  }

  // Los métodos de obtener contenidos permanecen igual
  obtenerCatalogoiPhones() {
    const telefono = this.config?.empresa_telefono || '305 2707907';
    return `📱 *LISTADO DE iPHONES*

1. iPhone 13 – 128 GB
   Colores: Negro, Blanco Estelar, Azul, Rosa, Rojo, Verde

2. iPhone 13 Mini – 128 GB
   Colores: Negro, Blanco Estelar, Azul, Rosa, Rojo, Verde

3. iPhone 13 Pro – 256 GB
   Colores: Grafito, Plata, Oro, Azul Sierra, Verde Alpino

4. iPhone 13 Pro Max – 256 GB
   Colores: Grafito, Plata, Oro, Azul Sierra, Verde Alpino

5. iPhone 14 – 128 GB
   Colores: Negro, Blanco Estelar, Azul, Morado, Rojo, Amarillo

6. iPhone 14 Plus – 128 GB
   Colores: Negro, Blanco Estelar, Azul, Morado, Rojo, Amarillo

7. iPhone 14 Pro – 256 GB
   Colores: Negro Espacial, Plata, Oro, Morado Oscuro

8. iPhone 14 Pro Max – 256 GB
   Colores: Negro Espacial, Plata, Oro, Morado Oscuro

9. iPhone 15 – 128 GB
   Colores: Negro, Azul, Verde, Amarillo, Rosa

10. iPhone 15 Plus – 128 GB
    Colores: Negro, Azul, Verde, Amarillo, Rosa

11. iPhone 15 Pro – 256 GB
    Colores: Titanio Negro, Titanio Blanco, Titanio Azul, Titanio Natural

12. iPhone 15 Pro Max – 512 GB
    Colores: Titanio Negro, Titanio Blanco, Titanio Azul, Titanio Natural

13. iPhone 16 – 256 GB
    Colores: Negro, Blanco, Rosa, Azul Ultramarino, Verde Azulado

14. iPhone 16 Plus – 256 GB
    Colores: Negro, Blanco, Rosa, Azul Ultramarino, Verde Azulado

15. iPhone 16 Pro – 512 GB
    Colores: Titanio Negro, Titanio Blanco, Titanio Natural, Titanio Desierto

16. iPhone 16 Pro Max – 1 TB
    Colores: Titanio Negro, Titanio Blanco, Titanio Natural, Titanio Desierto

📞 Para precios y disponibilidad escríbenos al ${telefono}`;
  }

  obtenerAccesoriosiPhone() {
    const telefono = this.config?.empresa_telefono || '305 2707907';
    return `🎁 *ACCESORIOS APPLE – IPHONE*

🔋 *Carga y energía*
- Adaptador de corriente Apple USB-C (20W / 30W / 35W)
- Cable Apple USB-C a Lightning
- Cable Apple USB-C a USB-C
- MagSafe Charger Apple
- Batería MagSafe Apple

🛡️ *Protección*
- Funda Apple Silicone Case
- Funda Apple Clear Case
- Funda Apple Leather Case
- Vidrio templado premium
- Protector de cámara iPhone

🎧 *Audio*
- AirPods (2.ª generación)
- AirPods (3.ª generación)
- AirPods Pro (2.ª generación)
- AirPods Max

🧲 *MagSafe*
- Funda MagSafe
- Wallet MagSafe
- Soporte MagSafe para carro
- Cargador MagSafe Duo

📞 Para precios y disponibilidad contacta: ${telefono}`;
  }

  obtenerCatalogoMacBooks() {
    const telefono = this.config?.empresa_telefono || '305 2707907';
    return `💻 *LISTADO DE MACBOOKS POR PROCESADOR*

1. Core i5
   Modelo 2019–2020, RAM 8 GB, pantalla 13", 256 GB SSD

2. Core i7
   Modelo 2019–2020, RAM 16 GB, pantalla 15" o 16", 512 GB SSD

3. Core i9
   Modelo 2019–2020, RAM 16 GB, pantalla 16", 1 TB SSD

4. M1
   Modelo 2020, RAM 8 GB, pantalla 13", 256 GB SSD

5. M1 Pro
   Modelo 2021, RAM 16 GB, pantalla 14", 512 GB SSD

6. M2
   Modelo 2022, RAM 8 GB, pantalla 13", 256 GB SSD

7. M2 Air
   Modelo 2022–2023, RAM 8 GB, pantalla 13" o 15", 256 GB SSD

8. M2 Pro
   Modelo 2023, RAM 16 GB, pantalla 14" o 16", 512 GB SSD

9. M4
   Modelo 2024, RAM 16 GB, pantalla 14", 512 GB SSD

10. M4 Air
    Modelo 2024, RAM 8 GB, pantalla 13" o 15", 256 GB SSD

11. M4 Pro
    Modelo 2024, RAM 18 GB, pantalla 14" o 16", 512 GB SSD

📞 Para precios y disponibilidad escríbenos al ${telefono}`;
  }

  obtenerAccesoriosMacBook() {
    const telefono = this.config?.empresa_telefono || '305 2707907';
    return `💻 *ACCESORIOS APPLE – MACBOOK*

🔌 *Carga y conectividad*
- Adaptador de corriente Apple USB-C
- Cable de carga USB-C Apple
- Cable MagSafe 3 Apple
- Adaptador multipuerto USB-C Apple
- Adaptador USB-C a HDMI Apple

⌨️ *Teclado y control*
- Magic Keyboard
- Magic Keyboard con Touch ID
- Magic Mouse
- Magic Trackpad

🛡️ *Protección y uso*
- Funda Apple Leather Sleeve
- Funda Apple Sleeve
- Protector de teclado MacBook
- Protector de pantalla MacBook

📞 Para precios y disponibilidad contacta: ${telefono}`;
  }

  obtenerCompatibilidad() {
    return `📦 *COMPATIBILIDAD*

iPhone 11 / 12 / 13 / 14 / 15 / 16
MacBook Air M1 / M2 / M3 / M4
MacBook Pro M1 / M2 / M3 / M4`;
  }

  obtenerHorario() {
    return `⏰ *Horario*
Lunes a Sábado: 7:00 AM - 8:00 PM
Domingos: 8:00 AM - 11:00 AM`;
  }

  obtenerParaLlevar() {
    return `📦 *PARA LLEVAR*\n\nConfigura este mensaje desde el panel de administración.`;
  }

  obtenerMetodosPago(config = this.config) {
    const direccion = config?.empresa_direccion || 'Calle 11a # 9-27, Tunja, Boyacá';
    const telefono = config?.empresa_telefono || '305 2707907';
    
    return `💳 *MÉTODOS DE PAGO*

💵 *Efectivo*
- Pago en efectivo en nuestra tienda

📱 *Transferencias y Apps*
- Nequi
- Daviplata
- Bancolombia (Transferencia o Botón PSE)

💳 *Tarjetas*
- Visa
- Mastercard
- American Express

🔌 *Pago de servicios*
- Codensa (Pago con recibo de luz)

📍 Todos los pagos pueden realizarse en nuestra tienda ubicada en:
${direccion}

📞 Contacto: ${telefono}`;
  }

  obtenerGarantia(config = this.config) {
    const nombre = config?.empresa_nombre || 'Outlet Tech Boyacá';
    const telefono = config?.empresa_telefono || '305 2707907';
    const direccion = config?.empresa_direccion || 'Calle 11a # 9-27, Tunja, Boyacá';
    
    return `🛡️ *GARANTÍA*

✅ *Dispositivos Nuevos*
- Garantía directamente con el fabricante (Apple)
- Cobertura según términos del fabricante
- Soporte en toda la red de servicio técnico autorizado

✅ *Dispositivos Usados*
- Garantía de 5 meses con ${nombre}
- Cobertura contra defectos de fabricación
- Soporte técnico incluido

🔧 *Garantía de Email*
- Garantía del correo electrónico: DE POR VIDA
- Soporte permanente para configuración de iCloud
- Asistencia con cuenta Apple ID

📋 *Condiciones*
- Presentar factura de compra
- No aplica para daños físicos o por mal uso
- Revisión técnica sin costo

📞 Más información: ${telefono}
📍 ${direccion}`;
  }

  guardarConfiguracion(nuevaConfig) {
    try {
      console.log('💾 Guardando configuración...');
      console.log('📸 Fotos en configuración a guardar:', nuevaConfig.fotos_catalogo);
      
      // Asegurar que fotos_catalogo existe con su estructura
      if (!nuevaConfig.fotos_catalogo) {
        console.warn('⚠️ fotos_catalogo no existe, creando estructura vacía');
        nuevaConfig.fotos_catalogo = {
          habilitado: false,
          fotos: []
        };
      } else {
        // Verificar que tenga la estructura correcta
        if (typeof nuevaConfig.fotos_catalogo.habilitado !== 'boolean') {
          nuevaConfig.fotos_catalogo.habilitado = false;
        }
        if (!Array.isArray(nuevaConfig.fotos_catalogo.fotos)) {
          nuevaConfig.fotos_catalogo.fotos = [];
        }
      }
      
      // Regenerar menú principal
      nuevaConfig.menu_principal = this.generarMenuPrincipal(nuevaConfig);
      
      // Guardar archivo
      fs.writeFileSync(this.configFile, JSON.stringify(nuevaConfig, null, 2));
      
      // Actualizar configuración en memoria
      this.config = nuevaConfig;
      
      console.log('✅ Configuración guardada correctamente');
      console.log(`📸 Total de fotos guardadas: ${nuevaConfig.fotos_catalogo.fotos.length}`);
      console.log(`📸 Estado habilitado: ${nuevaConfig.fotos_catalogo.habilitado}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración:', error.message);
      return false;
    }
  }
  recargarConfiguracion() {
    this.config = this.cargarConfiguracion();
    console.log('🔄 Configuración recargada en tiempo real');
    console.log(`📸 Fotos en catálogo: ${this.config.fotos_catalogo?.fotos?.length || 0}`);
    return this.config;
  }

  obtenerConfig() {
    return this.config;
  }
}

module.exports = ConfigManager;