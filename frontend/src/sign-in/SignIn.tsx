import { Button, Card, Container, Form, Alert, Row, Col } from "react-bootstrap";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../Api"; 
import axios from "axios";
import "./SignIn.css";

const isEmail = (str: string): boolean => {
    return str.includes('@') && str.includes('.');
};

interface LoginCredentials {
    email?: string;
    username?: string;
    password_hash: string;
}

const SignIn = () => {
    const [formData, setFormData] = useState({
        identifier: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        let name: string | undefined;

        if (id === "formBasicIdentifier") {
            name = "identifier";
        } else if (id === "formBasicPassword") {
            name = "password";
        }

        if (name) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!formData.identifier || !formData.password) {
            setError("Email/Username and password are required.");
            return;
        }

        let credentials: LoginCredentials;

        if (isEmail(formData.identifier)) {
            credentials = {
                email: formData.identifier,
                password_hash: formData.password, 
            };
        } else {
            credentials = {
                username: formData.identifier,
                password_hash: formData.password, 
            };
        }

        setLoading(true);

        try {
            const response = await loginUser(credentials);
            const userId = response?.user?.user_id;

            if (userId) {
                localStorage.setItem('user_id', userId);
            } else {
                throw new Error("Login successful, but user ID was missing from the response.");
            }
            
            setSuccess(true);
            
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);

        } catch (err) {
            setLoading(false);
            
            let errorMessage: string = "Login failed. Check your credentials.";

            if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } 
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5"> 
            <Row>
                <Col md={6} lg={4} className="mx-auto"> 
                    <Card className="p-4 shadow">
                        <h2>Sign In</h2>
                        <p className="text-muted mb-0">
                            Don't have an account?
                            <Link className="link ms-2" to={"/Sign-Up"}>
                                Sign Up
                            </Link>
                        </p>
                        
                        {loading && <Alert variant="info">Logging in...</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">Login successful! Redirecting...</Alert>}

                        <Form onSubmit={handleSubmit}>
                            
                            <Form.Group className="mb-3" controlId="formBasicIdentifier">
                                <Form.Label>Email or Username</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter email or username" 
                                    onChange={handleChange}
                                    value={formData.identifier}
                                    disabled={loading}
                                    required
                                />
                                <Form.Text className="text-muted">
                                    We'll never share your data with anyone else.
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
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Forgot your password?
                                    <a className="link ms-2" href="/Reset-Password">
                                        Reset Password
                                    </a>
                                </Form.Text>
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

export default SignIn;