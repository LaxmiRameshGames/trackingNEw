// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Create location schema
const locationSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Location = mongoose.model('Location', locationSchema);

// API endpoint to receive location updates
app.post('/api/location', async (req, res) => {
  try {
    const { phoneNumber, latitude, longitude, accuracy, timestamp } = req.body;
    
    if (!phoneNumber || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new location record
    const location = new Location({
      phoneNumber,
      latitude,
      longitude,
      accuracy,
      timestamp: timestamp || new Date()
    });
    
    // Save to database
    await location.save();
    
    res.status(201).json({ 
      message: 'Location saved successfully',
      location: {
        id: location._id,
        phoneNumber,
        latitude,
        longitude,
        accuracy,
        timestamp: location.timestamp
      }
    });
    
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API endpoint to get the latest location for a phone number
app.get('/api/location/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Find the latest location for this phone number
    const location = await Location.findOne({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(1);
    
    if (!location) {
      return res.status(404).json({ error: 'No location found for this phone number' });
    }
    
    res.json({
      phoneNumber: location.phoneNumber,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp
    });
    
  } catch (error) {
    console.error('Error retrieving location:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});