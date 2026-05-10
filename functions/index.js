const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

const TOKENS_COLLECTION = 'user_push_tokens'

exports.sendTaskAssignmentPush = onDocumentCreated('notifications/{notificationId}', async (event) => {
  const snap = event.data
  if (!snap) return
  const notif = snap.data() || {}
  if (notif.type !== 'task_assigned') return

  const userEmail = String(notif.userEmail || '').trim().toLowerCase()
  if (!userEmail) {
    logger.warn('Notification missing userEmail', { id: snap.id })
    return
  }

  const tokenSnap = await db.collection(TOKENS_COLLECTION).where('userEmail', '==', userEmail).where('enabled', '==', true).get()
  if (tokenSnap.empty) {
    logger.info('No active push tokens for user', { userEmail })
    return
  }

  const docs = tokenSnap.docs
  const tokens = docs.map((d) => d.get('token')).filter(Boolean)
  if (tokens.length === 0) return

  const title = notif.title || 'New task assigned'
  const body = notif.body || 'You have a new pending task.'

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: {
      type: String(notif.type || ''),
      notificationId: String(snap.id),
      taskId: String(notif.taskId || ''),
      title: String(title),
      body: String(body),
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/bell-icon.png',
      },
      fcmOptions: {
        link: '/',
      },
    },
  })

  const invalidTokenDeletes = []
  response.responses.forEach((r, i) => {
    if (r.success) return
    const code = r.error?.code || ''
    if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
      invalidTokenDeletes.push(docs[i].ref.delete())
    }
  })
  if (invalidTokenDeletes.length) {
    await Promise.allSettled(invalidTokenDeletes)
  }

  logger.info('Task notification push sent', {
    notificationId: snap.id,
    attempts: tokens.length,
    successCount: response.successCount,
    failureCount: response.failureCount,
  })
})
