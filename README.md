# RevoBank Milestone 4

## Project Overview

RevoBank is a backend banking API built with NestJS, TypeScript, Prisma, and PostgreSQL.
This project was created for Milestone 4 and focuses on secure backend fundamentals such as authentication, authorization, account management, transaction handling, API documentation, testing, and database seeding.

The application provides:
- JWT-based authentication
- Role-based access control for `USER` and `ADMIN`
- User profile management
- Bank account management
- Deposit, withdraw, and transfer transactions
- Swagger API documentation
- Prisma migration and seeding support
- Jest unit tests for important business logic

## Features Implemented

- User registration with hashed password
- User login with JWT access token
- JWT guard for private endpoints
- Role-based authorization with `USER` and `ADMIN`
- Current user profile view and update
- Admin access to user listing and user detail
- Account creation, listing, detail, update, and delete
- Unique account number generation
- Transaction deposit, withdraw, transfer, listing, and detail
- Decimal-safe money calculations with Prisma Decimal
- Atomic balance updates using Prisma `$transaction`
- Duplicate email validation
- Insufficient balance validation
- Self-transfer prevention
- Swagger documentation at `/api/docs`
- Prisma database seeder with dummy users, accounts, and transactions
- Jest tests for key service logic and auth protection

## Tech Stack

- Backend framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT with `@nestjs/jwt`
- Password hashing: bcrypt
- Validation: class-validator and class-transformer
- API documentation: Swagger
- Testing: Jest

## Database Schema Overview

This project uses three main models:

### User
- Stores user identity and login data
- Important fields:
  - `id`
  - `email` (unique)
  - `hashedPassword`
  - `fullName`
  - `role` (`USER` or `ADMIN`)
  - `createdAt`
  - `updatedAt`

### Account
- Represents a bank account owned by a user
- Important fields:
  - `id`
  - `userId`
  - `accountNumber` (unique)
  - `accountName`
  - `balance`
  - `currency`
  - `createdAt`
  - `updatedAt`

### Transaction
- Stores account transaction history
- Important fields:
  - `id`
  - `accountId`
  - `type` (`DEPOSIT`, `WITHDRAW`, `TRANSFER`)
  - `amount`
  - `balanceBefore`
  - `balanceAfter`
  - `referenceNumber` (unique)
  - `description`
  - `createdAt`
  - `updatedAt`

### Relationship Summary

- One `User` can have many `Account`s
- One `Account` belongs to one `User`
- One `Account` can have many `Transaction`s
- One `Transaction` belongs to one `Account`

## API Endpoint List

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### User

- `GET /user/profile`
- `PATCH /user/profile`
- `GET /user` (admin only)
- `GET /user/:id` (admin only)

### Accounts

- `POST /accounts`
- `GET /accounts`
- `GET /accounts/:id`
- `PATCH /accounts/:id`
- `DELETE /accounts/:id`

### Transactions

- `POST /transactions/deposit`
- `POST /transactions/withdraw`
- `POST /transactions/transfer`
- `GET /transactions`
- `GET /transactions/:id`

## Authentication Explanation

RevoBank uses JWT authentication.

How it works:

1. User registers or logs in through `/auth/register` or `/auth/login`
2. Server returns an `access_token`
3. For protected routes, the client sends the token in the `Authorization` header:

```http
Authorization: Bearer your-jwt-token
```

4. The JWT guard verifies the token
5. If valid, the request can continue
6. If missing, invalid, or expired, the API returns `401 Unauthorized`

### Role-Based Access

- `USER`
  - Can only access their own profile
  - Can only access their own accounts
  - Can only access transactions related to their own accounts

- `ADMIN`
  - Can access all users where relevant
  - Can access all accounts
  - Can access all transactions

## Environment Variables

Example environment file is provided in [.env.example](/d:/RevoU/milestone-4-mlitsec/.env.example:1).

Example:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revobank?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="1d"
```

### Variable Explanation

- `PORT`
  Application port. On Render or Railway this is usually injected automatically by the platform.

- `DATABASE_URL`
  PostgreSQL connection string used by Prisma. Set this in the deployment platform environment settings. Do not hardcode it in source code.

- `JWT_SECRET`
  Secret key used to sign and verify JWT tokens. This must be stored as a secure environment variable.

- `JWT_EXPIRES_IN`
  Token expiration setting, for example `1d`

- `NODE_ENV`
  Optional. For deployment you can set this to `production`

## How To Install Dependencies

Run this command from the project root:

```powershell
npm install
```

## How To Run Prisma Migration

1. Make sure PostgreSQL is running
2. Create your local `.env` file from `.env.example`
3. Run migration:

```powershell
npx prisma migrate dev
```

Optional Prisma client generation:

```powershell
npx prisma generate
```

## How To Run The App Locally

1. Install dependencies
2. Set up `.env`
3. Run migration
4. Start the app:

```powershell
npm run start:dev
```

The API will run by default at:

```text
http://localhost:3000
```

## How To Run Tests

Run unit tests:

```powershell
npm test
```

Run tests in watch mode:

```powershell
npm run test:watch
```

## How To Run Database Seeder

This project includes a Prisma seeder for dummy data.

Run:

```powershell
npm run seed
```

or:

```powershell
npx prisma db seed
```

### Seeded Test Accounts

- Admin
  - Email: `admin@revobank.test`
  - Password: `admin12345`

- User
  - Email: `alice@revobank.test`
  - Password: `password123`

- User
  - Email: `bob@revobank.test`
  - Password: `password123`

The seeder also creates:
- Dummy accounts
- Dummy deposit records
- Dummy withdraw records
- Dummy transfer records

## Swagger Documentation

Swagger UI is available at:

```text
http://localhost:3000/api/docs
```

### How To Use Swagger

1. Start the application
2. Open `/api/docs`
3. Use `/auth/login` or `/auth/register` to get a token
4. Click the `Authorize` button in Swagger
5. Paste the JWT token in bearer format
6. Test protected endpoints directly from Swagger UI

## Deployment URL

Deployment URL placeholder:

```text
https://your-deployment-url-here.com
```

## Deployment Instructions

This project is prepared for deployment on platforms like Render or Railway.

### Deployment Readiness

The project is already prepared for deployment because:

- The app already uses `process.env.PORT` in [src/main.ts](/d:/RevoU/milestone-4-mlitsec/src/main.ts:1)
- Prisma Client is generated during build through the `build` script
- Prisma Client is also generated on dependency install through `postinstall`
- Production app start uses:

```powershell
npm start
```

- Production database migrations can be applied with:

```powershell
npm run prisma:migrate:deploy
```

### Recommended Environment Variables For Deployment

Set these in Render or Railway:

```env
PORT=3000
DATABASE_URL=your-managed-postgresql-url
JWT_SECRET=your-strong-random-secret
JWT_EXPIRES_IN=1d
NODE_ENV=production
```

Do not commit real secrets or production database URLs into the repository.

### Render Deployment

1. Push this project to GitHub
2. Create a new `Web Service` in Render
3. Connect the GitHub repository
4. Set the build command:

```text
npm install && npm run build
```

5. Set the start command:

```text
npm start
```

6. Add environment variables in the Render dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV=production`

7. After the database is ready, run production migration:

```text
npm run prisma:deploy
```

8. Open the deployed URL after the service finishes building

### Railway Deployment

1. Push this project to GitHub
2. Create a new Railway project
3. Deploy from the GitHub repository
4. Add a PostgreSQL service or connect an external PostgreSQL database
5. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `PORT`
   - `NODE_ENV=production`

6. Set the Railway build command to:

```text
npm run build
```

7. Set the Railway start command to:

```text
npm run start:prod
```

8. After the database is ready, run production migration:

```text
npm run prisma:migrate:deploy
```

9. Open the deployed Railway public URL and verify:
   - `/health`
   - `/api/docs`
   - `/auth/login`

### Quick Deployment Checklist

Before you mark deployment as finished, make sure:

- environment variables are set correctly
- PostgreSQL database is connected
- Prisma migration has been applied
- the app starts successfully
- `/health` returns a successful response
- `/api/docs` opens correctly
- login endpoint works with seeded or registered user data

### Verify After Deployment

- Health check:
  `GET /health`
- Swagger docs:
  `https://your-deployment-url/api/docs`
- Test login:
  `POST /auth/login`

## Security And Authorization Notes

- Passwords are never stored as plain text
- Passwords are hashed using bcrypt
- JWT is required for protected routes
- Sensitive fields such as `hashedPassword` are not exposed in API responses
- Email must be unique
- Account number must be unique
- Users cannot directly edit account balances from account update endpoints
- Money operations use Prisma Decimal for safer numeric handling
- Deposit, withdraw, and transfer use database transactions so account balance updates and transaction records stay consistent
- Normal users are restricted to their own data
- Admin users have broader read/write access where relevant

## Important API Flow

For assignment review, these are the most important flows to test:

### 1. Register And Login Flow

1. Call `POST /auth/register`
2. Create a new user with email and password
3. Call `POST /auth/login`
4. Copy the returned `access_token`
5. Use the token for protected routes

### 2. User Profile Flow

1. Login as a user
2. Call `GET /user/profile`
3. Call `PATCH /user/profile`
4. Confirm the user can only update their own profile

### 3. Account Flow

1. Login as a normal user
2. Call `POST /accounts`
3. Call `GET /accounts`
4. Call `GET /accounts/:id`
5. Confirm the user cannot access another user's account
6. Login as admin and confirm admin can access broader account data

### 4. Transaction Flow

1. Use an authenticated token
2. Call `POST /transactions/deposit`
3. Call `POST /transactions/withdraw`
4. Call `POST /transactions/transfer`
5. Call `GET /transactions`
6. Confirm balances and transaction records update correctly

## Submission Notes

This Milestone 4 project includes:
- NestJS backend structure
- Prisma schema and migration
- Authentication and authorization
- Banking account and transaction logic
- Swagger documentation
- Seeder
- Jest unit tests

### Final Submission Checklist

Before submission, make sure:

- `npm run build` passes
- `npm test` passes
- Prisma migration works
- Seeder works
- Swagger opens at `/api/docs`
- README is complete
- deployment URL is filled if deployment is available

This README is written to help reviewers and beginners understand how to run, test, deploy, and review the project quickly.
