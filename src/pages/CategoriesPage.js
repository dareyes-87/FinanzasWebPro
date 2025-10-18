import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import CategoryModal from '../components/CategoryModal';
import './ListPage.css'; // Reutilizamos estilos

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase.from('categories').select('*').order('created_at');
        if (error) console.error('Error fetching categories:', error);
        else setCategories(data);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <div>
            {showModal && <CategoryModal closeModal={() => setShowModal(false)} refreshCategories={fetchCategories} />}

            <div className="header">
                <h2>Categorías</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Añadir Categoría</button>
            </div>

            <p className="page-description">Clasifica tus ingresos y gastos.</p>
            
            <div className="card">
                {categories.length > 0 ? (
                    categories.map(cat => (
                        <div key={cat.id} className="list-item">
                            <div className="list-item-main">
                                <span className="category-color-dot" style={{ backgroundColor: cat.color }}></span>
                                <h4>{cat.name}</h4>
                            </div>
                            <div className="list-item-details">
                                <span className={`category-type ${cat.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                    {cat.type}
                                </span>
                                {/* Aquí irán los iconos de editar/borrar */}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No tienes categorías. ¡Añade una para empezar!</p>
                )}
            </div>
        </div>
    );
};

export default CategoriesPage;