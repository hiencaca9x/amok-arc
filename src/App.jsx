import { useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)

  async function handleDeploy() {
    setStatus('Đang deploy, đợi khoảng 30 giây...')
    setResult(null)
    try {
      const res = await fetch('/api/deploy', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setStatus('Deploy thành công!')
        setResult(data)
      } else {
        setStatus('Lỗi: ' + JSON.stringify(data))
      }
    } catch (err) {
      setStatus('Lỗi: ' + err.message)
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Amok 🔥</h1>
      <p>Memecoin launchpad trên Arc — đang xây dựng...</p>
      <button
        onClick={handleDeploy}
        style={{ padding: '12px 24px', fontSize: 16, marginTop: 20, cursor: 'pointer' }}
      >
        Deploy Contract lên Arc
      </button>
      {status && <p style={{ marginTop: 20 }}>{status}</p>}
      {result && (
        <div style={{ marginTop: 10, wordBreak: 'break-all' }}>
          <p>Contract Address: {result.contractAddress}</p>
          <p>Tx Hash: {result.txHash}</p>
        </div>
      )}
    </div>
  )
}

