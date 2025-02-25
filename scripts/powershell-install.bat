@echo off
setlocal

:: Define variables
set INSTALL_DIR=%USERPROFILE%\SchedulrAI
set DOCKER_PATH="C:\Program Files\Docker\Docker\Docker Desktop.exe"
set DOCKER_COMPOSE_PATH="C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe"
set DOCKER_HOME=C:\Program Files\Docker
set OLLAMA_PATH="%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
set NEXTCLOUD_BASE_URL=https://nextcloud.mikicvi.com/s/5AwmomnJYiG7Rmw/download?path=/&files=
set DOCKER_COMPOSE_URL=%NEXTCLOUD_BASE_URL%docker-compose.yml
set ENV_FILE_URL=%NEXTCLOUD_BASE_URL%.env

echo Checking if Docker is running...
tasklist | findstr /I "Docker Desktop.exe" >nul
if %errorlevel% neq 0 (
    echo Docker is not running. Checking if Docker is installed...
    docker --version >nul 2>nul
    if %errorlevel% neq 0 (
        echo Docker not found. Installing via winget...
        winget install --id Docker.DockerDesktop -e
        echo Docker installation completed. Starting Docker...
        start "" %DOCKER_PATH%
    ) else (
        echo Docker is installed. Starting Docker...
        start "" %DOCKER_PATH%
    )
    echo Waiting for Docker to start...
    echo Please accept the Docker prompts if asked.
    timeout /t 30
)

:: Manually set the Docker paths (for current session)
set PATH=%DOCKER_HOME%\Docker;%DOCKER_HOME%\Docker\resources\bin;%DOCKER_HOME%\cli-plugins;%PATH%

if exist %DOCKER_PATH% (
    echo Docker is installed and running.
) else (
    echo Docker is not installed correctly. Please install Docker Desktop manually.
)

:: Checking if Ollama is running
tasklist | findstr /I "ollama.exe" >nul
if %errorlevel% neq 0 (
    echo Ollama is not running. Checking if Ollama is installed...
    ollama --version >nul 2>nul
    if %errorlevel% neq 0 (
        echo Ollama not found. Installing via winget...
        winget install --id Ollama.Ollama -e
        echo Ollama installation completed.
        :: Wait for Ollama to be available in PATH
        timeout /t 10 /nobreak
    )
    timeout /t 5
) else (
    echo Ollama is already running.
)

:: Manually set the Ollama path (for current session)
set PATH=%PATH%;%LOCALAPPDATA%\Programs\Ollama

:: Check if Ollama is installed and working
ollama --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Ollama is still not found. Exiting...
)

echo Ollama is installed and ready.

:: Create installation directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: Download docker-compose.yml if not found
if not exist "docker-compose.yml" (
    echo Downloading docker-compose.yml...
    powershell -Command "(New-Object System.Net.WebClient).DownloadFile('%DOCKER_COMPOSE_URL%', 'docker-compose.yml')" || set DOWNLOAD_FAILED=1
)

:: Download .env if not found
if not exist ".env" (
    echo Downloading .env file...
    powershell -Command "(New-Object System.Net.WebClient).DownloadFile('%ENV_FILE_URL%', '.env')" || set DOWNLOAD_FAILED=1
)

:: If downloads failed, show fallback message
if defined DOWNLOAD_FAILED (
    echo Some files could not be downloaded. Please manually download them from:
    echo Nextcloud: https://nextcloud.mikicvi.com/s/5AwmomnJYiG7Rmw
    echo Place them in %INSTALL_DIR% and re-run this script.
    exit /b 1
)

:: Extract model names from .env
set LLM_MODEL=
set LLM_EMBED_MODEL=
for /f "tokens=1,2 delims==" %%A in (.env) do (
    if "%%A"=="LLM_MODEL" set LLM_MODEL=%%B
    if "%%A"=="LLM_EMBED_MODEL" set LLM_EMBED_MODEL=%%B
)

:: Ensure models are pulled BEFORE starting the Ollama server
if defined LLM_MODEL (
    echo Pulling Ollama model: %LLM_MODEL%
    ollama pull %LLM_MODEL%
    if %errorlevel% neq 0 (
        echo Failed to pull model %LLM_MODEL%. Exiting...
        exit /b 1
    )
)

if defined LLM_EMBED_MODEL (
    echo Pulling Ollama embedding model: %LLM_EMBED_MODEL%
    ollama pull %LLM_EMBED_MODEL%
    if %errorlevel% neq 0 (
        echo Failed to pull model %LLM_EMBED_MODEL%. Exiting...
        exit /b 1
    )
)

:: Check if Ollama is already running
netstat -ano | findstr ":11434" >nul
if %errorlevel% equ 0 (
    echo Ollama is already running
) else (
    :: Start Ollama in the background
    echo Starting Ollama in the background...
    start /b ollama serve
    timeout /t 5
)

:: Start Docker Compose (fixing the path issue)
echo Starting Docker Compose...
docker-compose up -d

echo +----------------------------------------------------+
echo ^| SchedulrAI Environment is ready! ^|
echo ^| You can access the interface at http://localhost ^|
echo ^| Your files are at %INSTALL_DIR% ^|
echo +----------------------------------------------------+

endlocal
