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
/* 	var svg = d3.select( ".plot" )
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
	var g2 = svg.append( "g" ); */

	//PROJECTION
	var albersProjection = d3.geoAlbers()
	    .scale( 240000 )
	    .rotate( [71.087,0] )
	    .center( [0, 42.313] )
	    .translate( [width/2,height/2] );
		
	//CANVAS	
	var canvas = d3.select(".plot").append('canvas');
	var ctx = canvas.node().getContext('2d');

	//DRAWING THE PATHS OF geoJSON OBJECTS
	var geoPath = d3.geoPath()
	    .projection( albersProjection )
		.context(ctx);

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
    .defer(d3.json, 'data/geocodes/locations_0.geojson')
    .defer(d3.json, 'data/geocodes/locations_1.geojson')
    .defer(d3.json, 'data/geocodes/locations_2.geojson')
    .defer(d3.json, 'data/geocodes/locations_3.geojson')
    .defer(d3.json, 'data/geocodes/locations_4.geojson')
    .defer(d3.json, 'data/geocodes/locations_5a.geojson')
    .defer(d3.json, 'data/geocodes/locations_5b.geojson')
    .defer(d3.json, 'data/geocodes/locations_6.geojson')
    .defer(d3.json, 'data/geocodes/locations_7.geojson')
    .defer(d3.json, 'data/geocodes/locations_8.geojson')
    .defer(d3.json, 'data/geocodes/locations_9a.geojson')
    .defer(d3.json, 'data/geocodes/locations_9b.geojson')
    .await(dataLoaded);

    function parse(d){
	    //if(+d.duration<0) return;

	    return {
	    	ID: d.Id,
	    	sex: d.SEX,
	    	locDescipt: d.LOCATION,
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
		var latLong = [ +split[3], +split[2] ];
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

	function conjoin_repeats(_sch) {
		var prev_bldg_name;
		_sch.forEach( function (obj, i) {
			
			if (obj.building.match(prev_bldg_name) && prev_bldg_name != undefined ) { 
				//console.log(prev_bldg_name+" MATCHED "+obj.building) 
				_sch[i-1].school = [_sch[i-1].school, _sch[i].school];
				//console.log( sch[i-1].school );
				_sch.splice(i, 1);
			}
			prev_bldg_name = obj.building;
		});
		//console.log(_sch);
		return _sch;
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
	        radius = 5;
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
	        	zoom_squares(5);
	    } else {
	        x = width / 2;
	        y = height / 2;
	        k = 1;
	        zoomed = false;
	        centered = null;
	        	zoom_squares(5);
	    }

	    function zoom_squares (_num) {
		    g.selectAll(".square_school")
		    	// .attr("width", 2)
		    	// .attr("height", 2)
		    	.transition()
		    		.duration(750)
		    		.attr("width", _num)
		    		.attr("height", _num);

		    g.selectAll('stop_n_frisks')
		    	.transition()
		    		.duration(750)
		    		.attr("width", 1)
		    		.attr("height", 1);
		}
	    //console.log(x+', '+y+', '+k)

	    g.selectAll(".neighborhoods")
	        .classed("active", centered && function(d) { return d === centered; });

	    // g.selectAll('.station_dot')
	    //     .transition()
	    //     .duration(550)
	    //     .attr('r', function() {
	    //         if(k == 1) {return rad}
	    //         else { return rad*k/2 } })
	    //     .attr('stroke-width', function(){
	    //         if(k == 1) {return rad/2}
	    //         else { return rad*k/2 } });


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

function dataLoaded(err, rows, bos, sch, gj0, gj1, gj2, gj3, gj4, gj5, gj6, gj7, gj8, gj9, gj10, gj11){
        
	//ROWS is stop and frisk data
	//console.log(rows); // 152230 rows
	
	//SCH, SCH2 is boston school locations
	var sch2 = conjoin_repeats(sch); 
	//console.log(sch2);

	//GEOS is geojsons with locations for stop and frisks, 
	var geos = gj0.features
				.concat(gj1.features)
				.concat(gj2.features)
				.concat(gj3.features)
				.concat(gj4.features)
				.concat(gj5.features)
				.concat(gj6.features)
				.concat(gj7.features)
				.concat(gj8.features)
				.concat(gj9.features)
				.concat(gj10.features)
				.concat(gj11.features);

	geos.sort(function(a, b) { return a.properties.id - b.properties.id; });
		
		geos.forEach( function(_g,i) { 
			if (_g.geometry.coordinates[0] > -70.922 || _g.geometry.coordinates[0] < -71.195 ||
				_g.geometry.coordinates[1] > 42.404  || _g.geometry.coordinates[1] < -42.23) 
			{ geos.splice(i, 1); } 
		}) //from ~152,230 to 131,676; loss of 20,554 entries (~13.5% loss)

	console.log(geos);


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

    //APPEND STOP AND FRISKS ON MAP
	 var radi = 1;
	 g.selectAll('.stop_n_frisks')
	 	.data( geos )
	 	.enter()
	 	.append('circle')
	 	.attr('class', 'stop_n_frisks')
	 	.attr('occurence', function(d,i) { return 'oc'+i })
		.attr('cx', function(f) {
            var xy = albersProjection(f.geometry.coordinates);
            return xy[0]; })
        .attr('cy', function(f) {
            var xy = albersProjection(f.geometry.coordinates);
            return xy[1]; })
        //.transition(750)
        .attr('r', radi)
	        .style('fill', 'rgb(0,0,255)')
	        .style('stroke-width', 0)
	        .style('opacity', .1)
	        .on("click", clicked);
	 //END STOP AND FRISKS ON MAP


    //APPEND SCHOOLS ON MAP
    var square = 5;
    //Plot schools as squares
    g.selectAll('.square_school')
        .data( sch2 )
        .enter()
        .append('rect')
        .attr('class', 'square_school')
        .attr('school_num', function(d,i) { return 's'+i })
        .attr('x', function(f) {
         	//console.log(f.loc[0]+", "+f.loc[1])
            var xy = albersProjection(f.loc);
            //console.log(xy[0]+", "+xy[1])
            return xy[0]; })
        .attr('y', function(f) {
            var xy = albersProjection(f.loc);
            return xy[1]; })
        //.transition(750)
        .attr('width', square)
        .attr('height', square)
	        .style('fill', 'rgb(255,0,0)')
	        .style('stroke-width', 0)
	        .on("click", clicked);
	//END SCHOOLS ON MAP


	 


} //end of dataLoaded



