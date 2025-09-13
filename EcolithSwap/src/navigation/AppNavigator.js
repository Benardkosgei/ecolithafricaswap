import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import StationFinderScreen from '../screens/StationFinderScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import StationDetailScreen from '../screens/StationDetailScreen';


// Enhanced CRUD Screens
import ProfileScreen from '../screens/ProfileScreen';
import RentalManagementScreen from '../screens/RentalManagementScreen';
import EnhancedPlasticWasteScreen from '../screens/EnhancedPlasticWasteScreen';
import EnhancedStationScreen from '../screens/EnhancedStationScreen';
import PaymentManagementScreen from '../screens/PaymentManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const defaultStackOptions = {
  headerStyle: {
    backgroundColor: '#2E7D32',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'EcolithSwap' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen} 
        options={{ title: 'Scan QR Code' }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentManagementScreen} 
        options={{ title: 'Payment' }}
      />
    </Stack.Navigator>
  );
}

function StationStackNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen 
        name="StationList" 
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
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: 'home',
            StationsTab: 'location-on',
            RentalsTab: 'battery-charging-full',
            RecycleTab: 'recycling',
            PaymentsTab: 'payment',
            ProfileTab: 'person',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
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
        name="RentalsTab" 
        component={RentalManagementScreen} 
        options={{ tabBarLabel: 'Rentals' }}
      />
      <Tab.Screen 
        name="RecycleTab" 
        component={EnhancedPlasticWasteScreen} 
        options={{ tabBarLabel: 'Recycle' }}
      />
      <Tab.Screen 
        name="PaymentsTab" 
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