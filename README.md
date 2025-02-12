[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=bugs)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI)

# SchedulrAI

SchedulrAI is a booking/scheduling management system for small business owners that aims to improve and speed up the organization of operations while reducing costs.

## Pre-requisites

-   Docker - Latest recommended
-   Node.js - LTS/iron recommended
-   npm (v9.6.6 or later)

## Environment Variables

The application requires the following environment variables to be set. You can create a `.env` file in the root directory of the project to set these variables.

-   Chroma Server Authentication Credentials - Basic auth (RFC 7617) - need to be generated with `htpasswd -bc server.htpasswd admin admin` or `docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin admin > server.htpasswd`
-   Auth secret needs to be generated with `openssl rand -base64 32` or `openssl rand -hex 32` in Linux/MacOS or `openssl rand -base64:32` in Windows
-   Google OAuth client ID and secret can be obtained by creating a project in the Google Cloud Console and enabling the Google+ API. The redirect URI should be set to `http://localhost:3000/api/google/callback` for local use
    | Variable Name | Description | Default Value |
    | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
    | `CHROMA_SERVER_AUTHN_CREDENTIALS` | Authentication credentials for ChromaDB server | `admin:REPLACE_WITH_HASHED_PASSWORD` |
    | `CHROMA_SERVER_AUTHN_PROVIDER` | Authentication provider for ChromaDB server | `chromadb.auth.basic_authn.BasicAuthenticationServerProvider` |
    | `CHROMA_CLIENT_AUTH_CREDENTIALS` | Client authentication credentials for ChromaDB | `admin:REPLACE_WITH_PASSWORD` |
    | `CHROMA_SERVER_HOST` | Host for the ChromaDB server | `127.0.0.1` |
    | `CHROMA_SERVER_PORT` | Port for the ChromaDB server | `8000` |
    | `COMPOSE_PROJECT_NAME` | Docker compose project name | `schedulrai` |
    | `OLLAMA_API_BASE` | Base URL for the Ollama API | `127.0.0.1` |
    | `OLLAMA_PORT` | Port for the Ollama API | `11434` |
    | `LLM_MODEL` | Language model to be used | `llama3.2:3b-instruct-q5_K_M` |
    | `LLM_EMBED_MODEL` | Embedding model to be used | `nomic-embed-text` |
    | `LOG_LEVEL` | Logging level | `debug` |
    | `PROTOCOL` | Protocol used by the server | `http` |
    | `EXPRESS_PORT` | Port on which the Express server runs | `3000` |
    | `AUTH_SECRET` | Authentication secret key | `REPLACE_WITH_GENERATED_SECRET` |
    | `ALLOWED_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost,http://localhost:80,http://localhost:3000,http://frontend,http://localhost:5173` |
    | `DB_PATH` | SQLite database file path | `data/db.sqlite3` |
    | `FRONTEND_URL` | Url for frontend (e.g if on 80) | `http://localhost` |
    | `GOOGLE_CLIENT_ID` | Google OAuth client ID | `REPLACE_WITH_GOOGLE_CLIENT_ID` |
    | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `REPLACE_WITH_GOOGLE_CLIENT_SECRET` |
    | `GOOGLE_CALLBACK_URL` | Google OAuth redirect URI - port may vary depending on your setup | `http://localhost:3000/api/google/callback` |

## Ollama Environment Variables

The application also requires the following environment variables for Ollama models. You can create an `ollama.env` file in the docker directory of the project to set these variables.

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
    git clone https://github.com/mikicvi/schedulrai.git
    cd schedulrai
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Rename the `.env.example` file to `.env` and fill it out with the required environment variables as per the instructions:

    ```sh
    mv .env.example .env
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
