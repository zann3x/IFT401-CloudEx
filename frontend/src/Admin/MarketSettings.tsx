import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

interface Holiday {
  id: number;
  date: string;
  name: string;
}

const MarketSettings: React.FC = () => {
  const [openTime, setOpenTime] = useState("09:30");
  const [closeTime, setCloseTime] = useState("16:00");
  const [message, setMessage] = useState("");

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  // Load current market hours
  useEffect(() => {
    fetch(`${API_BASE}/api/market_hours`)
      .then((res) => res.json())
      .then((data) => {
        setOpenTime(data.open_time);
        setCloseTime(data.close_time);
      })
      .catch(() => setMessage("Could not load current market hours."));
  }, []);

  // Load holiday list
  const loadHolidays = () => {
    fetch(`${API_BASE}/api/holidays`)
      .then((res) => res.json())
      .then((data) => setHolidays(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const saveSettings = () => {
    setMessage("");

    fetch(`${API_BASE}/api/market_hours`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        open_time: openTime,
        close_time: closeTime,
      }),
    })
      .then((res) => res.json())
      .then(() => setMessage("Updated successfully."))
      .catch(() => setMessage("There was an error saving settings."));
  };

  const addHoliday = () => {
    if (!newHolidayDate || !newHolidayName) {
      setMessage("Please enter both date and name for the holiday.");
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
      })
      .catch(() => setMessage("Error adding holiday."));
  };

  const deleteHoliday = (id: number) => {
    fetch(`${API_BASE}/api/holidays/${id}`, {
      method: "DELETE",
    })
      .then(() => loadHolidays())
      .catch(() => setMessage("Error deleting holiday."));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Market Hours Settings</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Open Time: </label>
        <input
          type="time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Close Time: </label>
        <input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
        />
      </div>

      <button onClick={saveSettings}>Save Hours</button>

      {message && <p style={{ color: "green" }}>{message}</p>}

      <hr style={{ margin: "20px 0" }} />

      <h3>Market Holiday Schedule</h3>

      <table border={1} cellPadding={8} style={{ marginBottom: 20 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Holiday Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((h) => (
            <tr key={h.id}>
              <td>{h.date}</td>
              <td>{h.name}</td>
              <td>
                <button
                  onClick={() => deleteHoliday(h.id)}
                  style={{ color: "red" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {holidays.length === 0 && (
            <tr>
              <td colSpan={3}>No holidays found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h4>Add New Holiday</h4>

      <div style={{ marginBottom: 10 }}>
        <label>Date: </label>
        <input
          type="date"
          value={newHolidayDate}
          onChange={(e) => setNewHolidayDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Name: </label>
        <input
          type="text"
          value={newHolidayName}
          onChange={(e) => setNewHolidayName(e.target.value)}
          placeholder="Holiday name"
        />
      </div>

      <button onClick={addHoliday}>Add Holiday</button>
    </div>
  );
};

export default MarketSettings;