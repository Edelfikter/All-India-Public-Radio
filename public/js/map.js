let map;
let stations = [];
let markers = [];
let creatingStation = false;
let newStationLatLng = null;

// Initialize map
function initMap() {
  map = L.map('map').setView([22.5, 78.5], 5); // Centered on India

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  map.on('click', onMapClick);

  loadStations();
}

async function loadStations() {
  try {
    stations = await stationsAPI.getAll();
    displayStations();
  } catch (error) {
    console.error('Failed to load stations:', error);
  }
}

function displayStations() {
  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  // Add markers for each station
  stations.forEach(station => {
    const marker = L.marker([station.lat, station.lng])
      .addTo(map)
      .bindPopup(createStationPopup(station));
    
    markers.push(marker);
  });

  // Update station list
  updateStationList();
}

function createStationPopup(station) {
  return `
    <div>
      <h3>${station.name}</h3>
      <p>🎭 ${station.genre || 'Various'}</p>
      <p>👤 ${station.host}</p>
      <p>${station.description || 'No description'}</p>
      <button onclick="goToStation(${station.id})">Listen</button>
    </div>
  `;
}

function goToStation(stationId) {
  window.location.href = `/station/${stationId}`;
}

function enableStationCreation() {
  if (!currentUser) {
    alert('Please login to create a station');
    return;
  }
  
  creatingStation = true;
  alert('Click on the map to place your station');
}

function onMapClick(e) {
  if (!creatingStation) return;
  
  newStationLatLng = e.latlng;
  document.getElementById('stationLocation').textContent = 
    `Location: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
  
  document.getElementById('createStationModal').classList.add('active');
}

async function createStation() {
  if (!newStationLatLng) return;

  const name = document.getElementById('stationName').value.trim();
  const description = document.getElementById('stationDescription').value.trim();
  const genre = document.getElementById('stationGenre').value.trim();
  const errorEl = document.getElementById('createStationError');

  if (!name) {
    errorEl.textContent = 'Station name is required';
    return;
  }

  try {
    const station = await stationsAPI.create({
      name,
      description,
      genre,
      lat: newStationLatLng.lat,
      lng: newStationLatLng.lng
    });

    closeModal('createStationModal');
    document.getElementById('stationName').value = '';
    document.getElementById('stationDescription').value = '';
    document.getElementById('stationGenre').value = '';
    
    creatingStation = false;
    newStationLatLng = null;

    // Redirect to station page to build broadcast
    window.location.href = `/station/${station.id}`;
  } catch (error) {
    errorEl.textContent = error.message || 'Failed to create station';
  }
}

function cancelStationCreation() {
  creatingStation = false;
  newStationLatLng = null;
  closeModal('createStationModal');
  document.getElementById('stationName').value = '';
  document.getElementById('stationDescription').value = '';
  document.getElementById('stationGenre').value = '';
}

function toggleStationList() {
  const list = document.getElementById('stationList');
  list.style.display = list.style.display === 'none' ? 'block' : 'none';
}

function updateStationList() {
  const listEl = document.getElementById('stationListItems');
  if (!listEl) return;

  listEl.innerHTML = stations.map(station => `
    <div class="station-list-item" onclick="goToStation(${station.id})">
      <h3>${station.name}</h3>
      <p>🎭 ${station.genre || 'Various'} | 👤 ${station.host}</p>
      <p>${station.description || 'No description'}</p>
    </div>
  `).join('');
}

function searchStations() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  const filtered = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm) ||
    (station.description && station.description.toLowerCase().includes(searchTerm)) ||
    (station.genre && station.genre.toLowerCase().includes(searchTerm))
  );

  const listEl = document.getElementById('stationListItems');
  listEl.innerHTML = filtered.map(station => `
    <div class="station-list-item" onclick="goToStation(${station.id})">
      <h3>${station.name}</h3>
      <p>🎭 ${station.genre || 'Various'} | 👤 ${station.host}</p>
      <p>${station.description || 'No description'}</p>
    </div>
  `).join('');
}

// Initialize map on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}
