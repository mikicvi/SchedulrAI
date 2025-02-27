#!/bin/bash

# Define URLs for required files
NEXTCLOUD_BASE_URL="https://nextcloud.mikicvi.com/public.php/dav/files/n2fnyfQ5Aa8zEGF/"
DOCKER_COMPOSE_URL="${NEXTCLOUD_BASE_URL}docker-compose.yml"
ENV_FILE_URL="${NEXTCLOUD_BASE_URL}.env"
DOCKER_URL="https://www.docker.com/products/docker-desktop/"
INSTALL_DIR="$HOME/Documents/SchedulrAI-Installed"

echo "Checking if Docker is installed..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo "Homebrew not found. Installing..."
            if ! sudo -v; then
                echo "Need sudo access on macOS (e.g. the user needs to be an Administrator)!"
                exit 1
            fi
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/$(whoami)/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        if ! sudo -v; then
            echo "Need sudo access on macOS (e.g. the user needs to be an Administrator)!"
            exit 1
        fi
        brew install --cask docker
    else
        sudo apt update && sudo apt install -y docker.io || sudo yum install -y docker
        sudo systemctl enable --now docker
    fi
    echo "Docker installation completed."
fi

# Check if Docker is running, start it if not
if (! docker info > /dev/null 2>&1); then
    echo "Docker is not running. Starting Docker..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! sudo -v; then
            echo "Need sudo access on macOS (e.g. the user needs to be an Administrator)!"
            exit 1
        fi
        open -a Docker
    else
        sudo systemctl start docker
    fi
fi

# Wait for Docker to be fully running
until docker info > /dev/null 2>&1; do
    echo "Waiting for Docker to start..."
    sleep 5
done
echo "Docker is running."

echo "Checking if Ollama is installed..."
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ollama
    else
        curl -fsSL https://ollama.ai/install.sh | sh
    fi
    echo "Ollama installation completed."
fi

# Check if Ollama is running, start it if not
if ! pgrep -x "ollama" > /dev/null; then
    echo "Ollama is not running. Starting Ollama..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start ollama
    else
        sudo systemctl start ollama
    fi
    echo "Ollama started."
else
    echo "Ollama is already running."
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download docker-compose.yml if not found
if [ ! -f "docker-compose.yml" ]; then
    echo "Downloading docker-compose.yml..."
    curl -o docker-compose.yml "$DOCKER_COMPOSE_URL" || DOWNLOAD_FAILED=1
fi

# Download .env if not found
if [ ! -f ".env" ]; then
    echo "Downloading .env file..."
    curl -o .env "$ENV_FILE_URL" || DOWNLOAD_FAILED=1
fi

# If downloads failed, show fallback message
if [ "$DOWNLOAD_FAILED" == "1" ]; then
    echo "Some files could not be downloaded. Please manually download them from:"
    echo "Nextcloud: https://nextcloud.mikicvi.com/s/5AwmomnJYiG7Rmw"
    echo "Place them in $INSTALL_DIR and re-run this script."
    exit 1
fi

# Extract model names from .env
LLM_MODEL=$(grep -E '^LLM_MODEL=' .env | cut -d '=' -f2)
LLM_EMBED_MODEL=$(grep -E '^LLM_EMBED_MODEL=' .env | cut -d '=' -f2)

# Pull models **BEFORE** running Ollama
if [ -n "$LLM_MODEL" ]; then
    echo "Pulling Ollama model: $LLM_MODEL"
    ollama pull "$LLM_MODEL"
    if [ $? -ne 0 ]; then
        echo "Failed to pull model: $LLM_MODEL. Exiting..."
        exit 1
    fi
fi

if [ -n "$LLM_EMBED_MODEL" ]; then
    echo "Pulling Ollama embedding model: $LLM_EMBED_MODEL"
    ollama pull "$LLM_EMBED_MODEL"
    if [ $? -ne 0 ]; then
        echo "Failed to pull model: $LLM_EMBED_MODEL. Exiting..."
        exit 1
    fi
fi

# Start Ollama **AFTER** models are pulled
echo "Starting Ollama in the background..."
nohup ollama serve > /dev/null 2>&1 &

echo "Starting Docker Compose..."
docker compose pull
docker compose up -d

echo "+----------------------------------------------------+"
echo "| SchedulrAI Environment is ready!                  |"
echo "| You can access the interface at http://localhost  |"
echo "| Your files are at $INSTALL_DIR                    |"
echo "+----------------------------------------------------+"

