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
              <button id="btn-${slot.id}" class="btn btn-success btn-sm" onclick="processPaymentAndBook(${slot.id})">
                Pay & Book
              </button>
            </div>
          `;
        });
      }

      document.getElementById("slots").innerHTML = output;
    });
}

// Razorpay Payment and Booking Flow
async function processPaymentAndBook(slotId) {
  const btn = document.getElementById(`btn-${slotId}`);
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = `⏳ Processing...`;
    btn.disabled = true;

    // 1. Create order via Backend
    const amount = 100; // Fixed amount for testing
    const orderResponse = await fetch("http://localhost:5000/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ amount, slot_id: slotId })
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      throw new Error(orderData.message || "Failed to create order");
    }

    // 2. Configure Razorpay parameters
    const options = {
      key: "rzp_test_Sf1S2V1e1suBmj", 
      amount: orderData.amount,
      currency: orderData.currency,
      name: "EV Charging",
      description: "Slot Booking Payment",
      order_id: orderData.order_id,
      prefill: {
        name: "EV Charging Client",
        email: "client@evcharge.com",
        contact: "9876543210"
      },
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true
      },
      handler: async function (response) {
        // 3. Verify Payment with Backend
        showToast("Payment Successful! Verifying booking...", "info");
        
        try {
          const verifyRes = await fetch("http://localhost:5000/api/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              slot_id: slotId
            })
          });
          
          const verifyData = await verifyRes.json();
          
          if (verifyRes.ok && verifyData.qr_code) {
            showToast("Slot booked successfully! 🎉", "success");
            const qrSection = document.getElementById("qrSection");
            const qrImg = document.getElementById("qrImage");
            qrImg.src = verifyData.qr_code;
            qrSection.classList.add("visible");
            qrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Refresh slots after short delay
            setTimeout(() => location.reload(), 3000);
          } else {
            showToast(verifyData.message || "Booking verification failed", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        } catch (err) {
          showToast("Payment verified but error creating booking", "error");
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      },
      theme: {
        color: "#1fc600"
      }
    };

    // 4. Open Razorpay Checkout Window
    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
      showToast("Payment Failed: " + response.error.description, "error");
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
    rzp1.open();

  } catch (error) {
    showToast(error.message || "Error initiating payment", "error");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Removed local showToast as UI is now global

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
