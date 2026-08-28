// ضع رابط Web App الجديد هنا
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
        showError("No services configured yet.");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      showError("Server response error. Please try again.");
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
    const title = trip.title || trip.Title || "Excursions & Transfers";
    const category = trip.category || trip.Category || "Services";
    const price = trip.price || trip.Price || "0";
    const image = trip.image || trip.Image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957";
    const description = trip.description || trip.Description || "Reliable service in Marsa Alam & El Quseir.";

    container.innerHTML += `
      <div class="trip-card">
        <div class="card-img-wrapper">
          <span class="trip-tag">${category}</span>
          <img src="${image}" alt="${title}">
        </div>
        <div class="trip-info">
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="card-footer">
            <div class="trip-price">$${price} <span style="font-size:12px; font-weight:normal; color:#94a3b8;">/ service</span></div>
            <button class="book-btn" onclick="openBookingModal('${title}')">Book Now</button>
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
      const c = String(t.category || t.Category || "").toLowerCase().trim();
      const target = category.toLowerCase().trim();
      return c === target || c.includes(target);
    });
    renderTrips(filtered);
  }
}

function openBookingModal(title) {
  document.getElementById("modal-trip-title").innerText = "Book: " + title;
  document.getElementById("trip-title-input").value = title;
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
        alert("Invalid Username or Password.");
      }
    })
    .catch(() => alert("Authentication failed."));
}

function setupDashboard() {
  document.getElementById("loginNavBtn").style.display = "none";
  document.getElementById("logoutNavBtn").style.display = "inline-block";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcomeUser").innerText = `Welcome, ${currentUser.name} (${currentUser.role.toUpperCase()})`;

  if (currentUser.role === "admin") {
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
    select.innerHTML += `<option value="${t.title}">${t.title}</option>`;
  });
}

function loadDashboardData() {
  const date = document.getElementById("dashDateFilter").value;
  const trip = document.getElementById("dashTripFilter").value;

  fetch(`${API_URL}?action=getBookings&date=${date}&trip=${encodeURIComponent(trip)}`)
    .then(r => r.json())
    .then(res => {
      if (res.status === "success") {
        const tbody = document.getElementById("bookingsTableBody");
        tbody.innerHTML = "";
        let totalGuests = 0;

        res.data.forEach(b => {
          totalGuests += parseInt(b.Guests || 1);
          tbody.innerHTML += `
            <tr>
              <td>${new Date(b.Date_Submitted).toLocaleDateString()}</td>
              <td>${b.Name}</td>
              <td>${b.Phone}</td>
              <td>${b.Trip_Title}</td>
              <td>${b.Trip_Date}</td>
              <td>${b.Guests}</td>
              <td>${b.Notes}</td>
            </tr>
          `;
        });

        if (currentUser && currentUser.role === "admin") {
          document.getElementById("totalBookings").innerText = res.data.length;
          document.getElementById("totalGuests").innerText = totalGuests;
        }
      }
    });
}

function submitBooking(e) {
  e.preventDefault();
  const bookingData = {
    trip_title: document.getElementById("trip-title-input").value,
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    trip_date: document.getElementById("trip-date").value,
    guests: document.getElementById("guests").value,
    notes: document.getElementById("notes").value
  };

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  }).then(() => {
    alert("Reservation Request Sent Successfully!");
    closeModal('booking-modal');
    document.getElementById("booking-form").reset();
  });
}
