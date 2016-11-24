//
//
//  Plotting the map
//	odonnel.p 
//	CS 7280, AU 2016
//
//



	//global variables
	var w = d3.select('.plot').node().clientWidth,
    	h = d3.select('.plot').node().clientHeight;

	var width = d3.select('.plot').node().clientWidth,
	    height = d3.select('.plot').node().clientHeight,
	    centered, mapped_trips,
	    zoomed = false,
	    switch_a = false,
	    rad =2;

	//SVG FOR MAP
	var svg = d3.select( ".plot" )
	    .append( "svg" )
	    .attr( "width", width )
	    .attr( "height", height );

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height)
	    .style('fill', 'none')
	    .on("click", clicked);

	var g = svg.append( "g" );

	//PROJECTION
	var albersProjection = d3.geoAlbers()
	    .scale( 310000 )
	    .rotate( [71.087,0] )
	    .center( [0, 42.3575] )
	    .translate( [width/2,height/2] );

	//DRAWING THE PATHS OF geoJSON OBJECTS
	var geoPath = d3.geoPath()
	    .projection( albersProjection );


//
//
// queue data, json
// parse
//
//

	d3.queue()
    .defer(d3.csv,'data/Boston_Police_Department_FIO.csv', parse) //stop and frisk
    .defer(d3.json, 'data/neighborhoods.json') //boston
    .await(dataLoaded);


    function parse(d){
	    //if(+d.duration<0) return;

	    return d;
	}


//
//
// map functions
// based off of: https://bl.ocks.org/mbostock/2206590
//
//

	//
	// ZOOMING AND CLICKING FUNCTIONS OF MAP
	// click area to zoom in on it
	//

	var sc_rad = function scaleradius () {

	    if (zoomed == true){
	        radius = 5;
	        return radius
	    }
	    if (zoomed == false){
	        radius = 2;
	        return radius
	    }

	}

	function clicked(d) {
	    //console.log(x+', '+y+', '+k)
	    var x, y, k;

	    if (d && centered !== d) {
	        var centroid = geoPath.centroid(d);
	        x = centroid[0];
	        y = centroid[1];
	        k = 3.5;
	        zoomed = true;
	        centered = d;
	    } else {
	        x = width / 2;
	        y = height / 2;
	        k = 1;
	        zoomed = false;
	        centered = null;
	    }

	    //console.log(x+', '+y+', '+k)

	    g.selectAll(".neighborhoods")
	        .classed("active", centered && function(d) { return d === centered; });

	    g.selectAll('.station_dot')
	        .transition()
	        .duration(550)
	        .attr('r', function() {
	            if(k == 1) {return rad}
	            else { return rad*k/2 } })
	        .attr('stroke-width', function(){
	            if(k == 1) {return rad/2}
	            else { return rad*k/2 } });


	    g.transition()
	        .duration(750)
	        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	    //.style("stroke-width", 1.5 / k + "px");
	}


//
//
// Data Loaded
//
//

function dataLoaded(err, rows, bos){
        

 

	//Patrick: cross filter example for later
    //crossfilter and dimensions
    // var cfStart = crossfilter(rows);
    // var tripsByStart1 = cfStart.dimension(function(d){return d.startStation;}),
    //     tripsByTimeStart = cfStart.dimension(function(d){return d.startTimeT;});

    // var cfEnd = crossfilter(rows);
    // var tripsByEnd1 = cfEnd.dimension(function(d){return d.endStation;}),
    //     tripsByTimeEnd = cfEnd.dimension(function(d){return d.startTimeT;});

    //nest and crossfilter data when a station is selected as start
    // function selectStation(id){
    //     tripsByStart1.filterAll();
    //     tripsByTimeStart.filterAll();

    //     //choose the station as start station
    //     var nestStart = d3.nest()
    //         .key(function(d){return d.endStation})
    //         .rollup(function(d){return d.length})  //rollup!!
    //         .entries(tripsByStart1.filter(id).top(Infinity));

    //     var cf2Start = crossfilter(nestStart);
    //     var topTripsStart = cf2Start.dimension(function(d){return d.values;}).top(10);
    //     console.log(topTripsStart);

    //     var longlat = stationNameID.get(id).lngLat;
    //     var start = true;

    //     //pass on the array of trips to dispatcher
    //     dispatcherStation.getarray(topTripsStart, stations, longlat, start);
    // }


    //nest and crossfilter data when a station is selected as start
    // function selectStationEnd(id){
    //     tripsByEnd1.filterAll();
    //     tripsByTimeEnd.filterAll();

    //     //choose the station as end station
    //     var nestEnd = d3.nest()
    //         .key(function(d){return d.startStation})
    //         .rollup(function(d){return d.length})  //rollup!!
    //         .entries(tripsByEnd1.filter(id).top(Infinity));

    //     var cf2End = crossfilter(nestEnd);
    //     var topTripsEnd = cf2End.dimension(function(d){return d.values;}).top(10);
    //     console.log(topTripsEnd);

    //     var longlat = stationNameID.get(id).lngLat;
    //     var start = false;

    //     //pass on the array of trips to dispatcher
    //     dispatcherStation.getarray(topTripsEnd, stations, longlat, start);
    // }

    
    //APPEND NEIGHBORHOODS ON MAP
    g.selectAll( ".boston" )
        .data( bos.features )
        .enter()
        .append('path')
        .attr('class', 'boston neighborhoods')
        .attr( 'd', geoPath )
        //.style('fill', '#888') //boston
        .on("click", clicked);
    //END OF NEIGHBORHOODS ON MAP


    //Plot dots on map example for later
    // g.selectAll('.station_dot')
    //     .data( stations )
    //     .enter()
    //     .append('circle')
    //     .attr('class', 'station_dot')
    //     .attr('station_num', function(d) { return d.id })
    //     .attr('cx', function(d) {
    //         var xy = albersProjection(d.lngLat);
    //         return xy[0]; })
    //     .attr('cy', function(d) {
    //         var xy = albersProjection(d.lngLat);
    //         return xy[1]; })
    //     .attr('r', rad)
    //     .style('fill', 'rgb(32,96,255)')
    //     .style('stroke-width', 0)
    //     .style('opacity',.9)
    //     .on('click', set_station_num)

} //end of dataLoaded

