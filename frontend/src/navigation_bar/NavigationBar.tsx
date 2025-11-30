import React, { useState, useEffect, useRef } from "react";
import { Container, Nav, Navbar, NavLink, Form, Dropdown } from "react-bootstrap";
import { Link, useNavigate} from 'react-router-dom';
import { logoutUser, searchStocksBar } from '../Api';
import { BsPersonCircle } from 'react-icons/bs';

interface StockResult {
    symbol: string;
    company_name: string;
}

interface NavigationBarProps {
    signedIn: boolean;
    setSignedIn: (isSignedIn: boolean) => void;
    role: string;
}

interface SearchBarProps {
    className: string;
    isMobile?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StockResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [dropdownWidth, setDropdownWidth] = useState<number>(0);

    const searchStocks = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        try {
            const results: StockResult[] = await searchStocksBar(query);
            setSearchResults(results);
            setShowDropdown(results.length > 0);
        } catch {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        if (inputRef.current) setDropdownWidth(inputRef.current.offsetWidth);
        const handleResize = () => {
            if (inputRef.current) setDropdownWidth(inputRef.current.offsetWidth);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        searchStocks(searchQuery);
    }, [searchQuery]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.length > 0) setShowDropdown(true);
    };

    const handleSelectStock = (symbol: string) => {
        navigate(`/Buy-Sell?symbol=${symbol}`);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleFocus = () => {
        if (searchQuery.trim() || searchResults.length > 0) {
            setShowDropdown(true);
        }
    };

    return (
        <div ref={searchRef} className={`position-relative ${className}`}>
            <Form className="d-flex" onSubmit={(e) => e.preventDefault()}>
                <Form.Control
                    type="search"
                    placeholder="Search Stocks (e.g., AAPL)"
                    ref={inputRef}
                    aria-label="Search"
                    value={searchQuery}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    className="rounded"
                />
            </Form>

            {showDropdown && searchResults.length > 0 && (
                <div
                    className="dropdown-menu show"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1050,
                        width: dropdownWidth,
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}
                >
                    {searchResults.map((stock) => (
                        <Dropdown.Item
                            key={stock.symbol}
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => handleSelectStock(stock.symbol)}
                        >
                            <div className="fw-bold">{stock.symbol}</div>
                            <small className="text-muted">{stock.company_name}</small>
                        </Dropdown.Item>
                    ))}
                </div>
            )}
        </div>
    );
};

const NavigationBar: React.FC<NavigationBarProps> = ({ signedIn, setSignedIn, role }) => {
    
    const navigate = useNavigate();

    const handleLogout = async () => {
        const userId = localStorage.getItem('user_id');
        
        setSignedIn(false);
        localStorage.removeItem('user_id');

        if (userId) {
            try {
                await logoutUser(userId); 
            } catch {
                console.error("Logout API failed");
            }
        }
        navigate('/Sign-In');
    };

    return (
        <Navbar expand="lg" className="bg-body-tertiary shadow-sm">
            <Container fluid>
                <Navbar.Brand as={Link} to="/Home">CloudEX</Navbar.Brand>

                {signedIn && role !== 'admin' && (
                    <div className="d-flex align-items-center order-lg-last">
                        <SearchBar className="me-2 d-none d-lg-flex" />
                        
                        <NavLink as={Link} to="/Profile" className="me-2" title="Profile/Settings">
                            <BsPersonCircle size={24} />
                        </NavLink>
                        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    </div>
                )}

                {!signedIn || role === 'admin' ? (
                    <Nav className="ms-auto d-flex align-items-center">
                        {role === 'admin' ? (
                            <NavLink onClick={handleLogout} style={{ cursor: 'pointer' }} className="text-danger fw-bold">
                                Logout
                            </NavLink>
                        ) : (
                            <div className="d-flex align-items-center me-3"> 
                                <NavLink as={Link} to="/Sign-In" className="me-3">Sign In</NavLink>
                                <NavLink as={Link} to="/Sign-Up">Sign Up</NavLink>
                            </div>
                        )}
                    </Nav>
                ) : (
                    <Navbar.Collapse id="responsive-navbar-nav" className="order-lg-0">
                        <Nav className="me-auto">
                            <NavLink as={Link} to="/Dashboard">Dashboard</NavLink>
                            <NavLink as={Link} to="/Buy-Sell">Buy/Sell</NavLink>
                            <NavLink as={Link} to="/Funds">Funds</NavLink>
                            <NavLink as={Link} to="/Transactions">Transactions</NavLink>
                        </Nav>

                        <SearchBar className="d-flex w-100 d-lg-none mt-2 mb-2" isMobile={true} />

                        <Nav>
                            <NavLink onClick={handleLogout} style={{ cursor: 'pointer' }} className="text-danger fw-bold d-lg-none">
                                Logout
                            </NavLink>
                        </Nav>
                    </Navbar.Collapse>
                )}
            </Container>
        </Navbar>
    );
};

export default NavigationBar;