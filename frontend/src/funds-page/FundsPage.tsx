import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { PlusCircleFill, DashCircleFill, WalletFill } from 'react-bootstrap-icons';
import { 
    getUserBalance, 
    addFunds, 
    withdrawFunds 
} from '../Api'; 

interface UserBalanceResponse {
    balance: number;
}

interface AddFundsResponse {
    status: string;
    message?: string;
    new_balance: number;
}

const FundsPage = () => {
    const [balance, setBalance] = useState(0.00); 
    const [addAmount, setAddAmount] = useState<string>('');
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const USER_ID = localStorage.getItem('user_id') || "";
    
    useEffect(() => {
        const fetchBalance = async () => {
            setLoading(true);
            if (!USER_ID || USER_ID === "") {
                setLoading(false);
                setMessage({ type: 'danger', text: 'User ID not found. Please log in.' });
                return;
            }

            try {
                const response = await getUserBalance(USER_ID);
                const fetchedBalance = Number(response.balance) || 0;
                setBalance(fetchedBalance);
            } catch (error) {
                setMessage({ type: 'danger', text: 'Failed to load user balance. Please check API status.' });
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [USER_ID]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const amount = parseFloat(addAmount);
        
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'danger', text: 'Please enter a valid amount to add.' });
            return;
        }

        try {
            const response: AddFundsResponse = await addFunds(USER_ID, amount);
            
            const newBalance = Number(response.new_balance);
            
            setBalance(newBalance);
            setMessage({ type: 'success', text: `Successfully added $${amount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}.` });
            setAddAmount('');

        } catch (error) {
            setMessage({ type: 'danger', text: 'Transaction failed. Check server logs.' });
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        const amount = parseFloat(withdrawAmount);

        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'danger', text: 'Please enter a valid amount to withdraw.' });
            return;
        }

        if (amount > balance) {
            setMessage({ type: 'danger', text: `Withdrawal amount ($${amount.toFixed(2)}) exceeds current balance ($${balance.toFixed(2)}).` });
            return;
        }

        await withdrawFunds(USER_ID, amount); 
        const newBalance = balance - amount;
        setBalance(newBalance);
        setMessage({ type: 'success', text: `Successfully withdrew $${amount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}.` });
        setWithdrawAmount('');
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <p>Loading balance...</p>
            </Container>
        );
    }
    
    return (
        <Container className="py-4">
            <h2 className="mb-4">Funds Management</h2>

            <Card className="mb-4 shadow-sm bg-primary text-white">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <WalletFill size={20} className="me-2" />
                        <Card.Text className="h4 d-inline align-middle">Current Balance</Card.Text>
                    </div>
                    <Card.Text className="h1 mb-0">
                        ${balance.toFixed(2)}
                    </Card.Text>
                </Card.Body>
            </Card>

            {message && (
                <Alert variant={message.type} className="mb-4">
                    {message.text}
                </Alert>
            )}

            <Row className="g-4">
                <Col md={6}>
                    <Card className="shadow-sm border-success">
                        <Card.Header className="bg-success text-white h5">
                            <PlusCircleFill size={20} className="me-2" /> Add Funds
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAdd}>
                                <Form.Group className="mb-3" controlId="addAmount">
                                    <Form.Label>Amount to Add ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="e.g., 100.00"
                                        min="0.01"
                                        step="0.01"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Button variant="success" type="submit" className="w-100">
                                    Add Funds
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="shadow-sm border-danger">
                        <Card.Header className="bg-danger text-white h5">
                            <DashCircleFill size={20} className="me-2" /> Withdraw Funds
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleWithdraw}>
                                <Form.Group className="mb-3" controlId="withdrawAmount">
                                    <Form.Label>Amount to Withdraw ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="e.g., 50.00"
                                        min="0.01"
                                        step="0.01"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Button variant="danger" type="submit" className="w-100">
                                    Withdraw Funds
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default FundsPage;