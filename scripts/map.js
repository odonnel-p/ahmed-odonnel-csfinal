//
//
//  Plotting the map
//	odonnel.p 
//	CS 7280, AU 2016
//  zoom functionality based off: https://bl.ocks.org/mbostock/2206590
//
//
	
	//global variables
	var w = d3.select('.plot').node().clientWidth-145,
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
	    .attr( "height", h )
	    //.style("stroke", "blue");

	    //console.log(w+", "+width);  		

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height)
	    .style('fill', '#fffff9')
	    .on("click", clicked);

	//SVG for stacked bar addendum
	var svg_add = d3.select( ".plot" )
		.append("svg")
			.attr("class", "addendum")
			.attr("id", "fff")
			.attr("width", 50)
			.attr("height", "100%")
			.style("display", "none");
			
	var rect2 =	svg_add.append("rect")
					.attr("width", 25)
					.attr("height", 546)
					.attr("class", "rect2")
					.attr("transform", "translate("+22+","+33+")")
					.style("fill", "none")
					.style("stroke", "green");
		svg_add.append('text')
			.attr("transform", "translate("+(11)+","+(595)+")")
			.attr("x", 0 )
			 .attr("y", 0 )
			 .text( "Selection")
			 .attr("font-family", "Raleway")
			 .attr("font-size", "11px")
			 .attr("font-weight", 500)
			 .attr("fill", "black");
							 
							 	  
   var tooltip = svg_add.append("g")
		.attr("class", "toolTip")
		.style("display", null);

	tooltip.append("text")
	  .attr("x", 15)
	  .attr("dy", "1.2em")
	  .style("text-anchor", "middle")
	.style("text-align", "center")
	  .attr("font-size", "12px")
	  .attr("font-weight", "bold");	

	var g = svg.append( "g" );
	//var g2 = svg.append( "g" );

	//PROJECTION
	var albersProjection = d3.geoAlbers()
	    .scale( 190000 )
	    .rotate( [71.099,0] )
	    .center( [0, 42.311] )
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
	.defer(d3.json,'data/CENSUS2010TRACTS_WGS84_geo.json') //bos
    .defer(d3.csv, 'data/Boston_Public_Schools_2012-2013.csv', parseSchool) //sch
    .defer(d3.json, 'data/geocodes/boston_police_department_fio_cleaned_2015a.json') //gj0
	.defer(d3.json, 'data/geocodes/boston_police_department_fio_cleaned_2015b.json') //gj1
	.defer(d3.csv, 'data/percent_white_by_census_tract.csv', function(d) { raceByTract.set(d.id, +d.pc_white); })
    .await(dataLoaded);

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
			return latLong;
		}

		function parseAddress(e) {
			var raw = e;
			var split = e.split( '(' );
			var address = split[0];
			return address;
		}

		function conjoin_repeats(_sch) {
			var prev_bldg_name;
			_sch.forEach( function (obj, i) {
				
				if (obj.building.match(prev_bldg_name) && prev_bldg_name != undefined ) { 
					_sch[i-1].school = [_sch[i-1].school, _sch[i].school];
					_sch.splice(i, 1);
				}
				prev_bldg_name = obj.building;
			});
			return _sch;
		}
//
//
// map functions
// based off of: https://bl.ocks.org/mbostock/2206590
//
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

	    g.selectAll(".neighborhoods")
	        .classed("active", centered && function(d) { return d === centered; });

	    g.transition()
	        .duration(750)
	        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	}

//
//
// Data Loaded
//
//

function dataLoaded(err, bos, sch, gj0, gj1){
	
	//SCH, SCH2 is boston school locations
	var sch2 = conjoin_repeats(sch); 

	//GEOS is geojsons with locations for stop and frisks
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
        //.attr('transform', 'translate(-10,0)')
        .on("click", clicked);
    //END OF NEIGHBORHOODS ON MAP

    //APPEND STOP AND FRISKS ON MAP
	 var radi = 1.1;
	 g.selectAll('.stop_n_frisks')
	 	.data( geos )
	 	.enter()
	 	.append('circle')
	 	.attr('class', 'stop_n_frisks')
	 	.attr('id', function(d) { return ("sf"+d.properties.id); })
	 	.attr('occurence', function(d,i) { return 'oc'+i })
		.attr('cx', function(f) {
            var xy = albersProjection(f.geometry.coordinates);
            return xy[0]; })
        .attr('cy', function(f) {
            var xy = albersProjection(f.geometry.coordinates);
            return xy[1]; })
        .attr('r', radi)
	        .style('fill', 'rgb(255,0,0)')
	        .style('stroke-width', 0)
	        .style('opacity', .12)
	        //.attr('transform', 'translate(-30,0)')
	        // .on("click", clicked);
	 //END STOP AND FRISKS ON MAP


    //APPEND SCHOOLS ON MAP
    var square = 4;
    //Plot schools as squares
    g.selectAll('.square_school')
        .data( sch2 )
        .enter()
        .append('rect')
        .attr('class', 'square_school')
        .attr('school_num', function(d,i) { return 's'+i })
        .attr('x', function(f) {
            var xy = albersProjection(f.loc);
            return xy[0]; })
        .attr('y', function(f) {
            var xy = albersProjection(f.loc);
            return xy[1]; })
        .attr('width', square)
        .attr('height', square)
	        .style('fill', '#171717')
	        .style('stroke-width', 0)
	//END SCHOOLS ON MAP

	// d3.select('#fff')
	// 	.append('svg')
	// 		.attr('id', 'svg_clear')
	// 		.attr('width', 25)
	// 		.attr('height', 545)			
	
		$(window).scroll(function(){
		  if($(window).scrollTop() >= 150 && $(window).scrollTop() < 300  ){
				$(".dd").fadeOut(1500);
		  //less then 100px from top
		  } else if ($(window).scrollTop() >= 300 ){
		    	$("#fff").fadeIn(1500);
				$(".dd").fadeOut();

		  } else {
		     	$("#fff").fadeOut(1000);
		     	$(".dd").fadeIn(1500);
		  }
		});

//
//
// BRUSH, courtesy of an example of E. Gunn
//
//		
		var brush = d3.brush()
			.on("end", brushed);

		var gBrush = svg.append("g")
			.attr("class", "brush")
			.call(brush);

		geos.forEach( function(d) {
			d.properties.description = 	d.properties.description.replace(')', '').split('(')[1];
		})

		var centers = geos.map(function (d) {

			var centroid = geoPath.centroid(d); //provides two numbers [x,y] indicating the screen coordinates of the state
			//Puerto Rico returns NaN, sends error to the console. Also, something wrong with UT data - no fill color assigned.

			return {
				id: d.properties.id,
				description: d.properties.description,
				x0: centroid[0],
				y0: centroid[1],
				x: centroid[0],
				y: centroid[1]
			}
		});

		var selected_GEOs = [];

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
				svg_add.selectAll(".rects").remove();
				svg.selectAll('.stop_n_frisks').style('fill','rgb(255,0,0)');
				selected_GEOs = [];
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

					var selected_GEOArray = [];

					centers.forEach(function(d){
						if (  ((bx0 < d.x0 && d.x0 < bx1) && (by0 < d.y0 && d.y0 < by1)) || ((bx0 > d.x0 && d.x0 > bx1) && (by0 > d.y0 && d.y0 > by1)) ){
							//console.log(d);
							selected_GEOs.push(d);
							selected_GEOArray.push(d.description);
						}
					});

					var selectedString = "";

					selected_GEOs.forEach(function(d,i){
						if (i < selected_GEOs.length - 1){
							selectedString = selectedString + "#sf" + d.id + ","
						}
						else {
							selectedString = selectedString + "#sf" + d.id
						}
					});

					svg.selectAll(".stop_n_frisks").style("fill", "white");
					svg.selectAll(selectedString).style('fill','rgb(255,0,0)');

					draw_chart_addendum(geos,selected_GEOArray);

					var invert1 = albersProjection.invert(s[0]);
					var invert2 = albersProjection.invert(s[1]);

				}

		}
		
	
	function draw_chart_addendum ( _geos, _array) {

		var occur = array_occur(_array);
		var occur2 = make_array_of_objs(occur[0], occur[1]);
		console.log(occur2);

		occur2.sort(function(a, b) {
		    return parseFloat(a.percentage) - parseFloat(b.percentage);
		});

		var addend_h = d3.select('.rect2').node().height.baseVal.value;
		
		var y = d3.scaleLinear()
		    			.domain([0, 100])
		    			.range([0, addend_h]);

		var z = d3.scaleOrdinal()
		   				 .range(["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17"])
		   				 .domain(["Black", "White", "Hispanic", "Data Unavailable", "Asian", "Middle Eastern", "American Indian"]);
		
		var stack = d3.stack()
		    .offset(d3.stackOffsetExpand);

		var tooltip = svg_add.append("g")
			.attr("class", "toolTip")
			.style("display", null);

		  tooltip.append("text")
		    .attr("x", 15)
		    .attr("dy", "1.2em")
		    .style("text-anchor", "middle")
			.style("text-align", "center")
		    .attr("font-size", "12px")
		    .attr("font-weight", "bold");	

		var prev = 0;
		
		var serie = svg_add.selectAll(".rects")
		    .data(occur2)
		    .enter()
		      .append("rect")
		      .attr("class", "rects")
		      .attr("id", function(d) { return d.race+"_add" })
		      .attr("fill", function(d) { return z(d.race); })
				.attr("x", 0)
				.attr("y", function(d,i) {
					var y_current = prev;
					prev = prev + occur2[i].percentage;					
					return y(y_current);
				})
				.attr("width", 25)
				.attr("transform", "translate("+22+","+33+")")
				.attr("height", function(d) { return y(d.percentage); }) //y(d.percentage);
				  // .on("mouseover", function(d) { 
			   //    		tooltip.style("display", null);
			   //    		d3.select(this)
			   //    			.attr("stroke","green")
			   //    			.attr("stroke-width", 2)
						// var e = document.querySelectorAll(':hover');
						// var ind = e[6].__data__.index;
						// lastHovered = ind;
			 		// 	d3.select(serie._groups[0][ind].children[5])
						// 	.style("stroke","red")
						// 	.style("stroke-width", 2); 
			   //          })
				  // .on("mouseout", function(d) { 
			   //    		tooltip.style("display", "none");
			   //    		d3.select(this)
			   //    			.attr("stroke","none");
						// d3.select(serie._groups[0][lastHovered].children[5])
						// 	.style("stroke","none");
						// })
				  // .on("mousemove", function(d) {
			   //    		var xPosition = d3.mouse(this)[0] - 10;
			   //    		var yPosition = d3.mouse(this)[1] + 16;
			   //    		var elements = document.querySelectorAll(':hover');
			   //    		var race = elements[6].__data__.key;
			   //    		tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
			   //    		tooltip.select("text").text(race + ": "  + roundToOneDecimal(100*(d[1]-d[0])) + '%');
			   //    	  });
	}		

	function type(d, i, columns) {
	  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
	  d.total = t;
	  return d;
	}

	function roundToOneDecimal(num) {
		var rounded = Math.round( num * 10 ) / 10;
		return rounded;
	}

	function array_occur(arr) {

		arr.forEach ( function(d,i) { 
				//console.log(d);
				if(d==null) {return arr[i] = "Data Unavailable";}
				if(d=="Middle Eastern or East Indian") {return arr[i] = "Middle Eastern";}
				if(d=="Asian or Pacific Islander") {return arr[i] = "Asian";}
				// if(d=={ d = "Middle Eastern"; }
		});

		//console.log(arr);

		var a = [], b = [], prev, c = {};

		arr.sort();
		//console.log(arr);

		for ( var i = 0; i < arr.length; i++ ) {
			if ( arr[i] !== prev ) {
				a.push(arr[i]);
				b.push(1);
			} else {
				b[b.length-1]++;
			}
			prev = arr[i];
		}
		return [a, b];
	}


	function make_array_of_objs(_a, _b){

		var sum = 0;
			for (var i = 0; i < _b.length; i++) { 
				sum = sum + _b[i];
			}

		var percent = [];
			for (var i = 0; i < _b.length; i++) { 
				percent[i] = _b[i]/sum*100;
			}

		var result = [];
		var obj = {};
			for (var i = 0; i < _a.length; i++) { 
				obj = {
					race: _a[i],
					num_of_incidents: _b[i],
					percentage: percent[i]
				};
				result.push(obj)
			}
		return result;
	}
} //end of dataLoaded
