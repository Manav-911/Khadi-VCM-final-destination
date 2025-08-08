import React from 'react';
import supabase from '../../config/supabaseClient';
import { useState, useEffect } from 'react';
import AddUser from './AddUser';

function ManageUser() {

  const [fetchAll, setFetchAll] = useState(null);
  const [openPopup1, setOpenPopup1] = useState(false);

  useEffect(()=>{
    const fetchUsers = async()=>{
      const {data, error} = await supabase
      .from('users')
      .select()

      if(error){
        setFetchAll(null);
        console.log(error);
      }
      if(data)
      {
        setFetchAll(data);
      }
    }
    fetchUsers();
  }, []);
  
  return (
    <div>
      <div>
        <button className="left-btn" onClick={()=>setOpenPopup1(true)}>
            Add user
          </button>
      </div>
            <table className='meeting-table'>
        <thead>
          <tr className='meeting-table tr'>
            <th>ID</th>
            <th>NAME</th>
            <th>EMAIL</th>
            <th>PASSWORD</th>
            <th>OFFICE</th>
            <th>PHONE</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fetchAll===null?null: (
            fetchAll.length==0?(
              <tr><td colSpan="5">No meetings yet</td></tr>
            ):(
              fetchAll.map(fa=>(
                <tr key={fa.id}>
                  <td>{fa.id}</td>
                  <td>{fa.name}</td>
                  <td>{fa.email}</td>
                  <td>{fa.password}</td>
                  <td>{fa.office}</td>
                  <td>{fa.phone}</td>
                  <td><button className='status rejected'> REMOVE </button></td>
                </tr>
              ))
            ))}
        </tbody>
      </table>
    <div className="model-overlay">
      <AddUser 
      open={openPopup1}
      onClose={()=>setOpenPopup1(false)}
      />
    </div>
    </div>

  )
}

export default ManageUser

