// ===== ELEMENTOS =====
const form = document.getElementById("turmaForm");
const input = document.getElementById("nomeTurma");
const lista = document.getElementById("turmasList");
const btnConcluir = document.getElementById("concluirTurmasBtn");

// ===== FUNÇÕES =====
const carregarTurmas = () => {
    return JSON.parse(localStorage.getItem("turmas")) || [];
};

const salvarTurmas = (turmas) => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
};

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

// ===== EVENTOS =====
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = input.value.trim();
    if (!nome) return;

    const turmas = carregarTurmas();

    // evitar duplicado
    if (turmas.includes(nome)) {
        alert("Essa turma já foi cadastrada!");
        return;
    }

    turmas.push(nome);
    salvarTurmas(turmas);

    input.value = "";
    renderizarTurmas();
});

// remover turma
window.removerTurma = (index) => {
    const turmas = carregarTurmas();
    turmas.splice(index, 1);
    salvarTurmas(turmas);
    renderizarTurmas();
};

// botão concluir
btnConcluir.addEventListener("click", () => {
    window.location.href = "grade2.html";
});

// ===== INICIAR =====
renderizarTurmas();