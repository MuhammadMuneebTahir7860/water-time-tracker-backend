const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set correctly.", error);
  }
}

const sendPushNotification = async (fcmToken, messagePayload) => {
  if (!fcmToken) return;
  
  try {
    await admin.messaging().send({
      token: fcmToken,
      ...messagePayload
    });
  } catch (error) {
    console.error(`Error sending push notification to token ${fcmToken}:`, error);
    throw error;
  }
};

module.exports = {
  sendPushNotification
};
