#!/bin/bash

# =============================================================================
# Script de deployment para WhatsApp Bot Wimpy en AWS EC2 (Sin Docker, con PM2)
# =============================================================================
# Uso:
#   1. Subir este script a tu instancia EC2
#   2. chmod +x deploy-ec2-pm2.sh
#   3. ./deploy-ec2-pm2.sh
# =============================================================================

set -e

echo "=========================================="
echo "  Wimpy ChatBot - Deployment con PM2"
echo "=========================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Actualizar sistema
log_info "Actualizando sistema operativo..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Instalar dependencias del sistema (necesarias para sharp)
log_info "Instalando dependencias del sistema..."
sudo apt-get install -y build-essential python3 libvips-dev curl git

# 3. Instalar Node.js 18 LTS
if ! command -v node &> /dev/null; then
    log_info "Instalando Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_info "Node.js $(node --version) instalado"
else
    log_info "Node.js $(node --version) ya está instalado"
fi

# 4. Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    log_info "Instalando PM2..."
    sudo npm install -g pm2
    log_info "PM2 instalado"
else
    log_info "PM2 ya está instalado"
fi

# 5. Crear directorio de la aplicación
APP_DIR="/home/$USER/wimpy-chatbot"
log_info "Directorio de aplicación: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# 6. Verificar si hay código
if [ ! -f "package.json" ]; then
    log_warn "No se encontró package.json"
    log_warn "Por favor, clona tu repositorio o copia los archivos aquí:"
    log_warn "  git clone <tu-repo-url> ."
    log_warn "  O usa SCP: scp -r ./* ubuntu@<ip-ec2>:~/wimpy-chatbot/"
    exit 1
fi

# 7. Crear directorios necesarios
log_info "Creando directorios..."
mkdir -p auth_info audio imagenes/catalogo imagenes/pdfs menus logs

# 8. Instalar dependencias
log_info "Instalando dependencias de Node.js..."
npm ci --only=production || npm install --only=production

# 9. Detener instancia anterior si existe
log_info "Deteniendo instancia anterior (si existe)..."
pm2 delete wimpy-chatbot 2>/dev/null || true

# 10. Iniciar con PM2
log_info "Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js --env production

# 11. Guardar configuración PM2 para reinicio automático
log_info "Configurando inicio automático..."
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# 12. Mostrar estado
log_info "Estado de la aplicación:"
pm2 status

echo ""
echo "=========================================="
echo "  Deployment completado!"
echo "=========================================="
echo ""
log_info "Panel de control: http://$(curl -s ifconfig.me):3000"
log_info "Editor: http://$(curl -s ifconfig.me):3000/editor.html"
log_info "API Status: http://$(curl -s ifconfig.me):3000/status"
echo ""
log_warn "IMPORTANTE: La primera vez debes escanear el código QR"
log_warn "Accede al panel de control para ver el QR"
echo ""
log_info "Comandos útiles PM2:"
echo "  - Ver logs: pm2 logs wimpy-chatbot"
echo "  - Reiniciar: pm2 restart wimpy-chatbot"
echo "  - Detener: pm2 stop wimpy-chatbot"
echo "  - Estado: pm2 status"
echo "  - Monitoreo: pm2 monit"
echo ""
