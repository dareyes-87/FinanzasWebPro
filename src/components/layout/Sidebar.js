// src/components/layout/Sidebar.js

import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useData } from '../../contexts/DataContext'; // <-- ¡ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ!
import './Sidebar.css';

// 2. Importa los iconos necesarios
import { Home, CreditCard, Tag, List, LogOut, BarChart2, ChevronDown, CalendarCheck, Bot } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(null);
    const { setShowChatbot } = useData();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    // 4. Función para abrir/cerrar el menú
    const toggleMenu = (menuName) => {
        setOpenMenu(openMenu === menuName ? null : menuName);
    };

    // 5. Comprueba si la ruta actual está dentro de "Estadísticas"
    const isEstadisticasActive = location.pathname.startsWith('/estadisticas');

    return (
        <aside className="sidebar">
            <h1>WalletGT</h1>
            <nav className="sidebar-menu">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Home size={20} /> Inicio
                </NavLink>
                <NavLink to="/cuentas" className={({ isActive }) => isActive ? 'active' : ''}>
                    <CreditCard size={20} /> Cuentas
                </NavLink>
                <NavLink to="/categorias" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Tag size={20} /> Categorías
                </NavLink>
                <NavLink to="/registros" className={({ isActive }) => isActive ? 'active' : ''}>
                    <List size={20} /> Registros
                </NavLink>
                <NavLink to="/pagos" className={({ isActive }) => isActive ? 'active' : ''}>
                    <CalendarCheck size={20} /> Pagos Planificados
                </NavLink>
                <button className="sidebar-button" onClick={() => setShowChatbot(true)}>
                    <Bot size={20} /> Asesor IA
                </button>
                
                {/* --- 6. MENÚ COLAPSABLE DE ESTADÍSTICAS --- */}
                <div className="menu-item-wrapper">
                    <button 
                        // Marca 'active' si la ruta actual EMPIEZA con /estadisticas
                        className={`menu-item-button ${isEstadisticasActive ? 'active' : ''}`} 
                        onClick={() => toggleMenu('estadisticas')}
                    >
                        <div className="menu-item-content">
                            <BarChart2 size={20} /> Estadísticas
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`menu-chevron ${openMenu === 'estadisticas' ? 'open' : ''}`} 
                        />
                    </button>
                    
                    {/* --- 7. SUBMENÚ --- */}
                    {openMenu === 'estadisticas' && (
                        <div className="submenu">
                            <NavLink to="/estadisticas/saldo">Saldo</NavLink>
                            <NavLink to="/estadisticas/panorama">Panorama</NavLink>
                            <NavLink to="/estadisticas/flujo">Flujo de fondos</NavLink>
                            <NavLink to="/estadisticas/gasto">Gasto</NavLink>
                            <NavLink to="/estadisticas/informes">Informes</NavLink>
                        </div>
                    )}
                </div>
                {/* --- FIN DE MENÚ COLAPSABLE --- */}

            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout}>
                    <LogOut size={20} /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;