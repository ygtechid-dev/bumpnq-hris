import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './src/App'; // Kembali ke App asli
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);