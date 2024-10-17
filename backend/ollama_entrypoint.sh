#!/bin/bash
 
# Start Ollama in the background
/bin/ollama serve &

# Record the PID of the Ollama process
pid=$!


sleep 5

echo "Ollama is running with PID $pid"
echo "Pulling the models: llama3.2 and nomic-embed-text"
ollama pull nomic-embed-text
ollama pull llama3.2
echo "Models are pulled successfully - starting the server"

# Wait for the Ollama process to finish
wait $pid