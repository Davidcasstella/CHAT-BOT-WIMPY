// diagnostico.js - Script para diagnosticar el bot
const ConfigManager = require('./ConfigManager');

console.log('\n🔍 DIAGNÓSTICO DEL BOT\n');
console.log('='.repeat(50));

try {
  // Cargar configuración
  const configManager = new ConfigManager();
  const config = configManager.obtenerConfig();
  
  console.log('\n✅ ConfigManager cargado correctamente\n');
  
  // Verificar menú principal
  console.log('📋 MENÚ PRINCIPAL:');
  console.log('-'.repeat(50));
  console.log(config.menu_principal);
  console.log('-'.repeat(50));
  
  // Verificar que contenga las 6 opciones
  const opciones = [];
  for (let i = 1; i <= 6; i++) {
    if (config.menu_principal.includes(`${i}.`)) {
      opciones.push(i);
    }
  }
  
  console.log(`\n✅ Opciones encontradas en el menú: ${opciones.join(', ')}`);
  
  if (opciones.length === 6) {
    console.log('✅ ¡Todas las 6 opciones están presentes!');
  } else {
    console.log(`⚠️ PROBLEMA: Solo se encontraron ${opciones.length} opciones de 6`);
    console.log('❌ Faltan las opciones:', [1,2,3,4,5,6].filter(x => !opciones.includes(x)).join(', '));
  }
  
  // Verificar métodos de pago
  console.log('\n\n💳 MÉTODOS DE PAGO:');
  console.log('-'.repeat(50));
  if (config.metodos_pago) {
    console.log(config.metodos_pago);
    console.log('-'.repeat(50));
    console.log('✅ Métodos de pago configurados correctamente');
  } else {
    console.log('❌ ERROR: metodos_pago no está definido');
  }
  
  // Verificar garantía
  console.log('\n\n🛡️ GARANTÍA:');
  console.log('-'.repeat(50));
  if (config.garantia) {
    console.log(config.garantia);
    console.log('-'.repeat(50));
    console.log('✅ Garantía configurada correctamente');
  } else {
    console.log('❌ ERROR: garantia no está definido');
  }
  
  // Verificar todas las propiedades
  console.log('\n\n📊 PROPIEDADES DE CONFIGURACIÓN:');
  console.log('-'.repeat(50));
  const propiedades = [
    'empresa_nombre',
    'empresa_telefono',
    'empresa_direccion',
    'empresa_maps',
    'cooldown',
    'msg_texto_libre',
    'menu_principal',
    'catalogo_iphones',
    'accesorios_iphone',
    'catalogo_macbooks',
    'accesorios_macbook',
    'compatibilidad',
    'horario',
    'metodos_pago',
    'garantia'
  ];
  
  propiedades.forEach(prop => {
    const existe = config[prop] !== undefined;
    const icono = existe ? '✅' : '❌';
    const tamano = existe ? config[prop].length : 0;
    console.log(`${icono} ${prop.padEnd(25)} ${existe ? `(${tamano} caracteres)` : 'NO DEFINIDO'}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ DIAGNÓSTICO COMPLETADO\n');
  
  // Guardar diagnóstico en archivo
  const fs = require('fs');
  const diagnostico = {
    fecha: new Date().toISOString(),
    opcionesEnMenu: opciones,
    todasLasOpcionesPresentes: opciones.length === 6,
    propiedadesDefinidas: propiedades.filter(p => config[p] !== undefined),
    propiedadesFaltantes: propiedades.filter(p => config[p] === undefined)
  };
  
  fs.writeFileSync('diagnostico-resultado.json', JSON.stringify(diagnostico, null, 2));
  console.log('💾 Diagnóstico guardado en: diagnostico-resultado.json\n');
  
} catch (error) {
  console.error('\n❌ ERROR EN DIAGNÓSTICO:', error.message);
  console.error('\n📋 Stack trace:');
  console.error(error.stack);
}