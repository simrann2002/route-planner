// server.js

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose(); // SQLite3 module
require('dotenv').config(); // For loading environment variables

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('database.db'); // SQLite database file
// Replace 'database.db' with the path to your SQLite database file

// Create a table to store locations
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY, name TEXT)");
});

// Route to add a new location
app.post('/api/addLocation', (req, res) => {
    const { location } = req.body;
    db.run("INSERT INTO locations (name) VALUES (?)", [location], function(err) {
        if (err) {
            console.error('Error adding location:', err);
            res.status(500).json({ error: 'Failed to add location' });
        } else {
            res.status(201).json({ message: 'Location added successfully', locationId: this.lastID });
        }
    });
});

// Route to calculate shortest path
app.get('/api/shortestPath', (req, res) => {
    db.all("SELECT name FROM locations", (err, rows) => {
        if (err) {
            console.error('Error fetching locations:', err);
            res.status(500).json({ error: 'Failed to fetch locations' });
        } else {
            const locationNames = rows.map(row => row.name);
            // Call Google Maps API to calculate shortest path (you need to implement this)
            const shortestPath = calculateShortestPath(locationNames);
            res.json({ shortestPath });
        }
    });
});

// Function to calculate shortest path using Google Maps API (you need to implement this)
// Function to calculate shortest path using Google Maps API
function calculateShortestPath(locations) {
    // Create a DirectionsService object
    var directionsService = new google.maps.DirectionsService();

    // Create an array to store the waypoints (excluding the start and end points)
    var waypoints = [];
    for (var i = 1; i < locations.length - 1; i++) {
        waypoints.push({
            location: locations[i],
            stopover: true
        });
    }

    // Create a DirectionsRequest object
    var request = {
        origin: locations[0],
        destination: locations[locations.length - 1],
        waypoints: waypoints,
        optimizeWaypoints: true, // Optimize the order of waypoints to minimize travel time
        travelMode: google.maps.TravelMode.DRIVING // You can change the travel mode as needed
    };

    // Call the route method of DirectionsService to calculate the route
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Extract the shortest path from the response
            var route = response.routes[0];
            // Extract the order of waypoints (if optimized)
            var waypointOrder = response.routes[0].waypoint_order;
            // Display the route information
            displayShortestPath(route, waypointOrder);
        } else {
            console.error('Error calculating shortest path:', status);
        }
    });
}

// Function to display the shortest path on the map
function displayShortestPath(route, waypointOrder) {
    // Extract the path of the route
    var path = route.overview_path;
    // Create a Polyline object to display the route on the map
    var polyline = new google.maps.Polyline({
        path: path,
        strokeColor: '#FF0000', // Red color
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: window.map // Assuming 'map' is the Google Map object
    });

    // If the waypoints are optimized, update the order of waypoints
    if (waypointOrder) {
        var optimizedLocations = [route.bounds.origin];
        waypointOrder.forEach(index => {
            optimizedLocations.push(route.waypoints[index].location);
        });
        optimizedLocations.push(route.bounds.destination);
        // Display the optimized locations (optional)
        console.log('Optimized waypoint order:', optimizedLocations);
    }
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
