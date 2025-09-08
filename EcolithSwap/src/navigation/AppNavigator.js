import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import StationFinderScreen from '../screens/StationFinderScreen';
import SwapChargeScreen from '../screens/SwapChargeScreen';
import PlasticWasteScreen from '../screens/PlasticWasteScreen';
import ImpactScreen from '../screens/ImpactScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SupportScreen from '../screens/SupportScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import StationDetailScreen from '../screens/StationDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';

// Enhanced CRUD Screens
import ProfileScreen from '../screens/ProfileScreen';
import RentalManagementScreen from '../screens/RentalManagementScreen';
import EnhancedPlasticWasteScreen from '../screens/EnhancedPlasticWasteScreen';
import EnhancedStationScreen from '../screens/EnhancedStationScreen';
import PaymentManagementScreen from '../screens/PaymentManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'EcolithSwap' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen} 
        options={{ title: 'Scan QR Code' }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{ title: 'Payment' }}
      />
      <Stack.Screen 
        name="PaymentHistory" 
        component={PaymentManagementScreen} 
        options={{ title: 'Payment Management' }}
      />
      <Stack.Screen 
        name="RentalManagement" 
        component={RentalManagementScreen} 
        options={{ title: 'Rental Management' }}
      />
    </Stack.Navigator>
  );
}

function StationStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="StationFinder" 
        component={EnhancedStationScreen} 
        options={{ title: 'Stations' }}
      />
      <Stack.Screen 
        name="StationDetail" 
        component={StationDetailScreen} 
        options={{ title: 'Station Details' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'StationsTab') {
            iconName = 'location-on';
          } else if (route.name === 'SwapTab') {
            iconName = 'battery-charging-full';
          } else if (route.name === 'WasteTab') {
            iconName = 'recycling';
          } else if (route.name === 'PaymentTab') {
            iconName = 'payment';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="StationsTab" 
        component={StationStackNavigator} 
        options={{ tabBarLabel: 'Stations' }}
      />
      <Tab.Screen 
        name="SwapTab" 
        component={RentalManagementScreen} 
        options={{ tabBarLabel: 'Rentals' }}
      />
      <Tab.Screen 
        name="WasteTab" 
        component={EnhancedPlasticWasteScreen} 
        options={{ tabBarLabel: 'Recycle' }}
      />
      <Tab.Screen 
        name="PaymentTab" 
        component={PaymentManagementScreen} 
        options={{ tabBarLabel: 'Payments' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}