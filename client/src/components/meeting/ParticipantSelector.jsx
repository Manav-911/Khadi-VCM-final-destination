import React, { useState, useEffect } from "react";
import axios from "axios";
import "./participantselector.css";

export default function ParticipantSelector({
  show,
  onClose,
  onSelect,
  selected,
}) {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedIndividuals, setSelectedIndividuals] = useState([]);
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch participants and offices from API
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (show) {
      setLoading(true);
      Promise.all([
        axios.get("http://localhost:3000/meeting/getUsers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/meeting/getOffices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
        .then(([partRes, offRes]) => {
          const officesMap = {};
          offRes.data.forEach((office) => {
            officesMap[office.id] = office.name;
          });

          const participantsWithOffice = partRes.data.map((p) => ({
            ...p,
            officeName: officesMap[p.office] || "Unknown Office",
          }));
          console.log("Fetched Participants:", participantsWithOffice);
          setParticipants(participantsWithOffice);
          setOffices(offRes.data || []);
        })
        .catch(() => {
          setParticipants([]);
          setOffices([]);
        })
        .finally(() => setLoading(false));
    }
  }, [show]);

  // Sync selected prop when popup opens
  useEffect(() => {
    if (show) {
      setSelectedIndividuals(selected?.individuals || []);
      setSelectedOffices(selected?.offices || []);
    }
  }, [show, selected]);

  // Filter participants
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.officeName.toLowerCase().includes(search.toLowerCase())
  );

  // Filter offices
  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle individual
  const toggleIndividual = (id) => {
    setSelectedIndividuals((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  // Toggle office
  const toggleOffice = (officeName) => {
    const office = offices.find((o) => o.name === officeName);
    if (!office) return;

    const officeParticipants = participants
      .filter((p) => p.officeName === officeName) // ✅ compare by officeName
      .map((p) => p.id);

    if (selectedOffices.includes(officeName)) {
      // Deselect
      setSelectedOffices((prev) => prev.filter((n) => n !== officeName));
      setSelectedIndividuals((prev) =>
        prev.filter((id) => !officeParticipants.includes(id))
      );
    } else {
      // Select
      setSelectedOffices((prev) => [...prev, officeName]);
      setSelectedIndividuals((prev) => [
        ...new Set([...prev, ...officeParticipants]),
      ]);
    }
  };

  // Finalize selection
  const handleDone = () => {
    const selectedParticipantNames = participants
      .filter((p) => selectedIndividuals.includes(p.id))
      .map((p) => p.name);

    onSelect({
      individuals: selectedParticipantNames, // names only
      offices: selectedOffices,
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="ps-modal-overlay">
      <div className="ps-modal ps-modal-elevated">
        <button className="ps-close-btn" onClick={onClose} title="Close">
          &times;
        </button>
        <h2 className="ps-title">Select Participants</h2>

        {/* Search bar */}
        <div className="ps-searchbar-wrap">
          <input
            className="ps-search"
            type="text"
            placeholder="Search by name or office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Table */}
        <div className="ps-table">
          <div className="ps-table-header">
            <div>
              <span className="ps-header-icon">&#128100;</span> Individual
            </div>
            <div>
              <span className="ps-header-icon">&#128188;</span> Office
            </div>
          </div>
          <div className="ps-table-body">
            {/* Individuals */}
            <div className="ps-col">
              {loading ? (
                <div className="ps-empty">Loading...</div>
              ) : filteredParticipants.length === 0 ? (
                <div className="ps-empty">No individuals found.</div>
              ) : (
                filteredParticipants.map((p) => (
                  <label
                    className={`ps-row${
                      selectedIndividuals.includes(p.id)
                        ? " ps-row-selected"
                        : ""
                    }`}
                    key={p.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndividuals.includes(p.id)}
                      onChange={() => toggleIndividual(p.id)}
                    />
                    <span className="ps-row-name">
                      {p.name} ({p.officeName})
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Offices */}
            <div className="ps-col">
              {loading ? (
                <div className="ps-empty">Loading...</div>
              ) : filteredOffices.length === 0 ? (
                <div className="ps-empty">No offices found.</div>
              ) : (
                filteredOffices.map((o) => (
                  <label
                    className={`ps-row${
                      selectedOffices.includes(o.name) ? " ps-row-selected" : ""
                    }`}
                    key={o.name}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOffices.includes(o.name)}
                      onChange={() => toggleOffice(o.name)}
                    />
                    <span className="ps-row-name">{o.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

          {/* Summary */}
          <div className="ps-selected-summary">
            <div>
              <span className="ps-summary-label">Selected Individuals:</span>{" "}
              {selectedIndividuals.length > 0 ? (
                participants
                  .filter((p) => selectedIndividuals.includes(p.id))
                  .map((p) => p.name)
                  .join(", ")
              ) : (
                <span className="ps-summary-na">N/A</span>
              )}
            </div>
            <div>
              <span className="ps-summary-label">Selected Offices:</span>{" "}
              {selectedOffices.length > 0 ? (
                selectedOffices.join(", ")
              ) : (
                <span className="ps-summary-na">N/A</span>
              )}
            </div>
          </div>

        {/* Actions */}
        <div className="ps-actions">
          <button className="ps-btn" onClick={handleDone}>
            Done
          </button>
          <button className="ps-btn ps-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
