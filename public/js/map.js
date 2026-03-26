mapboxgl.accessToken = window.mapToken;

const coordinates = window.coordinates;
const locationName = window.locationName;

if (!coordinates || coordinates.length !== 2) {
    console.log("Invalid coordinates!");
} else {
    const map = new mapboxgl.Map({
        container: 'map',
        style: "mapbox://styles/mapbox/streets-v12",
        center: coordinates,
        zoom: 9
    });

    // Create marker
    const marker = new mapboxgl.Marker({color: 'red'})
        .setLngLat(coordinates)
        .addTo(map);

    // Attach popup to the marker
    const popup = new mapboxgl.Popup({ offset: 25 }) // offset so it doesn’t overlap marker
        .setHTML(`<p>${locationName}</p>`);

    marker.setPopup(popup).togglePopup(); // bind popup to marker and open it
}