const { Op } = require('sequelize');
const Station = require('../models/Station');
const Battery = require('../models/Battery');
const Rental = require('../models/Rental');
const User = require('../models/User');

// @desc    Get all stations with pagination, search, and battery counts
// @route   GET /api/stations
// @access  Public
exports.getAllStations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (search) {
      where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const { count, rows } = await Station.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const stations = await Promise.all(rows.map(async (station) => {
      const availableBatteries = await Battery.count({ where: { stationId: station.id, status: 'available' } });
      const inUseBatteries = await Battery.count({ where: { stationId: station.id, status: 'in_use' } });
      return {
        ...station.toJSON(),
        location: `${station.latitude}, ${station.longitude}`,
        availableBatteries,
        inUseBatteries,
      };
    }));

    res.json({
      data: stations,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      totalCount: count,
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// @desc    Get a single station by ID
// @route   GET /api/stations/:id
// @access  Public
exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id, {
      include: [
        { model: Battery, as: 'batteries' },
        {
          model: Rental,
          as: 'recentRentals',
          include: [{ model: User, as: 'user', attributes: ['name'] }],
          limit: 10,
          order: [['startTime', 'DESC']]
        }
      ]
    });

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json(station);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create a new station
// @route   POST /api/stations
// @access  Admin
exports.createStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);
    res.status(201).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update a station
// @route   PUT /api/stations/:id
// @access  Admin
exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    await station.update(req.body);
    res.json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Delete a station
// @route   DELETE /api/stations/:id
// @access  Admin
exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    await station.destroy();
    res.json({ message: 'Station removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Toggle station maintenance mode
// @route   PATCH /api/stations/:id/maintenance
// @access  Admin
exports.toggleMaintenanceMode = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) {
      return res.status(404).json({ msg: 'Station not found' });
    }
    station.in_maintenance = req.body.maintenance_mode;
    await station.save();
    res.json(station);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Bulk update stations
// @route   POST /api/stations/bulk-update
// @access  Admin
exports.bulkUpdateStations = async (req, res) => {
  const { station_ids, update_data } = req.body;

  try {
    const result = await Station.update(update_data, {
      where: {
        id: station_ids,
      },
    });
    res.json({ message: `${result[0]} stations updated successfully.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get station statistics
// @route   GET /api/stations/stats
// @access  Admin
exports.getStationStats = async (req, res) => {
  try {
    const total_stations = await Station.count();
    const active_stations = await Station.count({ where: { status: 'Active' } });
    const maintenance_stations = await Station.count({ where: { in_maintenance: true } });
    const plastic_accepting_stations = await Station.count({ where: { accepts_plastic: true } });

    res.json({
      total_stations,
      active_stations,
      maintenance_stations,
      plastic_accepting_stations
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
