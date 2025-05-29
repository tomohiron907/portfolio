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
        type: node.type || "Skill",  // デフォルトはSkill
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
const headerHeight = 60; // ヘッダーの高さ
const filterButtonsHeight = 60; // フィルターボタンの高さ
const margin = 30; // 画面端からの余白
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
        .force("y", d3.forceY(height / 2).strength(0.05 * forceMultiplier))  // 位置固定の力を弱める
        .alphaDecay(0.03)  // シミュレーションの減衰率を下げて、より長く動き続けるように
        .velocityDecay(0.2);  // 速度の減衰率を下げて、よりスムーズに停止するように

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
                if (d.id !== "main") {
                    dragstarted(event, d);
                    // ドラッグ開始時に透明度を更新
                    updateNodeOpacity(d);
                }
            })
            .on("drag", (event, d) => {
                if (d.id !== "main") dragged(event, d);
            })
            .on("end", (event, d) => {
                if (d.id !== "main") {
                    dragended(event, d);
                }
            }))
        .style("cursor", d => d.id === "main" ? "pointer" : (d.url ? "pointer" : "default"));

    // Add transparent circle for larger drag area (before the image)
    node.append("circle")
        .attr("r", d => d.size * 1.5)  // ノードの1.5倍のサイズ
        .attr("fill", "transparent")
        .attr("stroke", "none")
        .on("click", (event, d) => {
            if (d.id === "main") {
                window.location.href = "about.html";
            } else if (d.url) {
                // スマートフォンの場合は直接遷移、PCの場合は新しいタブで開く
                if (window.innerWidth <= 768) {
                    window.location.href = d.url;
                } else {
                    window.open(d.url, '_blank');
                }
            }
        });

    // Add images to nodes with clip path
    node.append("image")
        .attr("xlink:href", d => d.image)
        .attr("width", d => d.size)
        .attr("height", d => d.size)
        .attr("x", d => -d.size/2)
        .attr("y", d => -d.size/2)
        .attr("clip-path", d => `url(#clip-${d.id})`)
        .style("pointer-events", "none");  // 画像のポインターイベントを無効化

    // Add node labels
    svg.append("g")
        .selectAll("text")
        .data(graphData.nodes)
        .enter()
        .append("text")
        .attr("class", "node-label")  // クラスを追加して後で参照できるようにする
        .text(d => d.name)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dy", d => -(d.size/2 + (isMobile ? 3 : 10)))  // スマホ版では間隔を小さく
        .style("fill", "white")
        .style("font-family", "Consolas, monospace")
        .style("font-size", "14px")
        .style("font-weight", "bold");

    // Update positions on each tick
    simulation.on("tick", () => {
        // ノードが画面外にはみ出ないように制限
        graphData.nodes.forEach(d => {
            // ヘッダーとフィルターボタンの領域を避ける
            const labelOffset = d.size/2 + (isMobile ? 3 : 10); // ラベルの高さを考慮
            const minY = headerHeight + d.size/2 + labelOffset; // ラベルの高さを加算
            const maxY = height - filterButtonsHeight - d.size/2;
            const minX = margin + d.size/2;  // 左端の余白を追加
            const maxX = width - margin - d.size/2;  // 右端の余白を追加
            
            d.x = Math.max(minX, Math.min(maxX, d.x));
            d.y = Math.max(minY, Math.min(maxY, d.y));
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
    if (!event.active) {
        simulation.alphaTarget(0);
        // シミュレーションを一時停止してから再開
        simulation.stop();
        setTimeout(() => {
            simulation.alpha(0.1).restart();
        }, 100);
    }
    d.fx = null;
    d.fy = null;
    
    // 現在のフィルターを取得
    const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    
    // Allフィルターの場合は全てのノードを表示
    if (currentFilter === 'all') {
        resetNodeOpacity();
    } else {
        // それ以外の場合は、現在のフィルターに基づいて表示を更新
        filterNodes(currentFilter);
    }
}

// ノードの透明度を更新する関数
function updateNodeOpacity(draggedNode) {
    // 現在のフィルターを取得
    const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    
    // Allフィルター以外の場合は何もしない
    if (currentFilter !== 'all') {
        return;
    }

    // ドラッグ中のノードと直接接続されているノードのIDを取得
    const connectedNodeIds = new Set();
    graphData.links.forEach(link => {
        if (link.source.id === draggedNode.id) {
            connectedNodeIds.add(link.target.id);
        } else if (link.target.id === draggedNode.id) {
            connectedNodeIds.add(link.source.id);
        }
    });

    // 全てのノードの透明度を更新
    node.style("opacity", d => {
        if (d.id === draggedNode.id || connectedNodeIds.has(d.id)) {
            return 1; // ドラッグ中のノードと接続ノードは完全に表示
        }
        return 0.1; // その他のノードは暗く表示
    });

    // リンクの透明度も更新
    link.style("opacity", d => {
        if (d.source.id === draggedNode.id || d.target.id === draggedNode.id) {
            return 1;
        }
        return 0.1;
    });

    // テキストラベルの透明度も更新
    svg.selectAll(".node-label")
        .style("opacity", d => {
            if (d.id === draggedNode.id || connectedNodeIds.has(d.id)) {
                return 1;
            }
            return 0.1;
        });
}

// ノードの透明度をリセットする関数
function resetNodeOpacity() {
    node.style("opacity", 1);
    link.style("opacity", 1);
    svg.selectAll(".node-label").style("opacity", 1);
}

// フィルタリング機能の実装
function initializeFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // アクティブなボタンの更新
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');
            filterNodes(filter);
        });
    });
}

function filterNodes(filter) {
    node.style("opacity", d => {
        if (d.id === "main" || filter === "all" || d.type === filter) {
            return 1;
        }
        return 0.1;
    });

    link.style("opacity", d => {
        if (filter === "all") {
            return 1;
        }
        // 両方のノードがハイライトされている場合のみエッジを表示
        const sourceHighlighted = d.source.id === "main" || d.source.type === filter;
        const targetHighlighted = d.target.id === "main" || d.target.type === filter;
        if (sourceHighlighted && targetHighlighted) {
            return 1;
        }
        return 0.1;
    });

    svg.selectAll(".node-label")
        .style("opacity", d => {
            if (d.id === "main" || filter === "all" || d.type === filter) {
                return 1;
            }
            return 0.1;
        });
}

// Load the JSON data
fetch('graph-data.json')
    .then(response => response.json())
    .then(data => {
        processGraphData(data);
        initializeFilterButtons();  // フィルターボタンの初期化を追加
    })
    .catch(error => console.error('Error loading the graph data:', error)); 