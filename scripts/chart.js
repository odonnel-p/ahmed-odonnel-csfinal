//svg and g, g2 might be in use in map.js --PJO
var get_chart_h = d3.select('#chart').node().clientHeight-50;
var get_chart_w = d3.select('#chart').node().clientWidth-50;

//NEXT STEP: Take off both y-axes and make them a tool tip.
// maybe based off of http://bl.ocks.org/mstanaland/6100713 

//#chart contains an svg. SVGs do not have the "overflow" styling like other elements. All axes and marks must be on svg.
var padding = 18;
var svg2 = d3.select("#chart").append("svg").attr("id","svg2").attr("width",get_chart_w).attr("height",get_chart_h).style("padding", "30px 30px 30px 30px");

var x = d3.scaleBand()
    .rangeRound([padding, get_chart_w-padding]) //chart_w
    .padding(.4)
    .align(0.1);

var y = d3.scaleLinear()
    .rangeRound([get_chart_h, 0]); //chart_h

var z = d3.scaleOrdinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var stack = d3.stack()
    .offset(d3.stackOffsetExpand);

d3.csv("data/chart1data.csv", type, function(error, data) {
  if (error) throw error;

  x.domain(data.map(function(d) { return d.Year; }));
  z.domain(data.columns.slice(1));

  var serie = svg2.selectAll(".serie")
    .data(stack.keys(data.columns.slice(1))(data))
    .enter()
      .append("g")
      .attr("class", "serie")
      .attr("fill", function(d) { return z(d.key); });
	  
  var tooltip = svg2.append("g")
	.attr("class","tooltip")
	.style("display", "none");
	  
  tooltip.append("rect")
	.attr("width", 30)
    .attr("height", 20)
    .attr("fill", "white")
    .style("opacity", 0.5);

  tooltip.append("text")
    .attr("x", 15)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");		  

  serie.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return x(d.data.Year); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
	  .on("mouseover", function() { tooltip.style("display", null); })
	  .on("mouseout", function() { tooltip.style("display","none"); })
	  .on("mousemove", function(d) {
		  var xPosition = d3.mouse(this)[0] - 15;
		  var yPosition = d3.mouse(this)[1] - 25;
		  tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
		  console.log(d.key);
		  tooltip.select("text").text(roundToOne(100*(d[1]-d[0])) + '%');
	  });

  svg2.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + get_chart_h + ")")
    .call(d3.axisBottom(x));

  //ticks and labels for percentage (on the left)
/*   svg2.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", "translate(28,0)")
      .call(d3.axisLeft(y).ticks(10, "%"));

  //ticks and labels for race (on the right)
  var legend = serie.append("g")
      .attr("class", "legend")
      .attr("transform", function(d) { var d = d[d.length - 1]; console.log(d); return "translate(" + (x(d.data.Year) + x.bandwidth()) + "," + ((y(d[0]) + y(d[1])) / 2) + ")"; });

  legend.append("line")
      .attr("x1", -6)
      .attr("x2", 6)
      .attr("stroke", "#000"); */

/*   legend.append("text")
    .attr("x", 9)
    .attr("dy", "0.35em")
    .attr("fill", "#000")
    .style("font", "10px sans-serif")
    .text(function(d) { return d.key; }); */
});

function type(d, i, columns) {
  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
  d.total = t;
  return d;
}

function roundToOne(num) {
	var rounded = Math.round( num * 10 ) / 10;
	return rounded;
}
