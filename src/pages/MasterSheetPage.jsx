import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import './MasterSheetPage.css'

const TA_MASTER_DATA = [
  { from: 'Nagpur', to: 'Kondhali', km: 48, upDown: 96, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 240 },
  { from: 'Nagpur', to: 'Bhilai', km: 255, upDown: 169.6, ownTaPerKm: 2.5, publicTaPerKm: 1.5, ownTa: 382.5 },
  { from: 'Nagpur', to: 'Bilaspur', km: 396, upDown: 92.6, ownTaPerKm: 2.5, publicTaPerKm: 1.5, ownTa: 594 },
  { from: 'Nagpur', to: 'Pauni', km: 84.8, upDown: 30.2, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 424 },
  { from: 'Nagpur', to: 'Umred', km: 46.3, upDown: 322, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 231.5 },
  { from: 'Nagpur', to: 'Kamptee', km: 15.1, upDown: 274, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 75.5 },
  { from: 'Nagpur', to: 'Gondia', km: 161, upDown: 199.8, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 805 },
  { from: 'Nagpur', to: 'Armori', km: 137, upDown: 124.4, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 685 },
  { from: 'Nagpur', to: 'Tumsar', km: 99.9, upDown: 254, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 499.5 },
  { from: 'Nagpur', to: 'Bhandara', km: 62.2, upDown: 118.2, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 311 },
  { from: 'Nagpur', to: 'Wadsa', km: 127, upDown: 72.6, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 635 },
  { from: 'Nagpur', to: 'Katol', km: 59.1, upDown: 80.8, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 295.5 },
  { from: 'Nagpur', to: 'Mouda', km: 36.3, upDown: 30.2, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 181.5 },
  { from: 'Nagpur', to: 'Kuhi', km: 40.4, upDown: 15.1, ownTaPerKm: 2.5, publicTaPerKm: '', ownTa: 202 },
]

function MasterSheetPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Master Sheet" />
      <div className="content-wrapper">
        <div className="master-sheet-card">
          <div className="master-sheet-banner">
            <span className="master-sheet-banner-item">DA 200</span>
            <span className="master-sheet-banner-sep" aria-hidden>•</span>
            <span className="master-sheet-banner-item">DA U/D 250</span>
            <span className="master-sheet-banner-sep" aria-hidden>•</span>
            <span className="master-sheet-banner-item">NH 800</span>
          </div>
          <div className="master-sheet-table-wrap">
            <table className="master-sheet-table">
              <thead>
                <tr>
                  <th className="master-sheet-th master-sheet-th-from">From</th>
                  <th className="master-sheet-th master-sheet-th-to">To</th>
                  <th className="master-sheet-th master-sheet-th-num">Km</th>
                  <th className="master-sheet-th master-sheet-th-num">UP/down</th>
                  <th colSpan={2} className="master-sheet-th master-sheet-th-group">
                    Own Transport
                  </th>
                  <th className="master-sheet-th master-sheet-th-group">Public Transport</th>
                </tr>
                <tr className="master-sheet-subhead">
                  <th className="master-sheet-th" aria-hidden />
                  <th className="master-sheet-th" aria-hidden />
                  <th className="master-sheet-th" aria-hidden />
                  <th className="master-sheet-th" aria-hidden />
                  <th className="master-sheet-th master-sheet-th-num">TA/km</th>
                  <th className="master-sheet-th master-sheet-th-num">T.A</th>
                  <th className="master-sheet-th master-sheet-th-num">TA/km</th>
                </tr>
              </thead>
              <tbody>
                {TA_MASTER_DATA.map((row, i) => (
                  <tr key={i} className="master-sheet-row">
                    <td className="master-sheet-td master-sheet-td-from">{row.from}</td>
                    <td className="master-sheet-td master-sheet-td-to">{row.to}</td>
                    <td className="master-sheet-td master-sheet-td-num">{row.km}</td>
                    <td className="master-sheet-td master-sheet-td-num">{row.upDown}</td>
                    <td className="master-sheet-td master-sheet-td-num">{row.ownTaPerKm}</td>
                    <td className="master-sheet-td master-sheet-td-num master-sheet-td-ta">{row.ownTa}</td>
                    <td className="master-sheet-td master-sheet-td-num">{row.publicTaPerKm || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterSheetPage
