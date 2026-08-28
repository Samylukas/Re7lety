function renderTrips(trips) {
  const container = document.getElementById("trips-container");
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 18px;">No experiences found in this category.</p>`;
    return;
  }

  trips.forEach(trip => {
    // قراءة القيم بشرط مرن يتجاوز اختلافات الأحرف الكبيرة والصغيرة
    const title = trip.title || trip.Title || "Excursion";
    const category = trip.category || trip.Category || "Marine";
    const price = trip.price || trip.Price || "0";
    const image = trip.image || trip.Image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";
    const description = trip.description || trip.Description || "";

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
            <div class="trip-price">$${price} <span style="font-size:12px; font-weight:normal; color:#94a3b8;">/ person</span></div>
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
      const cat = String(t.category || t.Category || "").toLowerCase().trim();
      const targetCat = category.toLowerCase().trim();
      const arabicMatch = getArabicCategory(category).toLowerCase().trim();
      return cat === targetCat || cat === arabicMatch || cat.includes(targetCat);
    });
    renderTrips(filtered);
  }
}
