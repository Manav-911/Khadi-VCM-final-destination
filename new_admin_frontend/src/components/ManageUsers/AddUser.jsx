import React from 'react';
import '../../styles/ScheduleMeeting.css'; // Optional: include styling
import { useState } from 'react';
import supabase from '../../config/supabaseClient';

function AddUser({ open, onClose }) {
  if (!open) return null; // Don't render anything if not open

  const[name, setName] = useState('')
  const[email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const[office, setOffice] = useState('');
  const[phone, setPhone] = useState('');
  const[formError, setFormError] = useState(null);

  const handleSubmit = async(e) =>{

    e.preventDefault()

    if(!name || !email || !password || !office || !phone)
    {
      setFormError('Please fill in all fields correctly');
      console.log('fill all details');
    }
    const{data, error} = await supabase
    .from('users')
    .insert([{name, email, password, office, phone}])

    if(error)
    {
      setFormError(error);
      console.log(formError);
    }
    if(data)
    {
      setFormError(null);
      console.log(data);
    }
    alert("Form Submitted successfully");
    onClose(true);
  }

  return (
    <div className="overlay">
      <div className="popup">
        <h2>Add New User</h2>
        <form>
          <input type="text" placeholder="Name" value={name} onChange={(e=>setName(e.target.value))} required/>
          <input type="email" placeholder="Email" value={email} onChange={(e=>setEmail(e.target.value))} required />
          <input type="password" placeholder="Password" value={password} onChange={(e=>setPassword(e.target.value))} required />
          <input type="text" placeholder="Office" value={office} onChange={(e=>setOffice(e.target.value))} required/>
          <input type="tel" placeholder="Phone" value={phone} onChange={(e=>setPhone(e.target.value))} required/>
          <button type="submit" onClick={handleSubmit}>Add</button>
          <button type='close-btn' onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
