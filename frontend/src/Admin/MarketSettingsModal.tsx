import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Table } from "react-bootstrap";

interface Props {
    show: boolean;
    handleClose: () => void;
}

const API_BASE = "http://127.0.0.1:5000";

interface Holiday {
    id: number;
    date: string;
    name: string;
}

const MarketSettingsModal: React.FC<Props> = ({ show, handleClose }) => {
    const [openTime, setOpenTime] = useState("09:30");
    const [closeTime, setCloseTime] = useState("16:00");
    const [msg, setMsg] = useState("");

    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayName, setNewHolidayName] = useState("");

    useEffect(() => {
        if (!show) return;

        setMsg("");

        fetch(`${API_BASE}/api/market_hours`)
            .then((res) => res.json())
            .then((data) => {
                if (data.open_time) setOpenTime(data.open_time);
                if (data.close_time) setCloseTime(data.close_time);
            });

        loadHolidays();
    }, [show]);

    const loadHolidays = () => {
        fetch(`${API_BASE}/api/holidays`)
            .then((res) => res.json())
            .then((data) => setHolidays(data))
            .catch(() => {});
    };

    const saveHours = () => {
        setMsg("");

        fetch(`${API_BASE}/api/market_hours`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                open_time: openTime,
                close_time: closeTime,
            }),
        })
            .then((res) => res.json())
            .then(() => setMsg("Market hours updated successfully."))
            .catch(() => setMsg("Error saving market hours."));
    };

    const addHoliday = () => {
        if (!newHolidayDate || !newHolidayName) {
            setMsg("Please enter both a date and holiday name.");
            return;
        }

        fetch(`${API_BASE}/api/holidays`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: newHolidayDate,
                name: newHolidayName,
            }),
        })
            .then(() => {
                setNewHolidayDate("");
                setNewHolidayName("");
                loadHolidays();
                setMsg("Holiday added.");
            })
            .catch(() => setMsg("Error adding holiday."));
    };

    const deleteHoliday = (id: number) => {
        fetch(`${API_BASE}/api/holidays/${id}`, {
            method: "DELETE",
        })
            .then(() => {
                loadHolidays();
                setMsg("Holiday removed.");
            })
            .catch(() => setMsg("Error deleting holiday."));
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Market Settings</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>
                {msg && <Alert variant="info">{msg}</Alert>}

                <h5>Market Hours</h5>

                <Form.Group className="mb-3">
                    <Form.Label>Open Time</Form.Label>
                    <Form.Control
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Close Time</Form.Label>
                    <Form.Control
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                    />
                </Form.Group>

                <Button
                    variant="primary"
                    className="w-100 mb-4"
                    onClick={saveHours}
                >
                    Save Market Hours
                </Button>

                <hr />

                <h5>Market Holiday Schedule</h5>

                <Table striped bordered hover size="sm" className="mt-2">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Holiday Name</th>
                            <th style={{ width: "80px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holidays.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center">
                                    No holidays found.
                                </td>
                            </tr>
                        )}

                        {holidays.map((h) => (
                            <tr key={h.id}>
                                <td>{h.date}</td>
                                <td>{h.name}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => deleteHoliday(h.id)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <h6 className="mt-3">Add New Holiday</h6>

                <Form.Group className="mb-2">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Holiday Name</Form.Label>
                    <Form.Control
                        type="text"
                        value={newHolidayName}
                        onChange={(e) => setNewHolidayName(e.target.value)}
                        placeholder="e.g., Independence Day"
                    />
                </Form.Group>

                <Button variant="success" className="w-100" onClick={addHoliday}>
                    Add Holiday
                </Button>
            </Modal.Body>
        </Modal>
    );
};

export default MarketSettingsModal;
