# Database Setup Guide

## PostgreSQL with TypeORM Configuration

This project uses PostgreSQL as the database with TypeORM as the ORM.

### Prerequisites

1. **Install PostgreSQL**: Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. **Create Database**: Create a database named `debby_shop` (or use your preferred name)

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5433
   DB_USERNAME=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_NAME=debby_shop
   ```

### Database Connection

The application is configured to:
- Auto-sync database schema in development mode (`synchronize: true`)
- Use connection pooling with retry mechanisms
- Log SQL queries in development mode

### Running the Application

1. Ensure PostgreSQL is running
2. Make sure the database exists
3. Start the application:
   ```bash
   npm run start:dev
   ```

### Entity Creation

Create entities in the `src/entities/` directory. Example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class YourEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

### Production Notes

- Set `NODE_ENV=production` in production
- The `synchronize` option is automatically disabled in production
- Consider using migrations for schema changes in production