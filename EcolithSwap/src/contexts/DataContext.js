import React, { createContext, useContext, useReducer, useEffect } from 'react';
import stationService from '../services/stationService';
import batteryService from '../services/batteryService';
import wasteService from '../services/wasteService';
import paymentService from '../services/paymentService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  // Stations
  stations: [],
  nearbyStations: [],
  selectedStation: null,
  
  // Batteries
  batteries: [],
  currentRental: null,
  rentalHistory: [],
  
  // Waste
  wasteHistory: [],
  userCredits: { available: 0, pending: 0 },
  wasteStats: null,
  
  // Payments
  paymentHistory: [],
  
  // UI State
  isLoading: {
    stations: false,
    batteries: false,
    rentals: false,
    waste: false,
    payments: false,
  },
  
  errors: {
    stations: null,
    batteries: null,
    rentals: null,
    waste: null,
    payments: null,
  },
  
  // User location
  userLocation: null,
};

// Action types
const DATA_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Stations
  SET_STATIONS: 'SET_STATIONS',
  SET_NEARBY_STATIONS: 'SET_NEARBY_STATIONS',
  SET_SELECTED_STATION: 'SET_SELECTED_STATION',
  
  // Batteries
  SET_BATTERIES: 'SET_BATTERIES',
  SET_CURRENT_RENTAL: 'SET_CURRENT_RENTAL',
  SET_RENTAL_HISTORY: 'SET_RENTAL_HISTORY',
  
  // Waste
  SET_WASTE_HISTORY: 'SET_WASTE_HISTORY',
  SET_USER_CREDITS: 'SET_USER_CREDITS',
  SET_WASTE_STATS: 'SET_WASTE_STATS',
  ADD_WASTE_SUBMISSION: 'ADD_WASTE_SUBMISSION',
  
  // Payments
  SET_PAYMENT_HISTORY: 'SET_PAYMENT_HISTORY',
  ADD_PAYMENT: 'ADD_PAYMENT',
  
  // Location
  SET_USER_LOCATION: 'SET_USER_LOCATION',
};

// Reducer
function dataReducer(state, action) {
  switch (action.type) {
    case DATA_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.key]: action.payload.isLoading,
        },
      };
    
    case DATA_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
        isLoading: {
          ...state.isLoading,
          [action.payload.key]: false,
        },
      };
    
    case DATA_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: null,
        },
      };
    
    case DATA_ACTIONS.SET_STATIONS:
      return {
        ...state,
        stations: action.payload.stations,
        isLoading: { ...state.isLoading, stations: false },
      };
    
    case DATA_ACTIONS.SET_NEARBY_STATIONS:
      return {
        ...state,
        nearbyStations: action.payload.stations,
      };
    
    case DATA_ACTIONS.SET_SELECTED_STATION:
      return {
        ...state,
        selectedStation: action.payload.station,
      };
    
    case DATA_ACTIONS.SET_BATTERIES:
      return {
        ...state,
        batteries: action.payload.batteries,
        isLoading: { ...state.isLoading, batteries: false },
      };
    
    case DATA_ACTIONS.SET_CURRENT_RENTAL:
      return {
        ...state,
        currentRental: action.payload.rental,
      };
    
    case DATA_ACTIONS.SET_RENTAL_HISTORY:
      return {
        ...state,
        rentalHistory: action.payload.rentals,
        isLoading: { ...state.isLoading, rentals: false },
      };
    
    case DATA_ACTIONS.SET_WASTE_HISTORY:
      return {
        ...state,
        wasteHistory: action.payload.wasteHistory,
        isLoading: { ...state.isLoading, waste: false },
      };
    
    case DATA_ACTIONS.SET_USER_CREDITS:
      return {
        ...state,
        userCredits: action.payload.credits,
      };
    
    case DATA_ACTIONS.SET_WASTE_STATS:
      return {
        ...state,
        wasteStats: action.payload.stats,
      };
    
    case DATA_ACTIONS.ADD_WASTE_SUBMISSION:
      return {
        ...state,
        wasteHistory: [action.payload.submission, ...state.wasteHistory],
        userCredits: {
          ...state.userCredits,
          pending: state.userCredits.pending + (action.payload.creditEarned || 0),
        },
      };
    
    case DATA_ACTIONS.SET_PAYMENT_HISTORY:
      return {
        ...state,
        paymentHistory: action.payload.payments,
        isLoading: { ...state.isLoading, payments: false },
      };
    
    case DATA_ACTIONS.ADD_PAYMENT:
      return {
        ...state,
        paymentHistory: [action.payload.payment, ...state.paymentHistory],
      };
    
    case DATA_ACTIONS.SET_USER_LOCATION:
      return {
        ...state,
        userLocation: action.payload.location,
      };
    
    default:
      return state;
  }
}

// Create context
const DataContext = createContext();

// Data Provider component
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Load initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Helper function to handle async operations
  const handleAsync = async (key, asyncFunction) => {
    dispatch({ type: DATA_ACTIONS.SET_LOADING, payload: { key, isLoading: true } });
    dispatch({ type: DATA_ACTIONS.CLEAR_ERROR, payload: { key } });
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        payload: { key, error: error.message },
      });
      throw error;
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadStations(),
        loadCurrentRental(),
        loadUserCredits(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Stations
  const loadStations = async () => {
    return handleAsync('stations', async () => {
      const stations = await stationService.getAllStations();
      dispatch({ type: DATA_ACTIONS.SET_STATIONS, payload: { stations } });
      return stations;
    });
  };

  const loadNearbyStations = async (latitude, longitude, radius = 10) => {
    return handleAsync('stations', async () => {
      const stations = await stationService.getStationsNearLocation(latitude, longitude, radius);
      const sortedStations = stationService.sortStationsByDistance(stations, latitude, longitude);
      dispatch({ type: DATA_ACTIONS.SET_NEARBY_STATIONS, payload: { stations: sortedStations } });
      return sortedStations;
    });
  };

  const selectStation = (station) => {
    dispatch({ type: DATA_ACTIONS.SET_SELECTED_STATION, payload: { station } });
  };

  // Batteries
  const loadBatteries = async (params = {}) => {
    return handleAsync('batteries', async () => {
      const batteries = await batteryService.getAllBatteries(params);
      dispatch({ type: DATA_ACTIONS.SET_BATTERIES, payload: { batteries } });
      return batteries;
    });
  };

  const loadCurrentRental = async () => {
    try {
      const rental = await batteryService.getCurrentRental();
      dispatch({ type: DATA_ACTIONS.SET_CURRENT_RENTAL, payload: { rental } });
      return rental;
    } catch (error) {
      console.error('Error loading current rental:', error);
      return null;
    }
  };

  const loadRentalHistory = async (params = {}) => {
    return handleAsync('rentals', async () => {
      const rentals = await batteryService.getRentalHistory(params);
      dispatch({ type: DATA_ACTIONS.SET_RENTAL_HISTORY, payload: { rentals } });
      return rentals;
    });
  };

  const rentBattery = async (batteryId, stationId) => {
    return handleAsync('rentals', async () => {
      const response = await batteryService.rentBattery(batteryId, stationId);
      dispatch({ type: DATA_ACTIONS.SET_CURRENT_RENTAL, payload: { rental: response.rental } });
      return response;
    });
  };

  const returnBattery = async (rentalId, stationId) => {
    return handleAsync('rentals', async () => {
      const response = await batteryService.returnBattery(rentalId, stationId);
      dispatch({ type: DATA_ACTIONS.SET_CURRENT_RENTAL, payload: { rental: null } });
      
      // Reload rental history
      await loadRentalHistory();
      
      return response;
    });
  };

  // Waste
  const loadWasteHistory = async (params = {}) => {
    return handleAsync('waste', async () => {
      const wasteHistory = await wasteService.getWasteHistory(params);
      dispatch({ type: DATA_ACTIONS.SET_WASTE_HISTORY, payload: { wasteHistory } });
      return wasteHistory;
    });
  };

  const submitWaste = async (wasteData) => {
    return handleAsync('waste', async () => {
      const response = await wasteService.submitWaste(wasteData);
      
      dispatch({
        type: DATA_ACTIONS.ADD_WASTE_SUBMISSION,
        payload: {
          submission: response.wasteLog,
          creditEarned: response.creditEarned,
        },
      });
      
      return response;
    });
  };

  const loadUserCredits = async () => {
    try {
      if (user && user.profile) {
        const credits = {
          available: user.profile.available_credits || 0,
          pending: user.profile.pending_credits || 0,
        };
        
        dispatch({ type: DATA_ACTIONS.SET_USER_CREDITS, payload: { credits } });
        wasteService.setUserCredits(credits.available, credits.pending);
        
        return credits;
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const loadWasteStats = async () => {
    try {
      const stats = await wasteService.getWasteStats();
      dispatch({ type: DATA_ACTIONS.SET_WASTE_STATS, payload: { stats } });
      return stats;
    } catch (error) {
      console.error('Error loading waste stats:', error);
      throw error;
    }
  };

  // Payments
  const loadPaymentHistory = async (params = {}) => {
    return handleAsync('payments', async () => {
      const payments = await paymentService.getPaymentHistory(params);
      dispatch({ type: DATA_ACTIONS.SET_PAYMENT_HISTORY, payload: { payments } });
      return payments;
    });
  };

  const processPayment = async (paymentData, method) => {
    return handleAsync('payments', async () => {
      let response;
      
      if (method === 'mpesa') {
        response = await paymentService.processMPesaPayment(paymentData);
      } else if (method === 'credits') {
        response = await paymentService.processCreditPayment(paymentData);
      } else {
        throw new Error('Unsupported payment method');
      }
      
      // Add to payment history if successful
      if (response.paymentId) {
        // Reload payment history to get updated data
        await loadPaymentHistory();
      }
      
      return response;
    });
  };

  // Location
  const setUserLocation = (latitude, longitude) => {
    const location = { latitude, longitude };
    dispatch({ type: DATA_ACTIONS.SET_USER_LOCATION, payload: { location } });
    stationService.setCurrentLocation(latitude, longitude);
  };

  // Clear errors
  const clearError = (key) => {
    dispatch({ type: DATA_ACTIONS.CLEAR_ERROR, payload: { key } });
  };

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions - Stations
    loadStations,
    loadNearbyStations,
    selectStation,
    
    // Actions - Batteries
    loadBatteries,
    loadCurrentRental,
    loadRentalHistory,
    rentBattery,
    returnBattery,
    
    // Actions - Waste
    loadWasteHistory,
    submitWaste,
    loadUserCredits,
    loadWasteStats,
    
    // Actions - Payments
    loadPaymentHistory,
    processPayment,
    
    // Actions - Location
    setUserLocation,
    
    // Utilities
    clearError,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use data context
export function useData() {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
}

export default DataContext;