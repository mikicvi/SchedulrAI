# SchedulrAI

SchedulrAI is a booking/scheduling management system for small business owners that aims to improve and speed up the organization of operations while reducing costs.

## Pre-requisites

-   Docker
-   Node.js (v18.19.1 or later)
-   npm (v9.6.6 or later)

## Environment Variables

The application requires the following environment variables to be set. You can create a `.env` file in the root directory of the project to set these variables.

-   Chroma Server Authentication Credentials - Basic auth (RFC 7617) - need to be generated with `htpasswd -bc server.htpasswd admin admin` or `docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin admin > server.htpasswd`

| Variable Name                       | Description                                     | Default Value                                                 |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `CHROMA_SERVER_AUTHN_CREDENTIALS`   | Authentication credentials for ChromaDB server  | `admin:$2y505<22-character salt >`                            |
| `CHROMA_SERVER_AUTHN_PROVIDER`      | Authentication provider for ChromaDB server     | `chromadb.auth.basic_authn.BasicAuthenticationServerProvider` |
| `CHROMA_CLIENT_AUTH_CREDENTIALS`    | Client authentication credentials for ChromaDB  | `admin:dummy_password`                                        |
| `CHROMA_SERVER_HOST`                | Host for the ChromaDB server                    | `127.0.0.1`                                                   |
| `CHROMA_SERVER_PORT`                | Port for the ChromaDB server                    | `8000`                                                        |
| `MONGODB_INITDB_ROOT_USERNAME_FILE` | MongoDB root username                           | `admin`                                                       |
| `MONGODB_INITDB_ROOT_PASSWORD_FILE` | MongoDB root password                           | `dummy_password`                                              |
| `MONGO_INITDB_DATABASE`             | MongoDB initial database                        | `test`                                                        |
| `MONGO_URI`                         | MongoDB URI                                     | `mongodb://127.0.0.1:27017`                                   |
| `MONGO_PORT`                        | MongoDB port                                    | `27017`                                                       |
| `OLLAMA_API_BASE`                   | Base URL for the Ollama API                     | `127.0.0.1`                                                   |
| `OLLAMA_PORT`                       | Port for the Ollama API                         | `11434`                                                       |
| `LLM_MODEL`                         | Language model to be used                       | `llama3.2:3b-instruct-q5_K_M`                                 |
| `LLM_EMBED_MODEL`                   | Embedding model to be used                      | `nomic-embed-text`                                            |
| `LOG_LEVEL`                         | Logging level                                   | `info`                                                        |
| `PROTOCOL`                          | Protocol used by the server (`http` or `https`) | `http`                                                        |
| `EXPRESS_PORT`                      | Port on which the Express server runs           | `3000`                                                        |

## Ollama Environment Variables

The application also requires the following environment variables for Ollama models. You can create an `ollama.env` file in the root directory of the project to set these variables.

-   Note: Llama.3.2 model will be used by default and is the only model supported at the moment.

| Variable Name     | Description                | Default Value                 |
| ----------------- | -------------------------- | ----------------------------- |
| `LLM_MODEL`       | Language model to be used  | `llama3.2:3b-instruct-q5_K_M` |
| `LLM_EMBED_MODEL` | Embedding model to be used | `nomic-embed-text`            |

## Required Files

-   `.env`: Environment variables file. - place in backend folder
-   `ollama.env`: Ollama models env variables file. - place in backend folder
-   `docker-compose.yml`: Docker Compose configuration file.

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/schedulrai.git
    cd schedulrai
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the required environment variables:

    ```sh
    touch .env
    ```

    Example `.env` file:

    ```env
    EXPRESS_PORT=3000
    PROTOCOL=http
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=user
    DB_PASSWORD=password
    DB_NAME=schedulrai
    SESSION_SECRET=secret
    CORS_ORIGIN=http://localhost:5173
    ```

## Running the Application

### Development

To run the application in development mode with hot-reloading:

```sh
npm run dev
```

### Production

To build and start the application in production mode:

```sh
npm run prod
```

### Docker

To run the application using Docker:

```sh
docker-compose up --build
```

or

```sh
docker compose up --build
```

## Testing

To run tests:

```sh
npm run test
```

## Cleaning

To clean the build artifacts:

```sh
npm run clean
```

## Updating Dependencies

To update all dependencies:

```sh
npm run update:deps
```
