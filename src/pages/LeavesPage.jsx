import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import LeavesCards from '../components/LeavesCards'
import './LeavesPage.css'

const LEAVE_APPLICATIONS_COLLECTION = 'leave_applications'
const EMPLOYEES_COLLECTION = 'employees'

function LeavesPage() {
  const [leaveApplications, setLeaveApplications] = useState([])
  const [employees, setEmployees] = useState([])
  const [savingId, setSavingId] = useState(null)

  const setLeaveStatus = async (appId, status) => {
    if (!db || !appId) return
    setSavingId(appId)
    try {
      await setDoc(
        doc(db, LEAVE_APPLICATIONS_COLLECTION, appId),
        { status, [status === 'approved' ? 'approvedAt' : 'rejectedAt']: serverTimestamp() },
        { merge: true }
      )
    } catch (err) {
      console.error('Failed to update leave status:', err)
    } finally {
      setSavingId(null)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, LEAVE_APPLICATIONS_COLLECTION), (snapshot) => {
      setLeaveApplications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const leaveOnly = leaveApplications.filter((app) => app.type !== 'sunday_work')

  return (
    <div className="main-content">
      <UniversalHeader title="Leaves" />
      <div className="content-wrapper">
        <LeavesCards
          leaveApplications={leaveOnly}
          employees={employees}
          onApprove={(id) => setLeaveStatus(id, 'approved')}
          onReject={(id) => setLeaveStatus(id, 'rejected')}
          savingId={savingId}
        />
      </div>
    </div>
  )
}

export default LeavesPage
