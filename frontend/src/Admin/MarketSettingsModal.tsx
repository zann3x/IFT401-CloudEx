import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

interface Props {
    show: boolean;
    handleClose: () => void;
}

const API_BASE: string = "http://127.0.0.1:5000";

const MarketSettingsModal: React.FC<Props> = ({ show, handleClose }) => {
    const [openTime, setOpenTime] = useState("09:30");
    const [closeTime, setCloseTime] = useState("16:00");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (!show) return;

        fetch('${API_BASE}/api/market_hours')
            .then((res) => res.json())
            .then((data) => {
                if (data.open_time) setOpenTime(data.open_time);
                if (data.close_time) setCloseTime(data.close_time);
            })
            .catch(() => setMsg("Error loading market hours."));
    }, [show]);

    const save = () => {
        setMsg("");

        fetch('${API_BASE}/api/market_hours', {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                open_time: openTime,
                close_time: closeTime,
            }),
        })
            .then((res) => res.json())
            .then(() => setMsg("Updated successfully."))
            .catch(() => setMsg("Error saving settings."));
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Market Hours Settings</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {msg && <Alert variant="info">{msg}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Market Open Time</Form.Label>
                    <Form.Control
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Market Close Time</Form.Label>
                    <Form.Control
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                    />
                </Form.Group>

                <Button className="w-100" variant="primary" onClick={save}>
                    Save Changes
                </Button>
            </Modal.Body>
        </Modal>
    );
};

export default MarketSettingsModal;