const express = require('express');

const router = express.Router();

// Get all stations
router.get('/', async (req, res) => {
  try {
    const { search, latitude, longitude, radius } = req.query;
    
    let stations = await req.db.query('stations');
    
    // Apply search filter
    if (search) {
      stations = stations.filter(station => 
        station.name.toLowerCase().includes(search.toLowerCase()) ||
        station.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Calculate distances if coordinates provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      
      stations = stations.map(station => {
        const distance = calculateDistance(userLat, userLon, station.latitude, station.longitude);
        return { ...station, distance };
      });
      
      // Filter by radius if provided
      if (radius) {
        const radiusKm = parseFloat(radius);
        stations = stations.filter(station => station.distance <= radiusKm);
      }
      
      // Sort by distance
      stations.sort((a, b) => a.distance - b.distance);
    }
    
    res.json({
      stations,
      pagination: {
        page: 1,
        limit: 50,
        total: stations.length,
        totalPages: 1
      }
    });
    
  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// Get station by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const station = await req.db.findOne('stations', { id: parseInt(id) });
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    // Get batteries at this station
    const batteries = await req.db.query('batteries', { station_id: parseInt(id) });
    
    res.json({ 
      station: {
        ...station,
        battery_count: batteries.length,
        available_batteries: batteries.filter(b => b.status === 'available').length
      }
    });
    
  } catch (error) {
    console.error('Get station error:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;