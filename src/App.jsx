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

  const [buyAmounts, setBuyAmounts] = useState({})
  const [sellAmounts, setSellAmounts] = useState({})
  const [busyToken, setBusyToken] = useState(null)

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

  async function handleBuy(tokenAddr) {
    if (!account) return setStatus('Vui lòng kết nối ví trước')
    const amountStr = buyAmounts[tokenAddr]
    if (!amountStr || Number(amountStr) <= 0) return setStatus('Nhập số USDC muốn mua')
    setBusyToken(tokenAddr)
    try {
      const signer = await provider.getSigner()
      const usdcIn = ethers.parseUnits(amountStr, 6)

      // Bước 1: kiểm tra & approve USDC nếu cần
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer)
      const allowance = await usdc.allowance(account, LAUNCHPAD_ADDRESS)
      if (allowance < usdcIn) {
        setStatus('Đang approve USDC, xác nhận trong ví...')
        const approveTx = await usdc.approve(LAUNCHPAD_ADDRESS, usdcIn)
        await approveTx.wait()
      }

      // Bước 2: gọi buy
      setStatus('Đang mua token, xác nhận trong ví...')
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.buy(tokenAddr, usdcIn, 0) // minTokensOut = 0 (test, không chống trượt giá)
      setStatus('Đang chờ xác nhận giao dịch...')
      await tx.wait()
      setStatus('Mua token thành công!')
      setBuyAmounts({ ...buyAmounts, [tokenAddr]: '' })
      loadTokens()
    } catch (err) {
      setStatus('Lỗi mua: ' + (err.reason || err.message))
    }
    setBusyToken(null)
  }

  async function handleSell(tokenAddr) {
    if (!account) return setStatus('Vui lòng kết nối ví trước')
    const amountStr = sellAmounts[tokenAddr]
    if (!amountStr || Number(amountStr) <= 0) return setStatus('Nhập số token muốn bán')
    setBusyToken(tokenAddr)
    try {
      const signer = await provider.getSigner()
      const tokensIn = ethers.parseUnits(amountStr, 18)

      // Bước 1: approve token cho launchpad nếu cần
      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
      const allowance = await tokenContract.allowance(account, LAUNCHPAD_ADDRESS)
      if (allowance < tokensIn) {
        setStatus('Đang approve token, xác nhận trong ví...')
        const approveTx = await tokenContract.approve(LAUNCHPAD_ADDRESS, tokensIn)
        await approveTx.wait()
      }

      // Bước 2: gọi sell
      setStatus('Đang bán token, xác nhận trong ví...')
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.sell(tokenAddr, tokensIn, 0) // minUsdcOut = 0 (test)
      setStatus('Đang chờ xác nhận giao dịch...')
      await tx.wait()
      setStatus('Bán token thành công!')
      setSellAmounts({ ...sellAmounts, [tokenAddr]: '' })
      loadTokens()
    } catch (err) {
      setStatus('Lỗi bán: ' + (err.reason || err.message))
    }
    setBusyToken(null)
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
        <div key={t.address} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{t.address}</p>
          <p style={{ fontSize: 13 }}>Creator: {t.creator.slice(0, 6)}...{t.creator.slice(-4)}</p>
          <p style={{ fontSize: 13 }}>Reserve USDC: {t.reserveUSDC} | Reserve Token: {t.reserveToken}</p>
          <p style={{ fontSize: 13, fontWeight: 'bold' }}>
            {t.graduated ? 'Da tot nghiep' : 'Dang trong bonding curve'}
          </p>

          {!t.graduated && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <input
                  placeholder="So USDC mua"
                  value={buyAmounts[t.address] || ''}
                  onChange={e => setBuyAmounts({ ...buyAmounts, [t.address]: e.target.value })}
                  style={smallInputStyle}
                />
                <button
                  onClick={() => handleBuy(t.address)}
                  disabled={busyToken === t.address}
                  style={{ ...btnStyle, background: '#16a34a', width: '100%' }}
                >
                  {busyToken === t.address ? 'Dang xu ly...' : 'Mua'}
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <input
                  placeholder="So token ban"
                  value={sellAmounts[t.address] || ''}
                  onChange={e => setSellAmounts({ ...sellAmounts, [t.address]: e.target.value })}
                  style={smallInputStyle}
                />
                <button
                  onClick={() => handleSell(t.address)}
                  disabled={busyToken === t.address}
                  style={{ ...btnStyle, background: '#dc2626', width: '100%' }}
                >
                  {busyToken === t.address ? 'Dang xu ly...' : 'Ban'}
                </button>
              </div>
            </div>
          )}
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

const smallInputStyle = {
  display: 'block',
  width: '100%',
  padding: 6,
  marginBottom: 4,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13
}
