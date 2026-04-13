import * as admin from "firebase-admin";

let app: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK (singleton)
 * Credentials loaded from environment variables — never hardcoded
 */
export function getFirebaseApp(): admin.app.App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env"
    );
  }

  // Avoid re-initializing if already done (e.g. hot reload)
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  console.log("[Firebase] Admin SDK initialized for project:", projectId);
  return app;
}

/**
 * Send a push notification to a single FCM device token
 */
export async function sendPushNotification({
  fcmToken,
  title,
  body,
  data = {},
}: {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<boolean> {
  try {
    const firebaseApp = getFirebaseApp();
    const messaging = admin.messaging(firebaseApp);

    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "orders" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });

    console.log(`[FCM] Push sent: "${title}"`);
    return true;
  } catch (error: any) {
    // Token expired/invalid — log but don't crash
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.warn("[FCM] Invalid/expired token — should be removed from DB");
    } else {
      console.error("[FCM] Send error:", error.message);
    }
    return false;
  }
}
