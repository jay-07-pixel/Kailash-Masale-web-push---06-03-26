/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: new URL(self.location.href).searchParams.get('apiKey') || '',
  authDomain: new URL(self.location.href).searchParams.get('authDomain') || '',
  projectId: new URL(self.location.href).searchParams.get('projectId') || '',
  storageBucket: new URL(self.location.href).searchParams.get('storageBucket') || '',
  messagingSenderId: new URL(self.location.href).searchParams.get('messagingSenderId') || '',
  appId: new URL(self.location.href).searchParams.get('appId') || '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || payload?.data?.title || 'New notification'
  const body = payload?.notification?.body || payload?.data?.body || ''
  const icon = '/bell-icon.png'
  self.registration.showNotification(title, {
    body,
    icon,
    data: payload?.data || {},
  })
})
