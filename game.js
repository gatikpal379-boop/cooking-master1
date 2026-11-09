const TOTAL_ORDERS = 5;
const UPGRADE_COST = 50;

const RECIPES = {
  "Omelette 🍳": ["🥚", "🧀", "🧈"],
  "Pancakes 🥞": ["🌾", "🥛", "🥚", "🧈"],
  "Pizza 🍕": ["🥖", "🍅", "🧀", "🌿"],
  "Burger 🍔": ["🍞", "🥩", "🧀", "🥬"],
  "Salad 🥗": ["🥬", "🍅", "🥒", "🧅"]
};
const SHELF = ["🥚", "🧀", "🧈", "🌾", "🥛", "🥖", "🍅", "🌿", "🍞", "🥩", "🥬", "🥒", "🧅"];
const CUSTOMERS = ["🧑", "👩", "👨", "👵", "👴", "🧒", "🧔", "👩‍🦰"];

const $ = (id) => document.getElementById(id);

let coins, order, panLevel, dish, pan, heat, timer, stage;

function loadBest() {
  try { return Number(localStorage.getItem("cookingMasterBest")) || 0; }
  catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem("cookingMasterBest", String(v)); } catch (e) {}
}

function show(id, visible) { $(id).classList.toggle("hidden", !visible); }
function say(text) { $("message").textContent = text; }

function updateStats() {
  $("coins").textContent = coins;
  $("order").textContent = Math.min(order, TOTAL_ORDERS);
  $("best").textContent = loadBest();
  $("panLevel").textContent = panLevel;
  $("shopBtn").disabled = coins < UPGRADE_COST;
}

function zoneStart() { return 70 - 7 * (panLevel - 1); }
const ZONE_END = 92;

function buildShelf() {
  const shelf = $("shelf");
  shelf.innerHTML = "";
  SHELF.forEach((item) => {
    const b = document.createElement("button");
    b.textContent = item;
    b.onclick = () => addIngredient(item);
    shelf.appendChild(b);
  });
}

function setShelfDisabled(disabled) {
  document.querySelectorAll("#shelf button").forEach((b) => (b.disabled = disabled));
}

function newOrder() {
  clearInterval(timer);
  const names = Object.keys(RECIPES);
  dish = names[Math.floor(Math.random() * names.length)];
  pan = [];
  heat = 0;
  stage = "build";

  $("face").textContent = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  $("bubble").textContent = `I'd like a ${dish}, please!`;
  $("recipe").textContent = RECIPES[dish].join(" ");
  $("panFood").textContent = "Pan is empty";
  $("panFood").classList.remove("sizzle");
  say("Click the right ingredients!");

  show("shelf", true);
  setShelfDisabled(false);
  show("cookArea", false);
  show("nextArea", false);
  updateStats();
}

function addIngredient(item) {
  if (stage !== "build") return;
  const needed = RECIPES[dish];
  if (needed.includes(item) && !pan.includes(item)) {
    pan.push(item);
    $("panFood").textContent = pan.join(" ");
    say("✅ Nice!");
    if (pan.length === needed.length) startCooking();
  } else {
    coins = Math.max(0, coins - 5);
    say("❌ Wrong ingredient! -5 coins");
    updateStats();
  }
}

function startCooking() {
  stage = "cook";
  say("Press Serve when the heat is in the GREEN zone!");
  setShelfDisabled(true);
  show("cookArea", true);
  $("panFood").classList.add("sizzle");

  const start = zoneStart();
  $("zone").style.left = start + "%";
  $("zone").style.width = (ZONE_END - start) + "%";

  const speed = 0.9 + Math.random() * 0.8;
  heat = 0;
  timer = setInterval(() => {
    heat += speed;
    $("heat").style.width = Math.min(heat, 100) + "%";
    if (heat >= 100) finish("burnt");
  }, 50);
}

function finish(result) {
  if (stage !== "cook") return;
  stage = "result";
  clearInterval(timer);
  $("panFood").classList.remove("sizzle");
  show("cookArea", false);

  let gain = 0;
  if (result === "perfect") {
    gain = 30 + 5 * panLevel;
    say(`🌟 Perfect! +${gain} coins`);
  } else if (result === "raw") {
    gain = 10;
    say("😬 Undercooked. +10 coins");
  } else {
    say("🔥 Burnt! No coins.");
  }
  coins += gain;
  updateStats();

  $("nextBtn").textContent = order < TOTAL_ORDERS ? "Next customer ➡️" : "See final score 🏆";
  show("nextArea", true);
}

function serve() {
  if (stage !== "cook") return;
  if (heat < zoneStart()) finish("raw");
  else if (heat <= ZONE_END) finish("perfect");
  else finish("burnt");
}

function next() {
  order += 1;
  if (order > TOTAL_ORDERS) endGame();
  else newOrder();
}

function endGame() {
  stage = "end";
  const best = loadBest();
  const newRecord = coins > best;
  if (newRecord) saveBest(coins);
  const stars = coins < 80 ? "⭐" : coins < 160 ? "⭐⭐" : "⭐⭐⭐";
  ["shelf", "cookArea", "nextArea", "customer", "recipe", "pan"].forEach((id) => show(id, false));
  say("");
  $("endScore").textContent = `Final score: ${coins} 🪙 ${stars}` + (newRecord ? "  🎉 New best!" : "");
  show("endArea", true);
  updateStats();
}

function buyPan() {
  if (coins >= UPGRADE_COST) {
    coins -= UPGRADE_COST;
    panLevel += 1;
    say(`🍳 Pan upgraded to level ${panLevel}! Bigger green zone.`);
    updateStats();
  }
}

function startGame() {
  coins = 0;
  order = 1;
  panLevel = 1;
  ["customer", "recipe", "pan"].forEach((id) => show(id, true));
  show("endArea", false);
  newOrder();
}

$("serveBtn").onclick = serve;
$("nextBtn").onclick = next;
$("againBtn").onclick = startGame;
$("shopBtn").onclick = buyPan;

buildShelf();
startGame();
