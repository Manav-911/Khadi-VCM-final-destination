const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class MeetingService {
  // Get all meetings
  static async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        credentials: 'include', // include cookies for auth
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  }

  // Get meetings for logged-in user
  static async getMeetingsForUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        credentials: 'include', // important for cookie-based auth
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user meetings:', error);
      throw error;
    }
  }
}

export default MeetingService;
