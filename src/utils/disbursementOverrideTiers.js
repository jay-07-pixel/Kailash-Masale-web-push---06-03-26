/** Maps admin tier keys to CSS classes (must match DisbursementTable.css) */
export const TA_TIER_CLASS = {
  auto: null,
  red: 'disb-tada-bold-red',
  blue: 'disb-tada-bold-blue',
  none: '',
}

export const DA_TIER_CLASS = {
  auto: null,
  redBold: 'disb-tada-bold-red',
  blueBold: 'disb-tada-bold-blue',
  midRed: 'disb-da-red',
  withheld: 'disb-da-withheld',
  none: '',
}

/**
 * @param {object} detail - row from tableData before override
 * @param {object | undefined} ov - saved override { taTier?, daTier? } (colors only; amounts always from computed data)
 */
export function applyDisbursementDetailOverride(detail, ov) {
  if (!ov || typeof ov !== 'object') return detail

  let taClass = detail.taClass
  let daClass = detail.daClass

  if (ov.taTier && ov.taTier !== 'auto' && Object.prototype.hasOwnProperty.call(TA_TIER_CLASS, ov.taTier)) {
    const c = TA_TIER_CLASS[ov.taTier]
    taClass = c != null ? c : detail.taClass
  }
  if (ov.daTier && ov.daTier !== 'auto' && Object.prototype.hasOwnProperty.call(DA_TIER_CLASS, ov.daTier)) {
    const c = DA_TIER_CLASS[ov.daTier]
    daClass = c != null ? c : detail.daClass
  }

  return {
    ...detail,
    taClass,
    daClass,
  }
}

/**
 * Firebase stores only two colors for TA/DA: "red" | "blue".
 * All red-tier UI classes map to "red"; bold blue maps to "blue"; plain/default → null.
 */
export function disbursementClassToStoredColor(cssClass) {
  if (!cssClass || String(cssClass).trim() === '') return null
  if (cssClass === 'disb-tada-bold-blue') return 'blue'
  if (
    cssClass === 'disb-tada-bold-red' ||
    cssClass === 'disb-da-red' ||
    cssClass === 'disb-da-withheld'
  ) {
    return 'red'
  }
  return null
}

/** Shape stored on Firestore for TA/DA line items */
export function buildTaDaFirestorePresentation(d) {
  return {
    ta: {
      value: d.ta,
      class: d.taClass || null,
      color: disbursementClassToStoredColor(d.taClass),
    },
    da: {
      display: d.daDisplay,
      paid: d.da,
      class: d.daClass || null,
      color: disbursementClassToStoredColor(d.daClass),
    },
  }
}

export function applyOverridesToRows(rows, entries) {
  if (!entries || typeof entries !== 'object' || Object.keys(entries).length === 0) return rows

  return rows.map((row) => {
    const details = row.details.map((d) => applyDisbursementDetailOverride(d, entries[d.id]))
    const totals = details.reduce(
      (acc, d) => ({
        secondary: acc.secondary + d.secondary,
        productiveCalls: acc.productiveCalls + d.productiveCalls,
        ta: acc.ta + d.ta,
        da: acc.da + d.da,
        daSumDisplay: acc.daSumDisplay + (d.daDisplay ?? 0),
        nh: acc.nh + d.nh,
      }),
      { secondary: 0, productiveCalls: 0, ta: 0, da: 0, daSumDisplay: 0, nh: 0 }
    )
    return {
      ...row,
      details,
      ...totals,
    }
  })
}
