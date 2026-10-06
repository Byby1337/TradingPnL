export type LanguageCode = 'en' | 'ru' | 'zh' | 'es' | 'fr' | 'de' | 'ja';

export interface Translations {
  // Navigation
  perpetual: string;
  options: string;
  pools: string;
  hourlyPool: string;
  portfolio: string;
  more: string;
  privacyPolicy: string;
  helpCenter: string;
  connectWallet: string;
  connected: string;
  copy: string;
  copied: string;
  disconnect: string;
  walletBalance: string;
  tradingBalance: string;
  deposit: string;
  withdraw: string;

  // Market Ribbon
  indexPrice: string;
  change24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  allPairs: string;
  crypto: string;
  stocks: string;

  // Order Ticket
  placeOrder: string;
  buyLong: string;
  sellShort: string;
  orderMargin: string;
  available: string;
  availableMargin: string;
  leverage: string;
  settlementRouting: string;
  hourlyPoolRouting: string;
  platformReserve: string;
  traderPayout: string;
  positionSize: string;
  estLiqPrice: string;
  takerFee: string;
  insufficientMargin: string;
  enterMarginGreaterThanZero: string;

  // Positions Table
  positions: string;
  openOrders: string;
  tradeHistory: string;
  symbol: string;
  side: string;
  size: string;
  entryPrice: string;
  markPrice: string;
  liqPrice: string;
  margin: string;
  pnl: string;
  action: string;
  close: string;
  noOpenPositions: string;
  connectWalletToView: string;

  // Order Book
  book: string;
  trades: string;
  price: string;
  total: string;
  spread: string;
  sizeSettings: string;
  compact: string;
  normal: string;
  wide: string;

  // Hourly Pool
  hourlyPoolTitle: string;
  hourlyPoolDesc: string;
  nextSettlementIn: string;
  tradeToParticipate: string;
  totalPrizePot: string;
  participatingWallets: string;
  topWinnerShare: string;
  yourActiveRouting: string;
  rank: string;
  walletAddress: string;
  tradingPair: string;
  routeVolume: string;
  poolShare: string;
  pnlContribution: string;
  estPayout: string;
  status: string;
  active: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    perpetual: 'Perpetual',
    options: 'US 0DTE Options',
    pools: 'Pools & Vaults',
    hourlyPool: 'Hourly Pool',
    portfolio: 'Portfolio',
    more: 'More',
    privacyPolicy: 'Privacy Policy',
    helpCenter: 'Help Center',
    connectWallet: 'Connect Wallet',
    connected: 'Connected',
    copy: 'Copy',
    copied: 'Copied!',
    disconnect: 'Disconnect Wallet',
    walletBalance: 'Wallet Balance',
    tradingBalance: 'Trading Balance',
    deposit: 'Deposit',
    withdraw: 'Withdraw',

    indexPrice: 'Index Price',
    change24h: '24h Change',
    high24h: '24h High',
    low24h: '24h Low',
    volume24h: '24h Volume',
    allPairs: 'All Pairs',
    crypto: 'Crypto',
    stocks: 'Equities',

    placeOrder: 'Place Order',
    buyLong: 'Buy / Long',
    sellShort: 'Sell / Short',
    orderMargin: 'Order Margin',
    available: 'Available',
    availableMargin: 'Available Margin',
    leverage: 'Leverage',
    settlementRouting: 'Settlement PnL Routing',
    hourlyPoolRouting: 'Hourly Pool (Min 10%)',
    platformReserve: 'Platform Reserve (Min 5%)',
    traderPayout: 'Net Trader Payout (Balance)',
    positionSize: 'Position Size',
    estLiqPrice: 'Est. Liq Price',
    takerFee: 'Taker Fee',
    insufficientMargin: 'Insufficient Trading Margin',
    enterMarginGreaterThanZero: 'Please enter a margin amount greater than 0.',

    positions: 'Positions',
    openOrders: 'Open Orders',
    tradeHistory: 'Trade History',
    symbol: 'Symbol',
    side: 'Side',
    size: 'Size',
    entryPrice: 'Entry Price',
    markPrice: 'Mark Price',
    liqPrice: 'Liq Price',
    margin: 'Margin',
    pnl: 'PnL (ROE)',
    action: 'Action',
    close: 'Close',
    noOpenPositions: 'No open positions. Use the order ticket on the right to place a trade.',
    connectWalletToView: 'Please connect your Web3 wallet to view open positions.',

    book: 'Book',
    trades: 'Trades',
    price: 'Price',
    total: 'Total',
    spread: 'Spread',
    sizeSettings: 'Size',
    compact: 'Compact',
    normal: 'Normal',
    wide: 'Wide',

    hourlyPoolTitle: 'Hourly Settlement Pool',
    hourlyPoolDesc: 'Every hour, 10% of settlement PnL from perpetual trades across all pairs routes into this high-frequency pool.',
    nextSettlementIn: 'Next Settlement In',
    tradeToParticipate: 'Trade to Participate',
    totalPrizePot: 'Total Hourly Prize Pot',
    participatingWallets: 'Participating Wallets',
    topWinnerShare: 'Top Winner Est. Share',
    yourActiveRouting: 'Your Active Routing',
    rank: 'Rank',
    walletAddress: 'Wallet Address',
    tradingPair: 'Trading Pair',
    routeVolume: 'Route Volume',
    poolShare: 'Pool Share',
    pnlContribution: 'PnL Contribution',
    estPayout: 'Est. Payout',
    status: 'Status',
    active: 'Active'
  },

  ru: {
    perpetual: 'Бессрочные',
    options: '0DTE Опционы',
    pools: 'Пулы и хранилища',
    hourlyPool: 'Часовой пул',
    portfolio: 'Портфель',
    more: 'Ещё',
    privacyPolicy: 'Политика приватности',
    helpCenter: 'База знаний',
    connectWallet: 'Подключить кошелёк',
    connected: 'Подключено',
    copy: 'Копировать',
    copied: 'Скопировано!',
    disconnect: 'Отключить кошелёк',
    walletBalance: 'Баланс кошелька',
    tradingBalance: 'Торговый баланс',
    deposit: 'Пополнить',
    withdraw: 'Вывести',

    indexPrice: 'Цена индекса',
    change24h: '24ч изм.',
    high24h: '24ч макс.',
    low24h: '24ч мин.',
    volume24h: '24ч объём',
    allPairs: 'Все пары',
    crypto: 'Криптовалюты',
    stocks: 'Акции и ETF',

    placeOrder: 'Разместить ордер',
    buyLong: 'Купить / Лонг',
    sellShort: 'Продать / Шорт',
    orderMargin: 'Маржа ордера',
    available: 'Доступно',
    availableMargin: 'Доступная маржа',
    leverage: 'Плечо',
    settlementRouting: 'Маршрутизация PnL',
    hourlyPoolRouting: 'Часовой пул (Мин 10%)',
    platformReserve: 'Резерв платформы (Мин 5%)',
    traderPayout: 'Чистая выплата трейдеру',
    positionSize: 'Размер позиции',
    estLiqPrice: 'Цена ликвидации',
    takerFee: 'Комиссия тейкера',
    insufficientMargin: 'Недостаточно маржи',
    enterMarginGreaterThanZero: 'Пожалуйста, введите сумму маржи больше 0.',

    positions: 'Позиции',
    openOrders: 'Открытые ордера',
    tradeHistory: 'История сделок',
    symbol: 'Пара',
    side: 'Сторона',
    size: 'Размер',
    entryPrice: 'Цена входа',
    markPrice: 'Маркировка',
    liqPrice: 'Ликвидация',
    margin: 'Маржа',
    pnl: 'PnL (ROE)',
    action: 'Действие',
    close: 'Закрыть',
    noOpenPositions: 'Нет открытых позиций. Используйте панель ордера справа для торговли.',
    connectWalletToView: 'Подключите Web3 кошелёк для просмотра позиций.',

    book: 'Книга ордеров',
    trades: 'Сделки',
    price: 'Цена',
    total: 'Всего',
    spread: 'Спред',
    sizeSettings: 'Размер',
    compact: 'Компактный',
    normal: 'Стандартный',
    wide: 'Широкий',

    hourlyPoolTitle: 'Часовой пул расчётов',
    hourlyPoolDesc: 'Каждый час 10% от расчётного PnL сделок со всех пар направляется в этот пул для распределения между участниками.',
    nextSettlementIn: 'До расчёта осталось',
    tradeToParticipate: 'Торговать для участия',
    totalPrizePot: 'Общий призовой пул',
    participatingWallets: 'Кошельков в эпохе',
    topWinnerShare: 'Доля лидера',
    yourActiveRouting: 'Ваша доля участия',
    rank: 'Ранг',
    walletAddress: 'Адрес кошелька',
    tradingPair: 'Торговая пара',
    routeVolume: 'Объём маршрута',
    poolShare: 'Доля пула',
    pnlContribution: 'Вклад PnL',
    estPayout: 'Расч. выплата',
    status: 'Статус',
    active: 'Активно'
  },

  zh: {
    perpetual: '永续合约',
    options: '0DTE期权',
    pools: '流动性池',
    hourlyPool: '每小时奖池',
    portfolio: '投资组合',
    more: '更多',
    privacyPolicy: '隐私政策',
    helpCenter: '帮助中心',
    connectWallet: '连接钱包',
    connected: '已连接',
    copy: '复制',
    copied: '已复制!',
    disconnect: '断开连接',
    walletBalance: '钱包余额',
    tradingBalance: '交易余额',
    deposit: '充值',
    withdraw: '提现',

    indexPrice: '指数价格',
    change24h: '24小时涨跌',
    high24h: '24小时最高',
    low24h: '24小时最低',
    volume24h: '24小时成交量',
    allPairs: '全部交易对',
    crypto: '加密货币',
    stocks: '美股',

    placeOrder: '下单',
    buyLong: '买入 / 做多',
    sellShort: '卖出 / 做空',
    orderMargin: '保证金',
    available: '可用',
    availableMargin: '可用保证金',
    leverage: '杠杆倍数',
    settlementRouting: '结算收益分配',
    hourlyPoolRouting: '每小时池 (最低10%)',
    platformReserve: '平台储备 (最低5%)',
    traderPayout: '交易者净收益',
    positionSize: '仓位大小',
    estLiqPrice: '预估强平价',
    takerFee: '吃单手续费',
    insufficientMargin: '保证金不足',
    enterMarginGreaterThanZero: '请输入大于0的保证金金额',

    positions: '持有仓位',
    openOrders: '当前委托',
    tradeHistory: '历史成交',
    symbol: '交易对',
    side: '方向',
    size: '数量',
    entryPrice: '开仓价',
    markPrice: '标记价',
    liqPrice: '强平价',
    margin: '保证金',
    pnl: '未实现盈亏',
    action: '操作',
    close: '平仓',
    noOpenPositions: '暂无持仓',
    connectWalletToView: '请连接钱包查看仓位',

    book: '委托列表',
    trades: '最新成交',
    price: '价格',
    total: '累计',
    spread: '价差',
    sizeSettings: '尺寸',
    compact: '紧凑',
    normal: '默认',
    wide: '加宽',

    hourlyPoolTitle: '每小时结算资金池',
    hourlyPoolDesc: '每小时将所有交易对合约结算PnL的10%自动路由至此奖池，按比例分配。',
    nextSettlementIn: '距离下次结算',
    tradeToParticipate: '去交易参与',
    totalPrizePot: '奖池总额',
    participatingWallets: '参与钱包',
    topWinnerShare: '头奖预估',
    yourActiveRouting: '您的参与额',
    rank: '排名',
    walletAddress: '钱包地址',
    tradingPair: '交易对',
    routeVolume: '路由交易量',
    poolShare: '资金池份额',
    pnlContribution: '贡献PnL',
    estPayout: '预估收益',
    status: '状态',
    active: '活跃中'
  },

  es: {
    perpetual: 'Perpetuos',
    options: 'Opciones 0DTE',
    pools: 'Piscinas y Bóvedas',
    hourlyPool: 'Piscina Horaria',
    portfolio: 'Portafolio',
    more: 'Más',
    privacyPolicy: 'Política de Privacidad',
    helpCenter: 'Centro de Ayuda',
    connectWallet: 'Conectar Billetera',
    connected: 'Conectado',
    copy: 'Copiar',
    copied: '¡Copiado!',
    disconnect: 'Desconectar',
    walletBalance: 'Saldo Billetera',
    tradingBalance: 'Saldo de Trading',
    deposit: 'Depositar',
    withdraw: 'Retirar',

    indexPrice: 'Precio Índice',
    change24h: 'Cambio 24h',
    high24h: 'Máx 24h',
    low24h: 'Mín 24h',
    volume24h: 'Volumen 24h',
    allPairs: 'Todos los Pares',
    crypto: 'Cripto',
    stocks: 'Acciones',

    placeOrder: 'Crear Orden',
    buyLong: 'Comprar / Long',
    sellShort: 'Vender / Short',
    orderMargin: 'Margen de Orden',
    available: 'Disponible',
    availableMargin: 'Margen Disponible',
    leverage: 'Apalancamiento',
    settlementRouting: 'Enrutamiento PnL',
    hourlyPoolRouting: 'Piscina Horaria (Min 10%)',
    platformReserve: 'Reserva Plataforma (Min 5%)',
    traderPayout: 'Pago Neto al Trader',
    positionSize: 'Tamaño Posición',
    estLiqPrice: 'Precio Liq. Estimado',
    takerFee: 'Comisión Taker',
    insufficientMargin: 'Margen Insuficiente',
    enterMarginGreaterThanZero: 'Ingrese un margen mayor a 0.',

    positions: 'Posiciones',
    openOrders: 'Órdenes Abiertas',
    tradeHistory: 'Historial',
    symbol: 'Par',
    side: 'Lado',
    size: 'Tamaño',
    entryPrice: 'Precio Entrada',
    markPrice: 'Precio Marca',
    liqPrice: 'Precio Liq.',
    margin: 'Margen',
    pnl: 'PnL (ROE)',
    action: 'Acción',
    close: 'Cerrar',
    noOpenPositions: 'No hay posiciones abiertas.',
    connectWalletToView: 'Conecte su billetera para ver posiciones.',

    book: 'Libro',
    trades: 'Operaciones',
    price: 'Precio',
    total: 'Total',
    spread: 'Spread',
    sizeSettings: 'Tamaño',
    compact: 'Compacto',
    normal: 'Normal',
    wide: 'Ancho',

    hourlyPoolTitle: 'Piscina de Liquidación Horaria',
    hourlyPoolDesc: 'Cada hora, el 10% del PnL se transfiere a esta piscina para los participantes.',
    nextSettlementIn: 'Próxima Liquidación En',
    tradeToParticipate: 'Operar para Participar',
    totalPrizePot: 'Bote Total Horario',
    participatingWallets: 'Billeteras Participantes',
    topWinnerShare: 'Premio Mayor Estimado',
    yourActiveRouting: 'Su Aporte Activo',
    rank: 'Rango',
    walletAddress: 'Dirección Billetera',
    tradingPair: 'Par Comercial',
    routeVolume: 'Volumen Enrutado',
    poolShare: 'Participación',
    pnlContribution: 'Aporte PnL',
    estPayout: 'Pago Estimado',
    status: 'Estado',
    active: 'Activo'
  },

  fr: {
    perpetual: 'Perpétuel',
    options: 'Options 0DTE',
    pools: 'Pools & Coffres',
    hourlyPool: 'Pool Horaire',
    portfolio: 'Portefeuille',
    more: 'Plus',
    privacyPolicy: 'Politique de Confidentialité',
    helpCenter: "Centre d'Aide",
    connectWallet: 'Connecter Portefeuille',
    connected: 'Connecté',
    copy: 'Copier',
    copied: 'Copié!',
    disconnect: 'Déconnecter',
    walletBalance: 'Solde Portefeuille',
    tradingBalance: 'Solde de Trading',
    deposit: 'Déposer',
    withdraw: 'Retirer',

    indexPrice: 'Prix Indice',
    change24h: 'Var. 24h',
    high24h: 'Haut 24h',
    low24h: 'Bas 24h',
    volume24h: 'Volume 24h',
    allPairs: 'Toutes Paires',
    crypto: 'Crypto',
    stocks: 'Actions',

    placeOrder: 'Passer Ordre',
    buyLong: 'Acheter / Long',
    sellShort: 'Vendre / Short',
    orderMargin: 'Marge Ordre',
    available: 'Disponible',
    availableMargin: 'Marge Disponible',
    leverage: 'Levier',
    settlementRouting: 'Routage PnL',
    hourlyPoolRouting: 'Pool Horaire (Min 10%)',
    platformReserve: 'Réserve Plateforme (Min 5%)',
    traderPayout: 'Paiement Net Trader',
    positionSize: 'Taille Position',
    estLiqPrice: 'Prix Liq. Estimé',
    takerFee: 'Frais Taker',
    insufficientMargin: 'Marge Insuffisante',
    enterMarginGreaterThanZero: 'Veuillez entrer une marge supérieure à 0.',

    positions: 'Positions',
    openOrders: 'Ordres Ouverts',
    tradeHistory: 'Historique',
    symbol: 'Paire',
    side: 'Côté',
    size: 'Taille',
    entryPrice: 'Prix Entrée',
    markPrice: 'Prix Repère',
    liqPrice: 'Prix Liq.',
    margin: 'Marge',
    pnl: 'PnL (ROE)',
    action: 'Action',
    close: 'Fermer',
    noOpenPositions: 'Aucune position ouverte.',
    connectWalletToView: 'Veuillez connecter votre portefeuille.',

    book: "Carnet d'Ordres",
    trades: 'Transactions',
    price: 'Prix',
    total: 'Total',
    spread: 'Spread',
    sizeSettings: 'Taille',
    compact: 'Compact',
    normal: 'Normal',
    wide: 'Large',

    hourlyPoolTitle: 'Pool de Règlement Horaire',
    hourlyPoolDesc: 'Chaque heure, 10% du PnL est reversé dans ce pool pour distribution.',
    nextSettlementIn: 'Prochain Règlement Dans',
    tradeToParticipate: 'Trader pour Participer',
    totalPrizePot: 'Cagnotte Horaire Totale',
    participatingWallets: 'Portefeuilles Actifs',
    topWinnerShare: 'Part Leader Estimée',
    yourActiveRouting: 'Votre Participation',
    rank: 'Rang',
    walletAddress: 'Adresse Portefeuille',
    tradingPair: 'Paire de Trading',
    routeVolume: 'Volume Routé',
    poolShare: 'Part du Pool',
    pnlContribution: 'Contribution PnL',
    estPayout: 'Paiement Estimé',
    status: 'Statut',
    active: 'Actif'
  },

  de: {
    perpetual: 'Perpetual',
    options: '0DTE Optionen',
    pools: 'Pools & Tresore',
    hourlyPool: 'Stundenpool',
    portfolio: 'Portfolio',
    more: 'Mehr',
    privacyPolicy: 'Datenschutz',
    helpCenter: 'Hilfebereich',
    connectWallet: 'Wallet Verbinden',
    connected: 'Verbunden',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    disconnect: 'Trennen',
    walletBalance: 'Wallet-Guthaben',
    tradingBalance: 'Handelsguthaben',
    deposit: 'Einzahlen',
    withdraw: 'Auszahlen',

    indexPrice: 'Indexpreis',
    change24h: '24h Änd.',
    high24h: '24h Hoch',
    low24h: '24h Tief',
    volume24h: '24h Volumen',
    allPairs: 'Alle Paare',
    crypto: 'Krypto',
    stocks: 'Aktien',

    placeOrder: 'Order Aufgeben',
    buyLong: 'Kaufen / Long',
    sellShort: 'Verkaufen / Short',
    orderMargin: 'Order-Margin',
    available: 'Verfügbar',
    availableMargin: 'Verfügbare Margin',
    leverage: 'Hebel',
    settlementRouting: 'PnL-Verteilung',
    hourlyPoolRouting: 'Stundenpool (Min 10%)',
    platformReserve: 'Plattform-Reserve (Min 5%)',
    traderPayout: 'Netto-Auszahlung',
    positionSize: 'Positionsgröße',
    estLiqPrice: 'Geschätzter Liq.-Preis',
    takerFee: 'Taker-Gebühr',
    insufficientMargin: 'Unzureichende Margin',
    enterMarginGreaterThanZero: 'Bitte Margin größer als 0 eingeben.',

    positions: 'Positionen',
    openOrders: 'Offene Orders',
    tradeHistory: 'Handelsverlauf',
    symbol: 'Paar',
    side: 'Seite',
    size: 'Größe',
    entryPrice: 'Einstiegspreis',
    markPrice: 'Markpreis',
    liqPrice: 'Liq.-Preis',
    margin: 'Margin',
    pnl: 'PnL (ROE)',
    action: 'Aktion',
    close: 'Schließen',
    noOpenPositions: 'Keine offenen Positionen.',
    connectWalletToView: 'Bitte Wallet verbinden.',

    book: 'Orderbuch',
    trades: 'Trades',
    price: 'Preis',
    total: 'Gesamt',
    spread: 'Spread',
    sizeSettings: 'Größe',
    compact: 'Kompakt',
    normal: 'Normal',
    wide: 'Breit',

    hourlyPoolTitle: 'Stündlicher Abrechnungspool',
    hourlyPoolDesc: 'Jede Stunde werden 10% des Abrechnungs-PnLs in diesen Pool geleitet.',
    nextSettlementIn: 'Nächste Abrechnung In',
    tradeToParticipate: 'Handeln zum Teilnehmen',
    totalPrizePot: 'Gesamter Stunden-Preispool',
    participatingWallets: 'Teilnehmende Wallets',
    topWinnerShare: 'Geschätzter Gewinneranteil',
    yourActiveRouting: 'Ihre Beteiligung',
    rank: 'Rang',
    walletAddress: 'Wallet-Adresse',
    tradingPair: 'Handelspaar',
    routeVolume: 'Routen-Volumen',
    poolShare: 'Pool-Anteil',
    pnlContribution: 'PnL-Beitrag',
    estPayout: 'Geschätzte Auszahlung',
    status: 'Status',
    active: 'Aktiv'
  },

  ja: {
    perpetual: '無期限契約',
    options: '0DTE オプション',
    pools: 'プール＆保管庫',
    hourlyPool: '毎時プール',
    portfolio: 'ポートフォリオ',
    more: 'その他',
    privacyPolicy: 'プライバシーポリシー',
    helpCenter: 'ヘルプセンター',
    connectWallet: 'ウォレット接続',
    connected: '接続済み',
    copy: 'コピー',
    copied: 'コピー完了!',
    disconnect: '接続解除',
    walletBalance: 'ウォレット残高',
    tradingBalance: '取引残高',
    deposit: '入金',
    withdraw: '出金',

    indexPrice: 'インデックス価格',
    change24h: '24時間変動',
    high24h: '24時間高値',
    low24h: '24時間安値',
    volume24h: '24時間出来高',
    allPairs: '全ペア',
    crypto: '暗号資産',
    stocks: '米国株',

    placeOrder: '注文発注',
    buyLong: '買い / ロング',
    sellShort: '売り / ショート',
    orderMargin: '注文証拠金',
    available: '利用可能',
    availableMargin: '利用可能証拠金',
    leverage: 'レバレッジ',
    settlementRouting: 'PnL分配ルーティング',
    hourlyPoolRouting: '毎時プール (最低10%)',
    platformReserve: 'プラットフォーム準備金 (最低5%)',
    traderPayout: '純利益払い戻し',
    positionSize: 'ポジション規模',
    estLiqPrice: '推定清算価格',
    takerFee: 'テイカー手数料',
    insufficientMargin: '証拠金不足',
    enterMarginGreaterThanZero: '0より大きい証拠金を入力してください',

    positions: '保有ポジション',
    openOrders: '未約定注文',
    tradeHistory: '取引履歴',
    symbol: 'ペア',
    side: '売買',
    size: '数量',
    entryPrice: '参入価格',
    markPrice: 'マーク価格',
    liqPrice: '清算価格',
    margin: '証拠金',
    pnl: '損益 (ROE)',
    action: '操作',
    close: '決済',
    noOpenPositions: '保有中のポジションはありません。',
    connectWalletToView: 'ウォレットを接続してポジションを確認してください。',

    book: '板情報',
    trades: '歩み値',
    price: '価格',
    total: '合計',
    spread: 'スプレッド',
    sizeSettings: 'サイズ',
    compact: 'コンパクト',
    normal: '標準',
    wide: 'ワイド',

    hourlyPoolTitle: '毎時決済プール',
    hourlyPoolDesc: '毎時間、全ペアの決済PnLの10%がこのプールにルーティングされます。',
    nextSettlementIn: '次回決済まで',
    tradeToParticipate: '取引して参加する',
    totalPrizePot: '賞金総額',
    participatingWallets: '参加ウォレット数',
    topWinnerShare: 'トップ推定獲得額',
    yourActiveRouting: 'あなたの参加額',
    rank: '順位',
    walletAddress: 'ウォレットアドレス',
    tradingPair: '取引ペア',
    routeVolume: '取引量',
    poolShare: 'プールシェア',
    pnlContribution: '貢献PnL',
    estPayout: '推定配当',
    status: '状態',
    active: 'アクティブ'
  }
};
