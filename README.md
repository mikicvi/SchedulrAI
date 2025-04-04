[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=coverage)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=bugs)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=mikicvi_SchedulrAI&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=mikicvi_SchedulrAI)

# SchedulrAI

SchedulrAI is a booking/scheduling management system for small business owners that aims to improve and speed up the organization of operations while reducing costs.

## Semi-Automated Quick Start

🚀 Automated Docker & Ollama Installer - SchedulrAI

This script will install Docker, Ollama, and AI models automatically.

---

## 🖥 1. Windows Installation

1. Open **PowerShell**:

    - Press `Win + X`, then click **Terminal (Admin)** or **PowerShell (Admin)**.
    - Alternatively, press `Win + R`, type `powershell`, and press **Enter**.

2. Copy and paste the command below:

`Invoke-WebRequest -Uri "https://nextcloud.mikicvi.com/public.php/dav/files/n2fnyfQ5Aa8zEGF/powershell-install.bat" -OutFile "$env:TEMP\powershell-install.bat"; Start-Process cmd -ArgumentList "/k $env:TEMP\powershell-install.bat"`

3. Press **Enter** and follow the instructions.

---

## 🐧 2. Linux / Mac Installation

1. Open **Terminal**:

    - **Linux:** Press `Ctrl + Alt + T` or search for **Terminal** in your applications.
    - **Mac:** Press `Cmd + Space`, type **Terminal**, and press **Enter**.

2. Copy and paste the command below (**Recommended**):

`curl -o /tmp/bash-install.sh "https://nextcloud.mikicvi.com/public.php/dav/files/n2fnyfQ5Aa8zEGF/bash-install.sh" && chmod +x /tmp/bash-install.sh && /tmp/bash-install.sh`

**Alternative:**

`curl -sSL "https://nextcloud.mikicvi.com/public.php/dav/files/n2fnyfQ5Aa8zEGF/bash-install.sh" | bash`

3. Press **Enter** and let the script run.

---

## ✅ 3. Done! SchedulrAI is now installed.

The script at the end will tell you where the files are. You can access the application at `http://localhost` in your browser.

## Pre-requisites

-   Docker - Latest recommended
-   Ollama
-   Node.js - LTS/iron recommended
-   npm (v9.6.6 or later)

## Quick start for users that wish to install manually

-   Satisfy the requirements above
-   Run `ollama pull llama3.2:3b-instruct-q5_K_M` to pull the required model
-   Run `ollama pull nomic-embed-text` to pull the required embedding model
-   Download docker-compose.prod.yml and .env.example from the repository
-   Rename .env.example to .env and fill in the required environment variables. Set up the Google Cloud Project and obtain the client ID and secret for the Google OAuth variables. Generate the authentication credentials for the ChromaDB server and client. Generate the authentication secret key.
    -   Rest of required variables can be left as default - you can read up more on them in the Environment Variables section
-   Rename docker-compose.prod.yml to docker-compose.yml
-   Run `docker-compose up` in the directory where the files are located

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

## Development Installation

#### Required Files

-   `.env`: Environment variables file. - place in backend folder
-   `docker-compose.yml`: Docker Compose configuration file.
    **Alternatively, you can place .env in the root directory to docker-compose.yml**

1. Clone the repository:

    ```sh
    git clone https://github.com/mikicvi/schedulrai.git
    cd schedulrai
    ```

2. Install dependencies:
   cd backend

    ```sh
    npm install
    ```

    cd frontend

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


## 📸 Dev Preview
<img width="1369" alt="Screenshot 2025-04-04 at 21 06 40" src="https://github.com/user-attachments/assets/fdffe5a2-97c9-424e-8017-e9649111108d" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 07 34" src="https://github.com/user-attachments/assets/d7980820-6c2d-446c-8514-106ba6a9eb12" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 16 25" src="https://github.com/user-attachments/assets/05ec5181-81a0-4620-be14-94ebbc1f9318" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 17 35" src="https://github.com/user-attachments/assets/0e8f2f57-6222-4b60-8a23-3a494389dfee" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 07 52" src="https://github.com/user-attachments/assets/39c7f7a7-3a90-4b0d-acc6-2cc94499ad8d" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 12 29" src="https://github.com/user-attachments/assets/b16dde00-333e-43d3-9697-96570e7ba3b4" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 12 37" src="https://github.com/user-attachments/assets/ce6ffa35-0b81-478c-9670-65b7671ca002" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 18 40" src="https://github.com/user-attachments/assets/a0f78842-6015-4fcf-8b4b-1ed82595d2a1" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 18 46" src="https://github.com/user-attachments/assets/4f9daca3-b5b0-47dc-85cd-277b7502d9ae" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 08 06" src="https://github.com/user-attachments/assets/f1ca38d5-e5d3-4011-aa1b-74ddbf18a7bb" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 08 16" src="https://github.com/user-attachments/assets/d6ee5c43-8b3b-408b-9e7d-d362aab6b4db" />
<img width="1369" alt="Screenshot 2025-04-04 at 21 08 27" src="https://github.com/user-attachments/assets/2a0caecf-7ad0-4d6c-bd0d-bba4cec01a25" />


