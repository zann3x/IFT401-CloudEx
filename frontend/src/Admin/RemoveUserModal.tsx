import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

interface RemoveUserModalProps {
    show: boolean;
    handleClose: () => void;
    onSubmit: (identifier: string) => Promise<void>;
}

const RemoveUserModal: React.FC<RemoveUserModalProps> = ({ show, handleClose, onSubmit }) => {
    const [identifier, setIdentifier] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Reset state when closing
    const handleModalClose = () => {
        setIdentifier('');
        setError('');
        setSuccess('');
        handleClose();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!identifier) {
            setError('Please enter the User ID, Username, or Email.'); // Updated message
            return;
        }

        if (!window.confirm(`Are you sure you want to permanently delete the user identified by: ${identifier}? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);

        try {
            await onSubmit(identifier); 
            setSuccess(`User identified by '${identifier}' removed successfully!`);
            
            setIdentifier('');
            
            setTimeout(handleModalClose, 1500);
        } catch (err) {
            const msg = (err as Error)?.message || 'Failed to remove user.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleModalClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-danger">Remove User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Alert variant="warning" className="mb-3">
                        **Warning:** Removing a user is permanent. All associated data (transactions, portfolio, etc.) may be lost.
                    </Alert>

                    <Form.Group className="mb-3" controlId="formUserIdentifier">
                        <Form.Label>User ID, Username, or Email</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter User ID (1001), Username (admin), or Email" // Updated placeholder
                            value={identifier} 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)} 
                            required 
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Enter the unique ID, Username, or Email of the user you wish to remove.
                        </Form.Text>
                    </Form.Group>

                    <div className="d-grid">
                        <Button variant="danger" type="submit" disabled={loading}>
                            {loading ? 'Removing...' : 'Permanently Remove User'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default RemoveUserModal;