// ===== LOCAL STORAGE =====
const carregarDados = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
};

const salvarDados = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// ===== STRINGS =====
const limparTexto = (texto) => texto.trim();

const stringParaLista = (str) => {
    return str.split(',').map(s => s.trim());
};

// ===== VALIDAÇÃO =====
const numeroValido = (valor) => {
    return !isNaN(valor) && valor > 0;
};