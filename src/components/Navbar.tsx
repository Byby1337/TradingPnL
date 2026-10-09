import React, { useState, useRef, useEffect } from 'react';
import { LanguageCode, TRANSLATIONS, Translations } from '../i18n/translations';

interface NavbarProps {
  currentSection: string;
  onSelectSection: (s: string) => void;
  currentTheme: string;
  onToggleTheme: () => void;
  userAddress: string | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  currentLang?: LanguageCode;
  onSelectLang?: (lang: LanguageCode) => void;
  userBalance?: number;
  rawWalletBalance?: number;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSection,
  onSelectSection,
  currentTheme,
  onToggleTheme,
  userAddress,
  onConnectWallet,
  onDisconnectWallet,
  currentLang = 'en',
  onSelectLang,
  userBalance = 0,
  rawWalletBalance = 0,
  onOpenDeposit,
  onOpenWithdraw
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const t: Translations = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const moreRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const languages: { code: LanguageCode; label: string; name: string }[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'zh', label: 'ZH', name: '中文' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'de', label: 'DE', name: 'Deutsch' },
    { code: 'ja', label: 'JA', name: '日本語' }
  ];

  const activeLangObj = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <header className="h-12 border-b border-panel bg-panel px-3 sm:px-4 flex items-center justify-between flex-shrink-0 z-40 relative gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <div className="flex items-center cursor-pointer select-none" onClick={() => onSelectSection('perpetual')}>
          <span className="text-[17px] font-black tracking-tight text-primary font-sans hover:text-amber-400 transition-colors">
            23Trade
          </span>
        </div>

        <nav className="flex items-center gap-1 font-medium text-[12px] shrink-0">
          <button
            onClick={() => onSelectSection('perpetual')}
            className={`px-3 py-1.5 rounded transition ${
              currentSection === 'perpetual'
                ? 'text-white bg-subpanel border border-[#312720] font-semibold'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.perpetual}
          </button>
          <button
            onClick={() => onSelectSection('options')}
            className={`px-3 py-1.5 rounded transition ${
              currentSection === 'options'
                ? 'text-white bg-subpanel border border-[#312720] font-semibold'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.options}
          </button>
          <button
            onClick={() => onSelectSection('pools')}
            className={`px-3 py-1.5 rounded transition ${
              currentSection === 'pools'
                ? 'text-white bg-subpanel border border-[#312720] font-semibold'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.pools}
          </button>
          <button
            onClick={() => onSelectSection('hourly-pool')}
            className={`px-3 py-1.5 rounded transition ${
              currentSection === 'hourly-pool'
                ? 'text-white bg-subpanel border border-[#312720] font-semibold'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.hourlyPool}
          </button>
          <button
            onClick={() => onSelectSection('portfolio')}
            className={`px-3 py-1.5 rounded transition ${
              currentSection === 'portfolio'
                ? 'text-white bg-subpanel border border-[#312720] font-semibold'
                : 'text-muted hover:text-primary'
            }`}
          >
            {t.portfolio}
          </button>

          {/* More Menu Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`px-3 py-1.5 rounded text-muted hover:text-primary flex items-center gap-1.5 transition ${
                showMoreMenu || currentSection === 'privacy' || currentSection === 'help' ? 'text-primary bg-subpanel' : ''
              }`}
            >
              <span>{t.more}</span>
              <span className={`text-[9px] transition-transform duration-200 ${showMoreMenu ? 'rotate-180 text-amber-400' : ''}`}>
                ▼
              </span>
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 top-10 w-60 bg-[#17110c]/95 backdrop-blur-xl border border-[#3b2d22] shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-2xl p-2 z-50 font-sans animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onSelectSection('privacy');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 group cursor-pointer ${
                    currentSection === 'privacy'
                      ? 'bg-[#281d14] border border-amber-500/30'
                      : 'hover:bg-[#221912] border border-transparent hover:border-[#382b20]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary group-hover:text-amber-300 transition-colors">
                      {t.privacyPolicy}
                    </span>
                    <span className="text-[10px] text-muted">
                      Non-custodial terms & safety
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onSelectSection('help');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 group cursor-pointer ${
                    currentSection === 'help'
                      ? 'bg-[#281d14] border border-amber-500/30'
                      : 'hover:bg-[#221912] border border-transparent hover:border-[#382b20]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary group-hover:text-amber-300 transition-colors">
                      {t.helpCenter}
                    </span>
                    <span className="text-[10px] text-muted">
                      Platform docs & guides
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 font-mono text-[11px] shrink-0">
        {/* Circle USDC Faucet Link */}
        <a
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-subpanel hover:bg-panel text-sky-600 dark:text-[#38bdf8] hover:text-sky-700 dark:hover:text-[#7dd3fc] border border-sky-500/30 hover:border-sky-500/50 rounded-lg text-xs font-semibold transition shadow-sm group shrink-0"
          title="Get Arbitrum Sepolia USDC from Circle Official Faucet"
        >
          <span>Faucet<span className="hidden xs:inline"> USDC</span></span>
          <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        {/* Trading Collateral Indicator */}
        {userAddress && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-subpanel border border-panel rounded-lg font-mono shrink-0">
            <span className="text-muted text-[10px]">{t.tradingBalance}:</span>
            <span className="text-[#0ecb81] font-bold text-xs">${userBalance.toFixed(2)} USDC</span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[9px] font-bold transition"
                title="Deposit Collateral to Trade"
              >
                +{t.deposit}
              </button>
            )}
          </div>
        )}

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="h-8 px-2.5 rounded-lg bg-subpanel border border-panel text-muted hover:text-primary flex items-center gap-1.5 transition shadow-sm group"
            title="Change Language"
          >
            <svg className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="text-[11px] font-sans font-semibold text-primary group-hover:text-amber-300">{activeLangObj.label}</span>
            <span className={`text-[9px] text-muted transition-transform duration-200 ${showLangMenu ? 'rotate-180 text-amber-400' : ''}`}>▼</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-10 w-52 max-h-72 overflow-y-auto bg-[#17110c]/95 backdrop-blur-xl border border-[#3b2d22] shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-2xl p-1.5 z-50 font-sans animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
              {languages.map((l) => {
                const isSelected = l.code === currentLang;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      onSelectLang?.(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition ${
                      isSelected
                        ? 'bg-[#281d14] text-amber-400 font-semibold border border-amber-500/30'
                        : 'text-primary hover:bg-[#221912] border border-transparent'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-muted font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1f1711] border border-[#2d2219]">
                      {l.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Contour Icon Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg bg-subpanel border border-panel text-muted hover:text-primary flex items-center justify-center transition-colors shadow-sm"
          title="Toggle Theme"
        >
          {currentTheme === 'dark' ? (
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#f59e0b]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="12" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
        </button>

        {/* Wallet Container */}
        <div className="relative" ref={walletRef}>
          {!userAddress ? (
            <button
              onClick={onConnectWallet}
              className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white font-sans text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>{t.connectWallet}</span>
            </button>
          ) : (
            <>
              <div
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-subpanel border border-panel rounded-lg cursor-pointer hover:border-[#10b981] transition shadow-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span className="text-primary font-mono font-semibold text-xs group-hover:text-[#10b981] transition-colors">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </span>
                <span className={`text-[9px] text-muted transition-transform duration-200 ${showWalletMenu ? 'rotate-180 text-[#10b981]' : ''}`}>
                  ▼
                </span>
              </div>

              {showWalletMenu && (
                <div className="absolute right-0 top-10 w-72 bg-[#17110c]/95 backdrop-blur-xl border border-[#3b2d22] shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-2xl p-3 z-50 font-sans animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  <div className="p-2.5 bg-[#120d09] border border-[#2d2219] rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">{t.connected}</span>
                      <span className="font-mono text-xs text-primary font-medium">{userAddress.slice(0, 8)}...{userAddress.slice(-6)}</span>
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="px-2 py-1 rounded bg-[#201711] hover:bg-[#2d2219] text-[10px] text-amber-400 border border-amber-500/20 transition"
                    >
                      {copied ? t.copied : t.copy}
                    </button>
                  </div>

                  {/* Wallet vs Trading Balances */}
                  <div className="p-2.5 bg-[#140e0a] border border-[#2d2219] rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center text-muted">
                      <span>{t.walletBalance}:</span>
                      <span className="text-primary font-bold">${rawWalletBalance.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>{t.tradingBalance}:</span>
                      <span className="text-[#0ecb81] font-bold">${userBalance.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-[#2d2219]">
                      {onOpenDeposit && (
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            onOpenDeposit();
                          }}
                          className="flex-1 py-1 text-center bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[11px] font-bold border border-amber-500/30 transition"
                        >
                          {t.deposit}
                        </button>
                      )}
                      {onOpenWithdraw && (
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            onOpenWithdraw();
                          }}
                          className="flex-1 py-1 text-center bg-subpanel hover:bg-[#281d14] text-muted hover:text-primary rounded-lg text-[11px] font-bold border border-panel transition"
                        >
                          {t.withdraw}
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      onSelectSection('portfolio');
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-[#221912] flex items-center gap-2.5 text-primary transition border border-transparent hover:border-[#382b20] group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold group-hover:text-amber-300">{t.portfolio}</span>
                      <span className="text-[10px] text-muted">Positions, PnL & history</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowWalletMenu(false);
                      onDisconnectWallet();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-[#2a1315] flex items-center gap-2.5 text-[#f6465d] transition border border-transparent hover:border-[#f6465d]/30"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#f6465d]/10 border border-[#f6465d]/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">{t.disconnect}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
