# Kawan Nusa - Referral Portal Backend 🚀

API Backend for **Kawan Nusa Referral Portal** built with **Hono**, **Bun**, and **TypeORM**. This application handles the core business logic for the referral system, customer management, and incentives.

## 🚀 Getting Started

### Prerequisites

Ensure you have **Bun** installed on your machine. If not, you can install it via:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd kawan-nusa-be
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Configure Environment Variables:
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.dist .env
   ```
   _Edit `.env` and provide your MySQL and SMTP details._

### Development

Run the application in development mode with hot-reloading:

```bash
bun run dev
```

The server will start at `http://localhost:4000` (or your configured port).

### Production

1. Build the project:
   ```bash
   bun run build
   ```
2. Start the production server:
   ```bash
   bun run start
   ```

## 📂 Project Structure

```text
src/
├── config/      # Configuration (Database, SMTP, App)
├── core/        # Core utilities, exceptions, and base classes
├── modules/     # Business logic modules (Auth, Reward, etc.)
│   ├── auth/          # Authentication module
│   ├── customer/      # Customer management
│   ├── feedback/      # Feedback module (AppScript integration)
│   ├── reward/        # Reward system logic
│   └── ...            # Other feature modules
├── routes/      # API routing definitions
└── index.ts     # Main entry point
```

## ⚙️ Configuration (.env)

| Variable             | Description                       | Default                  |
| -------------------- | --------------------------------- | ------------------------ |
| `PORT`               | Server port                       | `4000`                   |
| `ENV`                | Environment (dev/prod)            | `development`            |
| `FE_URL`             | Frontend URL                      | `https://localhost:3000` |
| `DB_HOST`            | Database Host                     | `localhost`              |
| `DB_PORT`            | Database Port                     | `3306`                   |
| `DB_USER`            | Database User                     | `root`                   |
| `DB_PASS`            | Database Password                 | `root`                   |
| `DB_NAME`            | Database Name                     | `kawan_nusa`             |
| `DB_SYNC`            | Sync Database Schema (TypeORM)    | `true`                   |
| `SMTP_HOST`          | SMTP Host                         | -                        |
| `SMTP_PORT`          | SMTP Port                         | -                        |
| `SMTP_USER`          | SMTP Username                     | -                        |
| `SMTP_PASS`          | SMTP Password                     | -                        |
| `SMTP_FROM`          | SMTP Sender Email                 | -                        |
| `JWT_SECRET`         | Access Token Secret               | `supersecretkey`         |
| `JWT_REFRESH_SECRET` | Refresh Token Secret              | `superrefreshsecretkey`  |
| `APP_URL`            | Public base URL of the server     | `http://localhost:4000`  |
| `FEEDBACK_URL`       | Google AppScript deployment URL   | -                        |

