// -------------------------
// Load network JSON & prepare data
// -------------------------
async function loadNetwork() {
    // --- Grab slider values ---
    const sliderRatio = document.getElementById("sliderRatio").value;
    const sliderH1 = document.getElementById("sliderHomophilyMajority").value;
    const sliderH2 = document.getElementById("sliderHomophilyMinority").value;

    // Build file name
    const ratioValue = Math.round(sliderRatio * 10); 
    const fileName = `../data/network_generated/graph_${ratioValue}_${sliderH1}_${sliderH2}.json`;

    console.log("Loading:", fileName);

    try {
        const graph = await d3.json(fileName);

        // --- Mark top 10 nodes by order_node ---
        const top10 = graph.nodes.slice().sort((a, b) => a.order_node - b.order_node).slice(0, 10);
        const top10Ids = new Set(top10.map(d => d.id));
        graph.nodes.forEach(d => d.isTop10 = top10Ids.has(d.id));

        return graph;

    } catch (err) {
        console.error("Error loading JSON:", err);
        return null;
    }
}

// -------------------------
// Draw network
// -------------------------
function drawNetwork(graph) {
    if (!graph) return; // Nothing to draw

    d3.select("svg").selectAll("*").remove(); // Clear previous graph
    const svg = d3.select("svg");
    const width = +svg.attr("width") || window.innerWidth;
    const height = +svg.attr("height") || window.innerHeight;

    // --- Simulation ---
    const simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // --- Draw links ---
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2);

    // --- Nodes as groups (to allow crown overlay) ---
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

    // Base node image (minority/majority)
    node.append("image")
        .attr("xlink:href", d => d.minority === 1 ? "../images/boba.svg" : "../images/tika.svg")
        .attr("width", 50)
        .attr("height", 50)
        .attr("x", -20)
        .attr("y", -20);

    // Crown for top 10 nodes
    node.filter(d => d.isTop10)
        .append("image")
        .attr("xlink:href", "../images/crown.svg")
        .attr("width", 60)
        .attr("height", 60)
        .attr("x", -20)
        .attr("y", -25);

    // --- Tick update (move nodes) ---
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // --- Drag functions ---
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
}

// -------------------------
// Main update function: load & draw
// -------------------------
async function updateNetwork() {
    const graph = await loadNetwork();
    drawNetwork(graph);
}

// --- Initial load ---
updateNetwork();

// --- Connect button ---
document.querySelector("button").onclick = updateNetwork;

