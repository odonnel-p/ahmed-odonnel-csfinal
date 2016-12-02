var get_chart_h = d3.select('#chart').node().clientHeight-50;
var get_chart_w = d3.select('#chart').node().clientWidth-50;
var padding = 18;
var svg2 = d3.select("#chart").append("svg").attr("id","svg2").attr("width",get_chart_w).attr("height",get_chart_h).style("padding", "10px 30px 30px 30px");

var x = d3.scaleBand()
    .rangeRound([padding, get_chart_w-padding]) //chart_w
    .padding(.4)
    .align(0.1);

var y = d3.scaleLinear()
    .rangeRound([get_chart_h, 0]);

var z = d3.scaleOrdinal()
    .range(["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17"]);

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
	.attr("class", "toolTip")
	.style("display", null);

  tooltip.append("text")
    .attr("x", 15)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
	.style("text-align", "center")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");	

  serie.selectAll("rect")
    .data(function(d) { return d; })
	.enter().append("rect")
      .attr("x", function(d) { return x(d.data.Year); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth())
	  .on("mouseover", function() { 
          console.log("Mouseover");
      		tooltip.style("display", null);
      		d3.select(this)
      			.attr("stroke","red")
      			.attr("stroke-width", 2);
            })
	  .on("mouseout", function() { 
          console.log("mouseout");
      		tooltip.style("display", "none");
      		d3.select(this)
      			.attr("stroke","none");
            })
	  .on("mousemove", function(d) {
          console.log("mousemove");
      		var xPosition = d3.mouse(this)[0] - 10;
      		var yPosition = d3.mouse(this)[1] + 16;
      		var elements = document.querySelectorAll(':hover');
          console.log(elements);
      		var race = elements[6].__data__.key;
      		tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
      		tooltip.select("text").text(race + ": "  + roundToOneDecimal(100*(d[1]-d[0])) + '%');
      	  });

  svg2.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + get_chart_h + ")")
    .call(d3.axisBottom(x));
});

function type(d, i, columns) {
  for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
  d.total = t;
  return d;
}

function roundToOneDecimal(num) {
	var rounded = Math.round( num * 10 ) / 10;
	return rounded;
}
