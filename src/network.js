async function loadNetwork() {
  // --- Grab sliders and their output spans ---
  const sliderRatio = document.getElementById("sliderRatio");
  const outputRatio = document.getElementById("sliderRatioValue");

  const sliderH1 = document.getElementById("sliderHomophilyMajority");
  const outputH1 = document.getElementById("sliderHomophilyMajorityValue");

  const sliderH2 = document.getElementById("sliderHomophilyMinority");
  const outputH2 = document.getElementById("sliderHomophilyMinorityValue");

  // --- Live updates for slider values ---
  outputRatio.textContent = sliderRatio.value;
  sliderRatio.oninput = function () {
    outputRatio.textContent = this.value;
  };

  outputH1.textContent = sliderH1.value;
  sliderH1.oninput = function () {
    outputH1.textContent = this.value;
  };

  outputH2.textContent = sliderH2.value;
  sliderH2.oninput = function () {
    outputH2.textContent = this.value;
  };

  // --- Build JSON filename (example naming convention) ---
  // sliderRatio.value needs to be multiplied by 10 to match file names
  // e.g., 0.1 -> 1, 0.2 -> 2, ..., 0.9 -> 9
  // Assuming slider values are in the range [0.1, 0.9]
  const ratioValue = Math.round(sliderRatio.value * 10);
  const fileName = `../data/network_generated/graph_${ratioValue}_${sliderH1.value}_${sliderH2.value}.json`;

  console.log("Loading:", fileName);

  d3.json(fileName).then(function (graph) {
    d3.select("svg").selectAll("*").remove(); // Clear previous graph

    // --- Normalize IDs to strings to avoid D3 matching issues ---
    graph.nodes.forEach(d => d.id = d.id.toString());
    graph.links.forEach(l => {
      l.source = l.source.toString();
      l.target = l.target.toString();
    });

    // ✅ Define svg, width, height here
    const svg = d3.select("svg");
    const width = +svg.attr("width") || window.innerWidth;
    const height = +svg.attr("height") || window.innerHeight * 0.9;

    // --- Mark top 10 nodes by order_node ---
    const top10 = graph.nodes
      .slice() // copy
      .sort((a, b) => a.order_node - b.order_node) // ascending
      .slice(0, 10);

    const top10Ids = new Set(top10.map(d => d.id));
    graph.nodes.forEach(d => {
      d.isTop10 = top10Ids.has(d.id);
    });

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

    // --- Draw nodes as groups (to allow crown overlay) ---
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graph.nodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Base SVG (minority/majority)
    node.append("image")
      .attr("xlink:href", d => d.minority === 1 ? "../images/boba.svg" : "../images/tika.svg")
      .attr("width", 50)
      .attr("height", 50)
      .attr("x", -20)
      .attr("y", -20);

    // Crown overlay for top 10 nodes
    node.filter(d => d.isTop10)
      .append("image")
      .attr("xlink:href", "../images/crown.svg")
      .attr("width", 60)
      .attr("height", 60)
      .attr("x", -20)   // adjust crown position
      .attr("y", -25);  // place above the node

    simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
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

    // 👇 Add jitter force
  simulation.force("jitter", () => {
    graph.nodes.forEach(n => {
      n.vx += (Math.random() - 0.5) * 0.1;  // tiny random motion
      n.vy += (Math.random() - 0.5) * 0.1;
    });
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
    .force('center', d3.forceCenter(width / 2, height / 2))
  .alphaDecay(0);   // keeps the simulation running forever

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
  simulation.on("tick", () => {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("x", d => d.x - 20)   // because your image is 40x40
    .attr("y", d => d.y - 20);
  });
}

function createSliderTicks(sliderId, numSteps) {
    const slider = document.getElementById(sliderId);
    const ticksContainer = document.getElementById(sliderId + "Ticks");
    ticksContainer.innerHTML = ""; // clear previous ticks

    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = (max - min) / numSteps;

    for (let i = 0; i <= numSteps; i++) {
        const value = min + i * step;
        const percent = (i / numSteps) * 100;

        // tick line
        const tick = document.createElement("span");
        tick.style.left = percent + "%";
        ticksContainer.appendChild(tick);

        // min/max labels
        if (i === 0 || i === numSteps) {
            const label = document.createElement("label");
            label.textContent = value.toFixed(2);
            label.style.left = percent + "%";
            ticksContainer.appendChild(label);
        }
    }
}

// Initial load
loadNetwork();


