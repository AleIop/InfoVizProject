class TimeGraph {

  constructor(model, root) {
    this.model = model;
    this.root = root;

    model.addObserver(this.update); //to be able to get the search results
    this.render();
  }

  render() {
    timeGraph(null);
  }

  //HERE WE HAVE ACCESS TO THE SEARCH RESULTS
  update(whatHappened) {
    if(whatHappened.searchResults) {
      $("#timeGraph").empty();
      timeGraph(whatHappened.searchResults.map(r => [r.StartDate, r.NCTId, r.OverallStatus]));
      drawLegend(whatHappened.searchResults.map(r => r.OverallStatus));
      // Clear resultsDiv and render search results
    }
  }
}

function drawLegend(statuses) {
  $("#legend").empty(); // empty legend
  var classes = Array.from(new Set(statuses.map(s => s[0])));
  classes = classes.map(c => String(c).replace(/ /g, '_').replace(",", ''));
  classes = classes.map(c => {
    // <div class="circle Recruiting px-2">⬤<span class="pl-2">Recruiting</span></div>
    return h("div", {class: `circle ${c} px-2`}, "⬤",
      h("span", {class: "pl-2"}, c.replace(/_/g, ' '))
    )
  });
  // console.log(classes)
  h("fragment", {}, classes).render(document.querySelector('#legend'));
}

function timeGraph(searchResults) {

  //Define dimensions
  var margin = 25;
  width = document.getElementById("timeGraph").getBoundingClientRect().width - margin*2,
  height = document.getElementById("timeGraph").getBoundingClientRect().height - margin*2;

  //Create svg
  var timeGraphSVG = d3.select("#timeGraph").append("svg")
      .attr("id", "timeGraphSVG")
      .attr("width", width + margin*2)
      .attr("height", height + margin*2)
      .append("g").attr("transform", "translate(" + margin + "," + margin + ")");

  //Retrieve data
  var trials = [];
  if(searchResults != null) {
    for(var i = 0; i < searchResults.length; i++) {
      var tmp = {}
      tmp.startDate = new Date(Date.parse(searchResults[i][0]));
      tmp.id = searchResults[i][1];
      tmp.status = searchResults[i][2];
      trials.push(tmp);
    }
  }

  //Create scale and range
  var x = d3.scaleTime()
    .domain([new Date(1970, 0, 1), new Date()]).nice()
    .range([0, width]);

  //Create rect for zooming and panning
  var view = timeGraphSVG.append("rect")
  .attr("id", "tg-view")
  .attr("class", "view")
  .style("fill", "transparent")
  .attr("x", -margin)
  .attr("y", -margin)
  .style("position", "absolute")
  .style("z-index", "0")
  .attr("width", width + margin*2)
  .attr("height", height + margin*2);

    //document.getElementById("tg-view").addEventListener("click", function() {console.log("viewList")});

  //Create the X Axis
  var xAxis = d3
    .axisBottom(x)
    //.ticks(width/100)
    //.ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%m/%Y"))
    .tickSize([width*0.0075]); //maybe do it in css

  //Append the X Axis
  var axisG = timeGraphSVG.append("g")
    .attr("id", "xAxis")
    .attr("transform","translate(0,50)")
    .call(xAxis);

  d3.select("#xAxis").select(".domain")
    .attr("id", "axisPath");


  var refTicks = d3.selectAll(".tick");
  reformatTicks(refTicks);
  if(searchResults != null) {
    refresh();
  }

  //Find out how many times the user can zoom depending on how many months there are in the interval
  //var zoomScaleCounter = ((d3.max(x.domain()).getFullYear()*12 + d3.max(x.domain()).getMonth()) - (d3.min(x.domain()).getFullYear()*12 + d3.min(x.domain()).getMonth())) / 12;

  //Create zoom property
  var zoom = d3.zoom()
    .scaleExtent([1, 40])
    .extent([[margin, 0], [width - margin, height]])
    .translateExtent([[margin, -Infinity], [width - margin, Infinity]])
    //.translateExtent([[0, 0], [width, 0]])
    .on("zoom",zoomed);

  timeGraphSVG.call(zoom);

  function zoomed() {
    //view.attr("transform", d3.event.transform); //Don't think I need this but I copied it so...
    axisG.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    var ticks = d3.selectAll(".tick");
    reformatTicks(ticks);
    if(searchResults != null) {
      refresh();

    }
  }

  //main function executed every zoom and first time
  function refresh() {
    //Initialize variables to be used inside of zoomed
    var prevDateTick = trials[0].startDate,
    prevTick = document.getElementById("xAxis").children[1];

    //Calculate tick distance (unit of space)
    var firstTick = document.getElementById("xAxis").children[1],
      secondTick = document.getElementById("xAxis").children[2],
      firstTickX = firstTick.children[0].getBoundingClientRect().left,
      secondTickX = secondTick.children[0].getBoundingClientRect().left,
      tickDist = secondTickX - firstTickX;

    //Calculate time distance (unit of time)
    var firstYear = firstTick.getAttribute("id").split("/")[1],
      firstMonth = +(firstTick.getAttribute("id").split("/")[0]) - 1,
      secondYear = secondTick.getAttribute("id").split("/")[1],
      secondMonth = +(secondTick.getAttribute("id").split("/")[0]) - 1,
      firstDate = new Date(firstYear, firstMonth),
      secondDate = new Date(secondYear, secondMonth),
      timeDist = secondDate - firstDate;

    var timePerSpace = timeDist / tickDist;

    var lastTick = document.getElementById("xAxis").lastChild

    var leftEdgeX = document.getElementById("axisPath").getBoundingClientRect().left;
    var rightEdgeX = document.getElementById("axisPath").getBoundingClientRect().right;
    var leftEdgeDate = new Date(firstDate - (new Date(((firstTickX - leftEdgeX) * timePerSpace))));
    var rightEdgeDate = new Date(leftEdgeDate.getTime() + ((rightEdgeX - leftEdgeX) * timePerSpace));

    var tickDates = [],
      ticks = [];
    for(var i = 1; i < document.getElementById("xAxis").children.length; i++) {
      tick = document.getElementById("xAxis").children[i];
      ticks[i - 1] = tick;
      tickDates[i - 1] = new Date((tick).getAttribute("id").split("/")[1], (+((tick).getAttribute("id").split("/")[0]) - 1));

      d3.select(tick).selectAll(".tg-result").remove();
    }

    for(var i = 0; i < trials.length; i++) {
      var trial = trials[i];
      if(trial.startDate < leftEdgeDate || trial.startDate > rightEdgeDate) {
        continue;
      }
      else if(trial.startDate > leftEdgeDate && trial.startDate < tickDates[0]) {
        var offsetTime = (tickDates[0]).getTime() - trial.startDate.getTime();
        var cx = offsetTime / timePerSpace;
        drawResults(trial, ticks[0], cx);
      }
      else if(trial.startDate < rightEdgeDate && trial.startDate > tickDates[tickDates.length - 1]) {
        offsetTime = trial.startDate.getTime() - (tickDates[tickDates.length - 1]).getTime() ;
        cx = offsetTime / timePerSpace;
        drawResults(trial, ticks[ticks.length - 1], -cx);
      }

      prevTickDate = tickDates[0];
      for(var j = 0; j < tickDates.length; j++) {
        tickDate = tickDates[j];
        trial.startDate.getDate()
        if((trial.startDate.getFullYear() == tickDate.getFullYear()) && (trial.startDate.getMonth() == tickDate.getMonth()) && (trial.startDate.getDate() == 1)) {
          drawResults(trial, ticks[j], 0);
        }
        else if((trial.startDate.getTime() > prevTickDate.getTime()) && (trial.startDate.getTime() < tickDate.getTime())) {
          offsetTime = tickDate.getTime() - trial.startDate.getTime();
          cx = offsetTime / timePerSpace;
          drawResults(trial, ticks[j], cx);
        }
        prevTickDate = tickDates[j];
      }
    }
  }

  function drawResults(trial, tick, cx) {
  var circle = d3.select(tick)
    .append("circle")
    // .on('mouseenter', onMouseEnter)
    // .on('mouseleave', onMouseLeave)
    .attr("id", trial.id)
    .attr("class", "tg-result")
    .attr("cy", "0")
    .attr("cx", -cx)
    .style("position", "absolute")
    .style("z-index", "5")
    .attr("stroke", "white")
    .attr("r", "5");
    document.querySelector("#" + trial.id).classList.add(String(trial.status).replace(/ /g, '_').replace(
      ",", ''));
  }

  document.getElementById("tg-view").addEventListener("click", myFunction);
  function myFunction() {
    console.log("dsuiidsf");
  }

  //   const onMouseEnter = (d,m,n) => {
  //     // highlight dot
  //     d3.select(n[m]).style('fill', 'orange');

  //     // highlight corresponding search result
  //     const card = [...document.getElementsByClassName('card-title')]
  //       .find(({textContent}) => textContent === d.properties.title);

  //     card.parentElement.style.background = '#eee';
  // };

  // const onMouseLeave = ({properties}, x, y) => {
  //   d3.select(y[x]).style('fill', '#007bff');

  //   const card = [...document.getElementsByClassName('card-title')]
  //     .find(({textContent}) => textContent === properties.title);

  //   if (card) card.parentElement.style.background = '#F8F9FA';
  // };

  function reformatTicks(ticks) {
    ticks.each(function () {
      d3.select(this)
        .attr("id", d3.select(this).select("text").text());
      if(d3.select(this).select("text").text().startsWith("01")) {
        d3.select(this).select("line")
          .attr("class", "yearTick");
      }
      else {
        d3.select(this).select("text")
          .text(d3.select(this).select("text").text().split("/")[0]);
      }
    })
  }

  // function setColor(circle, status) {

  //   console.log(status);
  // }
}
