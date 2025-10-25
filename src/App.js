import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
// 1. IMPORTA EL PROVIDER Y EL HOOK
import { DataProvider, useData } from './contexts/DataContext'; 

// --- ¡ESTOS ERAN LOS IMPORTS QUE FALTABAN! ---
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import RegistrosPage from './pages/RegistrosPage';
import EstadisticasPage from './pages/EstadisticasPage';
import PagosPage from './pages/PagosPage';
// --- FIN DE IMPORTS ---

import Sidebar from './components/layout/Sidebar';
import FloatingActionButton from './components/FloatingActionButton';
import TransactionModal from './components/TransactionModal';
import ChatbotModal from './components/ChatbotModal';
import './components/Chatbot.css';
import './App.css';

// --- NUEVO COMPONENTE INTERNO ---
// Este componente vive DENTRO de DataProvider, por lo que SÍ PUEDE usar el hook useData
function AppContent() {
    // 2. ESTE ESTADO SÍ ES LOCAL (solo para el modal de transacción)
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // 3. ESTE ESTADO VIENE DEL CONTEXTO (compartido con el Sidebar)
    const { showChatbot, setShowChatbot } = useData();

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    {/* Estas líneas ahora funcionarán */}
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
            
            {/* 4. RENDERIZAR LOS MODALES USANDO SUS ESTADOS CORRESPONDIENTES */}
            {showTransactionModal && (
                <TransactionModal 
                    closeModal={() => setShowTransactionModal(false)} 
                />
            )}
            
            {/* Este modal ahora se muestra basado en el estado del CONTEXTO */}
            {showChatbot && (
                <ChatbotModal closeModal={() => setShowChatbot(false)} />
            )}
        </div>
    );
}

// --- COMPONENTE PRINCIPAL (sin cambios casi) ---
function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // ... (tu lógica de getSession y onAuthStateChange se mantiene igual)
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
        return <div>Cargando...</div>;
    }

    return (
        <Router>
            {!session ? (
                <Routes>
                    {/* Esta línea ahora funcionará */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="*" element={<Navigate to="/auth" />} />
                </Routes>
            ) : (
                // 6. DataProvider envuelve a AppContent
                <DataProvider>
                    <AppContent />
                </DataProvider>
            )}
        </Router>
    );
}

export default App;