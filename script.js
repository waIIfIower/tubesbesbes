const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 20;
const ROWS = 20;
const TILE_SIZE = canvas.width / COLS;

// Type: 0 = Kosong (Jalan), 1 = Obstacle (Rumah/Pohon), 2 = Start (NPC), 3 = Goal (Player)
let grid = [];
let start = { x: 0, y: 0 };
let goal = { x: 19, y: 19 };

// Inisialisasi Peta Grid
function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            // Membuat obstacle acak ~20% dari peta
            let isObstacle =
                Math.random() < 0.2 &&
                !(c === start.x && r === start.y) &&
                !(c === goal.x && r === goal.y);
            row.push(isObstacle ? 1 : 0);
        }
        grid.push(row);
    }
}

// Fungsi menggambar Grid & Overlay ke Canvas
function draw(explored = [], path = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ctx.strokeStyle = "#ccc";
            ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (grid[r][c] === 1) {
                ctx.fillStyle = "#444"; // Obstacle (Pohon/Rumah)
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Debug Overlay: Menggambar Node yang di-expand (Warna Merah Transparan)
    ctx.fillStyle = "rgba(255, 99, 71, 0.4)";
    for (let node of explored) {
        if (
            (node.x !== start.x || node.y !== start.y) &&
            (node.x !== goal.x || node.y !== goal.y)
        ) {
            ctx.fillRect(
                node.x * TILE_SIZE,
                node.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
            );
        }
    }

    // Menggambar Jalur Akhir (Warna Hijau Transparan)
    ctx.fillStyle = "rgba(46, 204, 113, 0.7)";
    for (let node of path) {
        if (
            (node.x !== start.x || node.y !== start.y) &&
            (node.x !== goal.x || node.y !== goal.y)
        ) {
            ctx.fillRect(
                node.x * TILE_SIZE,
                node.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
            );
        }
    }

    // Gambar Start (NPC - Biru) & Goal (Player - Kuning)
    ctx.fillStyle = "blue";
    ctx.fillRect(start.x * TILE_SIZE, start.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = "gold";
    ctx.fillRect(goal.x * TILE_SIZE, goal.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// --- FUNGSI HEURISTIK ---
function getHeuristic(pos, type) {
    if (type === "ucs") return 0; // UCS tidak memakai heuristik
    let dx = Math.abs(pos.x - goal.x);
    let dy = Math.abs(pos.y - goal.y);

    if (type === "astar-manhattan") return dx + dy;
    if (type === "astar-euclidean") return Math.sqrt(dx * dx + dy * dy);
    return 0;
}

// --- ALGORITMA SEARCH (A* / UCS) ---
function runPathfinding() {
    let algoType = document.getElementById("algorithm").value;

    let frontier = [
        {
            ...start,
            g: 0,
            h: getHeuristic(start, algoType),
            f: getHeuristic(start, algoType),
            parent: null,
        },
    ];
    let explored = [];
    let visitedKey = new Set();

    let finalPath = [];
    let nodesExpandedCount = 0;

    while (frontier.length > 0) {
        // Urutkan berdasarkan nilai f terkecil (Priority Queue sederhana)
        frontier.sort((a, b) => a.f - b.f);
        let current = frontier.shift();

        let key = `${current.x},${current.y}`;
        if (visitedKey.has(key)) continue;
        visitedKey.add(key);
        explored.push(current);
        nodesExpandedCount++;

        // Jika sampai di Goal
        if (current.x === goal.x && current.y === goal.y) {
            let temp = current;
            while (temp) {
                finalPath.push(temp);
                temp = temp.parent;
            }
            break;
        }

        // Cek Tetangga (4 Arah: Atas, Bawah, Kiri, Kanan)
        let neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
        ];

        for (let neighbor of neighbors) {
            // Batas Grid & Obstacle Check
            if (
                neighbor.x >= 0 &&
                neighbor.x < COLS &&
                neighbor.y >= 0 &&
                neighbor.y < ROWS &&
                grid[neighbor.y][neighbor.x] !== 1
            ) {
                let gCost = current.g + 1; // Asumsi cost per langkah = 1
                let hCost = getHeuristic(neighbor, algoType);
                let fCost = gCost + hCost;

                frontier.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gCost,
                    h: hCost,
                    f: fCost,
                    parent: current,
                });
            }
        }
    }

    // Update Tampilan Stats
    document.getElementById("nodeCount").innerText = nodesExpandedCount;
    document.getElementById("pathLength").innerText = finalPath.length;

    // Render Visualisasi
    draw(explored, finalPath);
}

function resetGrid() {
    initGrid();
    draw();
    document.getElementById("nodeCount").innerText = "0";
    document.getElementById("pathLength").innerText = "0";
}

// Jalankan saat pertama kali dibuka
initGrid();
draw();
