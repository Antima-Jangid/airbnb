// public/js/map.js - Responsive fix
mapboxgl.accessToken = window.mapToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: window.coordinates || [-74.5, 40],
  zoom: window.coordinates ? 12 : 2
});

// ✅ RESIZE HANDLER - Ye important hai!
window.addEventListener('resize', () => {
  map.resize();
});

map.on('load', () => {
  if (window.coordinates?.length === 2) {
    new mapboxgl.Marker()
      .setLngLat(window.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h4><strong>${window.locationName}</strong></h4>`
      ))
      .addTo(map);
  }
  
  // Fly to location
  if (window.coordinates) {
    map.flyTo({
      center: window.coordinates,
      zoom: 14,
      essential: true
    });
  }
});