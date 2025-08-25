// Toast
export function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg || "✅ Saved successfully";
  toast.className = "toast show";
  setTimeout(() => (toast.className = "toast"), 1800);
}

// Online/Offline pill
export function updateSyncStatus(status) {
  const el = document.getElementById("syncStatus");
  if (status === "online") {
    el.className = "sync-status sync-online";
    el.innerHTML = "🟢 Online";
  } else if (status === "syncing") {
    el.className = "sync-status sync-syncing";
    el.innerHTML = "🟡 Syncing…";
  } else {
    el.className = "sync-status sync-offline";
    el.innerHTML = "🔴 Offline";
  }
}

/* ---------- Sections ---------- */
export function renderFuelSection() {
  document.getElementById("fuelSection").innerHTML = `
    <h2>Fuel</h2>
    <div class="fuel-dashboard">
      <div class="fuel-card card">
        <h3>Available Fuel</h3>
        <p id="availableFuel">0.00 L</p>
      </div>
      <div class="fuel-card card">
        <h3>Remaining KM</h3>
        <p id="remainingKm">0 km</p>
      </div>
    </div>

    <form id="fuelForm" class="fuel-form card">
      <div>
        <label for="date">📅 Date</label>
        <input type="date" id="date" required />
      </div>
      <div>
        <label for="meterStart">🔢 Meter Start</label>
        <input type="number" id="meterStart" step="0.1" required />
      </div>
      <div>
        <label for="meterEnd">🔢 Meter End</label>
        <input type="number" id="meterEnd" step="0.1" required />
      </div>
      <div>
        <label for="fuel">⛽ Fuel Added (L)</label>
        <input type="number" id="fuel" step="0.01" required />
      </div>
      <div>
        <label for="cost">💰 Cost (₹)</label>
        <input type="number" id="cost" step="0.01" required />
      </div>
      <button type="submit">💾 Save Fuel Entry</button>
    </form>

    <div class="table-wrapper">
	  <!-- 🔍 Filters -->
	  <div class="filter-bar">
		<label>From: <input type="date" id="fuelFilterFrom"></label>
		<label>To: <input type="date" id="fuelFilterTo"></label>
		<button id="applyFuelFilter" class="export-btn">Filter</button>
		<button id="resetFuelFilter" class="export-btn">Reset</button>
	  </div>
      <table class="fuel-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Distance</th>
            <th>Fuel</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="fuelTableBody"></tbody>
      </table>
    </div>
  `;
}

export function renderCostSection() {
  document.getElementById("costSection").innerHTML = `
    <h2>Costs</h2>
    <div class="cost-dashboard">
      <div class="cost-card card">
        <h3>Total Cost</h3>
        <p id="totalCost">₹0.00</p>
      </div>
    </div>

    <form id="costForm" class="cost-form card">
      <div>
        <label for="costDate">📅 Date</label>
        <input type="date" id="costDate" required />
      </div>
      <div>
        <label for="costItem">🛒 Item</label>
        <select id="costItem" required>
          <option value="Petrol">Petrol</option>
          <option value="Goods">Goods</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Others">Others</option>
        </select>
      </div>
      <div>
        <label for="costAmount">💰 Amount (₹)</label>
        <input type="number" id="costAmount" step="0.01" required />
      </div>
      <button type="submit">💾 Save Cost</button>
    </form>

    <div class="table-wrapper">
	  <!-- 🔍 Filters -->
	  <div class="filter-bar">
		<label>From: <input type="date" id="costFilterFrom"></label>
		<label>To: <input type="date" id="costFilterTo"></label>
		<label>Item: <input type="text" id="costFilterItem" placeholder="Search item"></label>
		<button id="resetCostFilter" class="export-btn">Reset</button>
	  </div>
      <table class="cost-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="costTableBody"></tbody>
      </table>
    </div>
  `;
}

export function renderSummarySection() {
  document.getElementById("summarySection").innerHTML = `
    <h2>📊 Monthly Summary</h2>
    <div class="summary-section">
      <div id="summaryGrid" class="summary-grid"></div>
    </div>
  `;
}
