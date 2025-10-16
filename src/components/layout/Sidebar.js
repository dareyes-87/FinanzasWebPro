import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Sidebar.css'; // Crearemos este archivo CSS

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth'); // Redirige al login tras cerrar sesión
    };

    return (
        <aside className="sidebar">
            <h1>WalletGT</h1>
            <nav className="sidebar-menu">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink>
                <NavLink to="/cuentas" className={({ isActive }) => isActive ? 'active' : ''}>Cuentas</NavLink>
                <NavLink to="/categorias" className={({ isActive }) => isActive ? 'active' : ''}>Categorías</NavLink>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout}>Cerrar Sesión</button>
            </div>
        </aside>
    );
};

export default Sidebar;