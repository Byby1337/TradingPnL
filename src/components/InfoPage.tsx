import React, { useState } from 'react';
import { TRANSLATIONS, LanguageCode, Translations } from '../i18n/translations';

interface InfoPageProps {
  type: 'privacy' | 'help';
  onBack: () => void;
  currentLang?: string;
}

export const InfoPage: React.FC<InfoPageProps> = ({ type, onBack, currentLang = 'en' }) => {
  const [helpCategory, setHelpCategory] = useState<'all' | 'wallets' | 'perps' | 'options' | 'pools' | 'lottery' | 'points' | 'orders' | 'security'>('all');
  const t: Translations = TRANSLATIONS[(currentLang as LanguageCode) || 'en'] || TRANSLATIONS.en;
  const isRu = currentLang === 'ru';

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panel pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-subpanel hover:bg-panel border border-panel rounded-xl text-xs text-primary flex items-center gap-2 transition group shadow-sm font-sans"
            >
              <span className="text-amber-500 group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>{t.backToTrading}</span>
            </button>
            <h1 className="text-xl md:text-2xl font-black text-primary font-sans tracking-tight">
              {type === 'privacy'
                ? (isRu ? 'Политика конфиденциальности и условия' : 'Privacy Policy & Terms')
                : (isRu ? 'Справочный центр и документация' : 'Help Center & Documentation')}
            </h1>
          </div>

          {type === 'privacy' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[11px] font-mono self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>{isRu ? 'Последнее обновление: 2 октября 2026 г.' : 'Last Updated: October 2, 2026'}</span>
            </div>
          )}
        </div>

        {/* PRIVACY POLICY PAGE */}
        {type === 'privacy' && (
          <div className="space-y-6 text-xs font-sans text-muted leading-relaxed">
            <div className="p-4 rounded-2xl bg-subpanel border border-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  {isRu ? 'Юридическое заявление протокола' : 'Protocol Legal Statement'}
                </span>
                <span className="text-[10px] font-mono text-muted">
                  {isRu ? 'Версия 2.4.0 (Продакшн-релиз)' : 'Version 2.4.0 (Production Release)'}
                </span>
              </div>
              <p className="text-primary text-[13px] font-medium leading-normal">
                {isRu
                  ? '23Trade функционирует как институциональная некастодиальная децентрализованная биржа. Мы гарантируем полную конфиденциальность пользователей на уровне архитектуры: математическая псевдонимность и нулевой сбор персональных данных.'
                  : '23Trade operates as an institutional non-custodial decentralized exchange. We respect user privacy by design, enforcing mathematical pseudonymity with zero personal data collection.'}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">1</span>
                  <span>
                    {isRu
                      ? 'Некастодиальная архитектура и суверенность средств'
                      : 'Non-Custodial Architecture & Self-Sovereignty'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? '23Trade полностью некастодиален. Пользователи сохраняют исключительный контроль над своими криптографическими приватными ключами и активами в любое время. При подключении через Web3 (MetaMask, Rabby, Coinbase Wallet, WalletConnect) смарт-контракты получают исключительно изолированные разрешения на исполнение. Мы никогда не храним, не депонируем и не имеем доступа к секретным фразам или учетным данным кошельков пользователей.'
                    : '23Trade is fully non-custodial. Users maintain exclusive control over their cryptographic private keys and assets at all times. When you connect via Web3 (MetaMask, Rabby, Coinbase Wallet, WalletConnect), smart contracts only receive isolated execution authorizations. We never hold, escrow, custody, or possess access to user seed phrases or wallet credentials.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">2</span>
                  <span>
                    {isRu
                      ? 'Нулевая верификация личности (Без KYC) и псевдонимная торговля'
                      : 'Zero Identity Verification (No KYC) & Pseudonymous Trading'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? 'Мы не собираем имена, физические адреса, государственные идентификационные номера, контакты или адреса электронной почты. Все взаимодействия псевдонимны и верифицируются исключительно криптографическими подписями по стандартам EIP-712 и EIP-1193. В нашей инфраструктуре отсутствуют базы данных профилирования пользователей или слежения.'
                    : 'We do not collect names, residential addresses, government identification numbers, telephone contacts, or email addresses. All interactions are pseudonymous, verified exclusively through cryptographic signatures compliant with EIP-712 and EIP-1193 protocols. No centralized user profiling or behavioral tracking databases exist on our infrastructure.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">3</span>
                  <span>
                    {isRu
                      ? 'Неизменяемость реестра и прозрачность блокчейна'
                      : 'Public Ledger Immutability & On-Chain Transparency'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? 'Все исполненные сделки по бессрочным фьючерсам, расчеты опционов, распределение маржи и выплаты пулов фиксируются в публичных сетях блокчейна (Arbitrum, Base, Ethereum). Публичные адреса кошельков и хэши транзакций, записанные ончейн, полностью прозрачны и проверяемы через публичные блокчейн-эксплореры.'
                    : 'All executed perpetual fills, options settlements, margin allocations, and pool distributions are cryptographically committed to public blockchain networks (Arbitrum, Base, Ethereum). Public wallet addresses and transaction hashes recorded on-chain are inherently transparent and verifiable through public block explorers.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">4</span>
                  <span>
                    {isRu
                      ? 'Локальное хранилище клиента и файлы Cookies'
                      : 'Local Client Storage & Cookies'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? <>Интерфейс использует только локальное хранилище браузера (<code className="text-amber-400 font-mono">localStorage</code>) для сохранения неидентифицируемых настроек: выбранной темы (светлая/темная), таймфрейма графика, языка интерфейса и звуковых эффектов. Мы не используем сторонние аналитические пиксели или инвазивные маркетинговые cookies.</>
                    : <>The interface only utilizes client-side browser storage (<code className="text-amber-400 font-mono">localStorage</code>) to preserve non-identifiable user preferences, specifically: selected display theme (dark/light), active chart timeframe, language preference, and recent interface volume toggles. We do not use third-party analytics pixels, behavioral tracking beacons, or invasive marketing cookies.</>}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">5</span>
                  <span>
                    {isRu
                      ? 'Передача рыночных данных и потоки оракулов'
                      : 'Market Data Transmission & Oracle Feeds'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? 'Котировки цен, глубина книги ордеров и греки опционов передаются в реальном времени напрямую через защищенные TLS WebSockets от институциональных поставщиков ликвидности (Coinbase Institutional, Deribit, Pyth Network). Запросы клиента не проходят через промежуточные прокси-серверы.'
                    : 'Price quotes, order book depth, and option Greeks are streamed directly via secure TLS WebSockets from institutional liquidity endpoints (Coinbase Institutional, Deribit, Pyth Network). Client requests do not pass through intermediary harvesting proxies.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-panel space-y-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">6</span>
                  <span>
                    {isRu
                      ? 'Раскрытие рисков и юрисдикционные исключения'
                      : 'Risk Disclosures & Regulatory Exclusions'}
                  </span>
                </div>
                <p>
                  {isRu
                    ? 'Торговля криптовалютными бессрочными контрактами и опционами с нулевым сроком экспирации сопряжена с существенным риском потери капитала из-за кредитного плеча. Пользователи несут личную ответственность за соблюдение применимых законов, налоговых требований и санкционных ограничений в своих юрисдикциях.'
                    : 'Cryptocurrency perpetuals and zero-day options involve substantial risk of capital loss due to leverage. Users are solely responsible for ensuring compliance with applicable laws, tax regulations, and sanctions restrictions within their respective jurisdictions before deploying capital.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTION HELP CENTER */}
        {type === 'help' && (
          <div className="space-y-6 text-xs font-sans text-muted leading-relaxed">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-subpanel border border-panel rounded-2xl">
              {[
                { id: 'all', label: isRu ? 'Все темы' : 'All Topics' },
                { id: 'wallets', label: isRu ? '1. Кошелек и депозиты' : '1. Wallet & Deposits' },
                { id: 'perps', label: isRu ? '2. Бессрочные фьючерсы' : '2. Perpetual Futures' },
                { id: 'options', label: isRu ? '3. 0DTE Опционы' : '3. 0DTE Options' },
                { id: 'pools', label: isRu ? '4. Ликвидность и хранилища' : '4. Liquidity & Vaults' },
                { id: 'lottery', label: isRu ? '5. Почасовая лотерея и Шериф' : '5. Hourly Lottery & Sheriff' },
                { id: 'points', label: isRu ? '6. Программа поинтов (Stars)' : '6. Stars Points Program' },
                { id: 'orders', label: isRu ? '7. Исполнение ордеров' : '7. Order Execution' },
                { id: 'security', label: isRu ? '8. Риски и безопасность' : '8. Risk & Security' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setHelpCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    helpCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                      : 'text-muted hover:text-primary hover:bg-panel'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Help Content Cards */}
            <div className="grid gap-4">
              {(helpCategory === 'all' || helpCategory === 'wallets') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">01</span>
                    <span>
                      {isRu
                        ? 'Подключение некастодиального кошелька и пополнение залога'
                        : 'Non-Custodial Wallet Connection & Collateral Funding'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Поддерживаемые кошельки:' : 'Supported Wallets:'}</strong>{' '}
                      {isRu
                        ? 'Подключайтесь через MetaMask, Rabby, Coinbase Wallet, OKX Wallet или любой провайдер WalletConnect v2.'
                        : 'Connect seamlessly using MetaMask, Rabby, Coinbase Wallet, OKX Wallet, or any WalletConnect v2 provider.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Базовый залог:' : 'Base Collateral:'}</strong>{' '}
                      {isRu
                        ? 'Все бессрочные контракты и премии по опционам номинированы и рассчитываются в USDC. Для торговли убедитесь, что в кошельке есть USDC и нативные токены сети (например, ETH на Arbitrum или Base) для одобрения смарт-контракта.'
                        : 'All perpetual contracts and option premiums are denominated and settled in USDC. To begin trading, ensure your connected wallet holds USDC and native gas tokens (e.g. ETH on Arbitrum or Base) for the initial smart contract approval.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Торговля без газа (Gasless Signing):' : 'Gasless Order Signing:'}</strong>{' '}
                      {isRu
                        ? 'После однократного одобрения маржи USDC торговые ордера и отмены подписываются вне сети с помощью стандартных криптографических подписей EIP-712, что исключает комиссии за газ при каждой сделке.'
                        : 'Once your one-time USDC margin approval is granted, trade orders and cancellations are authenticated off-chain via standard EIP-712 cryptographic signatures, eliminating per-trade blockchain gas fees.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'perps') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">02</span>
                    <span>
                      {isRu
                        ? 'Бессрочные фьючерсы и механика кредитного плеча'
                        : 'Perpetual Contracts & Leverage Mechanics'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Доступные рынки:' : 'Available Markets:'}</strong>{' '}
                      {isRu
                        ? 'Торгуйте криптовалютными бессрочными контрактами (BTC, ETH, SOL, DOGE, BNB, ZEC, LIT, ARB, NEAR, UNI, GMX, XRP с плечом до 100x) и токенизированными фондовыми индексами (NVDA, SPY, TSLA с плечом до 20x).'
                        : 'Trade crypto perpetuals (BTC, ETH, SOL, DOGE, BNB, ZEC, LIT, ARB, NEAR, UNI, GMX, XRP up to 100x) and tokenized equity indexes (NVDA, SPY, TSLA up to 20x).'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Изолированная маржа и ползунки:' : 'Isolated Margin & Sliders:'}</strong>{' '}
                      {isRu
                        ? 'Каждая позиция обеспечивается независимо. Используйте ползунок маржи (с кнопками 25%, 50%, 75%, 100%) для точной установки размера залога.'
                        : 'Each position is collateralized independently. Use the margin slider (with 25%, 50%, 75%, 100% quick presets) to dial your exact collateral size.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Цена индекса против цены маркировки:' : 'Index vs. Mark Price:'}</strong>{' '}
                      {isRu
                        ? 'Для защиты трейдеров от ликвидаций резкими тенями на отдельных биржах ликвидация отслеживается по медианной цене маркировки (Mark Price) от мульти-биржевых оракулов (Coinbase, Binance, Pyth).'
                        : 'To protect traders against malicious exchange wick liquidations, liquidation checks reference the median Mark Price calculated from multi-exchange index oracles (Coinbase, Binance, Pyth).'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Динамическая ставка финансирования:' : 'Dynamic Funding Rate:'}</strong>{' '}
                      {isRu
                        ? 'Выплаты финансирования происходят каждые 8 часов между лонгами и шортами для привязки цены контрактов к спотовым индексам.'
                        : 'Funding payments occur every 8 hours between Longs and Shorts to tether perpetual contract prices to underlying spot indexes.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'options') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">03</span>
                    <span>
                      {isRu
                        ? 'Торговля опционами 0DTE (Экспирация в тот же день)'
                        : 'US 0DTE (Same-Day Expiration) Options Trading'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Направление рынка:' : 'Directional View:'}</strong>{' '}
                      {isRu
                        ? 'Переключайтесь между Коллами (Бычий ↗) и Путами (Медвежий ↘) на панели опционов.'
                        : 'Switch between Calls (Bullish ↗) and Puts (Bearish ↘) on the options trading board.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Котировки Deribit в реальном времени:' : 'Live Pricing & Deribit Feeds:'}</strong>{' '}
                      {isRu
                        ? 'Карточки опционов получают реальные котировки Bid, Ask и Mark премий напрямую из институционального потока Deribit.'
                        : 'Option cards fetch real-time bid, ask, and mark premiums directly from Deribit institutional order flow.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Прозрачный безубыток:' : 'Transparent Breakeven:'}</strong>{' '}
                      {isRu
                        ? 'Каждая карточка страйка отображает точный расчет точки безубытка:'
                        : 'Every strike card displays your exact breakeven spot price at expiry:'}
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel">
                        {isRu ? 'Безубыток Колла = Страйк + Уплаченная премия' : 'Call Breakeven = Strike Price + Premium Paid'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel mt-1 inline-block">
                        {isRu ? 'Безубыток Пута = Страйк - Уплаченная премия' : 'Put Breakeven = Strike Price - Premium Paid'}
                      </span>
                    </p>
                    <p>
                      <strong>{isRu ? 'Автоматический расчет:' : 'Automatic Cash Settlement:'}</strong>{' '}
                      {isRu
                        ? 'Контракты экспирируются ежедневно в 08:00 UTC. Опционы «в деньгах» (ITM) автоматически рассчитываются и начисляются на баланс USDC без необходимости ручных действий.'
                        : 'Contracts expire daily at 08:00 UTC. In-the-money (ITM) options settle automatically into your USDC balance without requiring manual exercise or underlying token delivery.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'pools') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">04</span>
                    <span>
                      {isRu
                        ? 'Пулы ликвидности и доходные хранилища'
                        : 'Liquidity Pools & Yield Vaults'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Пул ликвидности опционов USDC:' : 'USDC Option LP Pool:'}</strong>{' '}
                      {isRu
                        ? 'Обеспечивает контрагентную ликвидность для торговли опционами. Поставщики LP зарабатывают на торговых комиссиях, спредах и распаде временной стоимости опционов.'
                        : 'Provides counterparty liquidity for options writers and traders. LPs earn trading fee cuts, bid-ask spreads, and option decay premiums.'}
                    </p>
                    <p>
                      <strong>{isRu ? '30-дневное резервное хранилище:' : '30-Day Reserve Vault:'}</strong>{' '}
                      {isRu
                        ? 'Главный страховой фонд протокола. Депозиты в Резервном хранилище получают институциональную доходность от ликвидаций и ставок заимствования.'
                        : 'Senior protocol backstop pool. Capital deposited into the Reserve Vault receives institutional yield shares distributed from platform liquidations and perpetual borrow interest.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Реальная доходность:' : 'Real-Time Yield:'}</strong>{' '}
                      {isRu
                        ? 'Показатели APR отражают реальные доходы от объема торговли протокола без искусственной инфляционной эмиссии.'
                        : 'APRs reflect actual fee generation from settled protocol volume with 0 artificial inflationary mints.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'lottery') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">05</span>
                    <span>
                      {isRu
                        ? 'Почасовая лотерея, титул Шерифа и правила розыгрыша'
                        : 'Hourly Protocol Lottery, Sheriff Title & Rules'}
                    </span>
                  </div>
                  <div className="space-y-2.5 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Условия запуска эпохи (Epoch Activation & Reset):' : 'Epoch Activation & Reset Conditions:'}</strong>{' '}
                      {isRu
                        ? 'Эпохи лотереи не запускаются вхолостую при пустом банке. Если в пуле нет участников, лотерея находится в режиме ожидания (Epoch #0). Первая эпоха (Epoch #1) и 60-минутный обратный отсчет до розыгрыша активируются только тогда, когда выполнены минимальные условия: хотя бы 1 активный участник совершил сделку с роутингом маржи/PnL в призовой фонд.'
                        : 'Lottery epochs do not run idle when the prize pool is empty. If there are zero participants, the lottery remains in pending state (Epoch #0). Epoch #1 and the 60-minute countdown activate only once minimum requirements are met: at least 1 entrant places a trade routing margin/PnL into the prize pot.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Автоматический роутинг PnL (Как принять участие):' : 'Automated PnL Routing (How to Enter):'}</strong>{' '}
                      {isRu
                        ? 'Трейдерам не нужно покупать отдельные билеты. При открытии и удержании позиций 10% маржи автоматически направляются в почасовой призовой пул соответствующей пары. Действует строгое правило: 1 кошелек = 1 билет на торговую пару, что предотвращает спам и искусственную накрутку шансов.'
                        : 'Traders do not need to buy separate tickets. When maintaining open positions, 10% of margin is automatically routed into the hourly prize pool for that asset. A strict rule of 1 wallet = 1 entry per trading pair applies, preventing sybil spam and odds manipulation.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Титул «Шериф» пары (Sheriff Title):' : 'Market Sheriff Title & Volume Royalty:'}</strong>{' '}
                      {isRu
                        ? 'Участник с наибольшим торговым объемом или вкладом в пару в рамках эпохи признается Шерифом рынка. Помимо повышенных шансов на розыгрыш, Шериф получает авторское вознаграждение 0.01% от торгового объема данной пары за эпоху.'
                        : 'The entrant with the highest trading volume or contribution in a pair during the epoch earns the Sheriff title. Beyond higher lottery allocation, the Sheriff receives a 0.01% volume royalty on that market for the epoch duration.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Распределение призового фонда:' : 'Prize Pot Distribution:'}</strong>{' '}
                      {isRu
                        ? 'Каждый час собранный банк распределяется по прозрачной математической модели:'
                        : 'Every hour the prize pot is allocated transparently according to protocol mechanics:'}
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• 50% — Выплата победителю эпохи (Sheriff Winner / Soft-loss rebate)' : '• 50% — Epoch Winner Payout (Sheriff Winner / Soft-loss rebate)'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• 25% — Казначейство протокола (Protocol Treasury / Ликвидность)' : '• 25% — Protocol Treasury (Liquidity Backstop)'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• 25% — Накопительный SuperJackpot для масштабных раундов' : '• 25% — Cumulative SuperJackpot for major event rounds'}
                      </span>
                    </p>
                    <p>
                      <strong>{isRu ? 'Анти-монопольный кулдаун (24-Hour Cooldown):' : 'Anti-Monopoly 24-Hour Cooldown:'}</strong>{' '}
                      {isRu
                        ? 'После победы адрес победителя получает 24-часовой кулдаун на получение главного джекпота, чтобы гарантировать честное и децентрализованное распределение наград между всеми участниками сообщества.'
                        : 'Winning wallets enter a 24-hour jackpot cooldown to ensure equitable and decentralized reward distribution across all community members.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'points') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">06</span>
                    <span>
                      {isRu
                        ? 'Программа поинтов (Stars ⭐): формулы, ранги и экономика'
                        : 'Stars (⭐) Points Program: Formulas, Tiers & Economics'}
                    </span>
                  </div>
                  <div className="space-y-2.5 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Архитектурный принцип и Stars (⭐):' : 'Architecture & Stars (⭐) Accounting Unit:'}</strong>{' '}
                      {isRu
                        ? 'Программа Stars ориентирована на качество сделок и реальное удержание открытого интереса (Open Interest), а не на пустую накрутку объемов скриптовыми ботами. Психологический бенчмарк программы: 1 Star ≈ $1.00 USDC. Все начисления рассчитываются автоматически смарт-контрактами и алгоритмическими правилами протокола.'
                        : 'The Stars program prioritizes trading acumen and genuine open interest retention over manipulative wash volume. The psychological economic anchor is 1 Star ≈ $1.00 USDC. All allocations are governed transparently by smart contracts and protocol scoring rules.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Динамический множитель первопроходцев (Early Adopters Multiplier):' : 'Dynamic Early Adopter Multiplier Curve:'}</strong>{' '}
                      {isRu
                        ? 'Ранние трейдеры защищены динамической кривой сложности. Пока комьюнити формируется, множитель ранней эпохи увеличивает начисления:'
                        : 'Early participants benefit from an algorithmic difficulty curve. While the community bootstraps, points accrue at an elevated rate:'}
                      <br />
                      <span className="font-mono text-amber-400 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        M_early(N) = 1.0 + 30 / √N
                      </span>
                      <br />
                      <span className="text-[11px] text-muted">
                        {isRu
                          ? 'где N — текущее количество кошельков с открытой позицией (Wallets with Open Positions). При N=25 множитель составляет 7.0x, при N=100 — 4.0x, при N=1 000 — 1.95x, а при N ≥ 25 000 асимптотически приближается к 1.0x. С ростом базы фарм становится дороже естественным образом.'
                          : 'where N is the current count of unique wallets with open positions. At N=25 the boost is 7.0x, at N=100 it is 4.0x, at N=1,000 it is 1.95x, scaling smoothly to 1.0x at N ≥ 25,000. Mining difficulty scales organically as adoption deepens.'}
                      </span>
                    </p>
                    <p>
                      <strong>{isRu ? 'Правила начисления за бессрочные фьючерсы (Perps Scoring):' : 'Perpetual Futures Scoring Rules:'}</strong>{' '}
                      {isRu
                        ? 'Поинты начисляются за каждую закрытую позицию по строгой анти-сибил модели:'
                        : 'Stars accrue per closed position under strict anti-sybil validation:'}
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• Базовый бонус: +1.0 Star при ROE ≥ +30% и длительности сделки > 20 сек' : '• Base Win: +1.0 Star when ROE ≥ +30% and trade duration > 20s'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• Анти-скальп фильтр: сделки длительностью ≤ 20 сек при ROE ≥ +30% получают лишь 10% (+0.1 Star)' : '• Anti-Scalp Filter: trades held ≤ 20s with ROE ≥ +30% receive 10% penalty (+0.1 Star)'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• Мейкер-бонус: +0.25 Star за пассивный лимитный ордер, исполненный в течение 24 ч' : '• Maker Bonus: +0.25 Star for passive limit orders filled within 24h'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• Бонус за удержание (Holding): +1.5 Stars за позицию, удерживаемую ≥ 24 ч (независимо от PnL)' : '• Holding Bonus: +1.5 Stars for sustaining positions ≥ 24h (regardless of final PnL)'}
                      </span>
                      <br />
                      <span className="font-mono text-amber-500 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        {isRu ? '• Ликвидация: 0.0 Stars' : '• Liquidation Penalty: 0.0 Stars'}
                      </span>
                    </p>
                    <p>
                      <strong>{isRu ? 'Протокольный кэшбэк маржи (Protocol Fee Rebate):' : 'Protocol Margin Fee Rebate:'}</strong>{' '}
                      {isRu
                        ? 'При открытии позиции 10% маржи направляется в пул, из которого 25% составляет доход протокола. 25% от этой суммы возвращается трейдеру в виде Stars: Stars_dev = Margin × 0.00625.'
                        : 'Upon opening a position, 10% margin routes to the pool, 25% of which represents protocol development share. 25% of that fee is rebated in Stars: Stars_dev = Margin × 0.00625.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Лотерейный буст и выбор SuperJackpot (Gamble Multiplier):' : 'Lottery Boost & SuperJackpot Multiplier:'}</strong>{' '}
                      {isRu
                        ? 'Победа в часовой эпохе дает +100 Stars и 1.3x буст на 24 часа. Победитель SuperJackpot может выбрать либо чистый выигрыш в USDC, либо Stars по формуле среднего фандинга:'
                        : 'An hourly epoch win grants +100 Stars and a 1.3x trading boost for 24 hours. The SuperJackpot winner can claim pure USDC or convert to Stars via the monthly average funding formula:'}
                      <br />
                      <span className="font-mono text-amber-400 text-[11px] bg-subpanel px-2 py-0.5 rounded border border-panel inline-block mt-1">
                        Multiplier = (N_participants / 10) × FR_avg^month
                      </span>
                      <br />
                      <span className="text-[11px] text-muted">
                        {isRu
                          ? 'Формула математически сбалансирована (ожидаемая ценность ~51%), предоставляя честный выбор 50/50 между гарантированным USDC и потенциально кратно большим пакетом Stars при активном рынке.'
                          : 'The formula maintains fair 50/50 expected value parity (~51%), offering a calculated gamble between guaranteed USDC cash or outsized Stars allocation during high-velocity markets.'}
                      </span>
                    </p>
                    <p>
                      <strong>{isRu ? 'Поставка ликвидности в хранилища (Vaults):' : 'Liquidity Vault Emissions:'}</strong>{' '}
                      {isRu
                        ? 'Поставщики капитала в 30-Day Reserve Vault и USDC Option LP Pool получают 0.5 Stars в сутки за каждые $100 USDC депозита без рыночного риска.'
                        : 'Capital providers to the 30-Day Reserve Vault and USDC Option LP Pool earn 0.5 Stars daily per $100 USDC committed.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Ранги (Tiers) и Реферальная программа:' : 'Tier Hierarchy & Referral Model:'}</strong>{' '}
                      {isRu
                        ? 'Прогресс делится на 5 ступеней: Recruit (0–25), Frontier Trader (25–100), Deputy (100–500), Sheriff (500–2 500) и Marshal (2 500+). Прямой реферер получает 10% от Stars приглашенного, второй уровень — 5%, а приглашенный трейдер получает 5% пожизненную скидку на комиссии.'
                        : 'Progress spans 5 institutional tiers: Recruit (0–25), Frontier Trader (25–100), Deputy (100–500), Sheriff (500–2,500), and Marshal (2,500+). Direct referrers receive 10% of referee Stars, Tier-2 invites receive 5%, while new invitees get a permanent 5% fee discount.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'orders') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">07</span>
                    <span>
                      {isRu
                        ? 'Типы ордеров и центральная книга ордеров (CLOB)'
                        : 'Order Types & Central Limit Order Book (CLOB)'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Рыночные ордера:' : 'Market Orders:'}</strong>{' '}
                      {isRu
                        ? 'Исполняются мгновенно по лучшей доступной цене в стакане. Комиссия тейкера: 0.05%.'
                        : 'Fill immediately at the optimal available price on the order book. Taker fee: 0.05%.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Лимитные ордера:' : 'Limit Orders:'}</strong>{' '}
                      {isRu
                        ? 'Пассивные ордера по указанной цене для получения скидок мейкера (Комиссия мейкера: 0.02%).'
                        : 'Enter passive orders at specified prices to capture maker fee discounts (Maker fee: 0.02%).'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Стакан ордеров и глубина:' : 'Order Book & Depth:'}</strong>{' '}
                      {isRu
                        ? 'Центральный стакан обеспечивает отображение глубины рынка с субсекундной задержкой. Недавние исполнения доступны во вкладке «Сделки».'
                        : 'The central book provides sub-second depth visualization. Inspect recent executions in the Trades tab directly beside the order ticket.'}
                    </p>
                  </div>
                </div>
              )}

              {(helpCategory === 'all' || helpCategory === 'security') && (
                <div className="p-5 rounded-2xl bg-panel border border-panel space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center text-xs font-mono">08</span>
                    <span>
                      {isRu
                        ? 'Аудиты, управление с мультиподписью и параметры риска'
                        : 'Audits, Multi-Sig Governance & Risk Parameters'}
                    </span>
                  </div>
                  <div className="space-y-2 text-muted leading-normal">
                    <p>
                      <strong>{isRu ? 'Безопасность смарт-контрактов:' : 'Smart Contract Security:'}</strong>{' '}
                      {isRu
                        ? 'Контракты неизменяемы и проверены ведущими аудиторами. Экстренное изменение параметров требует согласования нескольких подписей и 48-часовой задержки таймлока.'
                        : 'Protocol contracts are immutable and audited by top tier security researchers. Emergency parameter adjustments require multi-signature approvals with a 48-hour timelock delay.'}
                    </p>
                    <p>
                      <strong>{isRu ? 'Буфер ликвидации:' : 'Liquidation Buffer:'}</strong>{' '}
                      {isRu
                        ? 'Автоматические механизмы дерискинга срабатывают до полного исчерпания маржи, защищая протокол от безнадежных долгов и обеспечивая своевременные выплаты трейдерам.'
                        : 'Automatic de-risking engines trigger before margin depletion, preventing protocol bad debt and ensuring solvent trader settlements under all market volatility conditions.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
