import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, USDC_ADDRESS } from './abi'

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
]

const LANGS = { vi: '🇻🇳', en: '🇬🇧', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷' }

const T = {
  vi: { title: 'Amok', subtitle: 'Launch memecoin trong 1 phút', connect: 'Kết nối ví', create: '+ Tạo Coin',
    formTitle: 'Tạo Coin Mới', namePh: 'Tên coin', symbolPh: 'Symbol', submit: 'Ra mắt ngay',
    progress: 'Tiến độ graduate', buy: 'Mua', sell: 'Bán', hot: '🔥 HOT',
    graduated: '🎓 Đã lên sàn', creator: 'Tạo bởi', noTokens: 'Chưa có coin nào. Hãy là người đầu tiên!',
    needWallet: 'Kết nối ví trước', buyPh: 'USDC', sellPh: 'Token', trades: 'giao dịch',
    share: 'Chia sẻ', copied: 'Đã copy!', custom: 'Khác', koth: '👑 Vua của đồi',
    searchPh: 'Tìm coin theo tên hoặc địa chỉ...', all: 'Tất cả', hotTab: 'Đang hot', mine: 'Của tôi',
    noResults: 'Không tìm thấy coin nào', recentActivity: 'Hoạt động gần đây', bought: 'đã mua',
    sold: 'đã bán', noActivity: 'Chưa có giao dịch', copyAddr: 'Copy địa chỉ' },
  en: { title: 'Amok', subtitle: 'Launch a memecoin in 1 minute', connect: 'Connect Wallet', create: '+ Create Coin',
    formTitle: 'Create New Coin', namePh: 'Coin name', symbolPh: 'Symbol', submit: 'Launch now',
    progress: 'Graduation progress', buy: 'Buy', sell: 'Sell', hot: '🔥 HOT',
    graduated: '🎓 Graduated', creator: 'Created by', noTokens: 'No coins yet. Be the first!',
    needWallet: 'Connect wallet first', buyPh: 'USDC', sellPh: 'Token', trades: 'trades',
    share: 'Share', copied: 'Copied!', custom: 'Custom', koth: '👑 King of the Hill',
    searchPh: 'Search by name or address...', all: 'All', hotTab: 'Trending', mine: 'Mine',
    noResults: 'No coins found', recentActivity: 'Recent activity', bought: 'bought',
    sold: 'sold', noActivity: 'No trades yet', copyAddr: 'Copy address' },
  zh: { title: 'Amok', subtitle: '1分钟发行你的模因币', connect: '连接钱包', create: '+ 创建代币',
    formTitle: '创建新代币', namePh: '代币名称', symbolPh: '代号', submit: '立即发布',
    progress: '毕业进度', buy: '购买', sell: '出售', hot: '🔥 热门',
    graduated: '🎓 已毕业', creator: '创建者', noTokens: '还没有代币，快来创建第一个！',
    needWallet: '请先连接钱包', buyPh: 'USDC', sellPh: '代币', trades: '笔交易',
    share: '分享', copied: '已复制！', custom: '自定义', koth: '👑 山丘之王',
    searchPh: '按名称或地址搜索...', all: '全部', hotTab: '热门', mine: '我的',
    noResults: '未找到代币', recentActivity: '最近活动', bought: '买入了',
    sold: '卖出了', noActivity: '暂无交易', copyAddr: '复制地址' },
  ja: { title: 'Amok', subtitle: '1分でミームコインを発行', connect: 'ウォレット接続', create: '+ コイン作成',
    formTitle: '新規コイン作成', namePh: 'コイン名', symbolPh: 'シンボル', submit: '今すぐ発行',
    progress: '卒業進捗', buy: '購入', sell: '売却', hot: '🔥 人気',
    graduated: '🎓 卒業済み', creator: '作成者', noTokens: 'まだコインがありません。最初の作成者になろう！',
    needWallet: '先にウォレットを接続', buyPh: 'USDC', sellPh: 'トークン', trades: '件の取引',
    share: '共有', copied: 'コピーしました！', custom: 'カスタム', koth: '👑 キング・オブ・ザ・ヒル',
    searchPh: '名前またはアドレスで検索...', all: 'すべて', hotTab: '人気', mine: '自分の',
    noResults: 'コインが見つかりません', recentActivity: '最近のアクティビティ', bought: 'が購入',
    sold: 'が売却', noActivity: 'まだ取引がありません', copyAddr: 'アドレスをコピー' },
  ko: { title: 'Amok', subtitle: '1분만에 밈코인 런칭', connect: '지갑 연결', create: '+ 코인 생성',
    formTitle: '새 코인 생성', namePh: '코인 이름', symbolPh: '심볼', submit: '지금 런칭',
    progress: '졸업 진행률', buy: '구매', sell: '판매', hot: '🔥 인기',
    graduated: '🎓 졸업됨', creator: '생성자', noTokens: '아직 코인이 없습니다. 첫 번째가 되어보세요!',
    needWallet: '먼저 지갑을 연결하세요', buyPh: 'USDC', sellPh: '토큰', trades: '건의 거래',
    share: '공유', copied: '복사됨!', custom: '직접입력', koth: '👑 언덕의 왕',
    searchPh: '이름 또는 주소로 검색...', all: '전체', hotTab: '인기', mine: '내 코인',
    noResults: '코인을 찾을 수 없습니다', recentActivity: '최근 활동', bought: '구매함',
    sold: '판매함', noActivity: '아직 거래 없음', copyAddr: '주소 복사' },
}

const GRADUATE_THRESHOLD = 20000
const QUICK_AMOUNTS = [5, 10, 25]

export default function App() {
  const [lang, setLang] = useState('vi')
  const t = T[lang]
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [tokens, setTokens] = useState([])
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [amounts, setAmounts] = useState({})
  const [busyToken, setBusyToken] = useState(null)
  const [busyMode, setBusyMode] = useState(null)
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (window.okxwallet || window.ethereum) {
      setProvider(new ethers.BrowserProvider(window.okxwallet || window.ethereum))
    }
  }, [])

  async function connectWallet() {
    const eth = window.okxwallet || window.ethereum
    if (!eth) return setStatus('No wallet found')
    const accs = await eth.request({ method: 'eth_requestAccounts' })
    setAccount(accs[0])
    loadTokens()
  }

  async function loadTokens() {
    if (!provider) return
    try {
      const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, provider)
      const len = await c.allTokensLength()
      const list = []
      for (let i = 0; i < Number(len); i++) {
        const addr = await c.allTokens(i)
        const info = await c.tokens(addr)
        const reserveUSDC = Number(ethers.formatUnits(info.reserveUSDC, 6))
        const reserveToken = Number(ethers.formatUnits(info.reserveToken, 18))
        const price = reserveToken > 0 ? reserveUSDC / reserveToken : 0
        const progressPct = Math.min(100, (reserveUSDC / GRADUATE_THRESHOLD) * 100)

        let trades = []
        let holders = new Set()
        try {
          const filter = c.filters.Trade(addr)
          const logs = await c.queryFilter(filter)
          trades = logs.slice(-3).reverse().map(log => ({
            trader: log.args.trader,
            isBuy: log.args.isBuy,
            usdcAmount: Number(ethers.formatUnits(log.args.usdcAmount, 6)),
          }))
          logs.forEach(l => holders.add(l.args.trader))
        } catch (e) { /* ignore */ }

        list.push({
          address: addr, creator: info.creator, reserveUSDC, reserveToken,
          graduated: info.graduated, price, progressPct, tradeCount: trades.length ? holders.size : 0,
          recentTrades: trades, holderCount: holders.size
        })
      }
      list.sort((a, b) => {
        if (a.graduated !== b.graduated) return a.graduated ? 1 : -1
        return b.progressPct - a.progressPct
      })
      setTokens(list)
    } catch (e) { setStatus(e.message) }
  }

  useEffect(() => { if (provider) loadTokens() }, [provider])

  async function handleCreate() {
    if (!account) return setStatus(t.needWallet)
    if (!tokenName || !tokenSymbol) return
    try {
      const signer = await provider.getSigner()
      const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await c.createToken(tokenName, tokenSymbol)
      await tx.wait()
      setTokenName(''); setTokenSymbol(''); setShowForm(false)
      loadTokens()
    } catch (e) { setStatus(e.reason || e.message) }
  }

  async function handleTrade(tokenAddr, mode, amtOverride) {
    if (!account) return setStatus(t.needWallet)
    const amt = amtOverride || amounts[tokenAddr]
    if (!amt || Number(amt) <= 0) return
    setBusyToken(tokenAddr); setBusyMode(mode)
    try {
      const signer = await provider.getSigner()
      if (mode === 'buy') {
        const usdcIn = ethers.parseUnits(String(amt), 6)
        const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer)
        const allowance = await usdc.allowance(account, LAUNCHPAD_ADDRESS)
        if (allowance < usdcIn) { await (await usdc.approve(LAUNCHPAD_ADDRESS, usdcIn)).wait() }
        const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
        await (await c.buy(tokenAddr, usdcIn, 0)).wait()
      } else {
        const tokensIn = ethers.parseUnits(String(amt), 18)
        const tok = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
        const allowance = await tok.allowance(account, LAUNCHPAD_ADDRESS)
        if (allowance < tokensIn) { await (await tok.approve(LAUNCHPAD_ADDRESS, tokensIn)).wait() }
        const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
        await (await c.sell(tokenAddr, tokensIn, 0)).wait()
      }
      setAmounts({ ...amounts, [tokenAddr]: '' })
      loadTokens()
    } catch (e) { setStatus(e.reason || e.message) }
    setBusyToken(null); setBusyMode(null)
  }

  function handleShare(tokenAddr) {
    const url = `${window.location.origin}?token=${tokenAddr}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAddr('share-' + tokenAddr)
      setTimeout(() => setCopiedAddr(null), 2000)
    })
  }

  function handleCopyAddr(tokenAddr) {
    navigator.clipboard.writeText(tokenAddr).then(() => {
      setCopiedAddr('addr-' + tokenAddr)
      setTimeout(() => setCopiedAddr(null), 2000)
    })
  }

  const kingOfHill = tokens.find(tk => !tk.graduated) || null

  const filteredTokens = tokens.filter(tk => {
    if (search && !tk.address.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === 'hot') return tk.progressPct > 60 && !tk.graduated
    if (tab === 'mine') return account && (tk.creator.toLowerCase() === account.toLowerCase())
    return true
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0d0d12ee', backdropFilter: 'blur(6px)',
        borderBottom: '1px solid #26262f', padding: '10px 16px'
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{t.title} 🚀</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ background: '#16161d', color: '#fff', border: '1px solid #26262f', borderRadius: 8, padding: '6px 8px', fontSize: 13 }}>
              {Object.entries(LANGS).map(([c, f]) => <option key={c} value={c}>{f}</option>)}
            </select>
            {!account ? (
              <button onClick={connectWallet} style={{ ...pillBtn, background: '#22c55e', color: '#0d0d12', padding: '8px 14px', fontSize: 13 }}>{t.connect}</button>
            ) : (
              <span style={{ ...pillBtn, background: '#16161d', border: '1px solid #26262f', padding: '8px 14px', fontSize: 13 }}>{account.slice(0,6)}...{account.slice(-4)}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>
        <p style={{ color: '#8a8a99', margin: '0 0 16px' }}>{t.subtitle}</p>

        <button onClick={() => setShowForm(!showForm)} style={{ ...pillBtn, background: '#ffb020', color: '#0d0d12', marginBottom: 16 }}>{t.create}</button>

        {status && <p style={{ color: '#ff5c5c', fontSize: 13 }}>{status}</p>}

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{t.formTitle}</h3>
            <input placeholder={t.namePh} value={tokenName} onChange={e => setTokenName(e.target.value)} style={inputStyle} />
            <input placeholder={t.symbolPh} value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} style={inputStyle} />
            <button onClick={handleCreate} style={{ ...pillBtn, background: '#22c55e', color: '#0d0d12', width: '100%' }}>{t.submit}</button>
          </div>
        )}

        {kingOfHill && (
          <div className="card hot" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1a1508, #16161d)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffb020', marginBottom: 8 }}>{t.koth}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{kingOfHill.address.slice(0,8)}...{kingOfHill.address.slice(-6)}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>${kingOfHill.price.toFixed(8)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#ffb020' }}>{kingOfHill.progressPct.toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: '#8a8a99' }}>{t.progress}</div>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 10 }}>
              <div className="progress-fill" style={{ width: `${kingOfHill.progressPct}%`, background: 'linear-gradient(90deg, #ffb020, #ff8c00)' }} />
            </div>
          </div>
        )}

        <input
          placeholder={t.searchPh}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['all', t.all], ['hot', t.hotTab], ['mine', t.mine]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                ...pillBtn, padding: '6px 14px', fontSize: 13,
                background: tab === key ? '#22c55e' : '#16161d',
                color: tab === key ? '#0d0d12' : '#f2f2f5',
                border: tab === key ? 'none' : '1px solid #26262f'
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filteredTokens.length === 0 && <p style={{ color: '#6b6b7a' }}>{tokens.length === 0 ? t.noTokens : t.noResults}</p>}
          {filteredTokens.map(tk => {
            const isHot = tk.progressPct > 60 && !tk.graduated
            const customVal = amounts[tk.address] || ''
            const isExpanded = expanded === tk.address
            return (
              <div key={tk.address} className={`card ${isHot ? 'hot' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <button onClick={() => handleCopyAddr(tk.address)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12, color: '#8a8a99', padding: 0 }}>
                    {copiedAddr === 'addr-' + tk.address ? `✅ ${t.copied}` : `${tk.address.slice(0,6)}...${tk.address.slice(-4)} 📋`}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {tk.graduated ? <span className="badge badge-graduated">{t.graduated}</span> :
                      isHot ? <span className="badge badge-hot">{t.hot}</span> : null}
                  </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 700 }}>${tk.price.toFixed(8)}</div>
                <div style={{ fontSize: 12, color: '#8a8a99', marginBottom: 4 }}>{t.creator}: {tk.creator.slice(0,6)}...{tk.creator.slice(-4)}</div>
                <div style={{ fontSize: 12, color: '#6b6b7a', marginBottom: 10 }}>👥 {tk.holderCount} holders</div>

                {!tk.graduated && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8a8a99', marginBottom: 4 }}>
                      <span>{t.progress}</span><span>{tk.progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${tk.progressPct}%` }} /></div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      {QUICK_AMOUNTS.map(v => (
                        <button key={v} onClick={() => handleTrade(tk.address, 'buy', v)} disabled={busyToken === tk.address}
                          style={{ ...quickBtn }}>
                          {v}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input
                        placeholder={t.custom}
                        value={customVal}
                        onChange={e => setAmounts({ ...amounts, [tk.address]: e.target.value })}
                        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                      />
                      <button onClick={() => handleTrade(tk.address, 'buy')} disabled={busyToken === tk.address}
                        style={{ ...pillBtn, background: '#22c55e', color: '#0d0d12', padding: '10px 14px' }}>
                        {busyToken === tk.address && busyMode === 'buy' ? '...' : t.buy}
                      </button>
                      <button onClick={() => handleTrade(tk.address, 'sell')} disabled={busyToken === tk.address}
                        style={{ ...pillBtn, background: '#ff5c5c', color: '#0d0d12', padding: '10px 14px' }}>
                        {busyToken === tk.address && busyMode === 'sell' ? '...' : t.sell}
                      </button>
                    </div>
                  </>
                )}

                <button onClick={() => setExpanded(isExpanded ? null : tk.address)} style={shareBtn}>
                  {isExpanded ? '▲' : '▼'} {t.recentActivity}
                </button>
                {isExpanded && (
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    {tk.recentTrades.length === 0 && <p style={{ color: '#6b6b7a' }}>{t.noActivity}</p>}
                    {tk.recentTrades.map((tr, i) => (
                      <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #26262f', color: tr.isBuy ? '#22c55e' : '#ff5c5c' }}>
                        {tr.trader.slice(0,6)}...{tr.trader.slice(-4)} {tr.isBuy ? t.bought : t.sold} ${tr.usdcAmount.toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => handleShare(tk.address)} style={shareBtn}>
                  {copiedAddr === 'share-' + tk.address ? `✅ ${t.copied}` : `🔗 ${t.share}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const pillBtn = { padding: '10px 18px', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 14 }
const quickBtn = { flex: 1, padding: '8px 0', border: '1px solid #26262f', background: '#0d0d12', color: '#f2f2f5', borderRadius: 8, cursor: 'pointer', fontSize: 13 }
const inputStyle = { display: 'block', width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, fontSize: 13 }
const shareBtn = { width: '100%', marginTop: 8, padding: '8px 0', background: 'transparent', border: '1px solid #26262f', color: '#8a8a99', borderRadius: 8, cursor: 'pointer', fontSize: 12 }
