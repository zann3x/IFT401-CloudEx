import { Button, Card, Col, Container, Form, Row, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUser } from "../Api";
import axios from "axios";

const SignUp = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        
        let name;
        if (id === "formBasicUsername") {
            name = "username";
        } else if (id === "formBasicEmail") {
            name = "email";
        } else if (id === "formBasicPassword") {
            name = "password";
        } else if (id === "formBasicConfirmPassword") {
            name = "confirmPassword";
        }

        if (name) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        const userDataToSend = {
            username: formData.username,
            email: formData.email,
            password_hash: formData.password, 
        };

        setLoading(true);

        try {
            await createUser(userDataToSend);
            
            setSuccess(true);
            setLoading(false);
            
            setTimeout(() => {
                navigate("/Sign-In");
            }, 1500);

        } catch (err) {
            setLoading(false);
            
            let errorMessage: string = "Registration failed. Please try again.";

            if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.error) {
                 errorMessage = err.response.data.error;
            } 
            
            setError(errorMessage);
        }
    };

    return (
        <Container className="py-5">
            <Row>
                {/* Col sets the max width: 
                  - On medium screens (md): takes 6 columns (half width)
                  - On large screens (lg): takes 4 columns (one-third width)
                  mx-auto centers the column horizontally
                */}
                <Col md={6} lg={4} className="mx-auto"> 
                    <Card className="p-4 shadow">
                        <h2>Sign Up</h2>
                        <p className="text-muted mb-3">
                            Already have an account?
                            <Link className="link ms-2" to={"/Sign-In"}>
                                Sign in
                            </Link>
                        </p>
                        
                        {loading && <Alert variant="info">Creating account...</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">Account created successfully! Redirecting to sign in...</Alert>}
                        
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="formBasicUsername">
                                <Form.Label>Username</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter username" 
                                    onChange={handleChange}
                                    value={formData.username}
                                    disabled={loading}
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    placeholder="Enter email" 
                                    onChange={handleChange}
                                    value={formData.email}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    We'll never share your email with anyone else.
                                </Form.Text>
                            </Form.Group>
                            
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    placeholder="Password" 
                                    onChange={handleChange}
                                    value={formData.password}
                                    disabled={loading}
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                                <Form.Label>Confirm Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Confirm Password"
                                    onChange={handleChange}
                                    value={formData.confirmPassword}
                                    disabled={loading}
                                />
                            </Form.Group>
                            
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SignUp;