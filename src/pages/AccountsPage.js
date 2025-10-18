import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext'; // <-- 1. Importa el Hook
import AccountModal from '../components/AccountModal';
import './ListPage.css';

const AccountsPage = () => {
    // 2. Obtén TODOS los datos necesarios del contexto
    const { accounts, transactions, transfers, loading } = useData();
    const [showModal, setShowModal] = useState(false);

    // 3. QUITA todo el 'useState' y 'useEffect' de 'fetchData'. Ya no es necesario.

    // 4. 'useMemo' ahora usa los datos del contexto y se recalculará solo
    const accountsWithBalance = useMemo(() => {
        return accounts.map(account => {
            let balance = parseFloat(account.opening_balance);

            // Sumar/Restar Transacciones
            for (const tx of transactions) {
                if (tx.account_id === account.id) {
                    if (tx.type === 'Ingreso') {
                        balance += parseFloat(tx.amount);
                    } else if (tx.type === 'Gasto') {
                        balance -= parseFloat(tx.amount);
                    }
                }
            }

            // Sumar/Restar Transferencias
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
    }, [accounts, transactions, transfers]); // Depende de los datos del contexto

    if (loading) {
        return <div>Cargando datos...</div>;
    }

    return (
        <div>
            {/* 5. El modal ya NO necesita la prop 'refreshAccounts' */}
            {showModal && <AccountModal closeModal={() => setShowModal(false)} />}
            
            <div className="header">
                <h2>Cuentas</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Añadir Cuenta</button>
            </div>

            <p className="page-description">Administra tus fuentes de ingresos y gastos.</p>
            
            <div className="card">
                {accountsWithBalance.length > 0 ? (
                    accountsWithBalance.map(acc => (
                        <div key={acc.id} className="list-item">
                            <div className="list-item-main">
                                <h4>{acc.name}</h4>
                                <p>{acc.institution || 'Sin institución'}</p>
                            </div>
                            <div className="list-item-details">
                                <span className="list-item-amount">
                                    Q{acc.current_balance.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No tienes cuentas. ¡Añade una para empezar!</p>
                )}
            </div>
        </div>
    );
};

export default AccountsPage;