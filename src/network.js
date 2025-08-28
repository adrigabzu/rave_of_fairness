async function loadNetwork() {
  var sliderRatio = document.getElementById("myRatio");
  var output = document.getElementById("demoRatio");

  var slidermyH1 = document.getElementById("myH1");
  var outputH1 = document.getElementById("demoH1");
  
  var slidermyH2 = document.getElementById("myH2");
  var outputH2 = document.getElementById("demoH2");

  // --- Live updates for slider values ---
  output.innerHTML = sliderRatio.value;
  sliderRatio.oninput = function () {
    output.innerHTML = this.value;
  };

  outputH1.innerHTML = slidermyH1.value;
  slidermyH1.oninput = function () {
    outputH1.innerHTML = this.value;
  };

  outputH2.innerHTML = slidermyH2.value;
  slidermyH2.oninput = function () {
    outputH2.innerHTML = this.value;
  };

  // --- Build JSON filename ---
  const fileName = `../data/network_generated/graph_${sliderRatio.value}_${slidermyH1.value}_${slidermyH2.value}.json`;

  
  console.log("Loading:", fileName);

  d3.json(fileName).then(function (graph) {
    d3.select("svg").selectAll("*").remove(); // Clear previous graph

    const svg = d3.select("svg");
    const width = +svg.attr("width") || window.innerWidth;
    const height = +svg.attr("height") || window.innerHeight * 0.9;

    const simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("stroke", "#999");

    // Draw nodes as images
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("image")
      .data(graph.nodes)
      .enter()
      .append("image")
      .attr("xlink:href", d => d.minority === 1 ? "../images/minority.svg" : "../images/majority.svg")
      .attr("width", 40)
      .attr("height", 40)
      .attr("x", -20)
      .attr("y", -20)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("x", d => d.x - 20)
        .attr("y", d => d.y - 20);
    });

    // Hide edges after 5 seconds
    setTimeout(() => {
      svg.select(".links").style("display", "none");
    }, 5000);

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x; d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }
  }).catch(err => {
    console.error("Error loading JSON:", err);
  });
}


function drawNetwork(nodes, links) {
  d3.select('svg').selectAll('*').remove();
  const svg = d3.select('svg');
  const width = +svg.attr('width') || window.innerWidth;
  const height = +svg.attr('height') || window.innerHeight * 0.9;

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(50))
    .force('charge', d3.forceManyBody().strength(-30))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const link = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('class', 'link');

  const node = svg.append('g')
    .attr('class', 'nodes')
    .selectAll("image")
    .data(nodes)
    .enter()
    .append("image")
    .attr("xlink:href", d => d.minority === 1 ? "../images/minority.svg" : "../images/majority.svg")
    .attr("width", 40)
    .attr("height", 40)
    .attr("x", -20)
    .attr("y", -20)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // node.append('title')
  //   .text(d => `Node: ${d.id}\nMinority: ${d.minority}\nPageRank: ${d.pagerank}`);

}

// Initial load
loadNetwork();