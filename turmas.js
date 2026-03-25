// ===== TURMAS =====
const form = document.getElementById("turmaForm");
const input = document.getElementById("nomeTurma");
const lista = document.getElementById("turmasList");

// Carregar turmas
const carregarTurmas = () => {
    return JSON.parse(localStorage.getItem("turmas")) || [];
};

// Salvar turmas
const salvarTurmas = (turmas) => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
};

// Renderizar lista
const renderizarTurmas = () => {
    const turmas = carregarTurmas();
    lista.innerHTML = "";

    turmas.forEach((turma, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${turma}
            <button onclick="removerTurma(${index})">❌</button>
        `;
        lista.appendChild(li);
    });
};

// Adicionar turma
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = input.value.trim();
    if (!nome) return;

    const turmas = carregarTurmas();
    turmas.push(nome);

    salvarTurmas(turmas);
    input.value = "";
    renderizarTurmas();
});

// Remover turma
window.removerTurma = (index) => {
    const turmas = carregarTurmas();
    turmas.splice(index, 1);
    salvarTurmas(turmas);
    renderizarTurmas();
};

// Botão concluir
document.getElementById("concluirTurmasBtn")
.addEventListener("click", () => {
    window.location.href = "grade.html";
});

// Inicializar
renderizarTurmas();