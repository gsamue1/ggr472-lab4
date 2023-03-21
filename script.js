/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZ3NhbXVlbC11b2Z0IiwiYSI6ImNsY3lieDA3MjJjNnAzcGs2NmxoMndpeGIifQ.PKKRKM7-HRYK7TuPgztVzg'; //default public map token from Mapbox account 

//Activating Base Map
const map = new mapboxgl.Map({
    container: 'map', // div container ID for map
    style: 'mapbox://styles/gsamuel-uoft/cle4l4pr5001t01ljheblcl08', // Link to mapbox style URL
    center: [-79.39, 43.70], // starting position [longitude, latitude]
    zoom: 10.5, // starting zoom
});

/*--------------------------------------------------------------------
Setting Up Collisions Geojson Variable
--------------------------------------------------------------------*/
//Empty variable to store Collision Data Responses from Fetch Function 
let collisgeojson;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/gsamue1/ggr472-lab4/main/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        collisgeojson = response; // Store geojson as variable using URL from fetch response
    });


/*--------------------------------------------------------------------
Building Bounding Box and Hexgrid
--------------------------------------------------------------------*/

map.on('load', () => {

// Building Bounding Box and Rescaling to Appropriate Borders
    let bboxgeojson;
    let bbox = turf.envelope(collisgeojson);
    let bboxscaled = turf.transformScale(bbox, 1.05)

    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxscaled]
    }

//Finding Coordinates for Bounding Box Vertices
    // console.log(bboxscaled)
    // console.log(bboxscaled.geometry.coordinates)

//Creating Hexgrid
let bboxcoords =  [bboxscaled.geometry.coordinates[0][0][0],
                   bboxscaled.geometry.coordinates[0][0][1],
                   bboxscaled.geometry.coordinates[0][2][0],
                   bboxscaled.geometry.coordinates[0][2][1],];
let hexgeojson = turf.hexGrid(bboxcoords, 0.5, {units: 'kilometers'});

/*--------------------------------------------------------------------
TESTING POINT, BBOX AND HEXGRID LAYER VISUALIZATION 
--------------------------------------------------------------------*/
// //MAPPING COLLISION POINTS - Add datasource using GeoJSON variable
//     map.addSource('collisions', {
//         type: 'geojson',
//         data: collisgeojson
//     });

// //MAPPING COLLISION POINTS - Set style for when new points are added to the data source
//     map.addLayer({
//         'id': 'collisions-points',
//         'type': 'circle',
//         'source': 'collisions',
//         'paint': {
//             'circle-radius': 5,
//             'circle-color': 'blue'
//         }
//     });

// //MAPPING BOUNDING BOX - Add datasource using GeoJSON variable
//     map.addSource('bbox-collisions', {
//         type: 'geojson',
//         data: bboxgeojson
//     });

// //MAPPING BOUNDING BBOX - Set style for when new points are added to the data source
//     map.addLayer({
//         'id': 'collisions-bbox-polygon',
//         'type': 'fill',
//         'source': 'bbox-collisions',
//         'paint': {
//             'fill-color': 'green',
//             'fill-opacity': 0.3,
//             'fill-outline-color': 'green'
//         },
//     });

// //MAPPING HEXGRID - Add datasource using GeoJSON variable
//       map.addSource('hexgrid-to', {
//         type: 'geojson',
//         data: hexgeojson
//     });

// //MAPPING HEXGRID - Set style for when new points are added to the data source
//     map.addLayer({
//         'id': 'hexgrid-toronto',
//         'type': 'fill',
//         'source': 'hexgrid-to',
//         'paint': {
//             'fill-opacity': 0.5,
//             'fill-outline-color': 'blue'
//         }
//     });
//-----------------------------------------------------------------------------------------------------------------------------------------

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/

//Building HexGrid with Collision Counts 
//Method: Collecting unique IDs of each crash and aggregating to corresponding polygon on the hexgrid
let collisionhex = turf.collect(hexgeojson, collisgeojson, '_id', 'values')
console.log(collisionhex)

//Maximum Number of Crashs per Hexagon -- Identified using the console.log display, when max collisions is at 67 there is one feature still displayed -- thus, max is 68 in on hexgrid
let maxcollisions = 68;

//Counting the number of unique IDs from the collisions data aggregated into each hexgrid
collisionhex.features.forEach((feature) => {
    feature.properties.COUNT = feature.properties.values.length
    if (feature.properties.COUNT > maxcollisions) {
        console.log(feature);
        maxcollisions=feature.properties.COUNT
    }
});

//MAPPING AGREGGATED HEXGRID - Add datasource using GeoJSON variable
map.addSource('hexgrid-collisions', {
    type: 'geojson',
    data: collisionhex
});

//MAPPING MAPPING AGGREGATED HEXGRID - Set style for when new points are added to the data source
map.addLayer({
    'id': 'hexcollisions',
    'type': 'fill',
    'source': 'hexgrid-collisions',
    'paint': {
        'fill-color': [
            'step',
            ['get','COUNT'],
            '#d3d3d3', // Step counts from Green Signalling low number of counts and good to Red signalling high crash numbers
            1, '#83cd6c',
            5, '#fff600',
            10, '#FFCF07',
            20, '#FE8116',
            30, '#ff0000',
        ],
        'fill-opacity': 0.5,
        'fill-outline-color': 'white'
    },
});
// map.addLayer({
//     'id': 'hexcollisions',
//     'type': 'fill',
//     'source': 'hexgrid-collisions',
//     'paint': {
//         'fill-color': [
//             'step',
//             ['get','COUNT'],
//             '#d3d3d3', // Step counts from Green Signalling low number of counts and good to Red signalling high crash numbers
//             1, '#83cd6d',
//             5, '#83cd6d',
//             10, '#fff400',
//             20, '#ffa700',
//             30, '#ff0000',
//         ],
//         'fill-opacity': 0.5,
//         'fill-outline-color': 'white'
//     },
// });
});

// /*--------------------------------------------------------------------
// ADDING MAP CONTROLS
// --------------------------------------------------------------------*/

//Adding Navigation Controls -- Zoom and Spin
map.addControl(new mapboxgl.NavigationControl());

//Adding Fullscreen Capacity 
map.addControl(new mapboxgl.FullscreenControl());

//Adding Geocoding Capacity -- People Can Search their Address
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca" 
});

//Positioning Geocoder on Page
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

//Setting up Return Button -- Return Zoom to Original Extent
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.39, 43.70], //Coordinates Centering Page
        zoom: 10.5,
        essential: true
    });
});


// /*--------------------------------------------------------------------
// CONFIGURING POP-UPS
// --------------------------------------------------------------------*/
// Code Sourced: Mapbox https://docs.mapbox.com/mapbox-gl-js/example/popup-on-hover/ 
    //HEXGRIDS
    //Creating Pop-Up Variable     
        map.on('click', 'hexcollisions', (e) => {
            new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("<strong>Number of Collisions</strong>" +  "<br>" + e.features[0].properties.COUNT)
            .addTo(map);
            });
             
            // Change the cursor to a pointer when
            // the mouse is over the states layer.
            map.on('mouseenter', 'states-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
            });
             
            // Change the cursor back to a pointer
            // when it leaves the states layer.
            map.on('mouseleave', 'states-layer', () => {
            map.getCanvas().style.cursor = '';
            });


        // const popup_collisions_hex = new mapboxgl.Popup({
        //     closeButton: false,
        //     closeOnClick: false
        //     });
        
        //     map.on('click', 'hexcollisions', (e) => {
        // // Change the cursor style as a UI indicator.
        // map.getCanvas().style.cursor = 'pointer';
        
        // // Copying Coordinates array
        // const coordinates = e.features[0].geometry.coordinates.slice();
        // const description = e.features[0].properties.COUNT;
        
        // // Ensure that if the map is zoomed out such that multiple
        // // copies of the feature are visible, the popup appears
        // // over the copy being pointed to.
        // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        // coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        // }
        
        // // Populate the popup and set its coordinates
        // // based on the feature found.
        // popup_idr.setLngLat(coordinates).setHTML(description).addTo(map);
        // });
        
        // map.on('mouseleave', 'hexcollisions', () => {
        // map.getCanvas().style.cursor = '';
        // popup_idr.remove();
        // });

//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows