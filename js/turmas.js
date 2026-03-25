// ===============================
// 🚀 INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {
    renderizarTurmas();
    bindEventos();
}

// ===============================
// 📦 STORAGE
// ===============================
const carregarTurmas = () => {
    try {
        return JSON.parse(localStorage.getItem("turmas")) || [];
    } catch {
        return [];
    }
};

const salvarTurmas = (turmas) => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
};

// ===============================
// 🎯 ELEMENTOS
// ===============================
const form = document.getElementById("turmaForm");
const input = document.getElementById("nomeTurma");
const lista = document.getElementById("turmasList");
const btnConcluir = document.getElementById("concluirTurmasBtn");

// ===============================
// 🔗 EVENTOS
// ===============================
function bindEventos() {

    if (form) {
        form.addEventListener("submit", adicionarTurma);
    }

    if (lista) {
        // 🔥 Delegação de evento
        lista.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-delete")) {
                const index = Number(e.target.dataset.index);
                removerTurma(index);
            }
        });
    }

    if (btnConcluir) {
        btnConcluir.addEventListener("click", () => {
            window.location.href = "professores_cargas.html";
        });
    }
}

// ===============================
// 🏫 TURMAS
// ===============================
function renderizarTurmas() {
    if (!lista) return;

    const turmas = carregarTurmas();
    lista.innerHTML = "";

    if (turmas.length === 0) {
        lista.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
        return;
    }

    turmas.forEach((turma, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            ${turma}
            <button class="btn-delete" data-index="${index}">❌</button>
        `;

        lista.appendChild(li);
    });
}

function adicionarTurma(e) {
    e.preventDefault();

    const nome = input.value.trim();

    if (!nome) {
        alert("Digite o nome da turma!");
        return;
    }

    const turmas = carregarTurmas();

    // 🔒 evitar duplicados
    if (turmas.includes(nome)) {
        alert("Essa turma já foi cadastrada!");
        return;
    }

    turmas.push(nome);
    salvarTurmas(turmas);

    input.value = "";
    renderizarTurmas();
}

function removerTurma(index) {
    if (!confirm("Deseja remover essa turma?")) return;

    const turmas = carregarTurmas();
    turmas.splice(index, 1);
    salvarTurmas(turmas);

    renderizarTurmas();
}