# Maynd.ma Admin Dashboard

> 100% Offline AI Desktop Application Admin Panel for Maynd.ma

## 📋 About

Maynd.ma Admin is the backend administration panel for managing the Maynd.ma offline AI desktop application. It provides:
- License key management
- Hardware UUID registry
- User and client management
- Audit logging
- System configuration

## 🚀 Quick Start (WSL2 + Docker)

### Prerequisites

- **WSL2** enabled on Windows
- **Docker Desktop** installed and running
- **Git** installed
- Minimum **4GB RAM** allocated to WSL2 (recommended: 8GB)

### 1. Clone the Repository

```bash
cd ~/Maynd.ma
git clone https://github.com/ismailrabah/maynd-admin.git
cd maynd-admin
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
# Required
JWT_SECRET=your-strong-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@maynd.ma

# Optional
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
API_BASE=http://localhost:3000/api
DATABASE_URL=sqlite:./data/maynd-admin.db
```

### 3. Build and Run with Docker

```bash
# Build the containers
docker-compose up --build
```

Wait for the build to complete. On first run, this will:
- Download Bun base image (~500MB)
- Install all dependencies
- Build the Nuxt frontend
- Start the application

### 4. Access the Application

Once the containers are running:

- **Admin Dashboard**: Open your browser and go to `http://localhost:3000`
- **API Endpoint**: `http://localhost:3000/api`

### 5. Stop the Application

```bash
# Stop containers
docker-compose down

# To also remove volumes (data will be lost!)
docker-compose down -v
```

## 🛠️ Local Development (Without Docker)

### Prerequisites

- **Node.js** 20+ (or **Bun** 1.0+ recommended)
- **SQLite** (included with Node.js on most systems)
- **Git**

### 1. Install Dependencies

Using **Bun** (recommended for faster installs):

```bash
# Install Bun globally first
curl -fsSL https://bun.sh/install | bash

# Then in project root
bun install
```

Or using **npm**:

```bash
npm install
```

### 2. Set Up Database

```bash
mkdir -p data logs
```

### 3. Run the Services

**Terminal 1: Start the API Server**

```bash
cd server
bun run dev
# or: npm run dev
```

**Terminal 2: Start the Admin Frontend**

```bash
cd client
bun run dev
# or: npm run dev
```

- **Admin Dashboard**: `http://localhost:3001`
- **API Server**: `http://localhost:3000`

## 📦 Project Structure

```
maynd-admin/
├── client/                  # Nuxt 4 Frontend
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   ├── app.vue
│   └── nuxt.config.ts
│
├── server/                  # Hono Backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   └── package.json
│
├── Dockerfile               # Bun-based Docker build
├── docker-compose.yml       # Docker Compose configuration
├── README.md                # This file
└── .env.example             # Environment variables template
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT tokens |
| `ADMIN_USERNAME` | ✅ Yes | `admin` | Admin username |
| `ADMIN_PASSWORD` | ✅ Yes | - | Admin password |
| `ADMIN_EMAIL` | ✅ Yes | `admin@maynd.ma` | Admin email |
| `NODE_ENV` | ❌ No | `production` | Environment mode |
| `PORT` | ❌ No | `3000` | Server port |
| `HOST` | ❌ No | `0.0.0.0` | Server host |
| `API_BASE` | ❌ No | `http://localhost:3000/api` | API base URL |
| `DATABASE_URL` | ❌ No | `sqlite:./data/maynd-admin.db` | Database connection string |

### Database

By default, SQLite is used with the database stored in `./data/maynd-admin.db`.
For production, you can change to PostgreSQL or MySQL by updating the `DATABASE_URL`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/licenses` | List all licenses |
| POST | `/api/admin/licenses` | Create new license |
| GET | `/api/admin/licenses/:id` | Get license details |
| PUT | `/api/admin/licenses/:id` | Update license |
| DELETE | `/api/admin/licenses/:id` | Delete license |
| GET | `/api/admin/stats` | Get system statistics |
| GET | `/api/health` | Health check |

## 🔒 Security

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong, random string (32+ characters)
- [ ] Change default `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Set up HTTPS with a reverse proxy (Nginx, Caddy, etc.)
- [ ] Configure firewall rules
- [ ] Enable Docker container restrictions
- [ ] Set up regular backups for the SQLite database

### JWT Secret Generation

```bash
# Generate a strong secret
openssl rand -base64 32
# or
bun -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

## 🐛 Troubleshooting

### Docker Build Fails

**Error**: `Cannot find module '../@runtime/main.js'`

**Solution**: This is caused by vite-plugin-checker. The Dockerfile already includes `ENV NODE_ENV=development` before the build step. If you still see this error:

1. Make sure you're using the latest Dockerfile
2. Run `docker-compose down -v` to clean up
3. Run `docker-compose up --build --no-cache`

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:

```bash
# Find and kill the process
sudo lsof -i :3000
kill -9 <PID>

# Or use a different port
# Edit docker-compose.yml and change "3000:3000" to "3001:3000"
```

### SQLite Permission Errors

**Error**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**:

```bash
# Create data directory with correct permissions
mkdir -p data logs
chmod -R 777 data logs

# Or in Docker, ensure volumes are writable
```

### Bun Not Found

**Error**: `bun: command not found`

**Solution**:

```bash
# Install Bun globally
curl -fsSL https://bun.sh/install | bash

# Add to PATH
source ~/.bashrc
# or
source ~/.zshrc
```

## 📄 License

Private - All rights reserved. Maynd.ma

## 🤝 Support

For issues or questions:
- **Email**: support@maynd.ma
- **Documentation**: [Maynd.ma Docs](https://docs.maynd.ma)

---

**Made in Morocco** 🇲🇦
