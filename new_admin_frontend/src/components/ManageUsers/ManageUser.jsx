import React from "react";
import supabase from "../../config/supabaseClient";
import { useState, useEffect } from "react";
import AddUser from "./AddUser";
import axios from "axios";
import "../../App.css";

function ManageUser() {
  const [fetchAll, setFetchAll] = useState([]);
  const [action, setAction] = useState("Nouser");
  const [openPopup, setOpenPopup] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Extract fetchUsers to be reusable
  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(
        "http://localhost:3000/manageUser/getUsers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched users:", response.data);

      // response.data is now the array directly
      setFetchAll(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error(err);
      setFetchAll([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const handleRemoveUser = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.delete(
        `http://localhost:3000/manageUser/deleteUser`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { id },
        }
      );

      if (response.data.success) {
        console.log("User removed successfully");
        // Refresh the user list
        setRefreshTrigger((prev) => prev + 1);
      } else {
        console.error("Failed to remove user:", response.data.message);
      }
    } catch (err) {
      console.error("Error removing user:", err);
    }
  };

  const handleUserAdded = () => {
    // Refresh the user list when a new user is added
    console.log("User added, refreshing list...");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClosePopup = () => {
    setAction("Nouser");
    setOpenPopup(false);
  };

  return (
    <>
      <button
        className="add-user-btn"
        onClick={() => {
          setAction("user");
          setOpenPopup(true);
        }}
      >
        ADD USER
      </button>

      <table className="meeting-table">
        <thead>
          <tr className="meeting-table tr">
            <th>ID</th>
            <th>NAME</th>
            <th>EMAIL</th>
            <th>PHONE</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fetchAll.length === 0 ? (
            <tr>
              <td colSpan="5">No users yet</td>
            </tr>
          ) : (
            fetchAll.map((fa) => (
              <tr key={fa.id}>
                <td>{fa.id}</td>
                <td>{fa.name}</td>
                <td>{fa.email}</td>
                <td>{fa.phone}</td>
                <td>
                  <button
                    className="status rejected"
                    onClick={() => handleRemoveUser(fa.id)}
                  >
                    REMOVE
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {action === "user" && openPopup && (
        <div className="model-overlay">
          <AddUser
            open={true}
            onClose={handleClosePopup}
            onUserAdded={handleUserAdded} // Pass the callback
          />
        </div>
      )}
    </>
  );
}

export default ManageUser;
