import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, USDC_ADDRESS } from './abi'

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
]

const LANGS = { en: '🇬🇧', vi: '🇻🇳', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷' }

const T = {
  vi: { title: 'Amok', subtitle: 'Launch memecoin trong 1 phút, giao dịch tức thì trên bonding curve', connect: 'Kết nối ví', create: '+ Tạo Coin',
    formTitle: 'Tạo Coin Mới', namePh: 'Tên coin', symbolPh: 'Symbol', submit: 'Ra mắt ngay',
    progress: 'Tiến độ graduate', buy: 'Mua', sell: 'Bán', hot: '🔥 HOT',
    graduated: '🎓 Đã lên sàn', creator: 'Tạo bởi', noTokens: 'Chưa có coin nào. Hãy là người đầu tiên!',
    needWallet: 'Vui lòng kết nối ví trước khi giao dịch', buyPh: 'Số lượng USDC', sellPh: 'Số lượng Token', trades: 'giao dịch',
    share: 'Chia sẻ', copied: 'Đã copy!', koth: '👑 Vua của đồi',
    searchPh: 'Tìm coin theo tên hoặc địa chỉ...', all: 'Tất cả', hotTab: 'Đang hot', mine: 'Của tôi',
    noResults: 'Không tìm thấy coin nào', details: 'Chi tiết', bought: 'đã mua',
    sold: 'đã bán', noActivity: 'Chưa có giao dịch', holders: 'người nắm giữ',
    marketCap: 'Vốn hóa', claim: 'Rút thưởng', claimed: 'Đã rút thưởng!', earned: 'Thưởng của bạn',
    totalCoins: 'Coin đã tạo', totalVolume: 'Tổng khối lượng', totalMcap: 'Tổng vốn hóa',
    footerTag: 'Memecoin launchpad trên Arc Testnet', footerNote: 'Chỉ dành cho môi trường testnet. Không phải lời khuyên tài chính.',
    previewLabel: 'Xem trước', enterAmount: 'Vui lòng nhập số lượng trước khi giao dịch',
    noWalletMobile: 'Không tìm thấy ví. Mở trang này trong app MetaMask để kết nối.',
    slippage: 'Trượt giá', minReceive: 'Nhận tối thiểu', priceChart: 'Biểu đồ giá', noChartData: 'Chưa có đủ dữ liệu giao dịch' },
  en: { title: 'Amok', subtitle: 'Launch a memecoin in 1 minute, trade instantly on a bonding curve', connect: 'Connect Wallet', create: '+ Create Coin',
    formTitle: 'Create New Coin', namePh: 'Coin name', symbolPh: 'Symbol', submit: 'Launch now',
    progress: 'Graduation progress', buy: 'Buy', sell: 'Sell', hot: '🔥 HOT',
    graduated: '🎓 Graduated', creator: 'Created by', noTokens: 'No coins yet. Be the first!',
    needWallet: 'Please connect your wallet before trading', buyPh: 'USDC amount', sellPh: 'Token amount', trades: 'trades',
    share: 'Share', copied: 'Copied!', koth: '👑 King of the Hill',
    searchPh: 'Search by name or address...', all: 'All', hotTab: 'Trending', mine: 'Mine',
    noResults: 'No coins found', details: 'Details', bought: 'bought',
    sold: 'sold', noActivity: 'No trades yet', holders: 'holders',
    marketCap: 'Market Cap', claim: 'Claim Rewards', claimed: 'Claimed!', earned: 'Your rewards',
    totalCoins: 'Coins launched', totalVolume: 'Total volume', totalMcap: 'Total market cap',
    footerTag: 'Memecoin launchpad on Arc Testnet', footerNote: 'Testnet only. Not financial advice.',
    previewLabel: 'Preview', enterAmount: 'Please enter an amount before trading',
    noWalletMobile: 'No wallet found. Open this page inside the MetaMask app to connect.',
    slippage: 'Slippage', minReceive: 'Min. received', priceChart: 'Price chart', noChartData: 'Not enough trade data yet' },
  zh: { title: 'Amok', subtitle: '1分钟发行代币，通过联合曲线即时交易', connect: '连接钱包', create: '+ 创建代币',
    formTitle: '创建新代币', namePh: '代币名称', symbolPh: '代号', submit: '立即发布',
    progress: '毕业进度', buy: '购买', sell: '出售', hot: '🔥 热门',
    graduated: '🎓 已毕业', creator: '创建者', noTokens: '还没有代币，快来创建第一个！',
    needWallet: '请先连接钱包再进行交易', buyPh: 'USDC 数量', sellPh: '代币数量', trades: '笔交易',
    share: '分享', copied: '已复制！', koth: '👑 山丘之王',
    searchPh: '按名称或地址搜索...', all: '全部', hotTab: '热门', mine: '我的',
    noResults: '未找到代币', details: '详情', bought: '买入了',
    sold: '卖出了', noActivity: '暂无交易', holders: '持有人',
    marketCap: '市值', claim: '领取奖励', claimed: '已领取！', earned: '你的奖励',
    totalCoins: '已发行代币', totalVolume: '总交易量', totalMcap: '总市值',
    footerTag: 'Arc 测试网上的模因币启动台', footerNote: '仅限测试网。非财务建议。',
    previewLabel: '预览', enterAmount: '请输入交易数量',
    noWalletMobile: '未检测到钱包。请在 MetaMask 应用内打开此页面以连接。',
    slippage: '滑点', minReceive: '最少收到', priceChart: '价格图表', noChartData: '交易数据不足' },
  ja: { title: 'Amok', subtitle: '1分でミームコインを発行、ボンディングカーブで即時取引', connect: 'ウォレット接続', create: '+ コイン作成',
    formTitle: '新規コイン作成', namePh: 'コイン名', symbolPh: 'シンボル', submit: '今すぐ発行',
    progress: '卒業進捗', buy: '購入', sell: '売却', hot: '🔥 人気',
    graduated: '🎓 卒業済み', creator: '作成者', noTokens: 'まだコインがありません。最初の作成者になろう！',
    needWallet: '取引の前にウォレットを接続してください', buyPh: 'USDC数量', sellPh: 'トークン数量', trades: '件の取引',
    share: '共有', copied: 'コピーしました！', koth: '👑 キング・オブ・ザ・ヒル',
    searchPh: '名前またはアドレスで検索...', all: 'すべて', hotTab: '人気', mine: '自分の',
    noResults: 'コインが見つかりません', details: '詳細', bought: 'が購入',
    sold: 'が売却', noActivity: 'まだ取引がありません', holders: '保有者',
    marketCap: '時価総額', claim: '報酬を受け取る', claimed: '受け取りました！', earned: 'あなたの報酬',
    totalCoins: '発行済みコイン', totalVolume: '総取引量', totalMcap: '総時価総額',
    footerTag: 'Arc テストネット上のミームコインローンチパッド', footerNote: 'テストネット専用。投資助言ではありません。',
    previewLabel: 'プレビュー', enterAmount: '取引数量を入力してください',
    noWalletMobile: 'ウォレットが見つかりません。MetaMaskアプリ内でこのページを開いてください。',
    slippage: 'スリッページ', minReceive: '最小受取量', priceChart: '価格チャート', noChartData: '取引データが不足しています' },
  ko: { title: 'Amok', subtitle: '1분만에 밈코인 런칭, 본딩 커브로 즉시 거래', connect: '지갑 연결', create: '+ 코인 생성',
    formTitle: '새 코인 생성', namePh: '코인 이름', symbolPh: '심볼', submit: '지금 런칭',
    progress: '졸업 진행률', buy: '구매', sell: '판매', hot: '🔥 인기',
    graduated: '🎓 졸업됨', creator: '생성자', noTokens: '아직 코인이 없습니다. 첫 번째가 되어보세요!',
    needWallet: '거래 전에 지갑을 먼저 연결해주세요', buyPh: 'USDC 수량', sellPh: '토큰 수량', trades: '건의 거래',
    share: '공유', copied: '복사됨!', koth: '👑 언덕의 왕',
    searchPh: '이름 또는 주소로 검색...', all: '전체', hotTab: '인기', mine: '내 코인',
    noResults: '코인을 찾을 수 없습니다', details: '상세정보', bought: '구매함',
    sold: '판매함', noActivity: '아직 거래 없음', holders: '보유자',
    marketCap: '시가총액', claim: '보상 받기', claimed: '받았습니다!', earned: '내 보상',
    totalCoins: '발행된 코인', totalVolume: '총 거래량', totalMcap: '총 시가총액',
    footerTag: 'Arc 테스트넷 밈코인 런치패드', footerNote: '테스트넷 전용입니다. 투자 조언이 아닙니다.',
    previewLabel: '미리보기', enterAmount: '거래 수량을 입력해주세요',
    noWalletMobile: '지갑을 찾을 수 없습니다. MetaMask 앱 내에서 이 페이지를 열어주세요.',
    slippage: '슬리피지', minReceive: '최소 수령량', priceChart: '가격 차트', noChartData: '거래 데이터가 부족합니다' },
}

const GRADUATE_THRESHOLD = 20000
const TOTAL_SUPPLY = 1_000_000_000
const SOCIAL_X = 'https://x.com/amok_launchpad'
const SOCIAL_TELEGRAM = 'https://t.me/Amokofficial'
const VIRTUAL_USDC = 3000
const CREATOR_FEE = 0.007
const TREASURY_FEE = 0.003
const SLIPPAGE_OPTIONS = [1, 3, 5]
const ARC_CHAIN_ID_HEX = '0x4cef52'
const ARC_CHAIN_PARAMS = {
  chainId: ARC_CHAIN_ID_HEX,
  chainName: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
}

async function ensureArcNetwork(eth) {
  try {
    await eth.request({ method: 'wallet_addEthereumChain', params: [ARC_CHAIN_PARAMS] })
  } catch (e) {
    // user rejected, or already on Arc — ignore and let the caller proceed
  }
}

const DEPLOY_BLOCK = 59700000 // approx block AmokLaunchpad was deployed at
const LOG_CHUNK_SIZE = 2000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Public Arc Testnet RPC rejects queryFilter over too wide a block range,
// and also rate-limits rapid consecutive requests — fetch in small chunks
// with short delays between them instead of one huge query.
async function queryTradeLogsChunked(contract, filter, provider) {
  const latest = await provider.getBlockNumber()
  let logs = []
  let from = DEPLOY_BLOCK
  while (from <= latest) {
    const to = Math.min(from + LOG_CHUNK_SIZE - 1, latest)
    try {
      const chunkLogs = await contract.queryFilter(filter, from, to)
      logs = logs.concat(chunkLogs)
    } catch (e) {
      await sleep(500)
      try {
        const mid = from + Math.floor((to - from) / 2)
        const l1 = await contract.queryFilter(filter, from, mid)
        await sleep(300)
        const l2 = await contract.queryFilter(filter, mid + 1, to)
        logs = logs.concat(l1, l2)
      } catch (e2) { /* give up on this chunk, continue */ }
    }
    from = to + 1
    await sleep(150)
  }
  return logs
}

function formatUSD(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
  return '$' + n.toFixed(2)
}

function estimateBuyOut(tk, usdcIn) {
  const creatorFee = usdcIn * CREATOR_FEE
  const treasuryFee = usdcIn * TREASURY_FEE
  const usdcNet = usdcIn - creatorFee - treasuryFee
  const vReserve = tk.reserveUSDC + VIRTUAL_USDC
  const k = vReserve * tk.reserveToken
  const newVReserve = vReserve + usdcNet
  const newReserveToken = k / newVReserve
  return Math.max(0, tk.reserveToken - newReserveToken)
}

function estimateSellOut(tk, tokensIn) {
  const vReserve = tk.reserveUSDC + VIRTUAL_USDC
  const k = vReserve * tk.reserveToken
  const newReserveToken = tk.reserveToken + tokensIn
  const newVReserve = k / newReserveToken
  const usdcOutGross = Math.max(0, vReserve - newVReserve)
  const creatorFee = usdcOutGross * CREATOR_FEE
  const treasuryFee = usdcOutGross * TREASURY_FEE
  return Math.max(0, usdcOutGross - creatorFee - treasuryFee)
}

function Avatar({ address, size }) {
  const s = size || 40
  const url = `https://api.dicebear.com/7.x/shapes/svg?seed=${address}&backgroundType=gradientLinear`
  return (
    <img
      src={url}
      alt=""
      width={s}
      height={s}
      style={{ borderRadius: '50%', flexShrink: 0, background: '#26262f' }}
      loading="lazy"
    />
  )
}

function MiniChart({ data }) {
  if (!data || data.length < 2) {
    const y = 18
    return (
      <svg viewBox="0 0 100 36" style={{ width: '100%', height: 44 }} preserveAspectRatio="none">
        <line x1="0" y1={y} x2="100" y2={y} stroke="#3a3a4a" strokeWidth="1.4" strokeDasharray="3,3" />
      </svg>
    )
  }
  const max = Math.max(...data), min = Math.min(...data)
  const range = (max - min) || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 34 - ((v - min) / range) * 30 - 2
    return [x, y]
  })
  const trendUp = data[data.length - 1] >= data[0]
  const color = trendUp ? '#22c55e' : '#ff5c5c'
  const linePoints = pts.map(p => p.join(',')).join(' ')
  const areaPoints = `0,36 ${linePoints} 100,36`
  const gradId = 'g' + Math.abs(data.reduce((a,b)=>a+b,0)).toString(36).slice(0,6)
  return (
    <svg viewBox="0 0 100 36" style={{ width: '100%', height: 44 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function PriceChart({ data, t }) {
  if (!data || data.length < 2) {
    return <p style={{ color: '#6b6b7a', fontSize: 12 }}>{t.noChartData}</p>
  }
  const width = 600, height = 180, padL = 55, padB = 20, padT = 10, padR = 10
  const max = Math.max(...data), min = Math.min(...data)
  const range = (max - min) || max || 1
  const pts = data.map((v, i) => {
    const x = padL + (i / (data.length - 1)) * (width - padL - padR)
    const y = padT + (height - padT - padB) - ((v - min) / range) * (height - padT - padB)
    return [x, y]
  })
  const trendUp = data[data.length - 1] >= data[0]
  const color = trendUp ? '#22c55e' : '#ff5c5c'
  const linePoints = pts.map(p => p.join(',')).join(' ')
  const yTicks = [min, min + range / 2, max]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 180 }}>
      {yTicks.map((v, i) => {
        const y = padT + (height - padT - padB) - ((v - min) / range) * (height - padT - padB)
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#26262f" strokeWidth="1" strokeDasharray="3,3" />
            <text x={4} y={y + 4} fontSize="10" fill="#8a8a99">${v.toFixed(8)}</text>
          </g>
        )
      })}
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={color} />
      ))}
    </svg>
  )
}

function SocialLinks() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <a href={SOCIAL_X} target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>𝕏 Twitter</a>
      <a href={SOCIAL_TELEGRAM} target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>✈️ Telegram</a>
    </div>
  )
}
export default function App() {
  const [lang, setLang] = useState('en')
  const t = T[lang]
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [tokens, setTokens] = useState([])
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [amounts, setAmounts] = useState({})
  const [slippage, setSlippage] = useState({})
  const [busyToken, setBusyToken] = useState(null)
  const [busyMode, setBusyMode] = useState(null)
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const eth = window.okxwallet || window.ethereum
    if (eth) {
      eth.request({ method: 'eth_chainId' }).then(chainId => {
        if (chainId === ARC_CHAIN_ID_HEX) {
          setProvider(new ethers.BrowserProvider(eth))
        }
      }).catch(() => {})
    }
  }, [])

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  async function connectWallet() {
    const eth = window.okxwallet || window.ethereum
    if (!eth) {
      if (isMobileDevice()) {
        const dappUrl = window.location.href.replace(/^https?:\/\//, '')
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`
        return
      }
      setStatus(t.noWalletMobile)
      window.alert(t.noWalletMobile)
      return
    }
    await ensureArcNetwork(eth)
    try {
      const accs = await eth.request({ method: 'eth_requestAccounts' })
      const browserProvider = new ethers.BrowserProvider(eth)
      setProvider(browserProvider)
      setAccount(accs[0])
      loadTokensWithProvider(browserProvider, accs[0])
    } catch (e) {
      setStatus(e.reason || e.message)
      window.alert(e.reason || e.message)
    }
  }

  async function loadTokensWithProvider(prov, currentAccount) {
    if (!prov) return
    try {
      const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, prov)
      const len = await c.allTokensLength()
      const list = []
      for (let i = 0; i < Number(len); i++) {
        const addr = await c.allTokens(i)
        const info = await c.tokens(addr)
        const reserveUSDC = Number(ethers.formatUnits(info.reserveUSDC, 6))
        const reserveToken = Number(ethers.formatUnits(info.reserveToken, 18))
        const price = reserveToken > 0 ? reserveUSDC / reserveToken : 0
        const progressPct = Math.min(100, (reserveUSDC / GRADUATE_THRESHOLD) * 100)
        const circulating = TOTAL_SUPPLY - reserveToken
        const marketCap = circulating * price

        let name = '', symbol = ''
        try {
          const tokenC = new ethers.Contract(addr, ERC20_ABI, prov)
          name = await tokenC.name()
          symbol = await tokenC.symbol()
        } catch (e) { /* ignore */ }

        let recentTrades = []
        let priceHistory = []
        let holders = new Set()
        let volume = 0
        try {
          const filter = c.filters.Trade(addr)
          const logs = await queryTradeLogsChunked(c, filter, prov)
          priceHistory = logs.map(log => {
            const usdc = Number(ethers.formatUnits(log.args.usdcAmount, 6))
            const tok = Number(ethers.formatUnits(log.args.tokenAmount, 18))
            volume += usdc
            return tok > 0 ? usdc / tok : null
          }).filter(v => v !== null)
          recentTrades = logs.slice(-3).reverse().map(log => ({
            trader: log.args.trader,
            isBuy: log.args.isBuy,
            usdcAmount: Number(ethers.formatUnits(log.args.usdcAmount, 6)),
          })))
          logs.forEach(l => holders.add(l.args.trader))
        } catch (e) { /* ignore */ }

        let myBalance = 0
        if (currentAccount) {
          try {
            const tokenC = new ethers.Contract(addr, ERC20_ABI, prov)
            const bal = await tokenC.balanceOf(currentAccount)
            myBalance = Number(ethers.formatUnits(bal, 18))
          } catch (e) { /* ignore */ }
        }

        list.push({
          address: addr, creator: info.creator, name, symbol,
          reserveUSDC, reserveToken, graduated: info.graduated, price, progressPct,
          marketCap, volume, creatorEarned: Number(ethers.formatUnits(info.creatorEarned, 6)),
          recentTrades, priceHistory, holderCount: holders.size, myBalance
        })
      }
      list.sort((a, b) => {
        if (a.graduated !== b.graduated) return a.graduated ? 1 : -1
        return b.progressPct - a.progressPct
      })
      setTokens(list)
    } catch (e) { setStatus(e.message) }
  }

  useEffect(() => { if (provider) loadTokensWithProvider(provider, account) }, [provider])

  async function handleCreate() {
    if (!account || !provider) {
      setStatus(t.needWallet)
      window.alert(t.needWallet)
      return
    }
    if (!tokenName || !tokenSymbol) return
    try {
      const signer = await provider.getSigner()
      const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
      const tx = await c.createToken(tokenName, tokenSymbol)
      await tx.wait()
      setTokenName(''); setTokenSymbol(''); setShowForm(false)
      loadTokensWithProvider(provider, account)
    } catch (e) {
      setStatus(e.reason || e.message)
      window.alert(e.reason || e.message)
    }
  }

  async function handleTrade(tk, mode) {
    if (!account || !provider) {
      setStatus(t.needWallet)
      window.alert(t.needWallet)
      return
    }
    const tokenAddr = tk.address
    const amt = amounts[tokenAddr]
    if (mode !== 'claim' && (!amt || Number(amt) <= 0)) {
      setStatus(t.enterAmount)
      window.alert(t.enterAmount)
      return
    }
    const slippagePct = slippage[tokenAddr] ?? 1
    setBusyToken(tokenAddr); setBusyMode(mode)
    try {
      const signer = await provider.getSigner()
      if (mode === 'buy') {
        const usdcIn = ethers.parseUnits(String(amt), 6)
        const estOut = estimateBuyOut(tk, Number(amt))
        const minTokensOut = estOut * (1 - slippagePct / 100)
        const minTokensOutWei = ethers.parseUnits(minTokensOut.toFixed(18), 18)
        const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer)
        const allowance = await usdc.allowance(account, LAUNCHPAD_ADDRESS)
        if (allowance < usdcIn) { await (await usdc.approve(LAUNCHPAD_ADDRESS, usdcIn)).wait() }
        const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
        await (await c.buy(tokenAddr, usdcIn, minTokensOutWei)).wait()
      } else if (mode === 'sell') {
        const tokensIn = ethers.parseUnits(String(amt), 18)
        const estOut = estimateSellOut(tk, Number(amt))
        const minUsdcOut = estOut * (1 - slippagePct / 100)
        const minUsdcOutWei = ethers.parseUnits(minUsdcOut.toFixed(6), 6)
        const tok = new ethers.Contract(tokenAddr, ERC20_ABI, signer)
        const allowance = await tok.allowance(account, LAUNCHPAD_ADDRESS)
        if (allowance < tokensIn) { await (await tok.approve(LAUNCHPAD_ADDRESS, tokensIn)).wait() }
        const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
        await (await c.sell(tokenAddr, tokensIn, minUsdcOutWei)).wait()
      } else if (mode === 'claim') {
        const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer)
        await (await c.claimCreatorRewards(tokenAddr)).wait()
        setStatus(t.claimed)
      }
      setAmounts({ ...amounts, [tokenAddr]: '' })
      loadTokensWithProvider(provider, account)
    } catch (e) {
      const msg = e.reason || e.message || 'Transaction failed'
      setStatus(msg)
      window.alert(msg)
    }
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
  const totalVolume = tokens.reduce((s, tk) => s + tk.volume, 0)
  const totalMcap = tokens.reduce((s, tk) => s + tk.marketCap, 0)

  const filteredTokens = tokens.filter(tk => {
    const q = search.toLowerCase()
    if (q && !tk.address.toLowerCase().includes(q) && !tk.name.toLowerCase().includes(q) && !tk.symbol.toLowerCase().includes(q)) return false
    if (tab === 'hot') return tk.progressPct > 60 && !tk.graduated
    if (tab === 'mine') return account && (tk.creator.toLowerCase() === account.toLowerCase() || tk.myBalance > 0)
    return true
  })

  const previewSeed = (tokenName || tokenSymbol) ? (tokenName + tokenSymbol) : null
 const previewSeed = (tokenName || tokenSymbol) ? (tokenName + tokenSymbol) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0d0d12ee', backdropFilter: 'blur(6px)',
        borderBottom: '1px solid #26262f', padding: '10px 16px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <div style={{ background: 'radial-gradient(ellipse at top, #1a1508 0%, #0d0d12 60%)', borderBottom: '1px solid #26262f', padding: '40px 16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, background: 'linear-gradient(90deg,#fff,#ffb020)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.title} 🚀
          </h1>
          <p style={{ color: '#8a8a99', margin: '8px 0 20px', fontSize: 15 }}>{t.subtitle}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{tokens.length}</div>
              <div style={{ fontSize: 11, color: '#8a8a99' }}>{t.totalCoins}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatUSD(totalVolume)}</div>
              <div style={{ fontSize: 11, color: '#8a8a99' }}>{t.totalVolume}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatUSD(totalMcap)}</div>
              <div style={{ fontSize: 11, color: '#8a8a99' }}>{t.totalMcap}</div>
            </div>
          </div>

          <button onClick={() => setShowForm(!showForm)} style={{ ...pillBtn, background: '#ffb020', color: '#0d0d12' }}>{t.create}</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px', flex: 1, width: '100%' }}>
        {status && <p style={{ color: '#ff5c5c', fontSize: 13, fontWeight: 600 }}>⚠️ {status}</p>}

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{t.formTitle}</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                {previewSeed ? <Avatar address={previewSeed} size={56} /> : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#26262f', border: '1px dashed #3a3a4a' }} />
                )}
                <div style={{ fontSize: 10, color: '#6b6b7a', marginTop: 4 }}>{t.previewLabel}</div>
              </div>
              <div style={{ flex: 1 }}>
                <input placeholder={t.namePh} value={tokenName} onChange={e => setTokenName(e.target.value)} style={inputStyle} />
                <input placeholder={t.symbolPh} value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleCreate} style={{ ...pillBtn, background: '#22c55e', color: '#0d0d12', width: '100%' }}>{t.submit}</button>
          </div>
        )}

        {kingOfHill && (
          <div className="card hot" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1a1508, #16161d)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffb020', marginBottom: 8 }}>{t.koth}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Avatar address={kingOfHill.address} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{kingOfHill.name || kingOfHill.address.slice(0,8)} {kingOfHill.symbol && `(${kingOfHill.symbol})`}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>${kingOfHill.price.toFixed(8)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ffb020' }}>{kingOfHill.progressPct.toFixed(0)}%</div>
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
            const amtVal = amounts[tk.address] || ''
            const slippagePct = slippage[tk.address] ?? 1
            const isExpanded = expanded === tk.address
            const isCreator = account && tk.creator.toLowerCase() === account.toLowerCase()

            return (
              <div key={tk.address} className={`card ${isHot ? 'hot' : ''}`}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <Avatar address={tk.address} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tk.name || 'Token'} {tk.symbol && <span style={{ color: '#8a8a99' }}>({tk.symbol})</span>}
                    </div>
                    <button onClick={() => handleCopyAddr(tk.address)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11, color: '#6b6b7a', padding: 0 }}>
                      {copiedAddr === 'addr-' + tk.address ? `✅ ${t.copied}` : `${tk.address.slice(0,6)}...${tk.address.slice(-4)} 📋`}
                    </button>
                  </div>
                  {tk.graduated ? <span className="badge badge-graduated">{t.graduated}</span> :
                    isHot ? <span className="badge badge-hot">{t.hot}</span> : null}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>${tk.price.toFixed(8)}</div>
                    <div style={{ fontSize: 11, color: '#8a8a99' }}>{t.marketCap}: {formatUSD(tk.marketCap)}</div>
                  </div>
                  <div style={{ width: 100 }}><MiniChart data={tk.priceHistory} /></div>
                </div>

                <div style={{ fontSize: 12, color: '#8a8a99', marginBottom: 2 }}>{t.creator}: {tk.creator.slice(0,6)}...{tk.creator.slice(-4)}</div>
                <div style={{ fontSize: 12, color: '#6b6b7a', marginBottom: 10 }}>👥 {tk.holderCount} {t.holders}</div>

                {!tk.graduated && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8a8a99', marginBottom: 4 }}>
                      <span>{t.progress}</span><span>{tk.progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${tk.progressPct}%` }} /></div>

                    <input
                      placeholder={t.buyPh + ' / ' + t.sellPh}
                      value={amtVal}
                      onChange={e => setAmounts({ ...amounts, [tk.address]: e.target.value })}
                      style={{ ...inputStyle, marginTop: 12, marginBottom: 6 }}
                    />

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#8a8a99' }}>{t.slippage}:</span>
                      {SLIPPAGE_OPTIONS.map(p => (
                        <button
                          key={p}
                          onClick={() => setSlippage({ ...slippage, [tk.address]: p })}
                          style={{
                            ...pillBtn, padding: '3px 10px', fontSize: 11,
                            background: slippagePct === p ? '#22c55e' : '#0d0d12',
                            color: slippagePct === p ? '#0d0d12' : '#8a8a99',
                            border: slippagePct === p ? 'none' : '1px solid #26262f'
                          }}
                        >{p}%</button>
                      ))}
                    </div>

                    {amtVal && Number(amtVal) > 0 && (
                      <div style={{ fontSize: 11, color: '#6b6b7a', marginBottom: 8 }}>
                        {t.minReceive}: {(estimateBuyOut(tk, Number(amtVal)) * (1 - slippagePct / 100)).toFixed(4)} token
                        {' / '}
                        {(estimateSellOut(tk, Number(amtVal)) * (1 - slippagePct / 100)).toFixed(4)} USDC
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleTrade(tk, 'buy')} disabled={busyToken === tk.address}
                        style={{ ...pillBtn, background: '#22c55e', color: '#0d0d12', flex: 1 }}>
                        {busyToken === tk.address && busyMode === 'buy' ? '...' : t.buy}
                      </button>
                      <button onClick={() => handleTrade(tk, 'sell')} disabled={busyToken === tk.address}
                        style={{ ...pillBtn, background: '#ff5c5c', color: '#0d0d12', flex: 1 }}>
                        {busyToken === tk.address && busyMode === 'sell' ? '...' : t.sell}
                      </button>
                    </div>
                  </>
                )}

                {isCreator && tk.creatorEarned > 0 && (
                  <div style={{ marginTop: 10, padding: 8, background: '#0d0d12', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12 }}>{t.earned}: <b>${tk.creatorEarned.toFixed(2)}</b></span>
                    <button onClick={() => handleTrade(tk, 'claim')} disabled={busyToken === tk.address}
                      style={{ ...pillBtn, background: '#ffb020', color: '#0d0d12', padding: '6px 12px', fontSize: 12 }}>
                      {busyToken === tk.address && busyMode === 'claim' ? '...' : t.claim}
                    </button>
                  </div>
                )}

                <button onClick={() => setExpanded(isExpanded ? null : tk.address)} style={shareBtn}>
                  {isExpanded ? '▲' : '▼'} {t.details}
                </button>
                {isExpanded && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8a8a99', marginBottom: 6 }}>{t.priceChart}</div>
                    <PriceChart data={tk.priceHistory} t={t} />
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      {tk.recentTrades.length === 0 && <p style={{ color: '#6b6b7a' }}>{t.noActivity}</p>}
                      {tk.recentTrades.map((tr, i) => (
                        <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #26262f', color: tr.isBuy ? '#22c55e' : '#ff5c5c' }}>
                          {tr.trader.slice(0,6)}...{tr.trader.slice(-4)} {tr.isBuy ? t.bought : t.sold} ${tr.usdcAmount.toFixed(2)}
                        </div>
                      ))}
                    </div>
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

      <footer style={{ borderTop: '1px solid #26262f', padding: '24px 16px', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800 }}>{t.title} 🚀</div>
            <div style={{ fontSize: 12, color: '#8a8a99' }}>{t.footerTag}</div>
          </div>
          <SocialLinks />
          <div style={{ fontSize: 11, color: '#6b6b7a', maxWidth: 320 }}>{t.footerNote}</div>
        </div>
      </footer>
    </div>
  )
}

const pillBtn = { padding: '10px 18px', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 14 }
const inputStyle = { display: 'block', width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, fontSize: 13 }
const shareBtn = { width: '100%', marginTop: 8, padding: '8px 0', background: 'transparent', border: '1px solid #26262f', color: '#8a8a99', borderRadius: 8, cursor: 'pointer', fontSize: 12 }
const socialLinkStyle = { color: '#f2f2f5', t
