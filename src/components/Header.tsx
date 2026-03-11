import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import Icon from './Icon';

interface HeaderProps {
    userAddress: string | null;
    handleLogin: () => Promise<void>;
    handleLogout: () => void;
}

export default function Header({ userAddress, handleLogin, handleLogout }: HeaderProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
        } else {
            root.classList.remove('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="sticky top-0 z-50 bg-bg-base">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-3xl font-bold tracking-tight text-brand-orange">Yade</span>
                </Link>

                {/* Right side controls */}
                <div className="flex items-center gap-3">
                    {/* Theme Selector */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-card/40 text-text-main transition hover:border-accent/50 hover:bg-bg-card-hover"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
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

                    <Link
                        to="/leaderboard"
                        className="flex h-9 items-center gap-1.5 rounded border border-border-subtle bg-bg-card/40 px-3 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-text-main"
                    >
                        <Icon name="leaderboard" className="icon-sm" />
                        <span className="hidden sm:inline">Leaderboard</span>
                    </Link>

                    <Link
                        to="/create-contest"
                        className="group flex h-9 items-center gap-1.5 rounded border border-border-subtle bg-bg-card/40 px-4 text-xs font-bold text-text-main transition hover:border-brand-lemon hover:bg-bg-card-hover"
                    >
                        <Icon name="add_circle" className="icon-sm text-brand-lemon group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Create Contest</span>
                    </Link>

                    {userAddress ? (
                        <button
                            onClick={handleLogout}
                            title="Disconnect Wallet"
                            className="group flex h-9 items-center gap-2 rounded bg-accent px-4 text-xs font-mono font-medium text-text-inverted transition hover:brightness-110"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM9.95 14.47L7.47 12L9.95 9.53V11H16V13H9.95V14.47Z" fill="currentColor" className="group-hover:block hidden" />
                                <path d="M2.5 12C2.5 17.2 6.8 21.5 12 21.5C17.2 21.5 21.5 17.2 21.5 12C21.5 6.8 17.2 2.5 12 2.5C6.8 2.5 2.5 6.8 2.5 12ZM14.9 8.2V9.8H9.1V8.2H14.9ZM14.9 14.2V15.8H9.1V14.2H14.9ZM14.9 11.2V12.8H9.1V11.2H14.9Z" fill="currentColor" className="group-hover:hidden" />
                            </svg>
                            {userAddress.slice(0, 4)}...{userAddress.slice(-4)}
                        </button>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="flex h-9 items-center gap-1.5 rounded bg-brand-orange px-4 text-xs font-bold text-black transition hover:brightness-110"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 12C2.5 17.2 6.8 21.5 12 21.5C17.2 21.5 21.5 17.2 21.5 12C21.5 6.8 17.2 2.5 12 2.5C6.8 2.5 2.5 6.8 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path d="M14.9 8.2V9.8H9.1V8.2H14.9ZM14.9 14.2V15.8H9.1V14.2H14.9ZM14.9 11.2V12.8H9.1V11.2H14.9Z" fill="currentColor" />
                            </svg>
                            Connect Stacks
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
