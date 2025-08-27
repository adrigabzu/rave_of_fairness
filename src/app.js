document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements with updated IDs
  const sliders = {
    proportionMinority: document.getElementById("proportionMinority"),
    homophilyMajority: document.getElementById("homophilyMajority"),
    homophilyMinority: document.getElementById("homophilyMinority"),
  };
  const valueDisplays = {
    proportionMinority: document.getElementById("proportionMinority-value"),
    homophilyMajority: document.getElementById("homophilyMajority-value"),
    homophilyMinority: document.getElementById("homophilyMinority-value"),
  };
  const graphContainer = document.getElementById("network-graph");
  const noMatchOverlay = document.getElementById("no-match-overlay");

  let lookupData = [];

  // --- Main Function to Update Network ---
  const updateNetwork = async () => {
    // 1. Get current values from sliders, using parseFloat for decimals
    const currentValues = {
      fm: parseFloat(sliders.proportionMinority.value),
      h_MM: parseFloat(sliders.homophilyMajority.value),
      h_mm: parseFloat(sliders.homophilyMinority.value),
    };

    // Update the displayed values
    valueDisplays.proportionMinority.textContent = currentValues.fm.toFixed(1);
    valueDisplays.homophilyMajority.textContent = currentValues.h_MM.toFixed(1);
    valueDisplays.homophilyMinority.textContent = currentValues.h_mm.toFixed(1);

    // 2. Find a match in the lookup data using the new keys
    const match = lookupData.find(
      (entry) =>
        entry.fm === currentValues.fm &&
        entry.h_MM === currentValues.h_MM &&
        entry.h_mm === currentValues.h_mm,
    );

    // 3. If a match is found, load the network using the 'id' key
    if (match) {
      noMatchOverlay.classList.add("hidden");
      try {
        const response = await fetch(`data/networks/${match.id}.json`);
        if (!response.ok) throw new Error("Network file not found");
        const networkData = await response.json();
        renderNetwork(networkData);
      } catch (error)
{
        console.error("Error loading network data:", error);
        noMatchOverlay.classList.remove("hidden");
      }
    } else {
      noMatchOverlay.classList.remove("hidden");
    }
  };

  // --- Function to Render the Graph using D3.js (NO CHANGES NEEDED HERE) ---
  const renderNetwork = (data) => {
    d3.select(graphContainer).select("svg").remove();
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;
    const svg = d3
      .select(graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);
    const links = data.links.map((d) => ({ ...d }));
    const nodes = data.nodes.map((d) => ({ ...d }));
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter());
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link");
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node");
    node.append("circle").attr("r", 10);
    node
      .append("text")
      .text((d) => d.id)
      .attr("x", 15)
      .attr("y", 5);
    node.call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
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
  };

  // --- Initialization (NO CHANGES NEEDED HERE) ---
  const init = async () => {
    try {
      const response = await fetch("data/lookup.json");
      if (!response.ok) throw new Error("Lookup file not found");
      lookupData = await response.json();
    } catch (error) {
      console.error("Failed to initialize:", error);
      noMatchOverlay.textContent = "Error: Could not load configuration.";
      noMatchOverlay.classList.remove("hidden");
      return;
    }
    Object.values(sliders).forEach((slider) => {
      slider.addEventListener("input", updateNetwork);
    });
    updateNetwork();
  };

  init();
});