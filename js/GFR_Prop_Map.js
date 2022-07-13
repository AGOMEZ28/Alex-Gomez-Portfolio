/* Map of GeoJSON data from GFR_14_20.geojson */
var att = 0;

//function to instantiate the Leaflet map
function createMap(){
var map = L.map('map').setView([36.7783, -119.4179], 5);
var tiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png ', {
	maxZoom: 19,
	attribution:"Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL." 
	}).addTo(map);
    //call getData function
    getData(map);
};

function createSearchLayer(data,map,attributes){
    var featuresLayer = getGeoJson(data,map,attributes);
	var searchControl = new L.Control.Search({
	    options: {
	        position: 'topright'
	    },
		layer: featuresLayer,
		propertyName: 'NAME',
		textPlaceholder: 'Search City...',
		marker: false,
		moveToLocation: function(latlng, title, map) {
  			map.setView(latlng, 11); // access the zoom
		}
	});

	searchControl.on('search:locationfound', function(e) {
		
		//console.log('search:locationfound', );

		//map.removeLayer(this._markerSearch)

		e.layer.setStyle({fillColor: '#3f0', color: '#0f0'});
		if(e.layer._popup)
			e.layer.openPopup();

	}).on('search:collapsed', function(e) {

		featuresLayer.eachLayer(function(layer) {	//restore feature color
			featuresLayer.resetStyle(layer);
		});	
	});
	
	map.addControl( searchControl );  //inizialize search control

};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("../data/GFR_14_20.json", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            //create a Leaflet GeoJSON layer and add it to the map
            createGeoJson(response, map,attributes);
            createSequenceControls(response,map,attributes);
            createLegend(response,map,attributes);
            createSearchLayer(response,map,attributes);
            createRadioButtons(response,map,attributes);
        }
    });
};

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data, att = 0){
    //empty array to hold attributes
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (att == 0) {
        if (attribute.match(/FR_TW_*/)){
            attributes.push(attribute);
        };
        }
        
        else if (att == 1) {
        if (attribute.match(/FR_AG1_*/)){
            attributes.push(attribute);
        };   
        }
        
        else if (att == 2) {
        if (attribute.match(/FR_AG2_*/)){
            attributes.push(attribute);
        };   
        }
        
        else if (att == 3) {
        if (attribute.match(/FR_AG3_*/)){
            attributes.push(attribute);
        };   
        }
    };
    

    return attributes.reverse();
    };

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);
            if (attributeValue > 0) {
            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };     
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){

    map.eachLayer(function(layer){
           //Example 3.16 line 4
            if (layer.feature && layer.feature.properties[attribute]){
                //access feature properties
                var props = layer.feature.properties;
    
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);

                layer.setRadius(radius);
    
                //add city to popup content string
                createPopup(props,attribute,layer,radius);
            };
            
    });
};
    
    //Update the legend with new attribute
function updateLegend(map, attributes){
    //create content for legend
    var year = "20" + String(attributes.slice(-2));
    var content = "";
    if (att == 0) {
         content += "<b>Total GFR<br>General Fertility Rate in " + year + "</b>";
    }
    else if (att == 1) {
        content += "<b>Age Group 15 - 19<br>General Fertility Rate in " + year + "</b>";
    }
        else if (att == 2) {
        content += "<b>Age Group 20 - 34<br>General Fertility Rate in " + year + "</b>";
    }
        else if (att == 3) {
        content += "<b>Age Group 35 - 50<br>General Fertility Rate in " + year + "</b>";
    }
    //replace legend content
    $('#temporal-legend').html(content);
    var circleValues = getCircleValues(map, attributes);
        for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });
            $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " births per 1000 women");
    };

};
    

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 4;
    //area based on attribute value and scale factor
    //if (attValue > 0) {
    if (attValue == 0) {
    	return 0;
    }
    else {
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);
    
    return radius;
	};
    //}
    //else {return 0};
};

//Example 2.1 line 1...function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[3];
    //check
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    createPopup(feature.properties,attribute,layer,options.radius);

    return layer;
};
//Step 3: Add circle markers for point features to the map
function createGeoJson(data, map,attributes){
  
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) { 
            return pointToLayer(feature, latlng, attributes);
                    }
        //onEachFeature:  onEachFeature 
    }).addTo(map);
    };
    
function getGeoJson(data,map,attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    return L.geoJson(data, {
        pointToLayer: function (feature, latlng) { 
            return pointToLayer(feature, latlng, attributes);
                    }
    });
}

function createPopup(properties, attribute, layer, radius){
 
    //add formatted attribute to panel content string
    var year = "20" + attribute.slice(-2);
    //popupContent += "<p><b>Place Type: </b>" + properties.TYPE;
    if (att == 0) { 
    var popupContent = "<p><b><u>Total GFR</u> </b><br>"
     popupContent += "<b>General Fertility Rate in " + year + ":</b> " + String(properties[attribute]) + " per 1000 woman</p>";
    }
    else if (att == 1) {
        var popupContent = "<p><b><u>Age Group 15 - 19</u> </b><br>"
    popupContent += "<p><b>General Fertility Rate in " + year + ":</b> " + String(properties[attribute]) + " per 1000 woman</p>";
    }
        else if (att == 2) {
        var popupContent = "<p><b><u>Age Group 20 - 34</u> </b><br>"
    popupContent += "<p><b>General Fertility Rate in " + year + ":</b> " + String(properties[attribute]) + " per 1000 woman</p>";
    }
        else if (att == 3) {
        var popupContent = "<p><b><u>Age Group 35 - 50</u> </b><br>"
    popupContent += "<p><b>General Fertility Rate in " + year + ":</b> " + String(properties[attribute]) + " per 1000 woman</p>";
    }
    
       //add city to popup content string
    popupContent += "<p><b>City:</b> " + properties.NAME + "</p>";

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};

//Create new sequence controls
function createRadioButtons(response,map, attributes){   
    var RadioControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
                        
                    //Example 3.12 line 2...Step 5: click listener for buttons
      
            var container = L.DomUtil.create('div', 'radio-buttons-container');

            //create range input element (slider)
            $(container).append('<button class="radio" id="radio0" title="Total General Fertility Rate">Total GFR</button>');
            $(container).append('<button class="radio" id="radio1" title="Age Group 15-19"> GFR 15 - 19</button>');
            $(container).append('<button class="radio" id="radio2" title="Age Group 20-34"> GFR 20 - 34</button>');
            $(container).append('<button class="radio" id="radio3" title="Age Group 35-50"> GFR 35 - 50</button>');

            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            return container;

        }
    })
    map.addControl(new RadioControl());
      $('.radio').click(function(){
                
                 var index = $('.range-slider').val();
                if ($(this).attr('id') == 'radio0'){ 
                    att = 0;
                    updateSymbolsLegend(map,attributes,response,index,att);
                }
                else if ($(this).attr('id') == 'radio1'){ 
                    att = 1;
                    updateSymbolsLegend(map,attributes,response,index,att);
                }
                else if ($(this).attr('id') == 'radio2'){ 
                    att = 2;
                    updateSymbolsLegend(map,attributes,response,index,att);
                }                                
                else if ($(this).attr('id') == 'radio3'){ 
                    att = 3;
                    updateSymbolsLegend(map,attributes,response,index,att);
                }
                
            });

    };
    
function updateSymbolsLegend(map,attributes,response,index,att) {
    updateLegend(map, processData(response,att)[index]);
    updatePropSymbols(map, processData(response,att)[index]);

}; 

//Create new sequence controls
function createSequenceControls(response,map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
                        
                    //Example 3.12 line 2...Step 5: click listener for buttons
      
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<button class="skip" id="reverse" title="Reverse">Previous</button>');

            $(container).append('<input class="range-slider" type="range" value = "3" max = "6">');
            //add skip buttons
            $(container).append('<button class="skip" id="forward" title="Forward">Next</button');
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            return container;

        }
    })
    map.addControl(new SequenceControl());
      $('.skip').click(function(){
                //get the old index value
                var index = $('.range-slider').val();
        
                //Step 6: increment or decrement depending on button clicked
                if ($(this).attr('id') == 'forward'){
                    index++;
                    //Step 7: if past the last attribute, wrap around to first attribute
                    index = index > 6 ? 0 : index;
                } else if ($(this).attr('id') == 'reverse'){
                    index--;
                    //Step 7: if past the first attribute, wrap around to last attribute
                    index = index < 0 ? 6 : index;
                };
        
                //Step 8: update slider
                $('.range-slider').val(index);
                
                 updateSymbolsLegend(map,attributes,response,index,att);
                //updatePropSymbols(map, attributes[index]);
                //updateLegend(map, attributes[index]);

            });

            //Step 5: input listener for slider
            $('.range-slider').on('input', function(){
                 //Step 6: get the new index value
                 var index = $(this).val();
                updateSymbolsLegend(map,attributes,response,index,att);
                //updatePropSymbols(map, attributes[index]);
                //updateLegend(map, attributes[index]);

            });
    };
    
//Example 2.7 line 1...function to create the legend
function createLegend(response,map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

        var svg = '<svg id="attribute-legend" width="280px" height="180px">';

        //object to base loop on...replaces Example 3.10 line 1
        var circles = {
            max: 20,
            mean: 40,
            min: 60,
        };

        //loop to add each circle and text to svg string
        for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
        };

        //close svg string
        svg += "</svg>";

        //add attribute legend svg to container
        $(container).append(svg);

            return container;
        }
    })
    map.addControl(new LegendControl());
    updateLegend(map, attributes[3]);

};

$(document).ready(createMap);