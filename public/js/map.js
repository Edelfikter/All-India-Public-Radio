let map;
let stations = [];
let markers = [];
let creatingStation = false;
let newStationLatLng = null;

// Initialize map
function initMap() {
  map = L.map('map').setView([22.5, 78.5], 5); // Centered on India

  L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://stamen.com">Stamen Design</a>, © <a href="https://stadiamaps.com">Stadia Maps</a>, © <a href="https://openmaptiles.org">OpenMapTiles</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    className: 'stamen-toner-tiles'
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

// Generate station abbreviation from name
function generateAbbreviation(name) {
  if (!name) return 'STN';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2-3 letters
    return words[0].substring(0, 3).toUpperCase();
  } else {
    // Multiple words: take first letter of each word, max 4
    return words.slice(0, 4).map(word => word[0]).join('').toUpperCase();
  }
}

// Get color combination based on station ID
function getStationColors(stationId) {
  const colorCombos = [
    { bg: '#2E8B3E', text: '#D4A5C8' },  // Green bg, Light Pink text
    { bg: '#B5A642', text: '#8B2252' },  // Gold bg, Dark Magenta text
    { bg: '#5B74D8', text: '#B5A642' },  // Blue bg, Gold text
    { bg: '#E07040', text: '#934495' }   // Coral bg, Purple text
  ];
  
  return colorCombos[stationId % 4];
}

function displayStations() {
  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  // Add markers for each station
  stations.forEach(station => {
    const abbreviation = generateAbbreviation(station.name);
    const colors = getStationColors(station.id);
    
    const divIcon = L.divIcon({
      className: 'custom-station-marker',
      html: `<div class="station-pin" style="background-color: ${colors.bg}; color: ${colors.text}; box-shadow: 0 0 10px ${colors.bg};">
        <span class="station-abbr">${abbreviation}</span>
      </div>`,
      iconSize: [45, 45],
      iconAnchor: [22.5, 22.5]
    });
    
    const marker = L.marker([station.lat, station.lng], { icon: divIcon })
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
