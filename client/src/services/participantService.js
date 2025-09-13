const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class ParticipantService {
  static async getAllParticipants() {
    const response = await fetch(`${API_BASE_URL}/participants`, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  static async getAllOffices() {
    const response = await fetch(`${API_BASE_URL}/offices`, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
}

export default ParticipantService;
