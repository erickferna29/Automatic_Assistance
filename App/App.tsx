/**
 * App.tsx
 * Entry point real: App.js (NavigationContainer + AppNavigator)
 * Este archivo existe por compatibilidad con el template RN.
 * El dashboard del profesor se accede via AppNavigator -> DashboardScreen
 */
import {AppRegistry} from 'react-native';
import App from './App.js';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
