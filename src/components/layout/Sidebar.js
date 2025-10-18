import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Sidebar.css';

// 1. Importa los iconos que faltan (opcional, pero mejora el diseño)
import { Home, CreditCard, Tag, BarChart2, List, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    return (
        <aside className="sidebar">
            <h1>WalletGT</h1>
            <nav className="sidebar-menu">
                {/* 2. Añade los iconos y el nuevo enlace a "Registros" */}
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Home size={20} /> Inicio
                </NavLink>
                <NavLink to="/cuentas" className={({ isActive }) => isActive ? 'active' : ''}>
                    <CreditCard size={20} /> Cuentas
                </NavLink>
                <NavLink to="/categorias" className={({ isActive }) => isActive ? 'active' : ''}>
                    <Tag size={20} /> Categorías
                </NavLink>
                {/* ESTE ES EL NUEVO ENLACE */}
                <NavLink to="/registros" className={({ isActive }) => isActive ? 'active' : ''}>
                    <List size={20} /> Registros
                </NavLink>
                {/* <NavLink to="/estadisticas" className={({ isActive }) => isActive ? 'active' : ''}>
                    <BarChart2 size={20} /> Estadísticas
                </NavLink> 
                */}
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