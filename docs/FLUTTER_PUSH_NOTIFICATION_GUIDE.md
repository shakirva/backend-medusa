# 🔔 Push Notification (FCM) — Quick Guide

**Project:** Marqa Souq | **Date:** 18 March 2026 | **Status:** ✅ Backend Ready

---

## 1. Add Packages

```yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0
```

```bash
flutter pub get
```

---

## 2. Init Firebase in `main.dart`

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

> Ask backend for `google-services.json` (Android) & `GoogleService-Info.plist` (iOS)

---

## 3. Save FCM Token (after login)

```dart
Future<void> saveFcmToken(String jwtToken) async {
  await FirebaseMessaging.instance.requestPermission();
  final token = await FirebaseMessaging.instance.getToken();
  if (token == null) return;

  await http.post(
    Uri.parse('https://api.marquesouq.com/store/customers/me/fcm-token'),
    headers: {'Authorization': 'Bearer $jwtToken', 'Content-Type': 'application/json'},
    body: jsonEncode({'fcm_token': token, 'device_type': Platform.isAndroid ? 'android' : 'ios'}),
  );
}
```

---

## 4. Delete Token (on logout)

```dart
await http.delete(
  Uri.parse('https://api.marquesouq.com/store/customers/me/fcm-token'),
  headers: {'Authorization': 'Bearer $jwtToken'},
);
```

---

## 5. Handle Notifications

```dart
// Foreground
FirebaseMessaging.onMessage.listen((msg) {
  // show in-app banner
});

// Background tap → navigate
FirebaseMessaging.onMessageOpenedApp.listen((msg) {
  if (msg.data['type'] == 'order.placed') {
    Navigator.pushNamed(context, '/orders/${msg.data['order_id']}');
  }
});
```

---

## Notification Payload

```json
{
  "notification": { "title": "Order Confirmed! 🎉", "body": "Your order #1234 has been placed." },
  "data": { "type": "order.placed", "order_id": "ord_01JXXX", "display_id": "1234" }
}
```

---

## Checklist

- [ ] Add packages & config files
- [ ] Init Firebase in `main.dart`
- [ ] Call `saveFcmToken()` after login
- [ ] Call `removeFcmToken()` on logout
- [ ] Handle foreground & background notifications
- [ ] Test on real device (FCM doesn't work on emulator)

> **API Base:** `https://api.marquesouq.com` | **Local:** `http://localhost:9000`
