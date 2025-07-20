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

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB Atlas!'));

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
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single song by ID
app.get('/api/songs/:id', async (req, res) => {
  try {
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