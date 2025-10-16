import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AccountsPage = () => {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data, error } = await supabase.from('accounts').select('*');
            if (error) console.error('Error fetching accounts:', error);
            else setAccounts(data);
        };
        fetchAccounts();
    }, []);

    return (
        <div>
            <div className="header">
                <h2>Cuentas</h2>
                <button className="btn-primary">+ Añadir Cuenta</button>
            </div>
            <div className="card">
                {accounts.length > 0 ? (
                    accounts.map(acc => (
                        <div key={acc.id} className="list-item">
                            <div className="list-item-main">
                                <h4>{acc.name}</h4>
                                <p>{acc.institution || 'Sin institución'}</p>
                            </div>
                            <span className="list-item-amount">
                                Q{acc.opening_balance.toFixed(2)}
                            </span>
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