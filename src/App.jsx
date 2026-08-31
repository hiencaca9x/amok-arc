import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, USDC_ADDRESS } from './abi'

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)"
]

export default function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')

  useEffect(() => {
    if (window.okxwallet || window.ethereum) {
      const p = new ethers.BrowserProvider(window.okxwallet || window.ethereum)
      setProvider(p)
    }
  }, [])

  async function connectWallet() {
    try {
      const eth = window.okxwallet || window.ethereum
      if (!eth) return setStatus('Không tìm thấy ví. Vui lòng cài OKX Wallet hoặc MetaMask.')
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      setStatus('Đã kết nối ví: ' + accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4))
      loadTokens()
    } catch (err) {
      setStatus('Lỗi kết nối: ' + err.message)
    }
  }

  async function loadTokens() {
    if (!provider) return
    setLoading(true)
    try {
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, provider)
      const len = await contract.allTokensLength()
      const list = []
      for (let i = 0; i < Number(len); i++) {
        const tokenAddr = await contract.allTokens(i)
        const info = await contract.tokens(tokenAddr)
        list.push({
          address: tokenAddr,
          creator: info.creator,
          reserveUSDC: ethers.formatUnits(info.reserveUSDC, 6),
          reserveToken: ethers.formatUnits(info.reserveToken, 18),
          graduated: info.graduated
        })
      }
      setTokens(list.reverse())
    } catch (err) {
      setStatus('Lỗi tải danh sách token: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (provider) loadTokens()
  }, [provider])

  async function handleCreateToken() {
    if (!account) return setStatus('Vui lòng kết nối ví trước')
    if (!tokenName || !tokenSymbol) return setStatus('Nhập đầy đủ tên và symbol')
    setStatus('Đang tạo token, xác nhận trong ví...')
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.createToken(tokenName, tokenSymbol)
      setStatus('Đang chờ xác nhận giao dịch...')
      await tx.wait()
      setStatus('Tạo token thành công!')
      setTokenName('')
      setTokenSymbol('')
      loadTokens()
    } catch (err) {
      setStatus('Lỗi: ' + (err.reason || err.message))
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <h1>Amok Launchpad</h1>
      <p style={{ color: '#666' }}>Memecoin launchpad tren Arc Testnet</p>

      {!account ? (
        <button onClick={connectWallet} style={btnStyle}>Ket noi vi</button>
      ) : (
        <p>Vi: {account.slice(0, 6)}...{account.slice(-4)}</p>
      )}

      {status && <p style={{ color: '#0066cc', fontSize: 14 }}>{status}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 24 }}>
        <h3>Tao token moi</h3>
        <input
          placeholder="Ten token (vd: Amok Coin)"
          value={tokenName}
          onChange={e => setTokenName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Symbol (vd: AMOK)"
          value={tokenSymbol}
          onChange={e => setTokenSymbol(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleCreateToken} style={btnStyle}>Tao token</button>
      </div>

      <h3 style={{ marginTop: 32 }}>Danh sach token ({tokens.length})</h3>
      {loading && <p>Dang tai...</p>}
      {tokens.map(t => (
        <div key={t.address} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.address}</p>
          <p>Creator: {t.creator.slice(0, 6)}...{t.creator.slice(-4)}</p>
          <p>Reserve USDC: {t.reserveUSDC} | Reserve Token: {t.reserveToken}</p>
          <p>{t.graduated ? 'Da tot nghiep' : 'Dang trong bonding curve'}</p>
        </div>
      ))}
    </div>
  )
}

const btnStyle = {
  padding: '10px 20px',
  background: '#0066cc',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  marginTop: 8
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: 8,
  marginBottom: 8,
  border: '1px solid #ccc',
  borderRadius: 4
}
