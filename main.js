// =========================================================================
// Re7lety Platform - Main Integrated Logic
// =========================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbyRv5Jayl2Ky2QZKfe16THx5Xrq7LjaeBtehoY2T37VtE4P9M4Hoguc_wSC2BTSNUuv6w/exec";
const COMPANY_WHATSAPP = "201000000000"; // استبدل برقم واتساب الشركة بدون مفتاح +

let allTrips = [];
let currentUser = null;

window.onload = function() {
  fetchTrips();
};

function fetchTrips() {
  const url = `${API_URL}?action=getTrips&t=${new Date().getTime()}`;
  
  fetch(url, { method: "GET", redirect: "follow" })
    .then(r => r.json())
    .then(data => {
      if (data && data.status === "success" && Array.isArray(data.data)) {
        allTrips = data.data;
        renderTrips(allTrips);
        populateTripDropdown(allTrips);
      } else {
        showError("No active services or trips found in spreadsheet.");
      }
    })
    .catch(err => {
      console.error("Connection Error:", err);
      showError("Failed to reach server. Please test your Google Apps Script Deployment.");
    });
}

function showError(msg) {
  const container = document.getElementById("trips-container");
  if (container) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #f87171; font-size: 16px; padding: 40px;">${msg}</p>`;
  }
}

// عرض كروت الليموزين ورابط الخريطة الجغرافي
function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  if (!container) return;
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 16px; padding: 40px;">No available services in this section.</p>`;
    return;
  }

  const luxuryLimoImg = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop";

  trips.forEach(trip => {
    const id = trip.Id || 1;
    const title = trip.Title || "Scheduled Transfer";
    const pickup = trip.PickupLocation || "Airport";
    const dropoff = trip.DropoffLocation || "Resort";
    const price = trip.Price || "0";
    const description = trip.Description || "Reliable scheduled transfer service.";

    const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;

    container.innerHTML += `
      <div class="trip-card">
        <div class="card-img-wrapper">
          <span class="trip-tag">${pickup} &rarr; ${dropoff}</span>
          <a href="${routeUrl}" target="_blank" class="map-btn-link" title="Open Google Maps Route">
            <i class="fa-solid fa-map-location-dot"></i> View Route
          </a>
          <img src="${luxuryLimoImg}" alt="${title}">
        </div>
        <div class="trip-info">
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="card-footer">
            <div class="trip-price">$${price} <span style="font-size:12px; font-weight:normal; color:#94a3b8;">/ seat</span></div>
            <button class="book-btn" onclick="openBookingModal(${id}, '${title.replace(/'/g, "\\'")}', ${price})">Book Now</button>
          </div>
        </div>
      </div>
    `;
  });
}

function filterTrips(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  if (category === 'all') {
    renderTrips(allTrips);
  } else {
    const filtered = allTrips.filter(t => {
      const p = String(t.PickupLocation || "").toLowerCase();
      const d = String(t.DropoffLocation || "").toLowerCase();
      const desc = String(t.Description || "").toLowerCase();
      const title = String(t.Title || "").toLowerCase();
      const cat = category.toLowerCase();

      return p.includes(cat) || d.includes(cat) || desc.includes(cat) || title.includes(cat);
    });
    renderTrips(filtered);
  }
}

function openBookingModal(id, title, price) {
  const modalTitle = document.getElementById("modal-trip-title");
  const tripInput = document.getElementById("trip-title-input");
  const modal = document.getElementById("booking-modal");

  if (modalTitle) modalTitle.innerText = "Book: " + title;
  if (tripInput) tripInput.value = id;
  if (modal) {
    modal.setAttribute("data-price", price);
    modal.style.display = "flex";
  }
}

function openLoginModal() { 
  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "flex"; 
}

function closeModal(id) { 
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none"; 
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value.trim();

  const url = `${API_URL}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}&t=${new Date().getTime()}`;

  fetch(url, { method: "GET", redirect: "follow" })
    .then(r => r.json())
    .then(res => {
      if (res && res.status === "success") {
        currentUser = res;
        closeModal('login-modal');
        setupDashboard();
      } else {
        alert("Authentication failed: " + (res.message || "Invalid credentials"));
      }
    })
    .catch(err => {
      console.error(err);
      alert("Authentication server unavailable.");
    });
}

function setupDashboard() {
  const loginBtn = document.getElementById("loginNavBtn");
  const logoutBtn = document.getElementById("logoutNavBtn");
  const dashboard = document.getElementById("dashboard");
  const welcomeText = document.getElementById("welcomeUser");
  const adminSummary = document.getElementById("adminSummary");

  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  if (dashboard) dashboard.style.display = "block";
  if (welcomeText && currentUser) {
    welcomeText.innerText = `Welcome, ${currentUser.name} (${String(currentUser.role).toUpperCase()})`;
  }

  if (adminSummary && currentUser) {
    const role = String(currentUser.role).toLowerCase();
    if (role === "superadmin" || role === "admin" || role === "companyadmin") {
      adminSummary.style.display = "flex";
    }
  }

  loadDashboardData();
}

function logout() {
  location.reload();
}

function populateTripDropdown(trips) {
  const select = document.getElementById("dashTripFilter");
  if (!select) return;
  select.innerHTML = '<option value="">All Services</option>';
  trips.forEach(t => {
    select.innerHTML += `<option value="${t.Id}">${t.Title}</option>`;
  });
}

function loadDashboardData() {
  const url = `${API_URL}?action=getBookings&t=${new Date().getTime()}`;

  fetch(url, { method: "GET", redirect: "follow" })
    .then(r => r.json())
    .then(res => {
      if (res && res.status === "success") {
        const tbody = document.getElementById("bookingsTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        let totalGuests = 0;

        res.data.forEach(b => {
          const seats = parseInt(b.ReservedSeats || b.guests || 1);
          totalGuests += seats;
          const bookedDate = b.BookedAt ? new Date(b.BookedAt).toLocaleDateString() : new Date().toLocaleDateString();
          
          const passengerName = b.PassengerName || b.passengername || (b.PassengerId ? 'Passenger #' + b.PassengerId : 'Guest');
          const passengerPhone = b.PassengerPhone || b.passengerphone || 'N/A';

          tbody.innerHTML += `
            <tr>
              <td>${bookedDate}</td>
              <td>${passengerName}</td>
              <td>${passengerPhone}</td>
              <td>Trip #${b.TripId || 'N/A'}</td>
              <td>${bookedDate}</td>
              <td>${seats}</td>
              <td><span style="color: #34d399; font-weight: 600;">${b.BookingStatus || 'Confirmed'}</span></td>
            </tr>
          `;
        });

        const totalBookingsElem = document.getElementById("totalBookings");
        const totalGuestsElem = document.getElementById("totalGuests");
        if (totalBookingsElem) totalBookingsElem.innerText = res.data.length;
        if (totalGuestsElem) totalGuestsElem.innerText = totalGuests;
      }
    });
}

function submitBooking(e) {
  e.preventDefault();
  const tripId = document.getElementById("trip-title-input").value;
  const guests = document.getElementById("guests").value;
  const passengerName = document.getElementById("passenger-name").value;
  const passengerPhone = document.getElementById("passenger-phone").value;
  const notes = document.getElementById("notes").value || "None";
  
  const modal = document.getElementById("booking-modal");
  const unitPrice = parseFloat(modal ? modal.getAttribute("data-price") : 0) || 0;
  const totalAmount = unitPrice * parseInt(guests);

  const bookingData = {
    trip_id: tripId,
    guests: guests,
    passenger_name: passengerName,
    passenger_phone: passengerPhone,
    total_amount: totalAmount,
    passenger_id: currentUser ? currentUser.accountId : 0,
    notes: notes
  };

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  }).then(() => {
    const waText = `*New Reservation Request - Re7lety*%0A` +
                   `*Name:* ${encodeURIComponent(passengerName)}%0A` +
                   `*Phone:* ${encodeURIComponent(passengerPhone)}%0A` +
                   `*Trip Ref:* Trip #${tripId}%0A` +
                   `*Passengers:* ${guests}%0A` +
                   `*Total Price:* $${totalAmount}%0A` +
                   `*Pickup Location / Notes:* ${encodeURIComponent(notes)}`;

    window.open(`https://wa.me/${COMPANY_WHATSAPP}?text=${waText}`, '_blank');

    closeModal('booking-modal');
    const form = document.getElementById("booking-form");
    if (form) form.reset();
    if (currentUser) loadDashboardData();
  }).catch(err => {
    console.error(err);
    alert("Error registering booking.");
  });
}
