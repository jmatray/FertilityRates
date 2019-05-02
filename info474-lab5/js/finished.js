'use strict';
/*
1. make a filterByYear function

*/

(function () {

  let data = "no data";
  let allYearsData = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let select = "";


  // load data and make scatter plot after window loads
  window.onload = function () {
    svgScatterPlot = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);


    // Append dropdown to body, and add function to remake scatterplot
    // with filtered year
    select = d3.select("body")
      .append("div")
      .attr('id', 'selectHolder')
      .append("text")
      .text("Year ")
      .attr('id', 'year')
      .append("select")
      .attr('id', 'dropdown')
      .on("change", function (d) {
        let value = d3.select(this).property("value");
        makeScatterPlot(value);
      });

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;

        // Add years to dropdown
        let years = allYearsData.map((row) => row['time']);
        let distinctYears = [...new Set(years)];
        select.selectAll("option")
          .data(distinctYears)
          .enter()
          .append("option")
          .attr("value", function (d) { return d; })
          .property("selected", function(d) { return d === '2000'})
          .text(function (d) { return d; });

        makeScatterPlot(2000);
      });


    /*
    .then(() => {
      let timeExtent = d3.extent(allYearsData.map((row) => row["time"]));
      console.log(timeExtent);
      for (let i = timeExtent[0]; i <= timeExtent[1]; i++) {
        setTimeout(() => {
          console.log(i);
          svgScatterPlot.html("");
          makeScatterPlot(i);
        }, (i - timeExtent[0]) * 200);
      }
      
    });*/
  }

  // make scatter plot with trend line
  function makeScatterPlot(year) {
    svgScatterPlot.html("");
    filterByYear(year);

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot, { min: 50, max: 450 }, { min: 50, max: 450 });

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  function filterByYear(year) {
    data = allYearsData.filter((row) => row['time'] == year);
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate (" + data[0]["time"] + ")");

    svgScatterPlot.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);



    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', (d) => pop_map_func(d["pop_mlns"]))
      .attr('fill', "#4286f4")
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html(
          'Country: ' + d.location + "<br/>" +
          'Year: ' + d.time + "<br/>" +
          'Life Expectancy: ' + d.life_expectancy + "<br/>" +
          'Fertility Rate: ' + d.fertility_rate + "<br/>" +
          'Population: ' +  numberWithCommas(d["pop_mlns"] * 1000000)

          )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px")
          .style("width", "auto")
          .style("height", "auto")
          .style("text-align", "left")
          .style("padding", ".5em");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }


  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
