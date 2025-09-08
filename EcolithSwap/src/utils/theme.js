import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32', // Green primary
    accent: '#4CAF50', // Light green accent
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    disabled: '#9E9E9E',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    // Custom colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
};

export const colors = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  accent: '#8BC34A',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 50,
};}