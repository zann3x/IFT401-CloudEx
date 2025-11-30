import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { Card, Form, Button, Alert, ListGroup, Row, Col, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; 
import { deleteUser, updateUserProfile, getFullWishlist, removeFromWishlist, logoutUser } from "../Api"; 

type WishlistItem = { 
    stock_id: string; 
    symbol: string; 
    company_name: string;
    price: number | string | null;
};

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusType, setStatusType] = useState<"success" | "danger">("success");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    useEffect(() => {
        const loadWishlist = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) return;

            try {
                const data = await getFullWishlist(userId); 
                
                let stockList: any[] = [];
                if (data && typeof data === 'object' && 'watchlist' in data && Array.isArray(data.watchlist)) {
                    stockList = data.watchlist;
                } else if (Array.isArray(data)) {
                    stockList = data;
                }
                
                setWishlist(stockList as WishlistItem[]);
            } catch (error) {
                console.error("Failed to load wishlist:", error);
            }
        };
        loadWishlist();
    }, []);

    const handleRemoveStock = async (stock_id: string) => {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const stockToRemove = wishlist.find(item => item.stock_id === stock_id);
        const symbolDisplay = stockToRemove ? stockToRemove.symbol : "Stock";

        try {
            await removeFromWishlist(userId, stock_id);
            setWishlist((prevList) => prevList.filter((item) => item.stock_id !== stock_id));
            setStatusMessage(`Removed ${symbolDisplay} from wishlist.`);
            setStatusType("success");
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.error("Failed to remove stock:", error);
            setStatusMessage("Failed to remove stock. Please try again.");
            setStatusType("danger");
        }
    };

    const handleLogout = async () => {
        const userId = localStorage.getItem("user_id");
        if (userId) {
            try {
                await logoutUser(userId);
            } catch (error) {
                console.error("Logout API call failed, forcing local logout:", error);
            }
        }
        
        localStorage.removeItem("user_id");
        navigate("/Login");
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatusMessage(null);
        
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            setStatusMessage("User ID not found. Please log in again.");
            setStatusType("danger");
            setIsLoading(false);
            return;
        }

        try {
            const updateData: { email?: string; username?: string; password_hash?: string } = {};
            if (email) updateData.email = email;
            if (username) updateData.username = username;
            if (password) updateData.password_hash = password;

            if (Object.keys(updateData).length === 0) {
                setStatusMessage("Enter details to update your account.");
                setStatusType("danger");
                setIsLoading(false); 
                return;
            }

            const result = await updateUserProfile(userId, updateData); 
            
            setStatusMessage(result.message);
            setStatusType(result.status === "success" ? "success" : "danger");

            if (result.status === "success") {
                setPassword(""); 
            }
        } catch (error) {
            setStatusMessage("Failed to update account.");
            setStatusType("danger");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            setStatusMessage("User ID not found.");
            setStatusType("danger");
            setShowDeleteConfirm(false);
            return;
        }

        setIsLoading(true);
        setShowDeleteConfirm(false); 
        try {
            await deleteUser(userId);
            setWishlist([]);
            localStorage.removeItem("user_id");
            navigate("/Home"); 
        } catch (error) {
            setStatusMessage("Failed to delete user account.");
            setStatusType("danger");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center m-3">
            <Card className="p-3 w-100 shadow-lg rounded-xl" style={{ maxWidth: "600px" }}>
                <Card.Body>
                    <Card.Title className="mb-4 text-center font-bold text-xl">Account Profile</Card.Title>

                    {statusMessage && (
                        <Alert variant={statusType} className="rounded-lg">
                            {statusMessage}
                        </Alert>
                    )}

                    <Form onSubmit={handleUpdate}>
                        <Row>
                            <Col xs={12} md={6}>
                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter new email"
                                        value={email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6}>
                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter new username"
                                        value={username}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter new password (optional)"
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <Form.Text className="text-muted">Leave blank to keep current password.</Form.Text>
                        </Form.Group>

                        <Button type="submit" variant="primary" className="w-full mb-4" disabled={isLoading}>
                            {isLoading ? "Processing..." : "Update Account"}
                        </Button>
                    </Form>

                    <Card className="mb-4 shadow-sm rounded-lg">
                        <Card.Header className="font-semibold bg-gray-100">Your Watchlist</Card.Header>
                        <ListGroup variant="flush">
                            {wishlist.length > 0 ? (
                                wishlist.map((item) => {
                                    const priceVal = Number(item.price);
                                    const isValidPrice = !isNaN(priceVal) && item.price !== null;

                                    return (
                                        <ListGroup.Item key={item.stock_id}>
                                            <div className="d-flex justify-content-between align-items-center font-mono">
                                                <div>
                                                    <span className="font-bold text-blue-700 text-lg">{item.symbol}</span>
                                                    <div className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                                        {item.company_name}
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center">
                                                    <span className="fw-bold me-3">
                                                        {isValidPrice ? `$${priceVal.toFixed(2)}` : 'N/A'}
                                                    </span>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleRemoveStock(item.stock_id)}
                                                        title="Remove from Watchlist"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })
                            ) : (
                                <ListGroup.Item className="text-muted text-center">
                                    No items in watchlist.
                                </ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>

                    <Row className="mt-4 gx-3">
                        <Col xs={6} className="mb-3 mb-md-0">
                            <Button 
                                variant="warning" 
                                className="w-full fw-bold text-dark" 
                                onClick={handleLogout} 
                                disabled={isLoading}
                            >
                                Logout
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button 
                                variant="outline-danger" 
                                className="w-full" 
                                onClick={() => setShowDeleteConfirm(true)} 
                                disabled={isLoading}
                            >
                                Delete Account
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">Confirm Account Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete Permanently
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProfilePage;