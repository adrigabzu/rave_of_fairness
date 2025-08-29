// --- Custom Slider Logic (from HTML) ---
// This part ensures sliders snap to specific, allowed values.
document.addEventListener("DOMContentLoaded", () => {
	// Define the allowed values for each slider
	const ratioValues = [0.1, 0.3];
	const homophilyValues = [0.2, 0.5, 0.8];

	// Helper function to set up a slider with discrete steps
	const setupSlider = (sliderId, displayId, valueMap) => {
		const slider = document.getElementById(sliderId);
		const display = document.getElementById(displayId);

		if (!slider || !display) return;

		const updateDisplay = () => {
			const index = parseInt(slider.value, 10);
			const actualValue = valueMap[index];
			display.textContent = actualValue;
			// Update the slider's value attribute so the loadNetwork function can read it
			slider.setAttribute("value", actualValue);
		};

		// Add event listener to update on change
		slider.addEventListener("input", updateDisplay);

		// Initial update on page load
		updateDisplay();
	};

	// Set up all three sliders
	setupSlider("sliderRatio", "sliderRatioValue", ratioValues);
	setupSlider(
		"sliderHomophilyMajority",
		"sliderHomophilyMajorityValue",
		homophilyValues
	);
	setupSlider(
		"sliderHomophilyMinority",
		"sliderHomophilyMinorityValue",
		homophilyValues
	);
});

// -------------------------
// Load network JSON & prepare data
// -------------------------
/**
 * Fetches the network JSON file based on the current slider values.
 * Computes the top 10 nodes by `order_node` and marks them for crown overlay.
 * @returns {Promise<Object|null>} graph object containing nodes and links
 */
async function loadNetwork() {
	// --- Grab slider values ---
	const sliderRatio = Math.round(
		parseFloat(document.getElementById("sliderRatioValue").textContent) * 10
	);
	const sliderH1 = Math.round(
		parseFloat(
			document.getElementById("sliderHomophilyMajorityValue").textContent
		) * 10
	);
	const sliderH2 = Math.round(
		parseFloat(
			document.getElementById("sliderHomophilyMinorityValue").textContent
		) * 10
	);

	console.log("Slider values:", sliderRatio, sliderH1, sliderH2);

	const fileName = `../../data/network_generated/graph_${sliderRatio}_${sliderH1}_${sliderH2}.json`;

	console.log("Loading:", fileName);

	try {
		const graph = await d3.json(fileName);

		// --- Identify top 10 nodes based on `order_node` ---
		const top10 = graph.nodes
			.slice()
			.sort((a, b) => a.order_node - b.order_node)
			.slice(0, 10);
		const top10Ids = new Set(top10.map((d) => d.id));
		graph.nodes.forEach((d) => (d.isTop10 = top10Ids.has(d.id)));

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
	if (!graph) return;

	d3.select("svg").selectAll("*").remove();
	const svg = d3.select("svg");
	const width = +svg.node().getBoundingClientRect().width;
	const height = +svg.node().getBoundingClientRect().height;
	const container = svg.append("g");

	const TOP10_OPACITY = 1.0;
	const OTHER_OPACITY = 0.7;
	const NODE_RADIUS = 20;

	container
		.append("defs")
		.append("marker")
		.attr("id", "arrowhead")
		.attr("viewBox", "-0 -5 10 10")
		.attr("refX", 10)
		.attr("refY", 0)
		.attr("orient", "auto")
		.attr("markerWidth", 8)
		.attr("markerHeight", 8)
		.attr("xoverflow", "visible")
		.append("svg:path")
		.attr("d", "M 0,-5 L 10 ,0 L 0,5")
		.attr("fill", "#999")
		.style("stroke", "none");

	const simulation = d3
		.forceSimulation(graph.nodes)
		.force(
			"link",
			d3.forceLink(graph.links).id((d) => d.id).distance(150)
		)
		.force("charge", d3.forceManyBody().strength(-400))
		.force("center", d3.forceCenter(width / 2, height / 2).strength(0.01))
		.force("x", d3.forceX(width / 2).strength(0.05))
		.force("y", d3.forceY(height / 2).strength(0.05));

	const link = container
		.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.links)
		.enter()
		.append("line")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.5)
		.attr("stroke-width", 0.4)
		.attr("marker-end", "url(#arrowhead)");

	const node = container
		.append("g")
		.attr("class", "nodes")
		.selectAll("g")
		.data(graph.nodes)
		.enter()
		.append("g")
		.attr("opacity", (d) => (d.isTop10 ? TOP10_OPACITY : OTHER_OPACITY))
		.call(
			d3
				.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
		);

	const nodeContent = node
		.append("g")
		.attr("class", (d) => (d.isTop10 ? "animate-wobble" : ""));

	nodeContent
		.append("image")
		.attr("xlink:href", (d) =>
			d.minority === 1 ? "../../images/boba_v2.svg" : "../../images/tika_v2.svg"
		)
		.attr("width", 50)
		.attr("height", 50)
		.attr("x", -25)
		.attr("y", -25);

	nodeContent
		.filter((d) => d.isTop10)
		.append("image")
		.attr("xlink:href", "../../images/crown.svg")
		.attr("width", 60)
		.attr("height", 60)
		.attr("x", -30)
		.attr("y", -40);

	// --- Zoom ---
	// MODIFICATION: Define the zoom behavior here so it's available for the "end" event
	const zoom = d3.zoom().scaleExtent([0.1, 8]).on("zoom", zoomed);
	svg.call(zoom);

	function zoomed(event) {
		container.attr("transform", event.transform);
	}

	// --- Tick ---
	simulation.on("tick", () => {
		link.each(function (d) {
			const dx = d.target.x - d.source.x;
			const dy = d.target.y - d.source.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist === 0) return;

			const newTargetX = d.target.x - (dx / dist) * NODE_RADIUS;
			const newTargetY = d.target.y - (dy / dist) * NODE_RADIUS;

			d3.select(this)
				.attr("x1", d.source.x)
				.attr("y1", d.source.y)
				.attr("x2", newTargetX)
				.attr("y2", newTargetY);
		});

		node.attr("transform", (d) => `translate(${d.x},${d.y})`);
	});

	// MODIFICATION: Add an "end" event listener to center the graph after the simulation finishes
	simulation.on("end", () => {
		const bbox = container.node().getBBox();
		const padding = 0.95; // 5% padding

		const scale = Math.min(
			(width / bbox.width) * padding,
			(height / bbox.height) * padding
		);

		const tx = (width - bbox.width * scale) / 2 - bbox.x * scale;
		const ty = (height - bbox.height * scale) / 2 - bbox.y * scale;

		const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

		svg
			.transition()
			.duration(500) // Smooth transition to the centered view
			.call(zoom.transform, transform);
	});

	// --- Drag functions ---
	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}
	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}
	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}

// -------------------------
// Update top 10 ranked nodes list
// -------------------------
function updateTop10List(nodes) {
	const listEl = document.getElementById("top10-list");
	listEl.innerHTML = "";

	const top10 = nodes
		.slice()
		.sort((a, b) => a.order_node - b.order_node)
		.slice(0, 10);

	top10.forEach((d) => {
		const li = document.createElement("li");
		li.className = "text-sm flex items-center gap-2";

		const img = document.createElement("img");
		img.src =
			d.minority === 1 ? "../../images/boba.svg" : "../../images/tika.svg";
		img.width = 20;
		img.height = 20;

		const text = document.createTextNode(
			`Node ${d.id} (Score: ${d.order_node})`
		);
		li.appendChild(img);
		li.appendChild(text);
		listEl.appendChild(li);
	});
}

// -------------------------
// Main update function: load & draw network
// -------------------------
async function updateNetwork() {
	const graph = await loadNetwork();
	if (!graph) return;
	updateTop10List(graph.nodes);
	drawNetwork(graph);
}

// --- Initial load ---
// updateNetwork(); // You can uncomment this to load a default network on page load

// --- Connect button to update ---
// This replaces the `onclick` attribute in the HTML for better practice
document
	.querySelector('button[onclick="updateNetwork()"]')
	.addEventListener("click", (event) => {
		event.preventDefault(); // <-- prevent page reload
		updateNetwork();
	});