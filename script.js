// Load the graph data from JSON file
let graphData = {
    nodes: [],
    links: []
};

// スマートフォン表示時の調整パラメータ
const isMobile = window.innerWidth <= 768;
const sizeMultiplier = isMobile ? 0.6 : 1;
const forceMultiplier = isMobile ? 0.5 : 1;  // 力の強さの調整係数
const edgeDistance = isMobile ? 120 : 180;   // エッジの長さの調整

// Function to process the loaded JSON data
function processGraphData(data) {
    // Convert the JSON data into the format needed for D3
    graphData.nodes = data.nodes.map(node => ({
        id: node.id,
        name: node.name,
        x: 0,
        y: 0,
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        size: (node.size || 30) * sizeMultiplier,
        image: node.image || null,
        url: node.url || null,
        fx: node.id === "main" ? width/2 : null,
        fy: node.id === "main" ? height/2 : null
    }));

    // Create links from connections
    graphData.links = [];
    data.nodes.forEach(node => {
        node.connections.forEach(targetId => {
            // Avoid duplicate links
            if (!graphData.links.some(link => 
                (link.source === node.id && link.target === targetId) ||
                (link.source === targetId && link.target === node.id)
            )) {
                graphData.links.push({
                    source: node.id,
                    target: targetId
                });
            }
        });
    });

    // Initialize the graph
    initializeGraph();
}

// Set up the SVG container
const width = window.innerWidth;
const height = window.innerHeight;
const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#1a1a1a");  // 背景色を設定

let simulation, link, node;

// Initialize the graph visualization
function initializeGraph() {
    // Create the force simulation
    simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links)
            .id(d => d.id)
            .distance(d => {
                // Xとmainの間のエッジの場合は50、それ以外は通常の距離
                if ((d.source.id === 'X' && d.target.id === 'main') || 
                    (d.source.id === 'main' && d.target.id === 'X')) {
                    return 50;
                }
                return edgeDistance;
            })
            .strength(1))  // リンクの強度を最大に設定
        .force("charge", d3.forceManyBody().strength(-50 * forceMultiplier))  // 反発力を弱める
        .force("collide", d3.forceCollide().radius(d => d.size + 10))
        .force("radial", d3.forceRadial(width/3, width/2, height/2).strength(0.1 * forceMultiplier))  // 放射状の力を弱める
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05 * forceMultiplier))  // 位置固定の力を弱める
        .force("y", d3.forceY(height / 2).strength(0.05 * forceMultiplier));  // 位置固定の力を弱める

    // Create the links
    link = svg.append("g")
        .selectAll("line")
        .data(graphData.links)
        .enter()
        .append("line")
        .attr("stroke", isMobile ? "#666" : "#999")  // スマホ版では線の色を薄く
        .attr("stroke-width", isMobile ? 1 : 2);     // スマホ版では線を細く

    // Create clip path for circular images
    svg.append("defs")
        .selectAll("clipPath")
        .data(graphData.nodes)
        .enter()
        .append("clipPath")
        .attr("id", d => `clip-${d.id}`)
        .append("circle")
        .attr("r", d => d.size/2);

    // Create the nodes with images
    node = svg.append("g")
        .selectAll("g")
        .data(graphData.nodes)
        .enter()
        .append("g")
        .call(d3.drag()
            .on("start", (event, d) => {
                if (d.id !== "main") dragstarted(event, d);
            })
            .on("drag", (event, d) => {
                if (d.id !== "main") dragged(event, d);
            })
            .on("end", (event, d) => {
                if (d.id !== "main") dragended(event, d);
            }))
        .style("cursor", d => d.id === "main" ? "default" : (d.url ? "pointer" : "default"))
        .on("click", (event, d) => {
            if (d.url) {
                window.open(d.url, '_blank');
            }
        });

    // Add images to nodes with clip path
    node.append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", d => d.size)
        .attr("height", d => d.size)
        .attr("x", d => -d.size/2)
        .attr("y", d => -d.size/2)
        .attr("clip-path", d => `url(#clip-${d.id})`);

    // Add node labels
    svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dy", d => -(d.size/2 + (isMobile ? 3 : 10)))  // スマホ版では間隔を小さく
        .style("fill", "white")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px")
        .style("font-weight", "bold");

    // Update positions on each tick
    simulation.on("tick", () => {
        // ノードが画面外にはみ出ないように制限
        graphData.nodes.forEach(d => {
            d.x = Math.max(d.size/2, Math.min(width - d.size/2, d.x));
            d.y = Math.max(d.size/2, Math.min(height - d.size/2, d.y));
        });

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);

        svg.selectAll("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}

// Drag functions
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

// Load the JSON data
fetch('graph-data.json')
    .then(response => response.json())
    .then(data => processGraphData(data))
    .catch(error => console.error('Error loading the graph data:', error)); 