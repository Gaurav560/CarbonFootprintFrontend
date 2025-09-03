import React, { useEffect, useMemo, useState } from 'react'

// MVP constraints: single file, useState only, fetch for API, Tailwind utility classes

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

export default function App() {
  const now = useMemo(() => new Date(), [])
  const [userId, setUserId] = useState('user-001')
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(now.getFullYear()))

  const [carKilometers, setCarKilometers] = useState('')
  const [flightKilometers, setFlightKilometers] = useState('')
  const [electricityUnits, setElectricityUnits] = useState('')
  const [lpgCylinders, setLpgCylinders] = useState('')
  const [meatMeals, setMeatMeals] = useState('')
  const [vegetarianMeals, setVegetarianMeals] = useState('')
  const [veganMeals, setVeganMeals] = useState('')
  const [usesRenewableEnergy, setUsesRenewableEnergy] = useState(false)
  const [otherActivities, setOtherActivities] = useState('')

  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleDelete(id) {
    if (!id) return
    const confirmDelete = window.confirm('Delete this entry?')
    if (!confirmDelete) return
    try {
  const res = await fetch(`https://q2wgrjtaef.ap-south-1.awsapprunner.com/api/footprint/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Delete failed')
      fetchHistory()
    } catch (err) {
      console.error(err)
      alert('Error deleting entry')
    }
  }

  // Simple helper to color-code CO2 and rating
  function getImpact(total) {
    if (total == null || isNaN(total)) return { level: 'LOW', color: 'bg-gray-200 text-gray-800' }
    if (total < 400) return { level: 'LOW', color: 'bg-green-100 text-green-800' }
    if (total < 800) return { level: 'MODERATE', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'HIGH', color: 'bg-red-100 text-red-800' }
  }

  async function fetchHistory() {
    try {
  const res = await fetch(`https://q2wgrjtaef.ap-south-1.awsapprunner.com/api/footprint/history/${encodeURIComponent(userId)}`)
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      alert('Error fetching history')
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        userId,
        month: Number(month),
        year: Number(year),
        carKilometers: Number(carKilometers || 0),
        flightKilometers: Number(flightKilometers || 0),
        electricityUnits: Number(electricityUnits || 0),
        lpgCylinders: Number(lpgCylinders || 0),
        meatMeals: Number(meatMeals || 0),
        vegetarianMeals: Number(vegetarianMeals || 0),
        veganMeals: Number(veganMeals || 0),
        usesRenewableEnergy: Boolean(usesRenewableEnergy),
        otherActivities: otherActivities || null,
      }

  const res = await fetch('https://q2wgrjtaef.ap-south-1.awsapprunner.com/api/footprint/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Calculation failed')
      const data = await res.json()

  // Map backend fields to UI expectations
  setResult(data)
      fetchHistory()
    } catch (err) {
      console.error(err)
      alert('Error calculating footprint')
    } finally {
      setLoading(false)
    }
  }

  // Try API total first; if missing/zero, parse from AI text; else use local breakdown as last resort
  function parseTotalFromText(text) {
    if (!text) return null
    // Pattern 1: TOTAL_CO2: 1234.56
    let m = text.match(/TOTAL_CO2:\s*([0-9]+(?:\.[0-9]+)?)/i)
    if (m && m[1]) return Number(m[1])
    // Pattern 2: ... 1234 kg CO2 ... (accept CO₂ or CO2e)
    m = text.match(/([0-9]+(?:\.[0-9]+)?)\s*kg\s*CO(?:2|₂)(?:e)?/i)
    if (m && m[1]) return Number(m[1])
    return null
  }

  // Compute simple breakdown from inputs (UI only, mirrors backend factors)
  const breakdown = useMemo(() => {
    const carCO2 = Number(carKilometers || 0) * 0.25
    const flightCO2 = Number(flightKilometers || 0) * 0.12
    const electricityCO2 = Number(electricityUnits || 0) * (usesRenewableEnergy ? 0.1 : 0.7)
    const lpgCO2 = Number(lpgCylinders || 0) * 45
    const meatCO2 = Number(meatMeals || 0) * 4.5
    const vegCO2 = Number(vegetarianMeals || 0) * 1.2
    const veganCO2 = Number(veganMeals || 0) * 0.8
    const items = [
      { key: 'car', label: 'Road (km)', value: carCO2, color: 'bg-emerald-500' },
      { key: 'flight', label: 'Flights (km)', value: flightCO2, color: 'bg-sky-400' },
      { key: 'electric', label: 'Electricity (units)', value: electricityCO2, color: 'bg-amber-400' },
      { key: 'lpg', label: 'LPG (cylinders)', value: lpgCO2, color: 'bg-orange-500' },
      { key: 'meat', label: 'Meat meals', value: meatCO2, color: 'bg-rose-500' },
      { key: 'vegetarian', label: 'Vegetarian meals', value: vegCO2, color: 'bg-lime-500' },
      { key: 'vegan', label: 'Vegan meals', value: veganCO2, color: 'bg-teal-500' },
    ]
    const sum = items.reduce((s, i) => s + i.value, 0)
    return { total: sum, items }
  }, [carKilometers, flightKilometers, electricityUnits, lpgCylinders, meatMeals, vegetarianMeals, veganMeals, usesRenewableEnergy])

  const apiTotal = result?.totalCO2Kg ?? result?.totalCo2
  const parsedFromText = parseTotalFromText(result?.aiAnalysis)
  const total = (typeof apiTotal === 'number' && apiTotal > 0)
    ? apiTotal
    : (typeof parsedFromText === 'number' && parsedFromText > 0)
      ? parsedFromText
      : (breakdown.total > 0 ? breakdown.total : null)

  const rating = result?.impactRating ?? result?.rating
  const impact = getImpact(total)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <header className="bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">🌿 Carbon Footprint Calculator</h1>
          <p className="text-sm opacity-90">React + Vite + Tailwind, backed by Spring AI for insights.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Form Card */}
        <section className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-emerald-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">🗓️ Monthly Inputs (India)</h2>
            <span className="text-xs text-gray-500">User: <span className="font-medium">{userId || '—'}</span></span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <input value={userId} onChange={e => setUserId(e.target.value)} required className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" placeholder="user-001" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <select value={year} onChange={e => setYear(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                    {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputNumber label="Road distance (km)" value={carKilometers} setValue={setCarKilometers} placeholder="e.g., 500" />
                <InputNumber label="Flight distance (km)" value={flightKilometers} setValue={setFlightKilometers} placeholder="e.g., 800" />
                <InputNumber label="Electricity (units)" value={electricityUnits} setValue={setElectricityUnits} placeholder="e.g., 250" />
                <InputNumber label="LPG cylinders" value={lpgCylinders} setValue={setLpgCylinders} placeholder="e.g., 1" />
                <InputNumber label="Meat meals" value={meatMeals} setValue={setMeatMeals} placeholder="e.g., 20" />
                <InputNumber label="Vegetarian meals" value={vegetarianMeals} setValue={setVegetarianMeals} placeholder="e.g., 40" />
                <InputNumber label="Vegan meals" value={veganMeals} setValue={setVeganMeals} placeholder="e.g., 10" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={usesRenewableEnergy} onChange={e => setUsesRenewableEnergy(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  Uses renewable electricity
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other activities</label>
                  <textarea value={otherActivities} onChange={e => setOtherActivities(e.target.value)} rows={3} className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" placeholder="Anything notable this month (e.g., road trip, home upgrade, etc.)" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className={classNames(
                  'inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 text-white shadow hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  loading && 'opacity-70 cursor-not-allowed'
                )}>
                  {loading ? 'Calculating…' : 'Calculate'}
                </button>
                <button type="button" onClick={fetchHistory} className="text-sm text-emerald-700 hover:underline">Refresh history</button>
              </div>
            </div>
          </form>
        </section>

        {/* Results Card */}
        <section className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-emerald-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">📊 Results</h2>
            <span className="text-xs text-gray-500">{String(month).padStart(2,'0')}/{year}</span>
          </div>
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={classNames('px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset', impact.color)}>
                  Impact: {rating || impact.level}
                </div>
                <div className={classNames(
                  'text-xl font-bold',
                  total == null ? 'text-gray-700' : total < 400 ? 'text-green-700' : total < 800 ? 'text-yellow-700' : 'text-red-700'
                )}>
                  {total != null ? `${total.toFixed(1)} kg CO₂e` : '—'}
                </div>
              </div>

              {result.aiAnalysis && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line border-l-4 border-emerald-200 pl-3">{result.aiAnalysis}</p>
                </div>
              )}

              {result.recommendations && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">✅ Recommendations</h3>
                  {/* Backend returns a string; split by lines for a simple list */}
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {String(result.recommendations)
                      .split(/\r?\n/)
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Breakdown bar */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Breakdown by source</h3>
                {breakdown.total > 0 ? (
                  <>
                    <div className="h-3 w-full rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                      <div className="flex h-full w-full">
                        {breakdown.items.filter(i => i.value > 0).map(i => (
                          <div key={i.key} className={classNames('h-full', i.color)} style={{ width: `${(i.value / breakdown.total) * 100}%` }} title={`${i.label}: ${i.value.toFixed(1)} kg`} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700">
                      {breakdown.items.filter(i => i.value > 0).map(i => (
                        <div key={i.key} className="flex items-center gap-2">
                          <span className={classNames('inline-block h-2.5 w-2.5 rounded', i.color)} />
                          <span className="min-w-0 truncate">
                            {i.label}: {i.value.toFixed(1)} kg ({((i.value / breakdown.total) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Enter values to see a breakdown.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No results yet. Submit the form to calculate.</p>
          )}
        </section>

        {/* History Card */}
        <section className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-emerald-100 p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🕒 History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No history entries.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h, idx) => (
                <li key={idx} className="py-3 flex items-center justify-between hover:bg-emerald-50/60 rounded-lg px-2 transition">
                  <div>
                    <p className="text-sm text-gray-900 font-medium flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        {String(h.month).padStart(2, '0')}/{h.year}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{h.userId || userId}</span>
                    </p>
                    <p className="text-xs text-gray-600">{typeof h.totalCO2Kg === 'number' ? h.totalCO2Kg.toFixed(1) : h.totalCO2Kg} kg CO₂e</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={classNames('px-2 py-0.5 rounded-full text-xs ring-1 ring-inset', getImpact(h.totalCO2Kg).color)}>{h.impactRating || getImpact(h.totalCO2Kg).level}</span>
                    {h.id && (
                      <button onClick={() => handleDelete(h.id)} className="text-xs text-red-600 hover:underline">🗑️ Delete</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        Built with React + Vite + Tailwind. No extra libs.
      </footer>
    </div>
  )
}

function InputNumber({ label, value, setValue, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        min="0"
        step="any"
      />
    </div>
  )
}
