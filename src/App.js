import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import Sidebar from './components/layout/Sidebar';
import './App.css';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div>Cargando...</div>; // O un spinner/componente de carga
    }

    return (
        <Router>
            {!session ? (
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate to="/auth" />} />
                </Routes>
            ) : (
                <div className="app-container">
                    <Sidebar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/cuentas" element={<AccountsPage />} />
                            <Route path="/categorias" element={<CategoriesPage />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </main>
                </div>
            )}
        </Router>
    );
}

export default App;