
const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', stationController.getAllStations);
router.get('/:id', stationController.getStationById);

// Protected routes (require admin privileges)
router.post('/', authMiddleware.isAdmin, stationController.createStation);
router.put('/:id', authMiddleware.isAdmin, stationController.updateStation);
router.delete('/:id', authMiddleware.isAdmin, stationController.deleteStation);
router.patch('/:id/maintenance', authMiddleware.isAdmin, stationController.toggleMaintenanceMode);
router.post('/bulk-update', authMiddleware.isAdmin, stationController.bulkUpdateStations);
router.get('/stats', authMiddleware.isAdmin, stationController.getStationStats);


module.exports = router;
