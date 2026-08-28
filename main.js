const API_URL = "https://script.google.com/macros/s/AKfycbwEUJdsuEmOvlBETHJVxGjYGOaLgWVbdnF_xKvS-zaeJV6gnHUNpwdlF-H-0URO9aneQQ/exec";

let allTrips = [];
let currentUser = null;

window.onload = function() {
  fetchTrips();
};

function fetchTrips() {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      if (data.status === "success") {
        allTrips = data.data;
        renderTrips(allTrips);
        populateTripDropdown(allTrips);
      } else {
        showError("Unable to retrieve excursions.");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      showError("Connection timeout. Please refresh.");
    });
}

function showError(msg) {
  document.getElementById("trips-container").innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #f87171; font-size: 18px;">${msg}</p>`;
}

function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 18px;">No experiences found in this category.</p>`;
    return;
  }

  trips.forEach(trip => {
    container.innerHTML += `
      <div class="trip-card">
        <div class="card-img-wrapper">
          <span class="trip-tag">${trip.category}</span>
          <img src="${trip.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'}" alt="${trip.title}">
        </div>
        <div class="trip-info">
          <h3>${trip.title}</h3>
          <p>${trip.description || 'Experience the best of the Red Sea coast with guided professionals.'}</p>
          <div class="card-footer">
            <div class="trip-price">$${trip.price} <span style="font-size:12px; font-weight:normal; color:#94a3b8;">/ person</span></div>
            <button class="book-btn" onclick="openBookingModal('${trip.title}')">Book Now</button>
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
    const filtered = allTrips.filter(t => t.category === category || t.category === getArabicCategory(category));
    renderTrips(filtered);
  }
}

function getArabicCategory(cat) {
  const map = {
    'Marine': 'بحري',
    'Safari': 'سفاري',
    'Diving': 'غوص',
    'Cultural': 'ثقافي',
    'Transfers': 'توصيلات',
    'Packages': 'باقات'
  };
  return map[cat] || cat;
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
        alert("Invalid credentials.");
      }
    })
    .catch(() => alert("Authentication server unavailable."));
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
  select.innerHTML = '<option value="">All Excursions</option>';
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
