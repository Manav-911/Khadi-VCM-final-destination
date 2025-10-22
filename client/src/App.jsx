// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import RequestMeetingForm from './components/meeting/RequestMeetingForm';
import PreviousMeeting from "./components/meeting/PreviousMeeting";
import MeetingStatus from './components/meeting/MeetingStatus';
import { MeetingProvider } from "../src/components/context/MeetingContext";
import ForgotPasswordRequest from './pages/ForgotPass';
import ResetPass from './pages/ResetPass';

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
            <Route path="stat" element={<MeetingStatus />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
          <Route path="/reset-password" element={<ResetPass />} />
        </Routes>
      </MeetingProvider>
    </Router>
  );
}

export default App;
