import ky from 'ky';
import Config from 'react-native-config';

const prefixUrl = `${Config.API_URL ?? ''}/`;

export const instance = ky.extend({
  headers: {
    Accept: 'application/json',
  },
  prefixUrl,
  timeout: 15000,
});
