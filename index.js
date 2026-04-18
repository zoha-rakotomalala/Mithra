// 🔥 MUST be first
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { enableScreens } from 'react-native-screens';

enableScreens();

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

// if (__DEV__) {
//   void import('@/reactotron.config');
// }

AppRegistry.registerComponent(appName, () => App);
