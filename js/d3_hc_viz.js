
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
//var attrArray = ["2020 Anti-American Indian or Alaskan Native Hate Crime Rate","2020 Anti-Asian Hate Crime Rate","2020 Anti-Black or African American Hate Crime Rate","2020 Anti-Hispanic or Latino Hate Crime Rate","2020 Anti-Native Hawaiian or Pacific Islander Hate Crime Rate","2020 Anti-White Hate Crime Rate","2020 Total Hate Crime Rate"];
var year = "2020";
var currentYear = "2020";
var attrArray = ["Anti-American Indian or Alaska Native Hate Crime Rate","Anti-Asian Hate Crime Rate","Anti-Black or African American Hate Crime Rate","Anti-Hispanic or Latino Hate Crime Rate","Anti-White Hate Crime Rate","Total Hate Crime Rate"];
var attrArray2 = ["Anti-American Indian or Alaska Native Hate Crime Rate","Anti-Asian Hate Crime Rate","Anti-Black or African American Hate Crime Rate","Anti-Hispanic or Latino Hate Crime Rate","Anti-White Hate Crime Rate","Total Hate Crime Rate"];
var attrArray3 = arr3;
//var attrArray3 = ["2020 Anti-American Indian or Alaskan Native Hate Crime Rate","2020 Anti-Asian Hate Crime Rate","2020 Anti-Black or African American Hate Crime Rate","2020 Anti-Hispanic or Latino Hate Crime Rate","2020 Anti-White Hate Crime Rate","2020 Total Hate Crime Rate","2019 Anti-American Indian or Alaskan Native Hate Crime Rate","2019 Anti-Asian Hate Crime Rate","2019 Anti-Black or African American Hate Crime Rate","2019 Anti-Hispanic or Latino Hate Crime Rate","2019 Anti-Native Hawaiian or Pacific Islander Hate Crime Rate","2019 Anti-White Hate Crime Rate","2019 Total Hate Crime Rate"];
//console.log(attrArray3);
//console.log(attrArray3);
//var expressed = year + " " + attrArray[6]; //initial attribute
attrArray = attrArray.map(i => year + ' ' + i);
var expressed = attrArray[5]; //initial attribute
attValue = expressed;
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 30,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([chartHeight - 10, 0])
    .domain([0, 10]); // csv first column max = 88


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
        
    //create Albers equal area conic projection centered on USA
		var projection = d3.geoAlbersUsa().scale(width * 1.1).translate([width/2, height/2])
	    var path = d3.geoPath().projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/HC_Data.csv")); //load attributes from csv
    promises.push(d3.json("data/us_states.json")); //load background spatial data
    promises.push(d3.json("data/countries.json")); //load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data){

        [csvData, usa, countries] = data;



        //place graticule on the map
        setGraticule(map, path);

        //translate europe TopoJSON
        var countryBoundaries = topojson.feature(countries, countries.objects.ne_50m_admin_0_countries),
            stateBoundaries = topojson.feature(usa, usa.objects.USA_States_4326).features;

        //add Europe countries to map
        var countries = map.append("path")
            .datum(countryBoundaries)
            .attr("class", "countries")
            .attr("d", path);

        //join csv data to GeoJSON enumeration units
        var states = joinData(stateBoundaries, csvData);

        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(stateBoundaries, map, path, colorScale);

        //add coordinated visualization to the map
        setChart(csvData, colorScale);

        //legend
        setLegend(map,colorScale);
        // dropdown
        createDropdown(csvData,attrArray,map);
        
        // slider
        createSlider(csvData,map);
        

    };
}; //end of setMap()


function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
    //create graticule generator
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    //create graticule lines	
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
};

function joinData(states, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.STUSPS; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<states.length; a++){

            var geojsonProps = states[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.STUSPS; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray3.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };


    return states;
};

 function makeColorScale(data,att = "2020 Total Hate Crime Rate"){
    let colorClasses;
    switch(att) {
    case year + " Anti-American Indian or Alaska Native Hate Crime Rate": colorClasses = [
        "#eff3ff",
        "#bdd7e7",
        "#6baed6",
        "#3182bd",
        "#08519c"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;  
    case  year+ " Anti-Black or African American Hate Crime Rate": colorClasses = [
        "#fee5d9",
        "#fcae91",
        "#fb6a4a",
        "#de2d26",
        "#a50f15"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
    case year+ " Anti-Hispanic or Latino Hate Crime Rate": colorClasses = [
        "#f2f0f7",
        "#cbc9e2",
        "#9e9ac8",
        "#756bb1",
        "#54278f"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;    
 case year + " Anti-White Hate Crime Rate": colorClasses = [
        "#f1eef6",
        "#d7b5d8",
        "#df65b0",
        "#dd1c77",
        "#980043"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;  
    case year + " Anti-Asian Hate Crime Rate": colorClasses = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#31a354",
        "#006d2c"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;  
    case year + " Total Hate Crime Rate": colorClasses = [
          "#ffffd4",
        "#fed98e",
        "#fe9929",
        "#d95f0e",
        "#993404"  
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;  
}

};


//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

function setEnumerationUnits(states, map, path, colorScale){
    var states = map.selectAll(".states")
        .data(states)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "states " + d.properties.STUSPS;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    
    //below Example 2.2 line 16...add style descriptor to each path
    var desc = states.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);


    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.STUSPS;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

    //below Example 2.2 line 31...add style descriptor to each rect
    var desc = bars.append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 52)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text(expressed + " (per 100,000)"+" in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};


//Example 1.1 line 1...function to create a dropdown menu for attribute selection
function createDropdown(csvData,att,map){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            var legend = d3.selectAll(".legendEntry").remove();
            changeAttribute(this.value, csvData,map,true);
            attValue = this.value;
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text(function(d){ return expressed });

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(att)
        .enter()
        .append("option")
        .attr('class',"attrOptions")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};


function updateDropdown(csvData,map){
    var att2 = attrArray2.map(i => year + ' ' + i);
    
    var xx = d3.selectAll(".dropdown")
    .remove(); 
    createDropdown(csvData,att2,map);
    
};
function createSlider(csvData,map){
    var slider = d3
    .sliderHorizontal()
    .min(2015)
    .max(2020)
    .step(1)
    .ticks(4)
    .default(2020)
    .tickFormat(d3.format('.0f'))
    .width(300)
    .displayValue(false)
    .on('onchange', (val) => {
      d3.select('body')
      .attr("class","value");
      currentYear = String(year);
      year = String(val);
      changeAttribute(attValue,csvData,map);
      updateDropdown(csvData,map);
    });

  d3.select('body')
    .append('svg')
    .attr("class","slider")
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)')
    .call(slider);
        

};

//Example 1.4 line 14...dropdown change listener handler
function changeAttribute(attribute, csvData,map, isAttChng = false){
    currentYear = attribute.slice(0,4);
    expressed = attribute.replace(currentYear,year);
    // change yscale dynamically
    csvmax = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });
    
    yScale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain([0, csvmax*1.1]);

    //updata vertical axis 
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    

    //recreate the color scale
    var colorScale = makeColorScale(csvData,expressed);
    
    if (isAttChng) {setLegend(map,colorScale); };
    
    //recolor enumeration units
    var states = d3.selectAll(".states")
        .transition()
        .duration(1000);
        
         updateMap(states,colorScale);
         
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20;
        })
        .duration(500);
    updateChart(bars, csvData.length, colorScale);
};

function updateMap(states,cs) {
        states
        .style("fill", function(d){
            return choropleth(d.properties, cs)
        });
};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            if ( isNaN(yScale(parseFloat(d[expressed])))) {
            return 0;
            }
            else {
                return 463 - yScale(parseFloat(d[expressed]));

            }
        })
        .attr("y", function(d, i){
              if ( isNaN(yScale(parseFloat(d[expressed])))) {
            return 0;
            }
            else {
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        }})
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    //add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " (per 100,000)"+" in Each State");
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", "yellow")
        .style("stroke-width", "2");
    
    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    //below Example 2.4 line 21...remove info label
    d3.select(".infolabel")
        .remove();

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

function returnLabel(num) {
var nd = "No Data";
if  (!isNaN(num)) {
    return Math.round(num * 100) / 100;
}
else  { return nd; }
};

//function to create dynamic label
function setLabel(props){
    //label content
    var number = props[expressed];
    var rounded = returnLabel(number);
    var labelAttribute = "<h1>" + rounded +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.NAME + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME);
};

//function to move info label with mouse
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

function setLegend(map,colorScale){
    var width =  window.innerWidth * 0.5;
    var legend = map.selectAll('legendEntry')
        .data(colorScale.range().reverse())
        .enter()
        .append('g').attr('class', 'legendEntry');
    
    legend
        .append('rect')
        .attr("x", width - 165)
        .attr("y", function(d, i) {
           return (i * 20.5) + (chartHeight - 165);
        })
       .attr("width", 10)
       .attr("height", 10)
       .style("stroke", "black")
       .style("stroke-width", 1)
        .style("fill", function(d){
                return d;
            })
    
    legend
        .append('text')
        .attr("x", width - 140) //leave 5 pixel space after the <rect>
        .attr("y", function(d, i) {
           return (i * 20) + (chartHeight - 165);
        })
        .attr("dy", "0.8em") //place text one line *below* the x,y point
        .text(function(d,i) {
            if (i == 0) { return "Very High"}
            else if (i == 1) {return "High"}
            else if (i== 2) {return "Moderate"}
            else if (i==3) {return "Low"}
            else if (i == 4) {return "Very Low"}
        });

};

})(); //last line of main.js