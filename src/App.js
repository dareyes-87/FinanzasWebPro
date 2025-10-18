import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { DataProvider } from './contexts/DataContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import RegistrosPage from './pages/RegistrosPage';
import EstadisticasPage from './pages/EstadisticasPage';
import PagosPage from './pages/PagosPage';
import Sidebar from './components/layout/Sidebar';
import FloatingActionButton from './components/FloatingActionButton';
import TransactionModal from './components/TransactionModal';

import './App.css';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    
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

    const handleTransactionClose = () => {
        setShowTransactionModal(false);
    };

    // La función 'onSuccess' ya no es necesaria, el modal llamará al contexto
    
    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <Router>
            {!session ? (
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate to="/auth" />} />
                </Routes>
            ) : (
                // 2. Envuelve TODO el layout autenticado con el DataProvider
                <DataProvider>
                    <div className="app-container">
                        <Sidebar />
                        <main className="main-content">
                            <Routes>
                                {/* Ya no necesitas pasar la 'key' */}
                                <Route path="/" element={<DashboardPage />} /> 
                                <Route path="/cuentas" element={<AccountsPage />} />
                                <Route path="/categorias" element={<CategoriesPage />} />
                                <Route path="/registros" element={<RegistrosPage />} />
                                <Route path="/estadisticas/*" element={<EstadisticasPage />} />
                                <Route path="/pagos" element={<PagosPage />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>
                        <FloatingActionButton onClick={() => setShowTransactionModal(true)} />
                        
                        {showTransactionModal && (
                            <TransactionModal 
                                closeModal={handleTransactionClose} 
                                // Ya no pasamos 'onSuccess'
                            />
                        )}
                    </div>
                </DataProvider>
            )}
        </Router>
    );
}

export default App;