// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import RequestMeetingForm from './components/meeting/RequestMeetingForm';
import { MeetingProvider } from "./context/MeetingContext";

function App() {
  return (
    <BrowserRouter>
      <MeetingProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<CalendarView />} /> {/* default on /dashboard */}
            <Route path="request" element={<RequestMeetingForm />} />
          </Route>
        </Routes>
      </MeetingProvider>
    </BrowserRouter>
  );
}

export default App;
