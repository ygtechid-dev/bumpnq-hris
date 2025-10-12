import firebase from '@react-native-firebase/app';
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCq2xuMGEmnNWqTPZZxQFOu4C3qMS27-fU",
    authDomain: "loffee-staging.firebaseapp.com",
    projectId: "loffee-staging",
    storageBucket: "loffee-staging.appspot.com",
    messagingSenderId: "1031902518089",
    appId: "1:1031902518089:web:d9b5de8c31f96b49dd1898",
    databaseURL: "https://loffee-staging-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const Fires = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const db = getFirestore(app);
const auth = getAuth(app);
const storages = getStorage(Fires)

export { db, auth, storages };