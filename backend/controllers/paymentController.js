const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const QRCode = require('qrcode');

const RAZORPAY_KEY_ID = 'rzp_test_Sf1S2V1e1suBmj';
const RAZORPAY_KEY_SECRET = 'IRdbVsHMrXoPXXeIlXl790a4';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', slot_id } = req.body;
    const user_id = req.user.id;

    if (!amount || !slot_id) {
      return res.status(400).json({ message: "Amount and slot_id are required" });
    }

    const options = {
      amount: amount * 100, // Razorpay amount is in paise
      currency,
      receipt: `receipt_user_${user_id}_slot_${slot_id}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

exports.verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, slot_id } = req.body;
  const user_id = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !slot_id) {
    return res.status(400).json({ message: "Missing required payment parameters" });
  }

  // Verify Signature
  const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  // If valid, check slot availability and book
  const updateSlot = "UPDATE slots SET status='booked' WHERE id=? AND status='available'";

  db.query(updateSlot, [slot_id], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error updating slot" });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Slot already booked or invalid" });
    }

    // Generate Booking
    const getStation = "SELECT station_id FROM slots WHERE id=?";
    
    db.query(getStation, [slot_id], async (err, data) => {
      if (err) return res.status(500).json(err);

      const station_id = data[0].station_id;

      // Generate QR Code data
      const timeStamp = new Date().toISOString();
      const bookingData = `User:${user_id}, Slot:${slot_id}, Station:${station_id}, Date:${timeStamp}`;

      try {
        const qrImage = await QRCode.toDataURL(bookingData);

        const insertBooking = `
          INSERT INTO bookings 
          (user_id, slot_id, station_id, booking_date, status, qr_code, payment_status)
          VALUES (?, ?, ?, CURDATE(), 'approved', ?, 'paid')`;

        db.query(insertBooking, [user_id, slot_id, station_id, qrImage], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error inserting booking" });
          }

          res.json({
            message: "Payment successful and slot booked! 🚗⚡",
            qr_code: qrImage
          });
        });
      } catch (qrError) {
        console.error("QR Error:", qrError);
        res.status(500).json({ message: "Failed to generate QR code" });
      }
    });
  });
};
