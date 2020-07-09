// https://observablehq.com/@d3/zoomable-treemap@395
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["flare-2.json",new URL("flare-2.json",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","treemap","data","name","format","DOM"], function(d3,width,height,treemap,data,name,format,DOM)
{
  width = document.body.querySelector('#visualization').getBoundingClientRect().width;
  height = document.body.querySelector('#geo-map').getBoundingClientRect().height + document.getElementById("timeGraph").getBoundingClientRect().height - 30;
  const x = d3.scaleLinear().rangeRound([0, width]);
  const y = d3.scaleLinear().rangeRound([0, height]);

  const svg = d3.create("svg")
      .attr("viewBox", [0.5, -30.5, width, height + 30])
      .style("font", "10px sans-serif");

  let group = svg.append("g")
      .call(render, treemap(data));

  function render(group, root) {
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g");

    node.filter(d => d === root ? d.parent : d.children)
        .attr("cursor", "pointer")
        .on("click", d => d === root ? zoomout(root) : zoomin(d));

    node.filter(d => !d.children)
        .attr("cursor", "pointer")
        .on("click", d => {
          // Switch to map view
          switchTo('map');
          // Fill in value in search bar and press "Search"
          document.getElementById("condition_or_disease").value = d.data.name;
          document.getElementById("search").click();
        });

    node.append("title")
        .text(d => `${name(d)}\n${format(d.value)}`);

    node.append("rect")
        .attr("id", d => (d.leafUid = DOM.uid("leaf")).id)
        // .attr("fill", d => d === root ? "#fff" : d.children ? "#92beeb" : "#d3e5f7")
        .attr("fill", d => {
          if (d.data.name === "More" && d !== root) {
            console.log(d);
            return "#5197df"
          };
          return d === root ? "#fff" : d.children ? "#92beeb" : "#d3e5f7"
        })
        .attr("stroke", "#fff");

    node.append("clipPath")
        .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
      .append("use")
        .attr("xlink:href", d => d.leafUid.href);

    node.append("text")
        .attr("clip-path", d => d.clipUid)
        .attr("font-weight", d => d === root ? "bold" : null)
      .selectAll("tspan")
      // .data(d => (d === root ? name(d) : d.data.name).split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
      .data(d => (d === root ? name(d) : d.data.name).split().concat("Num. of Trials: " + format(d.value)))
      .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
        .text(d => d);

    group.call(position, root);
  }

  function position(group, root) {
    group.selectAll("g")
        .attr("transform", d => {
          // if (d.data.name == "More") return `translate(0, 10)`;
          return d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`
        })
      .select("rect")
        .attr("width", d => {
          // if (d.data.name == "More") return 10;
          return d === root ? width : x(d.x1) - x(d.x0)
        })
        .attr("height", d => {
          // if (d.data.name == "More") return 10;
          return d === root ? 30 : y(d.y1) - y(d.y0)
        })
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .call(position, d.parent))
        .call(t => group1.transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d));
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d))
        .call(t => group1.transition(t)
          .call(position, d.parent));
  }

  return svg.node();
}
);
  main.variable(observer("data")).define("data", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("flare-2.json").json().then(d => processData(d))
)});
  main.variable(observer("treemap")).define("treemap", ["d3","tile"], function(d3,tile){return(
data => d3.treemap()
    .tile(tile)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => (a.value > b.value) ? -1 : 1))
)});
  main.variable(observer("tile")).define("tile", ["d3","width","height"], function(d3,width,height){return(
function tile(node, x0, y0, x1, y1) {
  d3.treemapSquarify(node, 0, 0, width, height);
  for (const child of node.children) {
    child.x0 = x0 + child.x0 / width * (x1 - x0);
    child.x1 = x0 + child.x1 / width * (x1 - x0);
    child.y0 = y0 + child.y0 / height * (y1 - y0);
    child.y1 = y0 + child.y1 / height * (y1 - y0);
  }
}
)});
  main.variable(observer("name")).define("name", function(){return(
d => d.ancestors().reverse().map(d => d.data.name).join("/")
)});
  main.variable(observer("width")).define("width", function(){return(
width//954
)});
  main.variable(observer("height")).define("height", function(){return(
height//924
)});
  main.variable(observer("format")).define("format", ["d3"], function(d3){return(
d3.format(",d")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}

function processData(data) {
  data.children.forEach(c => {
    // Sort children
    c.children.sort((a, b) => (a.value > b.value) ? -1 : 1);
    // Take only first 20
    c.children = computeMore(c.children);
  });

  return data;
}

function computeMore(children) {
  var sls = 70; // slice size
  if (children.length <= sls) {
    return children;
  } else {  // > 70
    var more = { name: "More", children: computeMore(children.slice(sls)) };
    return [...children.slice(0, sls), more];
  }
}
