// ===============================
// 📦 STORAGE
// ===============================
function carregarDados(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function salvarDados(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ===============================
// 🧹 STRINGS
// ===============================
function limparTexto(texto) {
    return typeof texto === "string" ? texto.trim() : "";
}

function stringParaLista(str) {
    if (typeof str !== "string") return [];

    return str
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

// ===============================
// 🔢 VALIDAÇÃO
// ===============================
function numeroValido(valor) {
    const num = Number(valor);
    return !isNaN(num) && num > 0;
}

// ===============================
// 🧠 EXTRAS
// ===============================
function itemExiste(lista, valor, chave = null) {
    if (!Array.isArray(lista)) return false;

    return chave
        ? lista.some(item => item[chave] === valor)
        : lista.includes(valor);
}

function gerarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}