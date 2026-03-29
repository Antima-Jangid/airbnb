console.log('🚀 Map.js loaded');
console.log('Token:', window.mapToken ? '✅ OK' : '❌ MISSING');
console.log('Coords:', window.coordinates);

mapboxgl.accessToken = window.mapToken || 'pk.eyJ1...'; // Backup token

// Hide loading immediately
const loadingEl = document.getElementById('map-loading');
if (loadingEl) {
    loadingEl.style.display = 'none';
    console.log('✅ Loading hidden');
}

// Map init
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: window.coordinates[0] ? window.coordinates : [77.5946, 12.9716], // India default
    zoom: 12
});

// Critical: Load event
map.on('load', () => {
    console.log('✅ MAP LOADED SUCCESS!');
    
    // PIN AT EXACT LOCATION
    if (window.coordinates && window.coordinates.length === 2) {
        console.log('📍 Adding pin at:', window.coordinates);
        new mapboxgl.Marker({ color: '#dc3545' })
            .setLngLat(window.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(
                `<h6>${window.locationName}</h6>`
            ))
            .addTo(map);
    }
});

// Error catch
map.on('error', (e) => {
    console.error('❌ MAP ERROR:', e);
    document.getElementById('map').innerHTML = `
        <div class="p-5 text-center">
            <i class="bi bi-exclamation-triangle fs-1 text-danger mb-3"></i>
            <h4>Map Error</h4>
            <p class="text-muted">Check console (F12)</p>
        </div>
    `;
});

// Resize fix
window.addEventListener('resize', () => {
    if (map) map.resize();
});