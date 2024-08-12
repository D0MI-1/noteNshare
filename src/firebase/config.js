import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB8s-gpyo4FzWZkT6Qq2ZgLo4V4TPQyPr4",
    authDomain: "notenshare.firebaseapp.com",
    projectId: "notenshare",
    storageBucket: "notenshare.appspot.com",
    messagingSenderId: "558411438708",
    appId: "1:558411438708:web:93b49051f13565108c8f21"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);