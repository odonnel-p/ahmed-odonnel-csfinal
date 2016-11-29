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
    .defer(d3.csv,'data/Boston_Police_Department_FIO_CLEANED.csv', parse) //rows
    .defer(d3.json, 'data/neighborhoods.json') //bos
    .defer(d3.csv, 'data/Boston_Public_Schools_2012-2013.csv', parseSchool) //sch
    .await(dataLoaded);


    function parse(d){
	    //if(+d.duration<0) return;

	    return {
	    	sex: d.SEX,
	    	locDescipt: d.LOCATION,
	    	//locLatLong: parseGeoLocate(d.LOCATION),
	    	date: parseDate(d.FIO_DATE_CORRECTED),
	    	race_description: d.DESCRIPTION.replace(')', '').split('('),
	    	complexion: d.COMPLEXION,
	    	fio: d.FIOFS_TYPE.split(''),
	    	outcome: d.OUTCOME.split(''),
	   		clothes: parseClothes(d.CLOTHING),
	    	age: +d.AGE_AT_FIO_CORRECTED,
	    	reason_stop: d.STOP_REASONS,
	    	reason_fio: d.FIOFS_REASONS
	    }

	}

		function parseDate(e){
	
	    	var day1 = e.split(' ')[0].split('/');
	        //console.log(day1);

	    	return new Date("20"+day1[2],+day1[1]-1, +day1[0]);
		}

		function parseClothes(e) {
			var lc = e.toLowerCase();
			var nsp = lc.replace(/\s\s+/g, ' ');
			var clothing_list = nsp.split(', ');

			return clothing_list;
		}

		//
		// geolocation example
		//
		// function parseGeoLocate(e) {

		// /* This showResult function is used as the callback function*/

		// 	function showResult(result) {
		// 	    document.getElementById('latitude').value = result.geometry.location.lat();
		// 	    document.getElementById('longitude').value = result.geometry.location.lng();
		// 	}

		// 	function getLatitudeLongitude(callback, address) {
			    
		// 	    var address = e || '11 Leon Street, Boston, Massachusetts';
		// 	    // Initialize the Geocoder
		// 	    geocoder = new google.maps.Geocoder();
		// 	    if (geocoder) {
		// 	        geocoder.geocode({
		// 	            'address': address
		// 	        }, function (results, status) {
		// 	            if (status == google.maps.GeocoderStatus.OK) {
		// 	                callback(results[0]);
		// 	            }
		// 	        });
		// 	    }
		// 	}

		// 	var button = document.getElementById('btn');

		// 	button.addEventListener("click", function () {
		// 	    var address = e;
		// 	    getLatitudeLongitude(showResult, address)
		// 	});

		// 	return e;
		// }

	function parseSchool(d) {
		
		return {
			building: d.BLDG_NAME,
			zip: pad(d.ZIPCODE, 5),
			school: d.SCH_NAME,
			type: d.SCH_TYPE,
			address: parseAddress(d.Location),
			loc: parseLoc(d.Location)
		}

	}

		function pad(num, size) {
		    var s = num+"";
		    while (s.length < size) s = "0" + s;
		    return s;
		}

		function parseLoc(e) {
			var raw = e;
			var split = e.split( /[(),]+/ );
			var latLong = [ +split[2], +split[3] ];
			//console.log(latLong);
			return latLong;
		}

		function parseAddress(e) {
			var raw = e;
			var split = e.split( '(' );
			var address = split[0];
			//console.log(split);
			return address;
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

function dataLoaded(err, rows, bos, sch){
        
	console.log(rows);
	console.log(sch);

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

