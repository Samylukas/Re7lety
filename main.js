// ضع رابط الـ Web App الخاص بك هنا
const API_URL = "https://script.google.com/macros/s/AKfycbwEUJdsuEmOvlBETHJVxGjYGOaLgWVbdnF_xKvS-zaeJV6gnHUNpwdlF-H-0URO9aneQQ/exec";
let allTrips = [];

// جلب الرحلات عند فتح الصفحة
window.onload = function() {
  fetchTrips();
};

function fetchTrips() {
  fetch(API_URL)
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        allTrips = data.data;
        renderTrips(allTrips);
      } else {
        document.getElementById("trips-container").innerHTML = "<p>حدث خطأ أثناء تحميل البيانات.</p>";
      }
    })
    .catch(error => {
      console.error("Error:", error);
      document.getElementById("trips-container").innerHTML = "<p>فشل الاتصال بالخادم.</p>";
    });
}

function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  container.innerHTML = "";

  if (trips.length === 0) {
    container.innerHTML = "<p>لا توجد رحلات متاحة حالياً.</p>";
    return;
  }

  trips.forEach(trip => {
    const card = `
      <div class="trip-card">
        <img src="${trip.image || 'https://via.placeholder.com/300x200'}" alt="${trip.title}">
        <div class="trip-info">
          <span class="trip-tag">${trip.category}</span>
          <h3>${trip.title}</h3>
          <p style="font-size: 13px; color: #666; margin-top: 5px;">${trip.description}</p>
          <div class="trip-price">${trip.price} جنيه</div>
          <button onclick="openBookingModal('${trip.title}')">احجز الآن</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

function filterTrips(category) {
  // تغيير شكل الأزرار
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  if (category === 'all') {
    renderTrips(allTrips);
  } else {
    const filtered = allTrips.filter(t => t.category === category);
    renderTrips(filtered);
  }
}

function openBookingModal(tripTitle) {
  document.getElementById("modal-trip-title").innerText = "حجز: " + tripTitle;
  document.getElementById("trip-title-input").value = tripTitle;
  document.getElementById("booking-modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("booking-modal").style.display = "none";
}

function submitBooking(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.innerText = "جاري الحجز...";
  submitBtn.disabled = true;

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
  })
  .then(() => {
    alert("تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً.");
    closeModal();
    document.getElementById("booking-form").reset();
    submitBtn.innerText = "تأكيد الحجز";
    submitBtn.disabled = false;
  })
  .catch(error => {
    alert("حدث خطأ، يرجى المحاولة مرة أخرى.");
    console.error("Error:", error);
    submitBtn.innerText = "تأكيد الحجز";
    submitBtn.disabled = false;
  });
}
