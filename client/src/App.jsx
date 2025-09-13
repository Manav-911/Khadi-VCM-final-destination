// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import RequestMeetingForm from './components/meeting/RequestMeetingForm';
import PreviousMeeting from "./components/meeting/PreviousMeeting";
import { MeetingProvider } from "./context/MeetingContext";

function App() {
  return (
    <Router>
      <MeetingProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<CalendarView />} />
            <Route path="request" element={<RequestMeetingForm />} />
            <Route path="previous" element={<PreviousMeeting />} />
          </Route>
        </Routes>
      </MeetingProvider>
    </Router>
  );
}

export default App;
