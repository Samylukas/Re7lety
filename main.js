// =========================================================================
// Re7lety Platform - Frontend Integration Logic
// =========================================================================

// ضع رابط الـ Web App الخاص بك هنا
const API_URL = "AKfycbwEUJdsuEmOvIBETHJVxGjYGOaLgWVbdnF_xKvS-zaeJV6gnHUNpwdlF-H-0URO9aneQQ";

let allTrips = [];
let currentUser = null;

// تشغيل النظام فور تحميل الصفحة
window.onload = function() {
  fetchTrips();
};

// 1. جلب قائمة الرحلات والتوصيلات المجدولة من الشيت
function fetchTrips() {
  fetch(API_URL + "?action=getTrips")
    .then(response => response.json())
    .then(data => {
      if (data.status === "success" && Array.isArray(data.data)) {
        allTrips = data.data;
        renderTrips(allTrips);
        populateTripDropdown(allTrips);
      } else {
        showError("No active services or trips configured.");
      }
    })
    .catch(error => {
      console.error("Connection Error:", error);
      showError("Failed to reach server. Please try again.");
    });
}

// دالة عرض رسائل الخطأ في الواجهة
function showError(msg) {
  const container = document.getElementById("trips-container");
  if (container) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #f87171; font-size: 16px; padding: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 16px;">${msg}</p>`;
  }
}

// 2. عرض الكروت العصرية للرحلات
function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  if (!container) return;
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 16px; padding: 40px;">No available services in this section.</p>`;
    return;
  }

  trips.forEach(trip => {
    const id = trip.Id || 1;
    const title = trip.Title || "Scheduled Transfer";
    const pickup = trip.PickupLocation || "Airport";
    const dropoff = trip.DropoffLocation || "Resort";
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
            <button class="book-btn" onclick="openBookingModal(${id}, '${title.replace(/'/g, "\\'")}', ${price})">Book Now</button>
          </div>
        </div>
      </div>
    `;
  });
}

// 3. تصفية الرحلات حسب الفئة أو المكان
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

// 4. التحكم في النوافذ المنبثقة (Modals)
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

// 5. إدارة تسجيل دخول الموظفين والأدمن
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
        alert("Authentication failed: " + (res.message || "Invalid credentials"));
      }
    })
    .catch(err => {
      console.error(err);
      alert("Authentication server unavailable. Check API deployment.");
    });
}

// 6. تجهيز لوحة التحكم وحساب الأدوار
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
    } else {
      adminSummary.style.display = "none";
    }
  }

  loadDashboardData();
}

function logout() {
  location.reload();
}

// 7. ملء خيارات القائمة المنسدلة في اللوحة
function populateTripDropdown(trips) {
  const select = document.getElementById("dashTripFilter");
  if (!select) return;
  select.innerHTML = '<option value="">All Services</option>';
  trips.forEach(t => {
    select.innerHTML += `<option value="${t.Id}">${t.Title}</option>`;
  });
}

// 8. جلب وعرض بيانات الحجوزات للتقارير
function loadDashboardData() {
  fetch(`${API_URL}?action=getBookings`)
    .then(r => r.json())
    .then(res => {
      if (res.status === "success") {
        const tbody = document.getElementById("bookingsTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        let totalGuests = 0;

        res.data.forEach(b => {
          const seats = parseInt(b.ReservedSeats || b.guests || 1);
          totalGuests += seats;
          
          const bookedDate = b.BookedAt ? new Date(b.BookedAt).toLocaleDateString() : new Date().toLocaleDateString();

          tbody.innerHTML += `
            <tr>
              <td>${bookedDate}</td>
              <td>Passenger #${b.PassengerId || 'Guest'}</td>
              <td>+2010xxxxxxx</td>
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

// 9. إرسال الحجز الجديد إلى الباك إند
function submitBooking(e) {
  e.preventDefault();
  const tripId = document.getElementById("trip-title-input").value;
  const guests = document.getElementById("guests").value;
  const modal = document.getElementById("booking-modal");
  const unitPrice = parseFloat(modal ? modal.getAttribute("data-price") : 0) || 0;

  const bookingData = {
    trip_id: tripId,
    guests: guests,
    total_amount: unitPrice * parseInt(guests),
    passenger_id: currentUser ? currentUser.accountId : 0,
    notes: document.getElementById("notes").value || ""
  };

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  }).then(() => {
    alert("Reservation Request Sent Successfully!");
    closeModal('booking-modal');
    const form = document.getElementById("booking-form");
    if (form) form.reset();
  }).catch(err => {
    console.error(err);
    alert("Error sending booking request.");
  });
}
