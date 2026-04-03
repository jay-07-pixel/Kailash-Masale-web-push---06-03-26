import React from 'react'
import './ExpenditureRulesIndex.css'

/** Short guide for Expenditure table — matches DisbursementTable logic. */
function ExpenditureRulesIndex() {
  return (
    <details className="exp-rules-index" open>
      <summary className="exp-rules-summary">
        <span className="exp-rules-title">Rules &amp; color index</span>
        <span className="exp-rules-hint">Quick guide</span>
      </summary>

      <div className="exp-rules-body exp-rules-body-short">
        <ul className="exp-rules-simple-list">
          <li>
            <strong>Total calls under 30:</strong> No daily allowance (DA) is counted. DA shows in <strong>bold red</strong>.
            That red wins over the color rules below for DA only. TA still uses the colors below.
          </li>
          <li>
            <strong>Colors (from monthly target vs achieved):</strong> Data comes from the same monthly sheet as the Monthly
            page. <strong>Under 50%</strong> → TA &amp; DA in bold red. <strong>50%–70%</strong> → TA normal, DA in red.{' '}
            <strong>Above 70%</strong> → TA &amp; DA in bold blue. Colors do not change rupee amounts.
          </li>
          <li>
            <strong>DA amount on screen:</strong> Taken from the master sheet for that route when it matches; otherwise from
            checkout. <strong>Total DA</strong> in the top row is the sum of those DA numbers.
          </li>
          <li>
            <strong>TA &amp; night halt:</strong> From checkout when present; otherwise from the master sheet (night halt =
            one-way TA × 1; no night halt = one-way × 2 for the trip).
          </li>
          <li>
            <strong>Salary:</strong> Gross pay minus leave cuts. Sundays are not working days. A day counts if there is a
            check-in or check-out.
          </li>
        </ul>
      </div>
    </details>
  )
}

export default ExpenditureRulesIndex
