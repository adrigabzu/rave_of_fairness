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
	// Note: The 'value' attribute is now set by the custom slider logic above
	const sliderRatio = document.getElementById("sliderRatio").value;
	const sliderH1 = document.getElementById("sliderHomophilyMajority").value;
	const sliderH2 = document.getElementById("sliderHomophilyMinority").value;

	console.log("Slider values:", sliderRatio, sliderH1, sliderH2);

	const fileName = `../data/network_generated/graph_${sliderRatio}_${sliderH1}_${sliderH2}.json`;

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
	const width = +svg.attr("width") || window.innerWidth;
	const height = +svg.attr("height") || window.innerHeight;
	const container = svg.append("g");

	const CONNECTED_OPACITY = 1.0;
	const UNCONNECTED_OPACITY = 0.3;

	const linkedNodeIds = new Set();
	graph.links.forEach((link) => {
		linkedNodeIds.add(link.source.id || link.source);
		linkedNodeIds.add(link.target.id || link.target);
	});
	graph.nodes.forEach((node) => {
		node.isConnected = linkedNodeIds.has(node.id);
	});

	// --- Simulation ---
	const simulation = d3
		.forceSimulation(graph.nodes)
		.force("link", d3.forceLink(graph.links).id((d) => d.id).distance(100))
		.force("charge", d3.forceManyBody().strength(-200))
		.force("center", d3.forceCenter(width / 2, height / 2))
		.force("x", d3.forceX(width / 2).strength(0.1))
		.force("y", d3.forceY(height / 2).strength(0.1));

	// --- Links ---
	const link = container
		.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.links)
		.enter()
		.append("line")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.2)
		.attr("stroke-width", 2);

	// --- Nodes (outer group for dragging) ---
	const node = container
		.append("g")
		.attr("class", "nodes")
		.selectAll("g")
		.data(graph.nodes)
		.enter()
		.append("g")
		.attr("opacity", (d) =>
			d.isConnected ? CONNECTED_OPACITY : UNCONNECTED_OPACITY
		)
		.call(
			d3
				.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
		);

	// --- Inner group for visuals ---
	const nodeContent = node
		.append("g")
		.attr("class", (d) => (d.isTop10 ? "animate-wobble" : "")); // Using Tailwind's class

	// Node image
	nodeContent
		.append("image")
		.attr("xlink:href", (d) =>
			d.minority === 1 ? "../images/boba.svg" : "../images/tika.svg"
		)
		.attr("width", 50)
		.attr("height", 50)
		.attr("x", -25)
		.attr("y", -25);

	// Crown for top 10 nodes
	nodeContent
		.filter((d) => d.isTop10)
		.append("image")
		.attr("xlink:href", "../images/crown.svg")
		.attr("width", 60)
		.attr("height", 60)
		.attr("x", -30)
		.attr("y", -40);

	// --- Tick ---
	simulation.on("tick", () => {
		link
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		node.attr("transform", (d) => `translate(${d.x},${d.y})`);
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

	// --- Zoom ---
	function zoomed(event) {
		container.attr("transform", event.transform);
	}
	svg.call(d3.zoom().scaleExtent([0.1, 8]).on("zoom", zoomed));
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
			d.minority === 1 ? "../images/boba.svg" : "../images/tika.svg";
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
	.addEventListener("click", updateNetwork);