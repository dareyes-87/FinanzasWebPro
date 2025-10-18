import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext';
import CategoryModal from '../components/CategoryModal';
import { Edit, Trash2, Plus, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import './ListPage.css';

const CategoriesPage = () => {
    const { categories, loading, refreshAllData } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'Ingreso', 'Gasto'

    const filteredCategories = useMemo(() => {
        if (filter === 'all') return categories;
        return categories.filter(cat => cat.type === filter);
    }, [categories, filter]);

    const categoryCounts = useMemo(() => {
        const income = categories.filter(cat => cat.type === 'Ingreso').length;
        const expense = categories.filter(cat => cat.type === 'Gasto').length;
        return { income, expense, total: categories.length };
    }, [categories]);

    const handleEdit = (category) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleDelete = async (category) => {
        const confirmMsg = `¿Seguro que quieres borrar la categoría "${category.name}"?\nLas transacciones asociadas no se borrarán, pero quedarán "Sin Categoría".`;
        if (window.confirm(confirmMsg)) {
            const { error } = await supabase.from('categories').delete().eq('id', category.id);
            if (error) {
                alert(`Error al borrar: ${error.message}`);
            } else {
                refreshAllData();
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {showModal && (
                <CategoryModal 
                    closeModal={() => {
                        setShowModal(false);
                        setEditingCategory(null);
                    }}
                    editingCategory={editingCategory}
                />
            )}

            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-title-section">
                        <Tag className="page-icon" size={32} />
                        <div>
                            <h2>Categorías</h2>
                            <p className="page-description">Clasifica tus ingresos y gastos</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Añadir Categoría
                    </button>
                </div>
            </div>

            {/* Estadísticas de Categorías */}
            {categories.length > 0 && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon income">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Ingresos</span>
                            <span className="stat-value">{categoryCounts.income}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon expense">
                            <TrendingDown size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Gastos</span>
                            <span className="stat-value">{categoryCounts.expense}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <Tag size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total</span>
                            <span className="stat-value">{categoryCounts.total}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            {categories.length > 0 && (
                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({categoryCounts.total})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'Ingreso' ? 'active' : ''}`}
                        onClick={() => setFilter('Ingreso')}
                    >
                        Ingresos ({categoryCounts.income})
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'Gasto' ? 'active' : ''}`}
                        onClick={() => setFilter('Gasto')}
                    >
                        Gastos ({categoryCounts.expense})
                    </button>
                </div>
            )}
            
            <div className="list-card">
                {filteredCategories.length > 0 ? (
                    <div className="list-grid">
                        {filteredCategories.map(cat => (
                            <div key={cat.id} className="modern-list-item category-item">
                                <div 
                                    className="item-color-indicator"
                                    style={{ backgroundColor: cat.color || '#94a3b8' }}
                                ></div>
                                <div className="item-content">
                                    <div className="item-header">
                                        <h4 className="item-title">{cat.name}</h4>
                                        <span className={`category-badge ${cat.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                            {cat.type === 'Ingreso' ? (
                                                <><TrendingUp size={14} /> Ingreso</>
                                            ) : (
                                                <><TrendingDown size={14} /> Gasto</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="item-actions">
                                    <button 
                                        className="icon-button edit-button" 
                                        onClick={() => handleEdit(cat)}
                                        title="Editar categoría"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        className="icon-button delete-button" 
                                        onClick={() => handleDelete(cat)}
                                        title="Eliminar categoría"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Tag size={64} className="empty-icon" />
                        <h3>
                            {filter === 'all' 
                                ? 'No tienes categorías' 
                                : `No tienes categorías de ${filter.toLowerCase()}`
                            }
                        </h3>
                        <p>
                            {filter === 'all'
                                ? '¡Añade una categoría para empezar a clasificar tus transacciones!'
                                : `Cambia el filtro o añade una nueva categoría de ${filter.toLowerCase()}.`
                            }
                        </p>
                        {filter === 'all' && (
                            <button className="btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={20} />
                                Crear tu primera categoría
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoriesPage;