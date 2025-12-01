# Migration Guide: SQLite to MongoDB

This guide helps you migrate from the old SQLite database to the new MongoDB setup.

## What Changed?

### Database
- **Before**: SQLite (hrnexus.db file)
- **After**: MongoDB (NoSQL database)

### Benefits
- Better scalability for production
- Improved performance with large datasets
- Better support for concurrent users
- More flexible schema
- Industry-standard for modern applications

## Migration Steps

### 1. Install MongoDB

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. MongoDB will start automatically

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/
```

Type `exit` to quit mongosh.

### 3. Update Backend Dependencies

```bash
cd backend

# Activate virtual environment
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install new dependencies
pip install -r requirements.txt
```

### 4. Update Environment Variables

Your `.env` file has been updated automatically. Verify it contains:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hrnexus
SECRET_KEY=your-secret-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
```

### 5. Seed the Database

```bash
# Run the seed script to populate MongoDB with sample data
python seed_data.py
```

This creates:
- 3 sample users (admin, hr manager, recruiter)
- 12 sample tasks across all HR categories
- Database indexes for performance

### 6. Start the Application

```bash
# Start backend
uvicorn main:app --reload --port 8000

# In another terminal, start frontend
cd frontend
npm run dev
```

### 7. Login with Sample Users

You can now login with:
- admin@hrnexus.com / admin123
- hr.manager@hrnexus.com / manager123
- recruiter@hrnexus.com / recruiter123

## What About My Old Data?

### Documents
Your uploaded documents in the `uploads/` folder are **preserved**. They will continue to work with the new system.

### Vector Database
Your ChromaDB vector database in `chroma_db/` is **preserved**. All your document embeddings remain intact.

### Old SQLite Data
If you want to keep your old SQLite data:
1. The old `hrnexus.db` file is still in the backend folder
2. You can manually export data if needed
3. The file is now ignored by git (won't be committed)

**Note**: The new MongoDB database starts fresh with sample data. If you need to migrate specific data from SQLite, you'll need to do it manually.

## Troubleshooting

### MongoDB won't start

**Windows:**
```bash
# Check service status
sc query MongoDB

# Start service
net start MongoDB
```

**Mac:**
```bash
# Check status
brew services list

# Start service
brew services start mongodb-community
```

**Linux:**
```bash
# Check status
sudo systemctl status mongod

# Start service
sudo systemctl start mongod
```

### Connection refused error

Make sure MongoDB is running on port 27017:
```bash
# Check if port is in use
netstat -an | grep 27017

# Or use mongosh to test connection
mongosh
```

### Can't install MongoDB

If you can't install MongoDB locally, you can use MongoDB Atlas (free cloud database):

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update `.env`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DATABASE_NAME=hrnexus
   ```

### Dependencies installation fails

```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Then install requirements
pip install -r requirements.txt
```

### Seed script fails

Make sure:
1. MongoDB is running
2. Virtual environment is activated
3. All dependencies are installed
4. No firewall blocking port 27017

## Rollback (If Needed)

If you need to go back to SQLite temporarily:

1. Checkout the previous commit:
   ```bash
   git log --oneline  # Find the commit before MongoDB migration
   git checkout <commit-hash>
   ```

2. Or manually restore old files from git history

## Database Schema Comparison

### SQLite (Old)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    hashed_password TEXT,
    ...
);
```

### MongoDB (New)
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  hashed_password: "...",
  created_at: ISODate("...")
}
```

## Performance Improvements

With MongoDB, you'll notice:
- ✅ Faster queries with indexes
- ✅ Better concurrent user support
- ✅ More flexible data structures
- ✅ Easier to scale in production
- ✅ Better for real-time features

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Dependencies updated
3. ✅ Database seeded
4. ✅ Application running
5. 🎯 Start using the new system!

## Need Help?

- Check MongoDB logs: `mongosh` → `show logs`
- Check application logs in terminal
- Verify all services are running
- Review error messages carefully

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Backend README](backend/README.md) - Detailed API documentation
- [Quick Start Guide](QUICK_START.md) - Setup instructions
