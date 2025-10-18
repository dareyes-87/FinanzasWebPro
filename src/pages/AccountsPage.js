import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext';
import AccountModal from '../components/AccountModal';
import { Edit, Trash2, Plus, Wallet, Building2 } from 'lucide-react';
import './ListPage.css';

const AccountsPage = () => {
    const { accounts, transactions, transfers, loading, refreshAllData } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const accountsWithBalance = useMemo(() => {
        return accounts.map(account => {
            let balance = parseFloat(account.opening_balance);

            for (const tx of transactions) {
                if (tx.account_id === account.id) {
                    if (tx.type === 'Ingreso') {
                        balance += parseFloat(tx.amount);
                    } else if (tx.type === 'Gasto') {
                        balance -= parseFloat(tx.amount);
                    }
                }
            }
            for (const tr of transfers) {
                if (tr.to_account_id === account.id) {
                    balance += parseFloat(tr.amount);
                }
                if (tr.from_account_id === account.id) {
                    balance -= parseFloat(tr.amount);
                }
            }
            return { ...account, current_balance: balance };
        });
    }, [accounts, transactions, transfers]);

    const handleEdit = (account) => {
        setEditingAccount(account);
        setShowModal(true);
    };

    const handleDelete = async (account) => {
        const confirmMsg = `¿Seguro que quieres borrar la cuenta "${account.name}"?\n¡Esto borrará TODAS las transacciones y transferencias asociadas a ella!`;
        if (window.confirm(confirmMsg)) {
            const { error } = await supabase.from('accounts').delete().eq('id', account.id);
            if (error) {
                alert(`Error al borrar: ${error.message}`);
            } else {
                refreshAllData();
            }
        }
    };

    const totalBalance = accountsWithBalance.reduce((sum, acc) => sum + acc.current_balance, 0);

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
                <AccountModal 
                    closeModal={() => {
                        setShowModal(false);
                        setEditingAccount(null);
                    }}
                    editingAccount={editingAccount}
                />
            )}
            
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-title-section">
                        <Wallet className="page-icon" size={32} />
                        <div>
                            <h2>Cuentas</h2>
                            <p className="page-description">Administra tus fuentes de ingresos y gastos</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Añadir Cuenta
                    </button>
                </div>
            </div>

            {/* Tarjeta de Balance Total */}
            {accountsWithBalance.length > 0 && (
                <div className="summary-card">
                    <div className="summary-content">
                        <span className="summary-label">Balance Total</span>
                        <span className={`summary-amount ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
                            Q{totalBalance.toFixed(2)}
                        </span>
                    </div>
                    <div className="summary-icon">
                        <Wallet size={40} />
                    </div>
                </div>
            )}
            
            <div className="list-card">
                {accountsWithBalance.length > 0 ? (
                    <div className="list-grid">
                        {accountsWithBalance.map(acc => (
                            <div key={acc.id} className="modern-list-item account-item">
                                <div className="item-icon-wrapper">
                                    <Building2 size={24} />
                                </div>
                                <div className="item-content">
                                    <div className="item-header">
                                        <h4 className="item-title">{acc.name}</h4>
                                        <span className={`item-amount ${acc.current_balance >= 0 ? 'positive' : 'negative'}`}>
                                            Q{acc.current_balance.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="item-subtitle">{acc.institution || 'Sin institución'}</p>
                                </div>
                                <div className="item-actions">
                                    <button 
                                        className="icon-button edit-button" 
                                        onClick={() => handleEdit(acc)}
                                        title="Editar cuenta"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        className="icon-button delete-button" 
                                        onClick={() => handleDelete(acc)}
                                        title="Eliminar cuenta"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Wallet size={64} className="empty-icon" />
                        <h3>No tienes cuentas</h3>
                        <p>¡Añade una cuenta para empezar a administrar tus finanzas!</p>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={20} />
                            Crear tu primera cuenta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsPage;