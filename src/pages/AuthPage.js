import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [focusedInput, setFocusedInput] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setMessage('¡Bienvenido de nuevo!');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="background-gradient gradient-1"></div>
            <div className="background-gradient gradient-2"></div>
            <div className="background-gradient gradient-3"></div>

            <div className="auth-card">
                <div className="logo-container">
                    <div className="logo-circle">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M20 5L25 15H15L20 5Z" fill="url(#gradient1)" />
                            <path d="M8 20L15 15L15 25L8 20Z" fill="url(#gradient2)" />
                            <path d="M32 20L25 15L25 25L32 20Z" fill="url(#gradient3)" />
                            <path d="M20 35L15 25H25L20 35Z" fill="url(#gradient4)" />
                            <defs>
                                <linearGradient id="gradient1" x1="20" y1="5" x2="20" y2="15">
                                    <stop stopColor="#8B5CF6" />
                                    <stop offset="1" stopColor="#6366F1" />
                                </linearGradient>
                                <linearGradient id="gradient2" x1="8" y1="20" x2="15" y2="20">
                                    <stop stopColor="#6366F1" />
                                    <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                                <linearGradient id="gradient3" x1="32" y1="20" x2="25" y2="20">
                                    <stop stopColor="#8B5CF6" />
                                    <stop offset="1" stopColor="#EC4899" />
                                </linearGradient>
                                <linearGradient id="gradient4" x1="20" y1="35" x2="20" y2="25">
                                    <stop stopColor="#EC4899" />
                                    <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                <h2 className="auth-title">WalletGT</h2>
                <p className="auth-subtitle">
                    {isLogin 
                        ? 'Inicia sesión para administrar tus finanzas' 
                        : 'Crea una cuenta para empezar a organizarte'}
                </p>

                <div className="auth-tabs">
                    <div className={`tab-slider ${!isLogin ? 'slide-right' : ''}`}></div>
                    <button
                        className={`tab ${isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(true);
                            setError(null);
                            setMessage('');
                        }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        className={`tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(false);
                            setError(null);
                            setMessage('');
                        }}
                    >
                        Crear Cuenta
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className={`input-wrapper ${focusedInput === 'email' ? 'focused' : ''}`}>
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M2 5l8 5 8-5" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className={`input-wrapper ${focusedInput === 'password' ? 'focused' : ''}`}>
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="3" y="10" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="10" cy="14" r="1" fill="currentColor" />
                            </svg>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={`btn-submit ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (
                            isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="message error-message">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {error}
                    </div>
                )}
                {message && (
                    <div className="message success-message">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthPage;