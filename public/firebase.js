// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getDatabase, ref, onValue, set, get } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCSZSZe4FKAfAUnnsZG3OBb7KBKUduTDFg',
  authDomain: 'gorillas2000-7136a.firebaseapp.com',
  projectId: 'gorillas2000-7136a',
  storageBucket: 'gorillas2000-7136a.appspot.com',
  messagingSenderId: '316337768327',
  appId: '1:316337768327:web:54c5da6b83bba62038f522',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getDatabase();

window.writeGameState = function(gameState) {
  set(ref(db, 'games/' + gameState.gameId), gameState);
}

window.createGameStateListener = function(gameId, callback) {
  const gameRef = ref(db, 'games/' + gameId);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    return callback(data);
  });
}

window.getInitialGameData = function(gameId, callback) {
  const gameRef = ref(db, 'games/' + gameId);
  get(gameRef).then((snapshot) => {
    const data = snapshot.val();
    return callback(data);
  }).catch((error) => {
    console.error(error);
  });
}
