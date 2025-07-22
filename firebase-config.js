import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEIljtlLfHOq4X8qRoi41XkyKmHbqv8NQ",
  authDomain: "hello-cutie-4843c.firebaseapp.com",
  projectId: "hello-cutie-4843c",
  storageBucket: "hello-cutie-4843c.firebasestorage.app",
  messagingSenderId: "944326866076",
  appId: "1:944326866076:web:23caefc4720925e6fd6959",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
