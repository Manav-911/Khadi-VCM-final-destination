const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class MeetingService {
  // Get all meetings
  static async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching meetings:", error);
      throw error;
    }
  }

  // Get single meeting (if needed for viewing details)
  static async getMeetingById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching meeting:", error);
      throw error;
    }
  }
}

export default MeetingService;
