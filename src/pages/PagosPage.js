import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext';
import { Edit, Trash2 } from 'lucide-react';
import PagoModal from '../components/PagoModal';
import './ListPage.css';

const PagosPage = () => {
    const { scheduledTransactions, loading, refreshAllData } = useData();
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (pago) => {
        if (window.confirm(`¿Seguro que quieres borrar el pago "${pago.note || 'Pago sin nota'}"?`)) {
            const { error } = await supabase.from('scheduled_transactions').delete().eq('id', pago.id);
            if (error) alert(error.message);
            else refreshAllData();
        }
    };
    
    const handleEdit = (pago) => {
        // Lógica futura:
        // 1. setPagoAEditar(pago)
        // 2. setShowModal(true)
        // 3. El modal debe recibir 'pagoAEditar' y llenar el formulario
        alert("¡Funcionalidad de editar por implementar!");
    };

    if (loading) return <div>Cargando pagos...</div>;

    return (
        <div>
            {/* 2. Descomenta y usa el modal */}
            {showModal && <PagoModal closeModal={() => setShowModal(false)} />}
            
            <div className="header">
                <h2>Pagos Planificados</h2>
                {/* 3. Actualiza el botón para abrir el modal */}
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Añadir Pago</button>
            </div>
            <p className="page-description">Pagos recurrentes como renta, servicios o suscripciones.</p>
            
            <div className="card">
                {scheduledTransactions.length > 0 ? (
                    scheduledTransactions.map(pago => (
                        <div key={pago.id} className="list-item">
                            <div className="list-item-main">
                                <span 
                                    className="category-color-dot" 
                                    style={{ backgroundColor: pago.categories?.color || '#ccc' }}
                                ></span>
                                <div>
                                    <h4>{pago.categories?.name || 'Sin Categoría'}</h4>
                                    <p className={`category-type ${pago.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                        {pago.note || 'Pago recurrente'}
                                    </p>
                                </div>
                            </div>
                            <div className="list-item-details">
                                {/* 4. Estructura mejorada para monto y fecha */}
                                <div className="list-item-amount-group">
                                    <span className={`list-item-amount ${pago.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                        {pago.type === 'Gasto' ? '-' : '+'}Q{parseFloat(pago.amount).toFixed(2)}
                                    </span>
                                    <p className="list-item-sub-amount">
                                        Próximo: {new Date(pago.next_due_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button className="icon-button" onClick={() => handleEdit(pago)}>
                                    <Edit size={18} />
                                </button>
                                <button className="icon-button" onClick={() => handleDelete(pago)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No tienes pagos planificados. ¡Añade uno para empezar!</p>
                )}
            </div>
        </div>
    );
};

export default PagosPage;