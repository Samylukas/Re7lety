const API_URL = "ضع_الرابط_الجديد_هنا";

let allTrips = [];
let currentUser = null;

window.onload = function() {
  fetchTrips();
};

function fetchTrips() {
  fetch(API_URL + "?action=getTrips")
    .then(r => r.json())
    .then(data => {
      if (data.status === "success" && Array.isArray(data.data)) {
        allTrips = data.data;
        renderTrips(allTrips);
        populateTripDropdown(allTrips);
      } else {
        showError("No active services configured.");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      showError("Failed to reach server. Please try again.");
    });
}

function showError(msg) {
  document.getElementById("trips-container").innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #f87171; font-size: 16px; padding: 40px;">${msg}</p>`;
}

function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 16px; padding: 40px;">No available services in this section.</p>`;
    return;
  }

  trips.forEach(trip => {
    const id = trip.Id || 1;
    const title = trip.Title || "Scheduled Trip";
    const pickup = trip.PickupLocation || "Airport";
    const dropoff = trip.DropoffLocation || "Hotel Resort";
    const price = trip.Price || "0";
    const description = trip.Description || "Reliable scheduled transfer service.";

    container.innerHTML += `
      <div class="trip-card">
        <div class="card-img-wrapper">
          <span class="trip-tag">${pickup} &rarr; ${dropoff}</span>
          <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957" alt="${title}">
        </div>
        <div class="trip-info">
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="card-footer">
            <div class="trip-price">$${price} <span style="font-size:12px; font-weight:normal; color:#94a3b8;">/ seat</span></div>
            <button class="book-btn" onclick="openBookingModal(${id}, '${title}', ${price})">Book Now</button>
          </div>
        </div>
      </div>
    `;
  });
}

function filterTrips(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }

  if (category === 'all') {
    renderTrips(allTrips);
  } else {
    const filtered = allTrips.filter(t => {
      const p = String(t.PickupLocation || "").toLowerCase();
      const d = String(t.DropoffLocation || "").toLowerCase();
      const cat = category.toLowerCase();
      return p.includes(cat) || d.includes(cat);
    });
    renderTrips(filtered);
  }
}

function openBookingModal(id, title, price) {
  document.getElementById("modal-trip-title").innerText = "Book: " + title;
  document.getElementById("trip-title-input").value = id;
  document.getElementById("booking-modal").setAttribute("data-price", price);
  document.getElementById("booking-modal").style.display = "flex";
}

function openLoginModal() { 
  document.getElementById("login-modal").style.display = "flex"; 
}

function closeModal(id) { 
  document.getElementById(id).style.display = "none"; 
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value;
  const p = document.getElementById("loginPassword").value;

  fetch(`${API_URL}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`)
    .then(r => r.json())
    .then(res => {
      if (res.status === "success") {
        currentUser = res;
        closeModal('login-modal');
        setupDashboard();
      } else {
        alert("Invalid credentials.");
      }
    })
    .catch(() => alert("Authentication failed."));
}

function setupDashboard() {
  document.getElementById("loginNavBtn").style.display = "none";
  document.getElementById("logoutNavBtn").style.display = "inline-block";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcomeUser").innerText = `Welcome, ${currentUser.name} (${currentUser.role.toUpperCase()})`;

  if (currentUser.role.toLowerCase() === "superadmin" || currentUser.role.toLowerCase() === "admin") {
    document.getElementById("adminSummary").style.display = "flex";
  } else {
    document.getElementById("adminSummary").style.display = "none";
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
  fetch(`${API_URL}?action=getBookings`)
    .then(r => r.json())
    .then(res => {
      if (res.status === "success") {
        const tbody = document.getElementById("bookingsTableBody");
        tbody.innerHTML = "";
        let totalGuests = 0;

        res.data.forEach(b => {
          totalGuests += parseInt(b.ReservedSeats || 1);
          tbody.innerHTML += `
            <tr>
              <td>${new Date(b.BookedAt).toLocaleDateString()}</td>
              <td>Passenger #${b.PassengerId || 'Guest'}</td>
              <td>+2010xxxxxxx</td>
              <td>Trip #${b.TripId}</td>
              <td>${new Date(b.BookedAt).toLocaleDateString()}</td>
              <td>${b.ReservedSeats}</td>
              <td>${b.BookingStatus}</td>
            </tr>
          `;
        });

        if (currentUser && (currentUser.role.toLowerCase() === "superadmin" || currentUser.role.toLowerCase() === "admin")) {
          document.getElementById("totalBookings").innerText = res.data.length;
          document.getElementById("totalGuests").innerText = totalGuests;
        }
      }
    });
}

function submitBooking(e) {
  e.preventDefault();
  const tripId = document.getElementById("trip-title-input").value;
  const guests = document.getElementById("guests").value;
  const unitPrice = parseFloat(document.getElementById("booking-modal").getAttribute("data-price") || 0);

  const bookingData = {
    trip_id: tripId,
    guests: guests,
    total_amount: unitPrice * parseInt(guests),
    passenger_id: currentUser ? currentUser.accountId : 0,
    notes: document.getElementById("notes").value
  };

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  }).then(() => {
    alert("Reservation Saved Successfully!");
    closeModal('booking-modal');
    document.getElementById("booking-form").reset();
  });
}
