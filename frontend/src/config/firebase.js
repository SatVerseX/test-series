import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    app = getApp();
    console.log("Using existing Firebase app");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize messaging with proper checks
let messaging = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
        console.log("Firebase messaging initialized");
      } catch (error) {
        console.error("Firebase messaging initialization failed:", error);
      }
    } else {
      console.warn("Firebase messaging not supported in this environment");
    }
  });
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
  login_hint: "",
  hd: "",
});

export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Notification permission error:", error);
    return null;
  }
};

if (messaging) {
  onMessage(messaging, (payload) => {
    console.log("Message received:", payload);

    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon,
      });
    }
  }).catch((error) => {
    console.error("Error in message handling:", error);
  });
}

export { auth, db, storage, messaging, googleProvider };
export default app;
