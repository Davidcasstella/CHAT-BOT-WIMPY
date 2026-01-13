// init-config.js - Inicializa la configuración con las 6 opciones
const fs = require('fs');
const path = require('path');

console.log('\n🚀 INICIALIZANDO CONFIGURACIÓN DEL BOT\n');
console.log('='.repeat(50));

const CONFIG_FILE = path.join(__dirname, 'bot-config.json');

// Configuración completa con las 6 opciones
const configCompleta = {
  empresa_nombre: "Outlet Tech Boyacá",
  empresa_telefono: "305 2707907",
  empresa_direccion: "Calle 11a # 9-27, Tunja, Boyacá",
  empresa_maps: "https://maps.app.goo.gl/tGE9JvRz49DyYrAk7",
  cooldown: 60,
  msg_texto_libre: "Vale ya te respondo",
  
  menu_principal: `Soy Johana, ¿en qué puedo ayudarte? 😊

1. 📱 Listado de iPhone
2. 🔌 Accesorios para iPhone
3. 💻 Listado de MacBook
4. 📍 Ubicación del negocio
5. 💳 Métodos de pago
6. 🛡️ Garantía

Escribe el número de tu opción`,

  catalogo_iphones: `📱 *LISTADO DE iPHONES*

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

📞 Para precios y disponibilidad escríbenos al 305 2707907`,

  accesorios_iphone: `🎁 *ACCESORIOS APPLE – IPHONE*

🔋 *Carga y energía*
• Adaptador de corriente Apple USB-C (20W / 30W / 35W)
• Cable Apple USB-C a Lightning
• Cable Apple USB-C a USB-C
• MagSafe Charger Apple
• Batería MagSafe Apple

🛡️ *Protección*
• Funda Apple Silicone Case
• Funda Apple Clear Case
• Funda Apple Leather Case
• Vidrio templado premium
• Protector de cámara iPhone

🎧 *Audio*
• AirPods (2.ª generación)
• AirPods (3.ª generación)
• AirPods Pro (2.ª generación)
• AirPods Max

🧲 *MagSafe*
• Funda MagSafe
• Wallet MagSafe
• Soporte MagSafe para carro
• Cargador MagSafe Duo

📞 Para precios y disponibilidad contacta: 305 2707907`,

  catalogo_macbooks: `💻 *LISTADO DE MACBOOKS POR PROCESADOR*

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

📞 Para precios y disponibilidad escríbenos al 305 2707907`,

  accesorios_macbook: `💻 *ACCESORIOS APPLE – MACBOOK*

🔌 *Carga y conectividad*
• Adaptador de corriente Apple USB-C
• Cable de carga USB-C Apple
• Cable MagSafe 3 Apple
• Adaptador multipuerto USB-C Apple
• Adaptador USB-C a HDMI Apple

⌨️ *Teclado y control*
• Magic Keyboard
• Magic Keyboard con Touch ID
• Magic Mouse
• Magic Trackpad

🛡️ *Protección y uso*
• Funda Apple Leather Sleeve
• Funda Apple Sleeve
• Protector de teclado MacBook
• Protector de pantalla MacBook

📞 Para precios y disponibilidad contacta: 305 2707907`,

  compatibilidad: `📦 *COMPATIBILIDAD*

iPhone 11 / 12 / 13 / 14 / 15 / 16
MacBook Air M1 / M2 / M3 / M4
MacBook Pro M1 / M2 / M3 / M4`,

  horario: `⏰ *Horario*
Lunes a Sábado: 7:00 AM - 8:00 PM
Domingos: 8:00 AM - 11:00 AM`,

  metodos_pago: `💳 *MÉTODOS DE PAGO*

💵 *Efectivo*
• Pago en efectivo en nuestra tienda

📱 *Transferencias y Apps*
• Nequi
• Daviplata
• Bancolombia (Transferencia o Botón PSE)

💳 *Tarjetas*
• Visa
• Mastercard
• American Express

🔌 *Pago de servicios*
• Codensa (Pago con recibo de luz)

📍 Todos los pagos pueden realizarse en nuestra tienda ubicada en:
Calle 11a # 9-27, Tunja, Boyacá

📞 Contacto: 305 2707907`,

  garantia: `🛡️ *GARANTÍA*

✅ *Dispositivos Nuevos*
• Garantía directamente con el fabricante (Apple)
• Cobertura según términos del fabricante
• Soporte en toda la red de servicio técnico autorizado

✅ *Dispositivos Usados*
• Garantía de 5 meses con Outlet Tech Boyacá
• Cobertura contra defectos de fabricación
• Soporte técnico incluido

📧 *Garantía de Email*
• Garantía del correo electrónico: DE POR VIDA
• Soporte permanente para configuración de iCloud
• Asistencia con cuenta Apple ID

📋 *Condiciones*
• Presentar factura de compra
• No aplica para daños físicos o por mal uso
• Revisión técnica sin costo

📞 Más información: 305 2707907
📍 Calle 11a # 9-27, Tunja, Boyacá`
};

try {
  // Crear backup si existe el archivo anterior
  if (fs.existsSync(CONFIG_FILE)) {
    const backupFile = CONFIG_FILE.replace('.json', `-backup-${Date.now()}.json`);
    fs.copyFileSync(CONFIG_FILE, backupFile);
    console.log(`\n💾 Backup creado: ${path.basename(backupFile)}`);
  }
  
  // Guardar nueva configuración
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configCompleta, null, 2));
  
  console.log('\n✅ Configuración inicializada correctamente');
  console.log('\n📋 Verificación:');
  console.log('   • Menú principal: ✅ 6 opciones');
  console.log('   • Catálogo iPhone: ✅');
  console.log('   • Catálogo MacBook: ✅');
  console.log('   • Accesorios: ✅');
  console.log('   • Métodos de pago: ✅');
  console.log('   • Garantía: ✅');
  console.log('   • Ubicación y horario: ✅');
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('   1. Ejecuta: node diagnostico.js (para verificar)');
  console.log('   2. Ejecuta: node server.js (para iniciar el bot)');
  console.log('   3. Escanea el código QR');
  console.log('   4. Envía "hola" al bot para probar el menú\n');
  
  console.log('='.repeat(50));
  console.log('✅ INICIALIZACIÓN COMPLETADA\n');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\n📋 Stack trace:');
  console.error(error.stack);
  process.exit(1);
}