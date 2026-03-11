const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Fetch user bookings
fetch(`http://localhost:5000/api/booking/my-bookings`, {
  headers: {
    "Authorization": "Bearer " + token
  }
})
.then(res => res.json())
.then(data => {
  let output = "";

  if (data.length === 0) {
    output = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No bookings yet</h3>
        <p>You haven't booked any charging slots. Find a station and book now!</p>
        <br>
        <a href="stations.html" class="btn btn-primary btn-sm">Browse Stations →</a>
      </div>
    `;
  } else {
    data.forEach((booking, index) => {
      const statusClass = booking.status === 'approved' ? 'badge-approved' : 
                          booking.status === 'pending' ? 'badge-pending' :
                          booking.status === 'cancelled' ? 'badge-cancelled' : 'badge-rejected';
      const statusIcon = booking.status === 'approved' ? '✅' : 
                         booking.status === 'pending' ? '⏳' :
                         booking.status === 'cancelled' ? '❌' : '🚫';

      const dateStr = new Date(booking.booking_date).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      output += `
        <div class="booking-card fade-in" style="animation-delay: ${index * 0.08}s; opacity: 0;">
          <div class="booking-details">
            <h3>🏢 ${booking.station_name}</h3>
            <div class="booking-info-row">
              <div class="booking-info-item">
                🕐 <strong>${booking.slot_time}</strong>
              </div>
              <div class="booking-info-item">
                📅 <strong>${dateStr}</strong>
              </div>
              <div class="booking-info-item">
                <span class="badge ${statusClass}">${statusIcon} ${booking.status}</span>
              </div>
            </div>
            ${booking.status !== 'cancelled' ? 
              `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.booking_id})">
                Cancel Booking
              </button>` : ''}
          </div>
          <div class="booking-actions">
            ${booking.qr_code ? 
              `<img class="booking-qr" src="${booking.qr_code}" alt="QR Code">` : ''}
          </div>
        </div>
      `;
    });
  }

  document.getElementById("bookings").innerHTML = output;
});


// Cancel booking function
function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) {
    return;
  }

  fetch(`http://localhost:5000/api/booking/cancel/${bookingId}`, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message || "Booking cancelled", "success");
    setTimeout(() => location.reload(), 800);
  })
  .catch(() => {
    showToast("Server error. Please try again.", "error");
  });
}

function showToast(message, type) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
