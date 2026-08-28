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
        document.getElementById("trips-container").innerHTML = "<p>Failed to load data from server.</p>";
      }
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById("trips-container").innerHTML = "<p>Connection failed. Please refresh.</p>";
    });
}

function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = "<p>No trips available at the moment.</p>";
    return;
  }

  trips.forEach(trip => {
    container.innerHTML += `
      <div class="trip-card">
        <img src="${trip.image || 'https://via.placeholder.com/300'}" alt="${trip.title}">
        <div class="trip-info">
          <span class="trip-tag">${trip.category}</span>
          <h3>${trip.title}</h3>
          <p style="font-size: 13px; color: #64748b; margin-top: 6px;">${trip.description}</p>
          <div class="trip-price">${trip.price} EGP</div>
          <button onclick="openBookingModal('${trip.title}')">Book Now</button>
        </div>
      </div>
    `;
  });
}

function filterTrips(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
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
    'Marine & Boats': 'بحري',
    'Safari': 'سفاري',
    'Diving': 'غوص',
    'City Tours': 'ثقافي',
    'Airport Transfers': 'توصيلات',
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
        alert("Invalid Username or Password");
      }
    })
    .catch(() => alert("Login failed. Check server connection."));
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
  select.innerHTML = '<option value="">All Trips</option>';
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
    alert("Booking Submitted Successfully!");
    closeModal('booking-modal');
    document.getElementById("booking-form").reset();
  });
}
