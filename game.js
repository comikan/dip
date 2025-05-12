// Game State
const gameState = {
    money: 1000,
    moneyPerSecond: 0,
    drugs: {
        weed: { name: "Weed", price: 10, sellPrice: 15, owned: 0, maxOwned: 1000 },
        cocaine: { name: "Cocaine", price: 50, sellPrice: 80, owned: 0, maxOwned: 500 },
        meth: { name: "Meth", price: 30, sellPrice: 45, owned: 0, maxOwned: 750 },
        heroin: { name: "Heroin", price: 70, sellPrice: 120, owned: 0, maxOwned: 300 },
        lsd: { name: "LSD", price: 20, sellPrice: 35, owned: 0, maxOwned: 1000 },
        mdma: { name: "MDMA", price: 25, sellPrice: 40, owned: 0, maxOwned: 800 },
        fentanyl: { name: "Fentanyl", price: 90, sellPrice: 150, owned: 0, maxOwned: 200 },
        oxy: { name: "Oxycontin", price: 40, sellPrice: 65, owned: 0, maxOwned: 600 }
    },
    workers: [],
    availableWorkers: [],
    upgrades: {
        backpack: { name: "Backpack Upgrade", description: "Increase drug carrying capacity by 20%", price: 500, bought: false, effect: () => { Object.values(gameState.drugs).forEach(drug => drug.maxOwned = Math.floor(drug.maxOwned * 1.2)); } },
        car: { name: "Delivery Car", description: "Workers sell drugs 25% faster", price: 1500, bought: false, effect: () => { gameState.workers.forEach(worker => worker.sellSpeed *= 0.75); } },
        gun: { name: "Protection", description: "Reduce chance of police bust by 50%", price: 2000, bought: false },
        phone: { name: "Burner Phones", description: "Workers can carry more drugs", price: 1000, bought: false, effect: () => { gameState.workers.forEach(worker => worker.capacity += 2); } }
    },
    properties: {
        trapHouse: { name: "Trap House", description: "Generates $50/sec", price: 5000, owned: false, income: 50 },
        warehouse: { name: "Warehouse", description: "Doubles drug storage capacity", price: 10000, owned: false, effect: () => { Object.values(gameState.drugs).forEach(drug => drug.maxOwned *= 2); } },
        lab: { name: "Meth Lab", description: "Produces 1 meth every 10 seconds", price: 15000, owned: false, effect: () => { setInterval(() => gameState.drugs.meth.owned++, 10000); } }
    },
    lastUpdate: Date.now(),
    bustChance: 0.005,
    protection: 0
};

// Worker names
const firstNames = ["Devin", "Jamal", "Tyrone", "Lamar", "Darnell", "Malik", "Terrell", "Andre", "Dante", "Marquis", "Shawn", "Raymond", "Quinton", "Darius", "Reggie", "Tevin", "Kareem", "Jermaine", "Deshawn", "Leon"];
const lastNames = ["Williams", "Johnson", "Brown", "Jackson", "Davis", "Wilson", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young"];

// Initialize the game
function initGame() {
    generateWorkers();
    updateUI();
    setupEventListeners();
    
    // Game loop
    setInterval(gameLoop, 1000);
    setInterval(generateWorkers, 30000);
}

// Game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastUpdate) / 1000;
    gameState.lastUpdate = now;
    
    let incomeThisTick = 0;
    
    // Calculate income from workers
    gameState.workers.forEach(worker => {
        if (worker.assignedDrug && gameState.drugs[worker.assignedDrug].owned > 0) {
            const drug = gameState.drugs[worker.assignedDrug];
            const sellAmount = Math.min(worker.capacity, drug.owned);
            
            // Fixed: Only use sellPrice for income
            incomeThisTick += (sellAmount * drug.sellPrice) / worker.sellSpeed;
            drug.owned -= sellAmount;
            
            // Police bust chance
            if (Math.random() < (gameState.bustChance * (1 - gameState.protection))) {
                bustWorker(worker);
            }
        }
    });
    
    // Add income from properties
    Object.values(gameState.properties).forEach(property => {
        if (property.owned && property.income) {
            incomeThisTick += property.income * deltaTime;
        }
    });
    
    gameState.money += incomeThisTick;
    gameState.moneyPerSecond = incomeThisTick / deltaTime;
    
    updateUI();
}

// Police bust a worker
function bustWorker(worker) {
    const workerIndex = gameState.workers.findIndex(w => w.id === worker.id);
    if (workerIndex !== -1) {
        gameState.workers.splice(workerIndex, 1);
        showNotification(`🚨 ${worker.name} got arrested by the police!`, "error");
    }
}

// Generate random workers
function generateWorkers() {
    gameState.availableWorkers = [];
    const workerCount = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < workerCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} "${lastName.charAt(0)}" ${lastName}`;
        
        let type, price, capacity, sellSpeed;
        const rand = Math.random();
        
        if (rand < 0.6) {
            type = "worker";
            price = 100 + Math.floor(Math.random() * 200);
            capacity = 1 + Math.floor(Math.random() * 2);
            sellSpeed = 5 + Math.random() * 5;
        } else if (rand < 0.9) {
            type = "goon";
            price = 300 + Math.floor(Math.random() * 300);
            capacity = 2 + Math.floor(Math.random() * 3);
            sellSpeed = 3 + Math.random() * 3;
        } else {
            type = "street-rat";
            price = 50 + Math.floor(Math.random() * 100);
            capacity = 1;
            sellSpeed = 8 + Math.random() * 7;
        }
        
        gameState.availableWorkers.push({
            id: Date.now() + i,
            name,
            type,
            price,
            capacity,
            sellSpeed,
            assignedDrug: null
        });
    }
    
    updateWorkersUI();
}

// Update all UI elements
function updateUI() {
    updateMoneyUI();
    updateDrugsUI();
    updateWorkersUI();
    updateUpgradesUI();
    updatePropertiesUI();
}

function updateMoneyUI() {
    document.getElementById("money").textContent = `$${formatNumber(gameState.money)}`;
    document.querySelector(".money-per-second").textContent = `+$${formatNumber(gameState.moneyPerSecond)}/sec`;
}

function updateDrugsUI() {
    const buyDrugsEl = document.getElementById("buy-drugs");
    const inventoryEl = document.getElementById("inventory");
    
    buyDrugsEl.innerHTML = "";
    inventoryEl.innerHTML = "";
    
    Object.entries(gameState.drugs).forEach(([id, drug]) => {
        // Buy drug card
        const buyCard = document.createElement("div");
        buyCard.className = "drug-card";
        buyCard.innerHTML = `
            <div class="drug-name">${drug.name}</div>
            <div class="drug-price">Buy Price: $${formatNumber(drug.price)}</div>
            <div class="drug-sell-price">Sell Price: $${formatNumber(drug.sellPrice)}</div>
            <button class="buy-btn" data-drug="${id}">
                <i class="fas fa-cart-plus"></i> Buy (1)
            </button>
            <button class="buy-10-btn" data-drug="${id}">
                <i class="fas fa-cart-plus"></i> Buy (10)
            </button>
        `;
        buyDrugsEl.appendChild(buyCard);
        
        // Inventory card
        if (drug.owned > 0) {
            const invCard = document.createElement("div");
            invCard.className = "drug-card";
            invCard.innerHTML = `
                <div class="drug-name">${drug.name}</div>
                <div class="drug-quantity">Owned: ${formatNumber(drug.owned)}/${formatNumber(drug.maxOwned)}</div>
                <button class="sell-btn" data-drug="${id}">
                    <i class="fas fa-money-bill-wave"></i> Sell (1)
                </button>
                <button class="sell-10-btn" data-drug="${id}">
                    <i class="fas fa-money-bill-wave"></i> Sell (10)
                </button>
            `;
            inventoryEl.appendChild(invCard);
        }
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.addEventListener("click", () => buyDrug(btn.dataset.drug, 1));
    });
    
    document.querySelectorAll(".buy-10-btn").forEach(btn => {
        btn.addEventListener("click", () => buyDrug(btn.dataset.drug, 10));
    });
    
    document.querySelectorAll(".sell-btn").forEach(btn => {
        btn.addEventListener("click", () => sellDrug(btn.dataset.drug, 1));
    });
    
    document.querySelectorAll(".sell-10-btn").forEach(btn => {
        btn.addEventListener("click", () => sellDrug(btn.dataset.drug, 10));
    });
}

function updateWorkersUI() {
    const hireWorkersEl = document.getElementById("hire-workers");
    const yourWorkersEl = document.getElementById("your-workers");
    
    hireWorkersEl.innerHTML = "";
    yourWorkersEl.innerHTML = "";
    
    // Available workers to hire
    gameState.availableWorkers.forEach(worker => {
        const workerCard = document.createElement("div");
        workerCard.className = "worker-card";
        workerCard.innerHTML = `
            <div class="worker-name">${worker.name}</div>
            <div class="worker-type ${worker.type}">${worker.type.replace("-", " ")}</div>
            <div class="worker-stats">
                Capacity: ${worker.capacity}<br>
                Speed: ${worker.sellSpeed.toFixed(1)}s/unit<br>
            </div>
            <div class="worker-price">Price: $${formatNumber(worker.price)}</div>
            <button class="hire-btn" data-worker-id="${worker.id}">
                <i class="fas fa-user-plus"></i> Hire
            </button>
        `;
        hireWorkersEl.appendChild(workerCard);
    });
    
    // Hired workers
    gameState.workers.forEach(worker => {
        const workerCard = document.createElement("div");
        workerCard.className = "worker-card";
        
        workerCard.innerHTML = `
            <div class="worker-name">${worker.name}</div>
            <div class="worker-type ${worker.type}">${worker.type.replace("-", " ")}</div>
            <div class="worker-stats">
                ${worker.assignedDrug ? `Selling ${gameState.drugs[worker.assignedDrug].name} (${worker.capacity}/cycle)` : 'Not assigned'}<br>
                Speed: ${worker.sellSpeed.toFixed(1)}s/unit<br>
            </div>
            <select class="assign-drug" data-worker-id="${worker.id}">
                <option value="">-- Assign Drug --</option>
                ${Object.entries(gameState.drugs).map(([id, drug]) => 
                    `<option value="${id}" ${worker.assignedDrug === id ? "selected" : ""}>${drug.name}</option>`
                ).join("")}
            </select>
            <button class="fire-btn" data-worker-id="${worker.id}">
                <i class="fas fa-user-minus"></i> Fire
            </button>
        `;
        yourWorkersEl.appendChild(workerCard);
    });
    
    // Add event listeners
    document.querySelectorAll(".hire-btn").forEach(btn => {
        btn.addEventListener("click", () => hireWorker(parseInt(btn.dataset.workerId)));
    });
    
    document.querySelectorAll(".fire-btn").forEach(btn => {
        btn.addEventListener("click", () => fireWorker(parseInt(btn.dataset.workerId)));
    });
    
    document.querySelectorAll(".assign-drug").forEach(select => {
        select.addEventListener("change", (e) => {
            const workerId = parseInt(select.dataset.workerId);
            const drugId = e.target.value;
            assignWorkerToDrug(workerId, drugId);
        });
    });
}

function updateUpgradesUI() {
    const upgradesEl = document.getElementById("upgrades");
    upgradesEl.innerHTML = "";
    
    Object.entries(gameState.upgrades).forEach(([id, upgrade]) => {
        const upgradeCard = document.createElement("div");
        upgradeCard.className = "upgrade-card";
        upgradeCard.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-price">Price: $${formatNumber(upgrade.price)}</div>
            <button class="buy-upgrade-btn" data-upgrade="${id}" ${upgrade.bought || gameState.money < upgrade.price ? "disabled" : ""}>
                <i class="fas fa-arrow-up"></i> ${upgrade.bought ? "Purchased" : "Buy"}
            </button>
        `;
        upgradesEl.appendChild(upgradeCard);
    });
    
    document.querySelectorAll(".buy-upgrade-btn").forEach(btn => {
        btn.addEventListener("click", () => buyUpgrade(btn.dataset.upgrade));
    });
}

function updatePropertiesUI() {
    const propertiesEl = document.getElementById("properties");
    propertiesEl.innerHTML = "";
    
    Object.entries(gameState.properties).forEach(([id, property]) => {
        const propertyCard = document.createElement("div");
        propertyCard.className = "property-card";
        propertyCard.innerHTML = `
            <div class="property-name">${property.name}</div>
            <div class="property-description">${property.description}</div>
            <div class="property-price">Price: $${formatNumber(property.price)}</div>
            <button class="buy-property-btn" data-property="${id}" ${property.owned || gameState.money < property.price ? "disabled" : ""}>
                <i class="fas fa-home"></i> ${property.owned ? "Owned" : "Buy"}
            </button>
        `;
        propertiesEl.appendChild(propertyCard);
    });
    
    document.querySelectorAll(".buy-property-btn").forEach(btn => {
        btn.addEventListener("click", () => buyProperty(btn.dataset.property));
    });
}

// Game actions
function buyDrug(drugId, amount) {
    const drug = gameState.drugs[drugId];
    const totalCost = drug.price * amount;
    
    if (gameState.money < totalCost) {
        showNotification("Not enough money!", "error");
        return;
    }
    
    if (drug.owned + amount > drug.maxOwned) {
        showNotification("Not enough storage space!", "error");
        return;
    }
    
    gameState.money -= totalCost;
    drug.owned += amount;
    
    showNotification(`Bought ${amount} ${drug.name} for $${formatNumber(totalCost)}`, "success");
    updateUI();
}

function sellDrug(drugId, amount) {
    const drug = gameState.drugs[drugId];
    amount = Math.min(amount, drug.owned);
    
    if (amount <= 0) {
        showNotification(`You don't have any ${drug.name} to sell!`, "error");
        return;
    }
    
    const totalValue = drug.sellPrice * amount;
    gameState.money += totalValue;
    drug.owned -= amount;
    
    showNotification(`Sold ${amount} ${drug.name} for $${formatNumber(totalValue)}`, "success");
    updateUI();
}

function hireWorker(workerId) {
    const workerIndex = gameState.availableWorkers.findIndex(w => w.id === workerId);
    
    if (workerIndex === -1) {
        showNotification("Worker not found!", "error");
        return;
    }
    
    const worker = gameState.availableWorkers[workerIndex];
    
    if (gameState.money < worker.price) {
        showNotification("Not enough money to hire this worker!", "error");
        return;
    }
    
    gameState.money -= worker.price;
    gameState.workers.push({...worker});
    gameState.availableWorkers.splice(workerIndex, 1);
    
    showNotification(`Hired ${worker.name} for $${formatNumber(worker.price)}`, "success");
    updateUI();
}

function fireWorker(workerId) {
    const workerIndex = gameState.workers.findIndex(w => w.id === workerId);
    
    if (workerIndex === -1) {
        showNotification("Worker not found!", "error");
        return;
    }
    
    const worker = gameState.workers[workerIndex];
    gameState.workers.splice(workerIndex, 1);
    
    // Get some money back
    const refund = Math.floor(worker.price * 0.25);
    gameState.money += refund;
    
    showNotification(`Fired ${worker.name} and got $${formatNumber(refund)} back`, "warning");
    updateUI();
}

function assignWorkerToDrug(workerId, drugId) {
    const worker = gameState.workers.find(w => w.id === workerId);
    
    if (!worker) {
        showNotification("Worker not found!", "error");
        return;
    }
    
    worker.assignedDrug = drugId || null;
    
    if (drugId) {
        showNotification(`Assigned ${worker.name} to sell ${gameState.drugs[drugId].name}`, "success");
    } else {
        showNotification(`${worker.name} is now unassigned`, "warning");
    }
    
    updateUI();
}

function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades[upgradeId];
    
    if (!upgrade) {
        showNotification("Upgrade not found!", "error");
        return;
    }
    
    if (upgrade.bought) {
        showNotification("You already have this upgrade!", "error");
        return;
    }
    
    if (gameState.money < upgrade.price) {
        showNotification("Not enough money for this upgrade!", "error");
        return;
    }
    
    gameState.money -= upgrade.price;
    upgrade.bought = true;
    
    // Special case for protection upgrade
    if (upgradeId === 'gun') {
        gameState.protection = 0.5; // 50% protection
    } else if (upgrade.effect) {
        upgrade.effect();
    }
    
    showNotification(`Purchased ${upgrade.name} for $${formatNumber(upgrade.price)}`, "success");
    updateUI();
}

function buyProperty(propertyId) {
    const property = gameState.properties[propertyId];
    
    if (!property) {
        showNotification("Property not found!", "error");
        return;
    }
    
    if (property.owned) {
        showNotification("You already own this property!", "error");
        return;
    }
    
    if (gameState.money < property.price) {
        showNotification("Not enough money for this property!", "error");
        return;
    }
    
    gameState.money -= property.price;
    property.owned = true;
    
    if (property.effect) {
        property.effect();
    }
    
    showNotification(`Purchased ${property.name} for $${formatNumber(property.price)}`, "success");
    updateUI();
}

// Helper functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showNotification(message, type = "info") {
    const notificationsEl = document.getElementById("notifications");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsEl.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            // Remove active class from all buttons and tabs
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            
            // Add active class to clicked button
            button.classList.add("active");
            
            // Show corresponding tab
            const tabId = `${button.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add("active");
        });
    });
}

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", initGame);
