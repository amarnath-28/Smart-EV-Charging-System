const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Get stationId from URL
const urlParams = new URLSearchParams(window.location.search);
const stationId = urlParams.get("stationId");

if (!stationId) {
  document.getElementById("slots").innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">⚠️</div>
      <h3>No station selected</h3>
      <p>Please go back and select a station first</p>
      <br>
      <a href="stations.html" class="btn btn-primary btn-sm">← Back to Stations</a>
    </div>
  `;
}

// Fetch available slots
if (stationId) {
  fetch(`http://localhost:5000/api/booking/slots/${stationId}`)
    .then(res => res.json())
    .then(data => {
      let output = "";

      if (data.length === 0) {
        output = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">😔</div>
            <h3>No slots available</h3>
            <p>All slots for this station are currently booked. Try another station.</p>
            <br>
            <a href="stations.html" class="btn btn-outline btn-sm">← Browse other stations</a>
          </div>
        `;
      } else {
        data.forEach((slot, index) => {
          output += `
            <div class="slot-card fade-in" style="animation-delay: ${index * 0.06}s; opacity: 0;">
              <div class="slot-info">
                <div class="slot-icon">🕐</div>
                <div>
                  <div class="slot-time">${slot.slot_time}</div>
                  <div class="slot-status">● Available</div>
                </div>
              </div>
              <button class="btn btn-success btn-sm" onclick="bookSlot(${slot.id})">
                Book
              </button>
            </div>
          `;
        });
      }

      document.getElementById("slots").innerHTML = output;
    });
}

// Book slot function
function bookSlot(slotId) {
  fetch("http://localhost:5000/api/booking/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      slot_id: slotId
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.qr_code) {
      showToast("Slot booked successfully! 🎉", "success");

      const qrSection = document.getElementById("qrSection");
      const qrImg = document.getElementById("qrImage");
      qrImg.src = data.qr_code;
      qrSection.classList.add("visible");
      qrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Refresh slots
      setTimeout(() => location.reload(), 2000);
    } else {
      showToast(data.message || "Booking failed", "error");
    }
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
  setTimeout(() => toast.remove(), 3500);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
