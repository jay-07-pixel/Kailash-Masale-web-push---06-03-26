import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const TOKENS_COLLECTION = 'user_push_tokens'
let foregroundBound = false

function hashToken(token) {
  let h = 0
  for (let i = 0; i < token.length; i += 1) {
    h = (h * 31 + token.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  })
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`)
}

function bindForegroundMessageHandler(messaging) {
  if (foregroundBound) return
  foregroundBound = true
  onMessage(messaging, (payload) => {
    try {
      const title = payload?.notification?.title || payload?.data?.title || 'New notification'
      const body = payload?.notification?.body || payload?.data?.body || ''
      if (Notification.permission === 'granted') {
        // Browser-level foreground fallback.
        new Notification(title, { body })
      }
    } catch (_) {
      // Ignore foreground notification render failures.
    }
  })
}

export async function initPushNotificationsForUser(user) {
  if (!user?.uid || !user?.email || !db) return null
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) return null
  if (!('Notification' in window)) return null
  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  if (Notification.permission === 'default') {
    const p = await Notification.requestPermission()
    if (p !== 'granted') return null
  } else if (Notification.permission !== 'granted') {
    return null
  }

  const registration = await ensureServiceWorker()
  const messaging = getMessaging()
  bindForegroundMessageHandler(messaging)

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration || undefined,
  })
  if (!token) return null

  const email = String(user.email).trim().toLowerCase()
  const tokenHash = hashToken(token)
  const tokenDocId = `${user.uid}_${tokenHash}`
  await setDoc(
    doc(db, TOKENS_COLLECTION, tokenDocId),
    {
      userId: user.uid,
      userEmail: email,
      token,
      enabled: true,
      platform: navigator.platform || '',
      userAgent: navigator.userAgent || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )
  return token
}

export function cleanupPushNotificationsForUser() {
  // Reserved for future token disable/delete-on-logout behavior.
}
