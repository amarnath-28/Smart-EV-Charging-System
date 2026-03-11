// admin.js

const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

// Redirect if not admin
if (!token || role !== 'admin') {
  alert("Unauthorized access. Admin privileges required.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  // Load Analytics by default
  fetchAnalytics();

  // Tab switching logic
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".admin-section");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Update active state
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      // Show corresponding section
      const target = item.getAttribute("data-target");
      sections.forEach(sec => sec.classList.remove("active"));
      document.getElementById(target).classList.add("active");

      // Fetch data based on selected tab
      if (target === "analytics") fetchAnalytics();
      if (target === "users") fetchUsers();
      if (target === "bookings") fetchBookings();
      if (target === "stations") fetchStations();
    });
  });
});

// Fetch functions
async function authFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    alert("Session expired or unauthorized. Please login again.");
    logout();
  }
  return response.json();
}

async function fetchAnalytics() {
  try {
    const data = await authFetch("http://localhost:5000/api/admin/analytics");
    const grid = document.getElementById("analytics-grid");
    grid.innerHTML = `
      <div class="stat-card fade-in" style="animation-delay: 0s;">
        <span class="stat-label">Total Users</span>
        <span class="stat-value">${data.users}</span>
      </div>
      <div class="stat-card fade-in" style="animation-delay: 0.1s;">
        <span class="stat-label">Total Stations</span>
        <span class="stat-value">${data.stations}</span>
      </div>
      <div class="stat-card fade-in" style="animation-delay: 0.2s;">
        <span class="stat-label">Total Bookings</span>
        <span class="stat-value">${data.bookings}</span>
      </div>
      <div class="stat-card fade-in" style="animation-delay: 0.3s; border-left: 4px solid var(--warning);">
        <span class="stat-label">Pending Bookings</span>
        <span class="stat-value">${data.pending_bookings}</span>
      </div>
      <div class="stat-card fade-in" style="animation-delay: 0.4s; border-left: 4px solid var(--accent);">
        <span class="stat-label">Approved Bookings</span>
        <span class="stat-value">${data.approved_bookings}</span>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching analytics:", error);
  }
}

async function fetchUsers() {
  try {
    const data = await authFetch("http://localhost:5000/api/admin/users");
    const tbody = document.getElementById("users-table-body");
    
    tbody.innerHTML = data.length === 0 ? `<tr><td colspan="5" style="text-align:center;">No users found</td></tr>` : '';
    
    data.forEach(user => {
      tbody.innerHTML += `
        <tr>
          <td>#${user.id}</td>
          <td><strong>${user.name}</strong></td>
          <td>${user.email}</td>
          <td>${user.phone || 'N/A'}</td>
          <td><span class="badge ${user.role === 'admin' ? 'badge-approved' : 'badge-pending'}">${user.role.toUpperCase()}</span></td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function fetchBookings() {
  try {
    const data = await authFetch("http://localhost:5000/api/admin/bookings");
    const tbody = document.getElementById("bookings-table-body");
    
    tbody.innerHTML = data.length === 0 ? `<tr><td colspan="7" style="text-align:center;">No bookings found</td></tr>` : '';
    
    data.forEach(booking => {
      let statusClass = "badge-pending";
      if (booking.status === "approved") statusClass = "badge-approved";
      if (booking.status === "rejected" || booking.status === "cancelled") statusClass = "badge-rejected";

      let actions = '';
      if (booking.status === "pending") {
         actions = `
          <div class="action-buttons">
            <button class="btn btn-success btn-sm" onclick="updateBooking(${booking.booking_id}, 'approved')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="updateBooking(${booking.booking_id}, 'rejected')">Reject</button>
          </div>
         `;
      } else {
         actions = `<span style="color:var(--text-muted); font-size:13px;">No actions available</span>`;
      }

      tbody.innerHTML += `
        <tr>
          <td>#${booking.booking_id}</td>
          <td>
            <strong>${booking.user_name}</strong><br>
            <span style="font-size:12px;color:var(--text-muted);">${booking.user_email}</span>
          </td>
          <td>${booking.station_name}</td>
          <td>${booking.slot_time}</td>
          <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
          <td><span class="badge ${statusClass}">${booking.status.toUpperCase()}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

async function fetchStations() {
  try {
    // stations route is public
    const response = await fetch("http://localhost:5000/api/stations");
    const data = await response.json();
    const tbody = document.getElementById("stations-table-body");
    
    tbody.innerHTML = data.length === 0 ? `<tr><td colspan="5" style="text-align:center;">No stations found</td></tr>` : '';
    
    data.forEach(station => {
      tbody.innerHTML += `
        <tr>
          <td>#${station.id}</td>
          <td><strong>${station.name}</strong></td>
          <td>${station.location}</td>
          <td>${station.total_slots}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteStation(${station.id}, '${station.name}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
  }
}

// Action handlers
async function updateBooking(bookingId, status) {
  if (!confirm(`Are you sure you want to mark this booking as ${status}?`)) return;

  try {
    const data = await authFetch(`http://localhost:5000/api/admin/bookings/${bookingId}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    
    if (data.message) {
      alert(data.message);
      fetchBookings(); // Refresh list
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    alert("Failed to update booking status");
  }
}

async function deleteStation(stationId, stationName) {
  if (!confirm(`DANGER! Are you sure you want to delete station "${stationName}"? This action cannot be undone.`)) return;

  try {
    const data = await authFetch(`http://localhost:5000/api/admin/stations/${stationId}`, {
      method: "DELETE"
    });
    
    if (data.message) {
      alert(data.message);
      fetchStations(); // Refresh list
    }
  } catch (error) {
    console.error("Error deleting station:", error);
    alert("Failed to delete station");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  window.location.href = "login.html";
}
