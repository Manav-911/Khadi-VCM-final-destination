const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class MeetingService {
  // Get all meetings
  static async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        credentials: 'include',
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

  // Get single meeting
  static async getMeetingById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw error;
    }
  }

  // Create new meeting
  static async createMeeting(meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Update meeting
  static async updateMeeting(id, meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  // Delete meeting
  static async deleteMeeting(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  // Get available conference rooms
  static async getAvailableRooms(startTime, durationMinutes = 60, officeId = null) {
    try {
      const params = new URLSearchParams({
        start_time: startTime,
        duration_minutes: durationMinutes.toString(),
      });

      if (officeId) {
        params.append('office_id', officeId.toString());
      }

      const response = await fetch(`${API_BASE_URL}/meetings/available-rooms?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      throw error;
    }
  }

  // Helper method to format meeting data for API
  static formatMeetingForAPI(calendarEvent, userId = null) {
    const startTime = new Date(calendarEvent.start);
    const endTime = new Date(calendarEvent.end);
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

    return {
      title: calendarEvent.title,
      description: calendarEvent.extendedProps?.description || '',
      start_time: startTime.toISOString(),
      duration_minutes: durationMinutes,
      requested_by: userId,
      conference_room_id: calendarEvent.extendedProps?.conference_room_id || null,
      want_room: calendarEvent.extendedProps?.want_room || false,
      link: calendarEvent.extendedProps?.link || null,
    };
  }
}

export default MeetingService;
