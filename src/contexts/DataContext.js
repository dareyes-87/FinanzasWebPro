import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// 1. Crear el Contexto
const DataContext = createContext();

// 2. Crear el "Proveedor" (el componente que tendrá toda la lógica)
export const DataProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [scheduledTransactions, setScheduledTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // 3. Crear las funciones de carga de datos
    // Usamos useCallback para que React no las re-cree innecesariamente

    const fetchAccounts = useCallback(async () => {
        const { data, error } = await supabase.from('accounts').select('*').order('name');
        if (error) console.error('Error fetching accounts:', error);
        else setAccounts(data);
    }, []);

    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) console.error('Error fetching categories:', error);
        else setCategories(data);
    }, []);

    const fetchTransactions = useCallback(async () => {
        const { data, error } = await supabase.from('transactions').select('*, categories ( name, color )').order('date', { ascending: false });
        if (error) console.error('Error fetching transactions:', error);
        else setTransactions(data);
    }, []);
    
    const fetchTransfers = useCallback(async () => {
        const { data, error } = await supabase.from('transfers').select('*').order('date', { ascending: false });
        if (error) console.error('Error fetching transfers:', error);
        else setTransfers(data);
    }, []);

    const fetchScheduledTransactions = useCallback(async () => {
        const { data, error } = await supabase
            .from('scheduled_transactions')
            .select('*, categories ( name, color )') // Traemos la categoría
            .order('next_due_date');
        
        if (error) console.error('Error fetching scheduled transactions:', error);
        else setScheduledTransactions(data);
    }, []);

    // 4. Función "Maestra" para recargar todo
    const refreshAllData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchAccounts(),
            fetchCategories(),
            fetchTransactions(),
            fetchTransfers(),
            fetchScheduledTransactions()
        ]);
        setLoading(false);
    }, [fetchAccounts, fetchCategories, fetchTransactions, fetchTransfers, fetchScheduledTransactions]);

    
    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);


    const value = {
        accounts,
        categories,
        transactions,
        transfers,
        scheduledTransactions,
        loading,
        refreshAllData // La función clave que usarán los modales
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

// 7. Crear un "Hook" personalizado para usar el contexto fácilmente
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};