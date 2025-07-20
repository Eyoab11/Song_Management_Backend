const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Song Management API is running!' });
});

// Swagger UI setup
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// MongoDB Connection Function
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ Connected to MongoDB Atlas successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Check if MONGO_URI is correct');
    console.log('   2. Ensure MongoDB Atlas network access allows all IPs (0.0.0.0/0)');
    console.log('   3. Verify your MongoDB Atlas cluster is running');
    console.log('   4. Check if your connection string includes the database name');
    
    // Don't exit the process, let it continue but API calls will fail
    console.log('⚠️  Server will start but database operations will fail');
  }
};

// Initialize database connection
connectDB();

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});
db.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});
db.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

// Song Schema & Model
const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  year: { type: Number, required: true },
  published: String,
  location: String,
  description: String,
  image_url: String,
}, { timestamps: true });

const Song = mongoose.model('Song', songSchema);

// Get all songs
app.get('/api/songs', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'Please try again later' 
      });
    }
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single song by ID
app.get('/api/songs/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'Please try again later' 
      });
    }
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new song
app.post('/api/songs', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'Please try again later' 
      });
    }
    const song = new Song(req.body);
    await song.save();
    res.status(201).json(song);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a song
app.put('/api/songs/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'Please try again later' 
      });
    }
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a song
app.delete('/api/songs/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        message: 'Please try again later' 
      });
    }
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Song Management API Server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🎵 API Base: http://localhost:${PORT}/api/songs`);
}); 