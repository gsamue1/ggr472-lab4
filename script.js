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
    center: [-79.39, 43.67], // starting position [longitude, latitude]
    zoom: 10, // starting zoom
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
    console.log(bboxscaled)
    console.log(bboxscaled.geometry.coordinates)

//Creating Hexgrid
let bboxcoords =  [bboxscaled.geometry.coordinates[0][0][0],
                   bboxscaled.geometry.coordinates[0][0][1],
                   bboxscaled.geometry.coordinates[0][2][0],
                   bboxscaled.geometry.coordinates[0][2][1],];
let hexgeojson = turf.hexGrid(bboxcoords, 0.5, {units: 'kilometers'});

//MAPPINF COLLISION POINTS - Add datasource using GeoJSON variable
    map.addSource('collisions', {
        type: 'geojson',
        data: collisgeojson
    });

//MAPPING COLLISION POINTS - Set style for when new points are added to the data source
    map.addLayer({
        'id': 'collisions-points',
        'type': 'circle',
        'source': 'collisions',
        'paint': {
            'circle-radius': 5,
            'circle-color': 'blue'
        }
    });

//MAPPING BOUNDING BOX - Add datasource using GeoJSON variable
    map.addSource('bbox-collisions', {
        type: 'geojson',
        data: bboxgeojson
    });

//MAPPING BOUNDING BBOX - Set style for when new points are added to the data source
    map.addLayer({
        'id': 'collisions-bbox-polygon',
        'type': 'fill',
        'source': 'bbox-collisions',
        'paint': {
            'fill-color': 'green',
            'fill-opacity': 0.3,
            'fill-outline-color': 'green'
        },
    });

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

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/

// NEEDS TO BE CONTINUED CODE INCOMPLETE AND NOT FUNCTIONAL 
let collisionhex = turf.collect(hexgeojson, collisgeojson, '_id', 'values')
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty


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
        'fill-opacity': 0.5,
        'fill-outline-color': 'blue'
    }
});
});



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows