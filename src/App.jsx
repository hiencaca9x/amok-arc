import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, USDC_ADDRESS } from './abi'

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)"
]

const LANGS = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt' },
  en: { flag: '🇬🇧', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
  ko: { flag: '🇰🇷', label: '한국어' },
}

const T = {
  vi: {
    title: 'Amok Launchpad',
    subtitle: 'Memecoin launchpad trên Arc Testnet',
    connectWallet: 'Kết nối ví',
    wallet: 'Ví',
    createTitle: 'Tạo token mới',
    namePlaceholder: 'Tên token (vd: Amok Coin)',
    symbolPlaceholder: 'Symbol (vd: AMOK)',
    createBtn: 'Tạo token',
    tokenListTitle: 'Danh sách token',
    loading: 'Đang tải...',
    creator: 'Người tạo',
    graduated: 'Đã tốt nghiệp',
    inCurve: 'Đang trong bonding curve',
    buyPlaceholder: 'Số USDC mua',
    sellPlaceholder: 'Số token bán',
    buy: 'Mua',
    sell: 'Bán',
    processing: 'Đang xử lý...',
    needWallet: 'Vui lòng kết nối ví trước',
    needName: 'Nhập đầy đủ tên và symbol',
    creatingToken: 'Đang tạo token, xác nhận trong ví...',
    waitingTx: 'Đang chờ xác nhận giao dịch...',
    createSuccess: 'Tạo token thành công!',
    needBuyAmount: 'Nhập số USDC muốn mua',
    needSellAmount: 'Nhập số token muốn bán',
    approving: 'Đang approve, xác nhận trong ví...',
    buying: 'Đang mua token, xác nhận trong ví...',
    selling: 'Đang bán token, xác nhận trong ví...',
    buySuccess: 'Mua token thành công!',
    sellSuccess: 'Bán token thành công!',
    errPrefix: 'Lỗi: ',
    noWalletFound: 'Không tìm thấy ví. Vui lòng cài OKX Wallet hoặc MetaMask.',
    connected: 'Đã kết nối ví: ',
  },
  en: {
    title: 'Amok Launchpad',
    subtitle: 'Memecoin launchpad on Arc Testnet',
    connectWallet: 'Connect Wallet',
    wallet: 'Wallet',
    createTitle: 'Create New Token',
    namePlaceholder: 'Token name (e.g. Amok Coin)',
    symbolPlaceholder: 'Symbol (e.g. AMOK)',
    createBtn: 'Create Token',
    tokenListTitle: 'Token List',
    loading: 'Loading...',
    creator: 'Creator',
    graduated: 'Graduated',
    inCurve: 'In bonding curve',
    buyPlaceholder: 'USDC amount to buy',
    sellPlaceholder: 'Token amount to sell',
    buy: 'Buy',
    sell: 'Sell',
    processing: 'Processing...',
    needWallet: 'Please connect your wallet first',
    needName: 'Please enter name and symbol',
    creatingToken: 'Creating token, confirm in wallet...',
    waitingTx: 'Waiting for transaction confirmation...',
    createSuccess: 'Token created successfully!',
    needBuyAmount: 'Enter USDC amount to buy',
    needSellAmount: 'Enter token amount to sell',
    approving: 'Approving, confirm in wallet...',
    buying: 'Buying token, confirm in wallet...',
    selling: 'Selling token, confirm in wallet...',
    buySuccess: 'Buy successful!',
    sellSuccess: 'Sell successful!',
    errPrefix: 'Error: ',
    noWalletFound: 'Wallet not found. Please install OKX Wallet or MetaMask.',
    connected: 'Connected: ',
  },
  zh: {
    title: 'Amok 启动台',
    subtitle: 'Arc 测试网上的模因币启动台',
    connectWallet: '连接钱包',
    wallet: '钱包',
    createTitle: '创建新代币',
    namePlaceholder: '代币名称 (例: Amok Coin)',
    symbolPlaceholder: '代号 (例: AMOK)',
    createBtn: '创建代币',
    tokenListTitle: '代币列表',
    loading: '加载中...',
    creator: '创建者',
    graduated: '已毕业',
    inCurve: '联合曲线中',
    buyPlaceholder: '购买 USDC 数量',
    sellPlaceholder: '出售代币数量',
    buy: '购买',
    sell: '出售',
    processing: '处理中...',
    needWallet: '请先连接钱包',
    needName: '请输入名称和代号',
    creatingToken: '正在创建代币，请在钱包中确认...',
    waitingTx: '等待交易确认...',
    createSuccess: '代币创建成功！',
    needBuyAmount: '请输入购买的 USDC 数量',
    needSellAmount: '请输入出售的代币数量',
    approving: '正在授权，请在钱包中确认...',
    buying: '正在购买代币，请在钱包中确认...',
    selling: '正在出售代币，请在钱包中确认...',
    buySuccess: '购买成功！',
    sellSuccess: '出售成功！',
    errPrefix: '错误：',
    noWalletFound: '未找到钱包，请安装 OKX Wallet 或 MetaMask。',
    connected: '已连接：',
  },
  ja: {
    title: 'Amok ローンチパッド',
    subtitle: 'Arc テストネット上のミームコインローンチパッド',
    connectWallet: 'ウォレット接続',
    wallet: 'ウォレット',
    createTitle: '新しいトークンを作成',
    namePlaceholder: 'トークン名 (例: Amok Coin)',
    symbolPlaceholder: 'シンボル (例: AMOK)',
    createBtn: 'トークン作成',
    tokenListTitle: 'トークン一覧',
    loading: '読み込み中...',
    creator: '作成者',
    graduated: '卒業済み',
    inCurve: 'ボンディングカーブ中',
    buyPlaceholder: '購入するUSDC量',
    sellPlaceholder: '売却するトークン量',
    buy: '購入',
    sell: '売却',
    processing: '処理中...',
    needWallet: '先にウォレットを接続してください',
    needName: '名前とシンボルを入力してください',
    creatingToken: 'トークンを作成中、ウォレットで確認してください...',
    waitingTx: 'トランザクション確認待ち...',
    createSuccess: 'トークン作成成功！',
    needBuyAmount: '購入するUSDC量を入力してください',
    needSellAmount: '売却するトークン量を入力してください',
    approving: '承認中、ウォレットで確認してください...',
    buying: 'トークンを購入中、ウォレットで確認してください...',
    selling: 'トークンを売却中、ウォレットで確認してください...',
    buySuccess: '購入成功！',
    sellSuccess: '売却成功！',
    errPrefix: 'エラー：',
    noWalletFound: 'ウォレットが見つかりません。OKX WalletまたはMetaMaskをインストールしてください。',
    connected: '接続済み：',
  },
  ko: {
    title: 'Amok 런치패드',
    subtitle: 'Arc 테스트넷 밈코인 런치패드',
    connectWallet: '지갑 연결',
    wallet: '지갑',
    createTitle: '새 토큰 생성',
    namePlaceholder: '토큰 이름 (예: Amok Coin)',
    symbolPlaceholder: '심볼 (예: AMOK)',
    createBtn: '토큰 생성',
    tokenListTitle: '토큰 목록',
    loading: '로딩 중...',
    creator: '생성자',
    graduated: '졸업됨',
    inCurve: '본딩 커브 진행 중',
    buyPlaceholder: '구매할 USDC 수량',
    sellPlaceholder: '판매할 토큰 수량',
    buy: '구매',
    sell: '판매',
    processing: '처리 중...',
    needWallet: '먼저 지갑을 연결해주세요',
    needName: '이름과 심볼을 입력해주세요',
    creatingToken: '토큰 생성 중, 지갑에서 확인해주세요...',
    waitingTx: '트랜잭션 확인 대기 중...',
    createSuccess: '토큰이 성공적으로 생성되었습니다!',
    needBuyAmount: '구매할 USDC 수량을 입력하세요',
    needSellAmount: '판매할 토큰 수량을 입력하세요',
    approving: '승인 중, 지갑에서 확인해주세요...',
    buying: '토큰 구매 중, 지갑에서 확인해주세요...',
    selling: '토큰 판매 중, 지갑에서 확인해주세요...',
    buySuccess: '구매 성공!',
    sellSuccess: '판매 성공!',
    errPrefix: '오류: ',
    noWalletFound: '지갑을 찾을 수 없습니다. OKX Wallet 또는 MetaMask를 설치해주세요.',
    connected: '연결됨: ',
  },
}

export default function App() {
  const [lang, setLang] = useState('vi')
  const t = T[lang]

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
      if (!eth) return setStatus(t.noWalletFound)
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      setStatus(t.connected + accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4))
      loadTokens()
    } catch (err) {
      setStatus(t.errPrefix + err.message)
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
      setStatus(t.errPrefix + err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (provider) loadTokens()
  }, [provider])

  async function handleCreateToken() {
    if (!account) return setStatus(t.needWallet)
    if (!tokenName || !tokenSymbol) return setStatus(t.needName)
    setStatus(t.creatingToken)
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.createToken(tokenName, tokenSymbol)
      setStatus(t.waitingTx)
      await tx.wait()
      setStatus(t.createSuccess)
      setTokenName('')
      setTokenSymbol('')
      loadTokens()
    } catch (err) {
      setStatus(t.errPrefix + (err.reason || err.message))
    }
  }

  async function handleBuy(tokenAddr) {
    if (!account) return setStatus(t.needWallet)
    const amountStr = buyAmounts[tokenAddr]
    if (!amountStr || Number(amountStr) <= 0) return setStatus(t.needBuyAmount)
    setBusyToken(tokenAddr)
    try {
      const signer = await provider.getSigner()
      const usdcIn = ethers.parseUnits(amountStr, 6)

      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer)
      const allowance = await usdc.allowance(account, LAUNCHPAD_ADDRESS)
      if (allowance < usdcIn) {
        setStatus(t.approving)
        const approveTx = await usdc.approve(LAUNCHPAD_ADDRESS, usdcIn)
        await approveTx.wait()
      }

      setStatus(t.buying)
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.buy(tokenAddr, usdcIn, 0)
      setStatus(t.waitingTx)
      await tx.wait()
      setStatus(t.buySuccess)
      setBuyAmounts({ ...buyAmounts, [tokenAddr]: '' })
      loadTokens()
    } catch (err) {
      setStatus(t.errPrefix + (err.reason || err.message))
    }
    setBusyToken(null)
  }

  async function handleSell(tokenAddr) {
    if (!account) return setStatus(t.needWallet)
    const amountStr = sellAmounts[tokenAddr]
    if (!amountStr || Number(amountStr) <= 0) return setStatus(t.needSellAmount)
    setBusyToken(tokenAddr)
    try {
      const signer = await provider.getSigner()
      const tokensIn = ethers.parseUnits(amountStr, 18)

      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
      const allowance = await tokenContract.allowance(account, LAUNCHPAD_ADDRESS)
      if (allowance < tokensIn) {
        setStatus(t.approving)
        const approveTx = await tokenContract.approve(LAUNCHPAD_ADDRESS, tokensIn)
        await approveTx.wait()
      }

      setStatus(t.selling)
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await contract.sell(tokenAddr, tokensIn, 0)
      setStatus(t.waitingTx)
      await tx.wait()
      setStatus(t.sellSuccess)
      setSellAmounts({ ...sellAmounts, [tokenAddr]: '' })
      loadTokens()
    } catch (err) {
      setStatus(t.errPrefix + (err.reason || err.message))
    }
    setBusyToken(null)
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{t.title}</h1>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          style={langSelectStyle}
        >
          {Object.entries(LANGS).map(([code, info]) => (
            <option key={code} value={code}>{info.flag} {info.label}</option>
          ))}
        </select>
      </div>
      <p style={{ color: '#666' }}>{t.subtitle}</p>

      {!account ? (
        <button onClick={connectWallet} style={btnStyle}>{t.connectWallet}</button>
      ) : (
        <p>{t.wallet}: {account.slice(0, 6)}...{account.slice(-4)}</p>
      )}

      {status && <p style={{ color: '#0066cc', fontSize: 14 }}>{status}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: 24 }}>
        <h3>{t.createTitle}</h3>
        <input
          placeholder={t.namePlaceholder}
          value={tokenName}
          onChange={e => setTokenName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder={t.symbolPlaceholder}
          value={tokenSymbol}
          onChange={e => setTokenSymbol(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleCreateToken} style={btnStyle}>{t.createBtn}</button>
      </div>

      <h3 style={{ marginTop: 32 }}>{t.tokenListTitle} ({tokens.length})</h3>
      {loading && <p>{t.loading}</p>}
      {tokens.map(tk => (
        <div key={tk.address} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{tk.address}</p>
          <p style={{ fontSize: 13 }}>{t.creator}: {tk.creator.slice(0, 6)}...{tk.creator.slice(-4)}</p>
          <p style={{ fontSize: 13 }}>Reserve USDC: {tk.reserveUSDC} | Reserve Token: {tk.reserveToken}</p>
          <p style={{ fontSize: 13, fontWeight: 'bold' }}>
            {tk.graduated ? t.graduated : t.inCurve}
          </p>

          {!tk.graduated && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <input
                  placeholder={t.buyPlaceholder}
                  value={buyAmounts[tk.address] || ''}
                  onChange={e => setBuyAmounts({ ...buyAmounts, [tk.address]: e.target.value })}
                  style={smallInputStyle}
                />
                <button
                  onClick={() => handleBuy(tk.address)}
                  disabled={busyToken === tk.address}
                  style={{ ...btnStyle, background: '#16a34a', width: '100%' }}
                >
                  {busyToken === tk.address ? t.processing : t.buy}
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <input
                  placeholder={t.sellPlaceholder}
                  value={sellAmounts[tk.address] || ''}
                  onChange={e => setSellAmounts({ ...sellAmounts, [tk.address]: e.target.value })}
                  style={smallInputStyle}
                />
                <button
                  onClick={() => handleSell(tk.address)}
                  disabled={busyToken === tk.address}
                  style={{ ...btnStyle, background: '#dc2626', width: '100%' }}
                >
                  {busyToken === tk.address ? t.processing : t.sell}
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

const langSelectStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 13
}
