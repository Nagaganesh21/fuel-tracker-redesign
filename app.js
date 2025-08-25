import { initFirebase } from "./storage.js";
import {
  updateSyncStatus,
  renderFuelSection,
  renderCostSection,
  renderSummarySection,
  showToast,
} from "./ui.js";

/* ---------- In-memory state ---------- */
let fuelRecords = [];
let costRecords = [];

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const connected = initFirebase();
  updateSyncStatus(connected ? "online" : "offline");

  // Render static sections
  renderFuelSection();
  renderCostSection();
  renderSummarySection();

  // Prefill dates
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;
  document.getElementById("costDate").value = today;

  // Load from localStorage
  fuelRecords = JSON.parse(localStorage.getItem("fuelRecords") || "[]");
  costRecords = JSON.parse(localStorage.getItem("costRecords") || "[]");

  // Wire handlers
  wireFuelForm();
  wireCostForm();

  // Wire export buttons
  document.getElementById("exportAllCSV").addEventListener("click", () => {
    exportAllXLSX();
  });
  
   // --- Dark Mode Toggle ---
  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.checked = true;
  }
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });

	document.getElementById("applyFuelFilter").addEventListener("click", applyFuelFilter);
	document.getElementById("resetFuelFilter").addEventListener("click", resetFuelFilter);

	document.getElementById("applyCostFilter").addEventListener("click", applyCostFilter);
	document.getElementById("resetCostFilter").addEventListener("click", resetCostFilter);
	// Live search on typing
	document.getElementById("costFilterItem").addEventListener("input", applyCostFilter);

	// Reset button
	document.getElementById("resetCostFilter").addEventListener("click", resetCostFilter);

  refreshAll();
  
  // Tab switching logic
	document.querySelectorAll(".tab-btn").forEach(btn => {
	  btn.addEventListener("click", () => {
		const target = btn.getAttribute("data-tab");

		// Hide all sections
		document.querySelectorAll(".tab-content").forEach(sec => {
		  sec.style.display = "none";
		});

		// Remove active class
		document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

		// Show selected
		document.getElementById(target).style.display = "block";
		btn.classList.add("active");
	  });
	});
	
});

/* ---------- Fuel ---------- */
function wireFuelForm() {
  document.getElementById("fuelForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const start = parseFloat(document.getElementById("meterStart").value);
    const end = parseFloat(document.getElementById("meterEnd").value);
    const fuel = parseFloat(document.getElementById("fuel").value);
    const cost = parseFloat(document.getElementById("cost").value);

    if (Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(fuel) || Number.isNaN(cost)) {
      alert("Please enter valid numbers.");
      return;
    }
    if (end < start) {
      alert("End meter must be greater than start meter.");
      return;
    }

    const distance = end - start;
    fuelRecords.push({ date, start, end, distance, fuel, cost });
    persist("fuelRecords", fuelRecords);
    showToast("✅ Fuel entry saved");

    // Reset (keep today)
    e.target.reset();
    document.getElementById("date").value = new Date().toISOString().split("T")[0];

    refreshAll();
  });
}

function updateFuelDashboard() {
  if (fuelRecords.length === 0) {
    document.getElementById("availableFuel").innerText = "0.00 L";
    document.getElementById("remainingKm").innerText = "0 km";
    return;
  }
  const totalFuel = fuelRecords.reduce((a, r) => a + r.fuel, 0);
  const totalDistance = fuelRecords.reduce((a, r) => a + r.distance, 0);
  const mileage = totalFuel > 0 ? totalDistance / totalFuel : 0;

  // This "remaining" is illustrative; real logic would use tank size etc.
  const remainingKm = totalFuel * mileage;

  document.getElementById("availableFuel").innerText = totalFuel.toFixed(2) + " L";
  document.getElementById("remainingKm").innerText = remainingKm.toFixed(1) + " km";
}

window.deleteFuelRecord = function (i) {
  if (!confirm("Delete this fuel entry?")) return;
  fuelRecords.splice(i, 1);
  persist("fuelRecords", fuelRecords);
  refreshAll();
};

window.editFuelRecord = function (i) {
  const record = fuelRecords[i];
  if (!record) return;

  const tbody = document.getElementById("fuelTableBody");
  const row = tbody.rows[i];

  // Inputs for editable fields, plain text for auto-calculated ones
  row.innerHTML = `
    <td><input type="date" id="editDate" value="${record.date}"></td>
    <td><input type="number" step="0.1" id="editStart" value="${record.start}"></td>
    <td><input type="number" step="0.1" id="editEnd" value="${record.end}"></td>
    <td>${record.distance}</td> <!-- auto calculated -->
    <td><input type="number" step="0.01" id="editFuel" value="${record.fuel}"></td>
    <td><input type="number" step="0.01" id="editCost" value="${record.cost}"></td>
    <td>
      <button class="action-btn save" id="saveFuelEdit">💾</button>
      <button class="action-btn cancel" id="cancelFuelEdit">❌</button>
    </td>
  `;

  // Save handler
  document.getElementById("saveFuelEdit").addEventListener("click", () => {
    const newDate = document.getElementById("editDate").value;
    const newStart = parseFloat(document.getElementById("editStart").value) || 0;
    const newEnd = parseFloat(document.getElementById("editEnd").value) || 0;
    const newFuel = parseFloat(document.getElementById("editFuel").value) || 0;
    const newCost = parseFloat(document.getElementById("editCost").value) || 0;

    // Validation checks
    if (!newDate) {
      alert("Date is required.");
      return;
    }
    if (newEnd < newStart) {
      alert("End reading must be greater than or equal to Start reading.");
      return;
    }
    if (newFuel < 0) {
      alert("Fuel cannot be negative.");
      return;
    }
    if (newCost < 0) {
      alert("Cost cannot be negative.");
      return;
    }

    // auto calculate distance
    const newDistance = newEnd - newStart;

    fuelRecords[i] = {
      date: newDate,
      start: newStart,
      end: newEnd,
      distance: newDistance,
      fuel: newFuel,
      cost: newCost,
    };

    persist("fuelRecords", fuelRecords);
    refreshAll();
  });

  // Cancel handler
  document.getElementById("cancelFuelEdit").addEventListener("click", () => {
    refreshAll();
  });
};

/* ---------- Costs ---------- */
function wireCostForm() {
  document.getElementById("costForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("costDate").value;
    const item = document.getElementById("costItem").value;
    const amount = parseFloat(document.getElementById("costAmount").value);

    if (Number.isNaN(amount)) {
      alert("Please enter a valid amount.");
      return;
    }

    costRecords.push({ date, item, amount });
    persist("costRecords", costRecords);
    showToast("✅ Cost entry saved");

    e.target.reset();
    document.getElementById("costDate").value = new Date().toISOString().split("T")[0];

    refreshAll();
  });
}

function updateCostDashboard() {
  const total = costRecords.reduce((a, r) => a + r.amount, 0);
  document.getElementById("totalCost").innerText = "₹" + total.toFixed(2);
}

window.deleteCostRecord = function (i) {
  if (!confirm("Delete this cost entry?")) return;
  costRecords.splice(i, 1);
  persist("costRecords", costRecords);
  refreshAll();
};

window.editCostRecord = function (i) {
  const record = costRecords[i];
  if (!record) return;

  const tbody = document.getElementById("costTableBody");
  const row = tbody.rows[i];

  row.innerHTML = `
    <td><input type="date" id="editDate" value="${record.date}"></td>
    <td><input type="text" id="editItem" value="${record.item}"></td>
    <td><input type="number" step="0.01" id="editAmount" value="${record.amount}"></td>
    <td>
      <button class="action-btn save" id="saveEdit">💾</button>
      <button class="action-btn cancel" id="cancelEdit">❌</button>
    </td>
  `;

  // Save handler with validation
  document.getElementById("saveEdit").addEventListener("click", () => {
    const newDate = document.getElementById("editDate").value;
    const newItem = document.getElementById("editItem").value.trim();
    const newAmount = parseFloat(document.getElementById("editAmount").value) || 0;

    // Validation
    if (!newDate) {
      alert("Date is required.");
      return;
    }
    if (!newItem) {
      alert("Item cannot be empty.");
      return;
    }
    if (newAmount < 0) {
      alert("Amount cannot be negative.");
      return;
    }

    costRecords[i] = { date: newDate, item: newItem, amount: newAmount };
    persist("costRecords", costRecords);
    refreshAll();
  });

  // Cancel handler
  document.getElementById("cancelEdit").addEventListener("click", () => {
    refreshAll();
  });
};



/* ---------- Summary (Monthly) ---------- */
function renderSummary() {
  const grid = document.getElementById("summaryGrid");
  grid.innerHTML = "";

  // Group fuel by month (YYYY-MM) for distance/fuel/cost/mileage
  const grouped = {};
  fuelRecords.forEach((r) => {
    const month = (r.date || "").substring(0, 7); // YYYY-MM
    if (!grouped[month]) grouped[month] = { distance: 0, fuel: 0, cost: 0 };
    grouped[month].distance += r.distance;
    grouped[month].fuel += r.fuel;
    grouped[month].cost += r.cost;
  });

  // Also add other costs from costRecords to month totals
  costRecords.forEach((c) => {
    const month = (c.date || "").substring(0, 7);
    if (!grouped[month]) grouped[month] = { distance: 0, fuel: 0, cost: 0 };
    grouped[month].cost += c.amount;
  });

  const months = Object.keys(grouped).sort(); // oldest -> newest
  months.forEach((m) => {
    const g = grouped[m];
    const mileage = g.fuel > 0 ? (g.distance / g.fuel) : 0;
    grid.innerHTML += `
      <div class="summary-card">
        <h3>${m}</h3>
        <p><b>Total Distance:</b> ${g.distance.toFixed(1)} km</p>
        <p><b>Total Fuel:</b> ${g.fuel.toFixed(2)} L</p>
        <p><b>Total Cost:</b> ₹${g.cost.toFixed(2)}</p>
        <p><b>Avg Mileage:</b> ${g.fuel > 0 ? mileage.toFixed(2) + " km/L" : "—"}</p>
      </div>
    `;
  });

  if (months.length === 0) {
    grid.innerHTML = `<div class="summary-card"><p>No data yet. Add some fuel or cost entries.</p></div>`;
  }
}

/* ---------- Utilities ---------- */
function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function refreshAll() {
  renderFuelTable();
  updateFuelDashboard();
  renderCostTable();
  updateCostDashboard();
  renderSummary();
}
function autoFitColumns(worksheet, data) {
  const colWidths = data[0].map((_, colIndex) => {
    return Math.max(
      ...data.map(row => (row[colIndex] ? row[colIndex].toString().length : 0))
    );
  });
  worksheet['!cols'] = colWidths.map(w => ({ wch: w + 2 })); // +2 padding
}

function exportAllXLSX() {
  const wb = XLSX.utils.book_new();

  // --- Fuel Sheet ---
  const fuelData = fuelRecords.length
    ? [["Date", "Start", "End", "Distance", "Fuel", "Cost"],
       ...fuelRecords.map(r => [r.date, r.start, r.end, r.distance, r.fuel, r.cost])]
    : [["No fuel records"]];
  const wsFuel = XLSX.utils.aoa_to_sheet(fuelData);
  autoFitColumns(wsFuel, fuelData);

  // Apply formatting (skip header row at index 0)
  fuelRecords.forEach((r, i) => {
    const row = i + 1; // 1-based because row 0 is header
    wsFuel[`D${row+1}`].z = "0.0";       // Distance (1 decimal)
    wsFuel[`E${row+1}`].z = "0.00";      // Fuel (2 decimals)
    wsFuel[`F${row+1}`].z = "₹ #,##0.00"; // Cost (currency)
  });

  XLSX.utils.book_append_sheet(wb, wsFuel, "Fuel Records");

  // --- Cost Sheet ---
  const costData = costRecords.length
    ? [["Date", "Item", "Amount"],
       ...costRecords.map(r => [r.date, r.item, r.amount])]
    : [["No cost records"]];
  const wsCost = XLSX.utils.aoa_to_sheet(costData);
  autoFitColumns(wsCost, costData);

  costRecords.forEach((r, i) => {
    const row = i + 1;
    wsCost[`C${row+1}`].z = "₹ #,##0.00"; // Amount
  });

  XLSX.utils.book_append_sheet(wb, wsCost, "Cost Records");

  // --- Summary Sheet ---
  const grouped = {};
  fuelRecords.forEach((r) => {
    const month = (r.date || "").substring(0, 7);
    if (!grouped[month]) grouped[month] = { distance: 0, fuel: 0, cost: 0 };
    grouped[month].distance += r.distance;
    grouped[month].fuel += r.fuel;
    grouped[month].cost += r.cost;
  });
  costRecords.forEach((c) => {
    const month = (c.date || "").substring(0, 7);
    if (!grouped[month]) grouped[month] = { distance: 0, fuel: 0, cost: 0 };
    grouped[month].cost += c.amount;
  });

  const months = Object.keys(grouped).sort();
  const summaryData = months.length
    ? [["Month", "Total Distance", "Total Fuel", "Total Cost", "Avg Mileage"],
       ...months.map(m => {
         const g = grouped[m];
         const mileage = g.fuel > 0 ? (g.distance / g.fuel).toFixed(2) : "—";
         return [m, g.distance, g.fuel, g.cost, mileage];
       })]
    : [["No summary data"]];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  autoFitColumns(wsSummary, summaryData);

  months.forEach((m, i) => {
    const row = i + 1;
    wsSummary[`B${row+1}`].z = "0.0";       // Distance
    wsSummary[`C${row+1}`].z = "0.00";      // Fuel
    wsSummary[`D${row+1}`].z = "₹ #,##0.00"; // Cost
    wsSummary[`E${row+1}`].z = "0.00";      // Mileage
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, "Monthly Summary");

  // --- Download File ---
  XLSX.writeFile(wb, "fuel-tracker.xlsx");
}
function applyFuelFilter() {
  const from = document.getElementById("fuelFilterFrom").value;
  const to = document.getElementById("fuelFilterTo").value;

  let filtered = [...fuelRecords];
  if (from) filtered = filtered.filter(r => r.date >= from);
  if (to) filtered = filtered.filter(r => r.date <= to);

  renderFuelTable(filtered);
}

function resetFuelFilter() {
  document.getElementById("fuelFilterFrom").value = "";
  document.getElementById("fuelFilterTo").value = "";
  renderFuelTable(fuelRecords);
}

function applyCostFilter() {
  const from = document.getElementById("costFilterFrom").value;
  const to = document.getElementById("costFilterTo").value;
  const item = document.getElementById("costFilterItem").value.toLowerCase();

  let filtered = [...costRecords];
  if (from) filtered = filtered.filter(r => r.date >= from);
  if (to) filtered = filtered.filter(r => r.date <= to);
  if (item) filtered = filtered.filter(r => r.item.toLowerCase().includes(item));

  renderCostTable(filtered);
}

function resetCostFilter() {
  document.getElementById("costFilterFrom").value = "";
  document.getElementById("costFilterTo").value = "";
  document.getElementById("costFilterItem").value = "";
  renderCostTable(costRecords);
}
function renderFuelTable(records = fuelRecords) {
  const tbody = document.getElementById("fuelTableBody");
  tbody.innerHTML = "";
  records.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.start.toFixed(1)}</td>
        <td>${r.end.toFixed(1)}</td>
        <td>${r.distance.toFixed(1)}</td>
        <td>${r.fuel.toFixed(2)}</td>
        <td>₹${r.cost.toFixed(2)}</td>
        <td>
          <button class="action-btn edit" onclick="editFuelRecord(${i})">✏️</button>
          <button class="action-btn delete" onclick="deleteFuelRecord(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });
}

function renderCostTable(records = costRecords) {
  const tbody = document.getElementById("costTableBody");
  tbody.innerHTML = "";
  records.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.item}</td>
        <td>₹${r.amount.toFixed(2)}</td>
        <td>
          <button class="action-btn edit" onclick="editCostRecord(${i})">✏️</button>
          <button class="action-btn delete" onclick="deleteCostRecord(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });
}
