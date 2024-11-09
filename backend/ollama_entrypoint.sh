#!/bin/bash

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Start Ollama in the background
/bin/ollama serve &

# Record the PID of the Ollama process
pid=$!

sleep 5

echo "Ollama is running with PID $pid"
echo "Pulling the models: $LLM_MODEL and $LLM_EMBED_MODEL"
ollama pull "$LLM_EMBED_MODEL"
ollama pull "$LLM_MODEL"
echo "Models are pulled successfully - starting the server"

# Wait for the Ollama process to finish
wait $pid