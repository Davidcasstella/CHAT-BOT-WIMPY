#!/bin/bash

# =============================================================================
# Script de deployment para WhatsApp Bot Wimpy en AWS EC2
# =============================================================================
# Uso:
#   1. Subir este script a tu instancia EC2
#   2. chmod +x deploy-ec2.sh
#   3. ./deploy-ec2.sh
# =============================================================================

set -e

echo "=========================================="
echo "  Wimpy ChatBot - Deployment Script"
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Actualizar sistema
log_info "Actualizando sistema operativo..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    log_info "Instalando Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    log_info "Docker instalado correctamente"
else
    log_info "Docker ya está instalado"
fi

# 3. Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    log_info "Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose instalado correctamente"
else
    log_info "Docker Compose ya está instalado"
fi

# 4. Instalar Git si no está instalado
if ! command -v git &> /dev/null; then
    log_info "Instalando Git..."
    sudo apt-get install -y git
fi

# 5. Crear directorio de la aplicación
APP_DIR="/home/$USER/wimpy-chatbot"
log_info "Creando directorio de aplicación en $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# 6. Clonar o actualizar repositorio
if [ -d ".git" ]; then
    log_info "Actualizando repositorio existente..."
    git pull origin main || git pull origin master || git pull origin progra-2
else
    log_warn "Por favor, clona tu repositorio manualmente o copia los archivos aquí:"
    log_warn "  git clone <tu-repo-url> ."
    log_warn "  O usa SCP para copiar los archivos"
fi

# 7. Crear directorios necesarios para volúmenes
log_info "Creando directorios para persistencia de datos..."
mkdir -p auth_info audio imagenes/catalogo imagenes/pdfs menus

# 8. Configurar permisos
log_info "Configurando permisos..."
chmod -R 755 .
chmod 644 bot-config.json 2>/dev/null || log_warn "bot-config.json no encontrado, se creará al iniciar"

# 9. Construir y ejecutar con Docker Compose
log_info "Construyendo imagen Docker..."
sudo docker-compose build --no-cache

log_info "Iniciando contenedor..."
sudo docker-compose up -d

# 10. Verificar estado
log_info "Verificando estado del contenedor..."
sleep 5
sudo docker-compose ps

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
log_info "Comandos útiles:"
echo "  - Ver logs: sudo docker-compose logs -f"
echo "  - Reiniciar: sudo docker-compose restart"
echo "  - Detener: sudo docker-compose down"
echo "  - Estado: sudo docker-compose ps"
echo ""
