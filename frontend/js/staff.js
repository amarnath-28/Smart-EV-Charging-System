const API_URL = "http://localhost:5000/api/staff";

// Global Station Object
let allStations = [];

// On Load
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  if (!token || role !== 'staff') {
    window.location.href = "login.html";
    return;
  }

  // Setup tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
      
      item.classList.add('active');
      const target = item.getAttribute('data-target');
      document.getElementById(target).classList.add('active');

      if(target === 'station-details') loadStation();
      if(target === 'manage-slots') loadSlots();
      if(target === 'manage-bookings') loadBookings();
    });
  });

  // Initial Load
  loadStation();
  loadSlots();
  loadBookings();
});

// Helper Function
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  };
}

// ====== UI Handlers Loaded Globaly by uiUtils.js ====== //

// ------ Station Operations ------
async function loadStation() {
  try {
    const res = await fetch(`${API_URL}/station`, { headers: getAuthHeaders() });
    const stations = await res.json();

    if (!res.ok) {
       document.getElementById("station-info-container").innerHTML = `<p style="color:red">${stations.message}</p>`;
       return;
    }

    allStations = stations;
    
    // 1. Populate Stations Dashboard Grid
    let output = "";
    let selectOptions = "";
    
    if (stations.length === 0) {
        output = "<p>No stations exist yet.</p>";
    } else {
        stations.forEach(station => {
            output += `
              <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                          <h4 style="font-size: 1.25rem; margin-bottom: 5px; color: var(--primary);">${station.name}</h4>
                          <p style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.9rem;">📍 ${station.location}</p>
                          <div style="display: flex; gap: 10px; font-size: 0.8rem; margin-bottom: 15px;">
                              <span class="badge" style="background: rgba(43, 116, 224, 0.1); color: var(--primary);">Total: ${station.total_slots}</span>
                              <span class="badge" style="background: rgba(39, 174, 96, 0.1); color: var(--success);">Available: ${station.available_slots || 0}</span>
                          </div>
                      </div>
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="toggleEditStationForm(true, ${station.id}, '${station.name.replace(/'/g, "\\'")}', '${station.location.replace(/'/g, "\\'")}', ${station.total_slots})">✏️ Edit Details</button>
              </div>
            `;
            
            // 2. Populate Dropdown for Add Slot
            selectOptions += `<option value="${station.id}">${station.name}</option>`;
        });
    }

    document.getElementById("station-info-container").innerHTML = output;
    
    const dropdown = document.getElementById("new-slot-station");
    if (dropdown) dropdown.innerHTML = selectOptions;

  } catch (error) {
    console.error("Failed to load station", error);
  }
}

function toggleEditStationForm(show = false, id = null, name = '', location = '', slots = 1) {
  document.getElementById('edit-station-form-container').style.display = show ? 'block' : 'none';
  if (show) {
      document.getElementById('edit-station-id').value = id;
      document.getElementById('edit-station-name').value = name;
      document.getElementById('edit-station-location').value = location;
      document.getElementById('edit-station-slots').value = slots;
  }
}

async function updateStation(e) {
  e.preventDefault();
  
  const payload = {
    id: document.getElementById("edit-station-id").value,
    name: document.getElementById("edit-station-name").value,
    location: document.getElementById("edit-station-location").value,
    total_slots: document.getElementById("edit-station-slots").value
  };

  try {
    const res = await fetch(`${API_URL}/station`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      toggleEditStationForm(false);
      loadStation();
    } else {
      showToast(data.message, "error");
    }
  } catch (error) {
    showToast("Error updating station", "error");
  }
}

// ------ Slot Operations ------
function toggleAddSlotForm() {
    const form = document.getElementById('add-slot-form-container');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function loadSlots() {
  try {
    const res = await fetch(`${API_URL}/slots`, { headers: getAuthHeaders() });
    const slots = await res.json();
    
    if(!res.ok) return;

    const tbody = document.getElementById("slots-table-body");
    tbody.innerHTML = "";

    slots.forEach(slot => {
      const statusClass = slot.status === 'booked' ? 'status-pending' : 'status-approved'; // reuse admin css colors
      tbody.innerHTML += `
        <tr>
          <td>#${slot.id}</td>
          <td><b>${slot.station_name}</b></td>
          <td><b>${slot.slot_time}</b></td>
          <td><span class="status-badge ${statusClass}">${slot.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="deleteSlot(${slot.id})">🗑️</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Failed to load slots", error);
  }
}

async function addSlot(e) {
  e.preventDefault();
  
  const payload = {
    station_id: document.getElementById("new-slot-station").value,
    slot_time: document.getElementById("new-slot-time").value,
    status: document.getElementById("new-slot-status").value,
  };

  try {
    const res = await fetch(`${API_URL}/slots`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      toggleAddSlotForm();
      document.getElementById("add-slot-form").reset();
      loadSlots();
    } else {
      showToast(data.message || "Failed to add slot", "error");
    }
  } catch (error) {
    showToast("Error adding slot", "error");
  }
}

async function deleteSlot(id) {
  if (!(await showConfirmModal("Are you sure you want to delete this slot?", "Delete Slot"))) return;

  try {
    const res = await fetch(`${API_URL}/slots/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      loadSlots();
    } else {
      showToast(data.message, "error");
    }
  } catch (error) {
    showToast("Error deleting slot", "error");
  }
}


// ------ Booking Operations ------
async function loadBookings() {
  try {
    const res = await fetch(`${API_URL}/bookings`, { headers: getAuthHeaders() });
    const bookings = await res.json();
    if(!res.ok) return;

    const tbody = document.getElementById("bookings-table-body");
    tbody.innerHTML = "";

    bookings.forEach(b => {
      const statusClass = b.status === "approved" ? "status-approved" : 
                          b.status === "rejected" ? "status-rejected" : "status-pending";
      
      let actions = "-";
      if (b.status === 'pending') {
          actions = `
              <button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${b.id}, 'approved')" style="margin-right: 5px;">Approve</button>
              <button class="btn btn-sm btn-outline" onclick="updateBookingStatus(${b.id}, 'rejected')">Reject</button>
          `;
      }

      tbody.innerHTML += `
        <tr>
          <td>#${b.id}</td>
          <td><b>${b.station_name}</b></td>
          <td>${b.user_name}</td>
          <td>${b.user_email}</td>
          <td>${b.slot_time}</td>
          <td>${new Date(b.booking_date).toLocaleDateString()}</td>
          <td><span class="status-badge ${statusClass}">${b.status}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Failed to load bookings", error);
  }
}

async function updateBookingStatus(id, newStatus) {
  if (!(await showConfirmModal(`Are you sure you want to ${newStatus} this booking?`, "Confirm Booking Status"))) return;

  try {
    const res = await fetch(`${API_URL}/bookings/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`Booking ${newStatus} successfully!`);
      loadBookings();
    } else {
      showToast(data.message || `Failed to update booking to ${newStatus}`, "error");
    }
  } catch (error) {
    showToast("Error updating booking status", "error");
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
