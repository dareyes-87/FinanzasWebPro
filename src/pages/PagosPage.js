import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext';
import PagoModal from '../components/PagoModal'; // Asumimos que este modal existe
import { 
    Edit, 
    Trash2, 
    Plus, 
    CalendarCheck, 
    TrendingDown, 
    TrendingUp,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './ListPage.css'; // Reutilizamos el CSS de las otras páginas de lista

const PagosPage = () => {
    const { scheduledTransactions, loading, refreshAllData } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editingPago, setEditingPago] = useState(null);

    // Agrupamos los pagos por el nombre de su categoría
    const groupedPagos = useMemo(() => {
        return scheduledTransactions.reduce((acc, pago) => {
            const categoryName = pago.categories?.name || 'Sin Categoría';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(pago);
            return acc;
        }, {});
    }, [scheduledTransactions]);

    const handleEdit = (pago) => {
        setEditingPago(pago);
        setShowModal(true);
    };

    const handleDelete = async (pago) => {
        const confirmMsg = `¿Seguro que quieres borrar el pago planificado "${pago.note || 'Pago sin nombre'}"?`;
        if (window.confirm(confirmMsg)) {
            const { error } = await supabase
                .from('scheduled_transactions')
                .delete()
                .eq('id', pago.id);
            
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
                <p>Cargando pagos...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {showModal && (
                <PagoModal 
                    closeModal={() => {
                        setShowModal(false);
                        setEditingPago(null);
                    }}
                    editingPago={editingPago}
                />
            )}

            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-title-section">
                        <CalendarCheck className="page-icon" size={32} />
                        <div>
                            <h2>Pagos Planificados</h2>
                            <p className="page-description">Pagos recurrentes como renta, servicios o suscripciones.</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Añadir Pago
                    </button>
                </div>
            </div>
            
            <div className="list-card">
                {scheduledTransactions.length > 0 ? (
                    Object.entries(groupedPagos)
                        .sort((a, b) => a[0].localeCompare(b[0])) // Ordenar por nombre de categoría
                        .map(([categoryName, pagos]) => (
                            <div key={categoryName} className="list-group">
                                <h3 className="list-group-header">{categoryName}</h3>
                                <div className="list-grid">
                                    {pagos.map(pago => (
                                        <div key={pago.id} className="modern-list-item">
                                            
                                            {/* Icono y Color */}
                                            <div 
                                                className="item-icon-wrapper"
                                                style={{ 
                                                    backgroundColor: `${pago.categories?.color || '#555'}20`, // Fondo opaco
                                                    borderColor: pago.categories?.color || '#555' 
                                                }}
                                            >
                                                {pago.type === 'Ingreso' ? (
                                                    <TrendingUp size={22} color={pago.categories?.color || '#00cc99'} />
                                                ) : (
                                                    <TrendingDown size={22} color={pago.categories?.color || '#ff6b6b'} />
                                                )}
                                            </div>

                                            {/* Contenido Principal */}
                                            <div className="item-content">
                                                <h4 className="item-title">{pago.note || 'Pago sin nota'}</h4>
                                                <p className="item-meta">
                                                    Próximo: <span className="item-meta-highlight">
                                                        {format(parseISO(pago.next_due_date), 'd MMMM, yyyy', { locale: es })}
                                                    </span>
                                                </p>
                                                <p className="item-meta">
                                                    Frecuencia: <span className="item-meta-highlight">{pago.frequency}</span>
                                                </p>
                                            </div>

                                            {/* Contenido Derecho (Monto y Estado) */}
                                            <div className="item-right-content">
                                                <span className={`item-amount ${pago.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                                    {pago.type === 'Gasto' ? '-Q' : '+Q'}
                                                    {parseFloat(pago.amount).toFixed(2)}
                                                </span>
                                                {pago.is_active ? (
                                                    <span className="status-badge active">
                                                        <CheckCircle size={14} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="status-badge inactive">
                                                        <XCircle size={14} /> Inactivo
                                                    </span>
                                                )}
                                            </div>

                                            {/* Acciones */}
                                            <div className="item-actions">
                                                <button 
                                                    className="icon-button edit-button" 
                                                    onClick={() => handleEdit(pago)}
                                                    title="Editar pago"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    className="icon-button delete-button" 
                                                    onClick={() => handleDelete(pago)}
                                                    title="Eliminar pago"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="empty-state">
                        <CalendarCheck size={64} className="empty-icon" />
                        <h3>No tienes pagos planificados</h3>
                        <p>Añade suscripciones, rentas o cualquier pago recurrente.</p>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={20} />
                            Añadir tu primer pago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PagosPage;