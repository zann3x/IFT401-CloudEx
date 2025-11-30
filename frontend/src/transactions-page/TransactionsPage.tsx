import React, { useState, useEffect } from 'react';
import Transactions from './Transactions';
import { getUserTransactions } from '../Api'; // Import the new API function
import { Container, Spinner, Alert } from 'react-bootstrap'; 

// Define the structure for a transaction item
interface TransactionItem {
    date: string;
    type: string; // e.g., 'Buy' or 'Sell'
    stockName: string;
    stockSymbol: string;
    shares: number;
    pricePerShare: number;
    totalAmount: number;
}

// Define the interface for the raw data coming from the API
interface RawTransaction {
    transaction_date: string;
    transaction_type: string; // Assuming the type field exists as this key
    stock_name: string;      // Assuming the name field exists as this key
    symbol: string;          // Assuming the symbol field exists as this key
    shares: string;          // Comes as string
    price_per_share: string; // Comes as string
    total_amount: string;    // Assuming the total amount is available
    [key: string]: any;      // Allow other keys like stock_id, transaction_id
}

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to map raw API data to the component's required interface
    const mapToTransactionItem = (rawItem: RawTransaction): TransactionItem => {
        const shares = parseFloat(rawItem.shares || '0') || 0;
        const pricePerShare = parseFloat(rawItem.price_per_share || '0') || 0;
        const totalAmount = parseFloat(rawItem.total_amount || '0') || (shares * pricePerShare);

        return {
            // Mapping keys and ensuring safe parsing
            date: rawItem.transaction_date,
            type: rawItem.transaction_type || rawItem.type || 'N/A',
            stockName: rawItem.stock_name || 'N/A Name',
            stockSymbol: rawItem.symbol || 'N/A Symbol',
            shares: shares,
            pricePerShare: pricePerShare,
            totalAmount: totalAmount,
        };
    };

    useEffect(() => {
        const fetchTransactions = async () => {
            const userId = localStorage.getItem("user_id");

            if (!userId) {
                setError("User ID not found. Please log in.");
                setLoading(false);
                return;
            }

            try {
                const data = await getUserTransactions(userId);
                
                // --- REQUIRED CONSOLE LOG ---
                console.log("[DEBUG] User Transactions API Result:", data);
                
                // The transaction list is correctly nested under the 'transactions' key
                const rawTransactions: RawTransaction[] = data.transactions || [];

                if (Array.isArray(rawTransactions)) {
                    // Map the raw backend response to the clean frontend interface
                    const mappedTransactions = rawTransactions.map(mapToTransactionItem);
                    setTransactions(mappedTransactions);
                } else {
                    setTransactions([]);
                }
                
            } catch (err) {
                console.error("Failed to fetch transactions:", err);
                setError("Failed to load transaction history.");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading Transactions...</span>
                </Spinner>
                <p className="mt-2">Loading transactions...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="text-center">
                    {error}
                </Alert>
            </Container>
        );
    }

    if (transactions.length === 0) {
        return (
            <Container className="py-5 text-center">
                <p className="text-muted">No transaction history found.</p>
            </Container>
        );
    }

    return (
        <Container className='py-4'>
            <h4 className='mb-4'>Transaction History</h4>
            {transactions.map((share, index) => (
                <Transactions 
                    key={index}
                    date={share.date}
                    type={share.type}
                    stockName={share.stockName}
                    stockSymbol={share.stockSymbol}
                    shares={share.shares}
                    pricePerShare={share.pricePerShare}
                    totalAmount={share.totalAmount}
                />
            ))}
        </Container>
    )
}

export default TransactionsPage;