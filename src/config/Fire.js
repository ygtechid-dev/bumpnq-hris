// Firebase v9 config yang benar
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const config = {
  apiKey: "AIzaSyCq2xuMGEmnNWqTPZZxQFOu4C3qMS27-fU",
  authDomain: "loffee-staging.firebaseapp.com",
  databaseURL: "https://loffee-staging-default-rtdb.firebaseio.com",
  projectId: "loffee-staging",
  storageBucket: "loffee-staging.appspot.com",
  messagingSenderId: "1031902518089",
  appId: "1:1031902518089:web:d9b5de8c31f96b49dd1898"
};

// Initialize Firebase v9
const app = initializeApp(config);
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;