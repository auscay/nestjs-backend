# NestJS Authentication API

## Project Setup and Usage

### 1. Initial Setup
First clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
cp .env.example .env
```

Edit the .env file with your configuration:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_auth?schema=public"
JWT_SECRET="your-strong-secret-key-here"
```

### 2. Database Configuration
Start PostgreSQL using Docker and run migrations:
```bash
docker-compose up -d
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Running the Application
For development with hot-reload:
```bash
npm run start:dev
```

For production build:
```bash
npm run build
npm run start:prod
```
The GraphQL Playground will be available at http://localhost:3000/graphql

### 4. Testing
Run the test suite with:
```bash
npm run test
```

### 5. API Usage Examples
User Registration:

```graphql
mutation Register {
  register(input: {
    email: "user@example.com",
    password: "securePassword123!",
    biometricKey: "device-fingerprint-123"
  }) {
    success
    message
    data {
      id
      email
    }
  }
}
```

User Login:

```graphql
mutation Login {
  login(input: {
    email: "user@example.com",
    password: "securePassword123!"
  }) {
    success
    message
    accessToken
    data {
      id
      email
    }
  }
}
```

Biometric Login:

```graphql
mutation BioLogin {
  biometricLogin(biometricKey: "device-fingerprint-123") {
    success
    message
    accessToken
    data {
      id
      email
    }
  }
}
```

Get Current User:

```graphql
query Me {
  me {
    id
    email
    createdAt
  }
}
```

### 6. Deployment
To build and run with Docker:

```bash
docker build -t nestjs-backend .
docker run -p 3000:3000 --env-file .env nest-auth