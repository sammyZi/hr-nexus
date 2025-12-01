# MongoDB Setup Summary

## Quick Setup (Automated)

### Windows
```bash
cd backend
setup.bat
```

### Mac/Linux
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

This will:
1. Create virtual environment
2. Install all dependencies
3. Seed MongoDB with sample data

## Manual Setup

### 1. Install MongoDB

Download from: https://www.mongodb.com/try/download/community

### 2. Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 3. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure Environment

Update `.env` file:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hrnexus
SECRET_KEY=your-secret-key
```

### 5. Seed Database

```bash
python seed_data.py
```

### 6. Start Server

```bash
uvicorn main:app --reload --port 8000
```

## Sample Data Created

### Users (3)
- admin@hrnexus.com / admin123
- hr.manager@hrnexus.com / manager123
- recruiter@hrnexus.com / recruiter123

### Tasks (12)
Distributed across all HR categories:
- Recruiting (2 tasks)
- Onboarding (1 task)
- Payroll (2 tasks)
- Benefits (1 task)
- Learning & Development (1 task)
- Employee Relations (3 tasks)
- Performance (1 task)
- Offboarding (1 task)

## Database Collections

### users
- Stores user accounts
- Email authentication
- Verification tokens

### tasks
- HR tasks management
- Category-based organization
- Priority and status tracking

### documents
- Uploaded document metadata
- File paths and types
- Category tagging

## Indexes Created

For optimal performance:
- `users.email` (unique)
- `tasks.category`
- `tasks.status`
- `tasks.owner_id`
- `documents.filename`
- `documents.category`

## Verify Setup

### Check MongoDB Connection
```bash
mongosh
> show dbs
> use hrnexus
> show collections
> db.users.countDocuments()
```

Should show 3 users.

### Check API
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "ok", "database": "mongodb"}
```

### Check Sample Data
```bash
curl http://localhost:8000/tasks
```

Should return 12 tasks.

## Troubleshooting

### MongoDB not starting
```bash
# Check if already running
mongosh

# Check service status (Windows)
sc query MongoDB

# Check service status (Linux/Mac)
sudo systemctl status mongod
```

### Connection refused
- Verify MongoDB is running on port 27017
- Check firewall settings
- Verify MONGODB_URL in .env

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Seed script fails
- Ensure MongoDB is running
- Check MongoDB connection string
- Verify virtual environment is activated

## Production Deployment

For production, consider:

1. **MongoDB Atlas** (Cloud)
   - Free tier available
   - Automatic backups
   - Global distribution
   - Update MONGODB_URL to Atlas connection string

2. **Security**
   - Enable authentication
   - Use strong passwords
   - Configure network access
   - Enable SSL/TLS

3. **Performance**
   - Add more indexes as needed
   - Monitor query performance
   - Use connection pooling
   - Enable compression

## Backup & Restore

### Backup
```bash
mongodump --db hrnexus --out ./backup
```

### Restore
```bash
mongorestore --db hrnexus ./backup/hrnexus
```

## Monitoring

### Check Database Size
```bash
mongosh
> use hrnexus
> db.stats()
```

### View Collections
```bash
> show collections
> db.users.find().pretty()
> db.tasks.find().pretty()
```

### Count Documents
```bash
> db.users.countDocuments()
> db.tasks.countDocuments()
> db.documents.countDocuments()
```

## Next Steps

1. ✅ MongoDB installed
2. ✅ Database seeded
3. ✅ Server running
4. 🎯 Start building!

For more details, see:
- [Backend README](README.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [Quick Start](../QUICK_START.md)
