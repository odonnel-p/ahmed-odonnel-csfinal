//
//
//  Plotting the map
//	odonnel.p 
//	CS 7280, AU 2016
//  zoom functionality based off: https://bl.ocks.org/mbostock/2206590
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
		
	//RACE COLOR MAPPING
	var raceByTract = d3.map();
	
	var raceColors = d3.scaleThreshold()
		.domain([0,20,40,60,80,100])
		.range(["#eeeeee", "#d4e5e8", "#bbdde2", "#A2D4DD", "#89CCD7", "#70C4D2"]);
		
	//SVG FOR MAP
	var svg = d3.select( ".plot" )
	    .append( "svg" )
	    .attr( "width", w )
	    .attr( "height", h );

	    //console.log(w+", "+width);

	    		

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height)
	    .style('fill', '#fffff9')
	    .on("click", clicked);

	    //SVG for stacked bar addendum
	    		var svg_add = svg.append("rect")
	    			.attr("width", 25)
	    			.attr("height", 546)
	    			.attr("transform", "translate("+(w-55)+",4)")
	    			.style("fill", "#ddd");
	    			//.style("stroke", "orange");

	var g = svg.append( "g" );
	//var g2 = svg.append( "g" );

	//PROJECTION
	var albersProjection = d3.geoAlbers()
	    .scale( 190000 )
	    .rotate( [71.087,0] )
	    .center( [0, 42.313] )
	    .translate( [width/2,height/2] );

	//DRAWING THE PATHS OF geoJSON OBJECTS
	var geoPath = d3.geoPath()
	    .projection( albersProjection );


//
//
// adding the brush
// from: http://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
//
//


			// var brush = d3.brush().on("end", brushended),
			//     idleTimeout,
			//     idleDelay = 350;

			// var k = height / width,
			//     x0 = albersProjection([-70.922, -71.195]),
			//     y0 = albersProjection([42.404, -42.23]),
			//     x = d3.scaleLinear().domain(x0).range([0, w]),
			//     y = d3.scaleLinear().domain(y0).range([h, 0]);
			//     //z = d3.scaleOrdinal(d3.schemeCategory10);




			//push up to brushended()
			// 		  var s = d3.event.selection;
			// 		  if (!s) {
			// 		    if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
			// 		    x.domain(x0);
			// 		    y.domain(y0);
			// 		    //undraw_chart_addendum();
			// 		  } else {
			// 		    x.domain([s[0][0], s[1][0]].map(x.invert, x));
			// 		    y.domain([s[1][1], s[0][1]].map(y.invert, y));
			// 		    svg.select(".brush").call(brush.move, null);
			// 		    draw_chart_addendum();
			// 		  }
			// 		  console.log("brushended, ended.");
			// 		}

			// function idled() {
			// 		  idleTimeout = null;
			// 		}

			// function draw_chart_addendum() {
			// 		  // var t = svg.transition().duration(750);
			// 		  // svg.select(".axis--x").transition(t).call(xAxis);
			// 		  // svg.select(".axis--y").transition(t).call(yAxis);
			// 		  // svg.selectAll("circle").transition(t)
			// 		  //     .attr("cx", function(d) { return x(d[0]); })
			// 		  //     .attr("cy", function(d) { return y(d[1]); });
			// 		  console.log("chart_addendum drawn");
			// 		}

 

//
//
// queue data, json
// parse
//
//

	d3.queue()
    .defer(d3.csv,'data/Boston_Police_Department_FIO_CLEANED.csv', parse) //rows
	.defer(d3.json,'data/CENSUS2010TRACTS_WGS84_geo.json') //bos
    .defer(d3.csv, 'data/Boston_Public_Schools_2012-2013.csv', parseSchool) //sch
    .defer(d3.json, 'data/geocodes/boston_police_department_fio_cleaned_2015a.json') //gj0
	.defer(d3.json, 'data/geocodes/boston_police_department_fio_cleaned_2015b.json') //gj1
	.defer(d3.csv, 'data/percent_white_by_census_tract.csv', function(d) { raceByTract.set(d.id, +d.pc_white); })
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

function dataLoaded(err, rows, bos, sch, gj0, gj1){
        
	//ROWS is stop and frisk data
	//console.log(rows); // 152230 rows
	

	//SCH, SCH2 is boston school locations
	var sch2 = conjoin_repeats(sch); 
	//console.log(sch2);

	//GEOS is geojsons with locations for stop and frisks, 
	var geos = gj0.features
				.concat(gj1.features);

	geos.sort(function(a, b) { return a.properties.id - b.properties.id; });

    //APPEND NEIGHBORHOODS ON MAP
    g.selectAll( ".boston" )
        .data( bos.features )
        .enter()
        .append('path')
        .attr('class', 'boston neighborhoods')
	    .style('fill', function(d,i) {return raceColors(raceByTract.get(d.id)); })
        .attr( 'd', geoPath )
		.style("stroke","#fffff9")
		.style("stroke-width",1)
        .attr('transform', 'translate(-30,0)')
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
	        .attr('transform', 'translate(-30,0)')
	        // .on("click", clicked);
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
        .attr('transform', 'translate(-30,0)')
	        .style('fill', 'rgb(255,0,0)')
	        .style('stroke-width', 0)
	        //.on("click", clicked);
	//END SCHOOLS ON MAP

	d3.select('#fff')
		.append('svg')
			.attr('id', 'svg_clear')
			.attr('width', 25)
			.attr('height', 545)
			// .style('outline', 'dashed 1px #aaa')
			// .style('outline-offset', '-10px')
			
	
		$(window).scroll(function(){
		  //more then or equals to
		  if($(window).scrollTop() >= 150 && $(window).scrollTop() < 300  ){
				$(".dd").fadeOut(3000);
		  //less then 100px from top
		  } else if ($(window).scrollTop() >= 300 ){
		    	$("#fff").fadeIn(3000);
				$(".dd").fadeOut();

		  } else {
		     	$("#fff").fadeOut(1000);
		     	$(".dd").fadeIn(1600);
		  }
		});

//
//
// BRUSH
//
//		
		var brush = d3.brush()
		//.on("start brush", brushed)
		.on("end", brushed);

		var gBrush = svg.append("g")
			.attr("class", "brush")
			.call(brush);

		

		console.log(geos);

		// var centers = mapJson.features.map(function (d) {

		// 	var centroid = path.centroid(d); //provides two numbers [x,y] indicating the screen coordinates of the state
		// 	//Puerto Rico returns NaN, sends error to the console. Also, something wrong with UT data - no fill color assigned.

		// 	return {
		// 		id: d.id,
		// 		x0: centroid[0],
		// 		y0: centroid[1],
		// 		x: centroid[0],
		// 		y: centroid[1]
		// 	}
		// });

		function brushed() {

			clickRect = svg.append('rect')
				.attr('width',600)
				.attr('height',400)
				.attr('class', 'clickRect')
				.style('fill','none')
				.attr('pointer-events', 'all')
				.on('click',clickedRect);


			function clickedRect(){
				svg.selectAll('.clickRect').remove();
				svg.selectAll('.country').style('fill','none');
				selectedCountries = [];
				selectedString = '';
			}

			var s = d3.event.selection; //returns the brush selection region
				if (s != null){
					var bx0 = s[0][0], //get the x0 position from the brush selection
						by0 = s[0][1],
						bx1 = s[1][0],
						by1 = s[1][1],
						bdx = bx1 - bx0,
						bdy = by1 - by0,
						max = 0;

					var selectedCountryArray = [];

					centers.forEach(function(d){
						if (  ((bx0 < d.x0 && d.x0 < bx1) && (by0 < d.y0 && d.y0 < by1)) || ((bx0 > d.x0 && d.x0 > bx1) && (by0 > d.y0 && d.y0 > by1)) ){
							//console.log(d.id);
							selectedCountries.push(d);
							selectedCountryArray.push(d.id);
						}
					});

					svg.selectAll('.country').style('fill','lightgray');

					var selectedString = "";

					selectedCountries.forEach(function(d,i){
						if (i < selectedCountries.length - 1){
							selectedString = selectedString + "." + d.id + ","
						}
						else {
							selectedString = selectedString + "." + d.id
						}
					});

					svg.selectAll(selectedString).style('fill','#80b78d');

					countryList(forests,selectedCountryArray);

					var invert1 = projection.invert(s[0]);
					var invert2 = projection.invert(s[1]);

				}

		}
		
				


//
//
// Brush 
//
//
	
	// var x0 = [w/2, h/2],
 //    y0 = [-4.5 * k, 4.5 * k],
	// xx = d3.scaleLinear().domain(x0).range([0, width]),
 //    yy = d3.scaleLinear().domain(y0).range([height, 0]);

	// var brush = d3.brush().on("end", brushended),
	// idleTimeout,
 //    idleDelay = 350;

	// svg.append("g")
	//     .attr("class", "brush")
	//     .call(brush);

	// function brushended() {
	//   var s = d3.event.selection;
	  
	//   if (!s) {
	//     if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
	//     console.log("zoom out?")
	//     // xx.domain(x0);
	//     // yy.domain(y0);
	//   } else {
	//     xx.domain([s[0][0], s[1][0]].map(x.invert, x));
	//     yy.domain([s[1][1], s[0][1]].map(y.invert, y));
	//     svg.select(".brush").call(brush.move, null);
	//   }
	//   zoom();
	// }

	// function idled() {
	// 	idleTimeout = null;
	// }

	// function zoom() {
	//   console.log('do this to stacked bar');
	// }
    
    

} //end of dataLoaded



