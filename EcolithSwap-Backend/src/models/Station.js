const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  station_type: {
    type: DataTypes.ENUM('swap', 'charge', 'both'),
    defaultValue: 'swap',
  },
  total_slots: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  operating_hours: {
    type: DataTypes.STRING,
    defaultValue: '24/7',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Maintenance'),
    defaultValue: 'Active',
  },
  in_maintenance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  contact_info: {
    type: DataTypes.STRING,
  },
  manager_id: {
    type: DataTypes.UUID,
  },
  accepts_plastic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  self_service: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image_url: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Station;
