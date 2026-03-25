// ===== 🚀 INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {
    renderProfessores();
    renderCargas();
    carregarTurmasSelect();
    bindEventos();
}

// ===============================
// 🔗 EVENTOS
// ===============================
function bindEventos() {

    const profForm = document.getElementById("professorForm");
    if (profForm) {
        profForm.addEventListener("submit", adicionarProfessor);
    }

    const cargaForm = document.getElementById("cargaHorariaForm");
    if (cargaForm) {
        cargaForm.addEventListener("submit", adicionarCarga);
    }

    const btnConcluir = document.getElementById("concluirProfessoresBtn");
    if (btnConcluir) {
        btnConcluir.addEventListener("click", () => {
            window.location.href = "grade2.html";
        });
    }
}

// ===============================
// 👨‍🏫 PROFESSORES
// ===============================
function renderProfessores() {
    const professores = get("professores");
    const lista = document.getElementById("professoresList");
    const select = document.getElementById("professorCargaSelect");

    if (lista) {
        lista.innerHTML = "";

        if (professores.length === 0) {
            lista.innerHTML = "<p>Nenhum professor cadastrado.</p>";
        }

        professores.forEach((p, i) => {
            const li = document.createElement("li");

            li.innerHTML = `
                <strong>${p.nome}</strong> - ${p.disciplinas.join(", ")}
                <button class="btn-delete" data-index="${i}">❌</button>
            `;

            lista.appendChild(li);
        });

        // 🔥 Delegação de evento (melhor que onclick inline)
        lista.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-delete")) {
                const i = Number(e.target.dataset.index);
                removerProfessor(i);
            }
        });
    }

    if (select) {
        select.innerHTML = '<option value="">Selecione um professor</option>';

        professores.forEach(p => {
            const option = document.createElement("option");
            option.value = p.nome;
            option.textContent = p.nome;
            select.appendChild(option);
        });
    }
}

function adicionarProfessor(e) {
    e.preventDefault();

    const nome = limparTexto(document.getElementById("nomeProfessor").value);

    const disciplinas = stringParaLista(
        document.getElementById("disciplinas").value
    ).filter(Boolean);

    // ✅ CAPTURA CORRETA DOS CHECKBOXES
    const disponibilidade = [...document.querySelectorAll('input[name="disponibilidade"]:checked')]
        .map(el => el.value);

    const nivel = [...document.querySelectorAll('input[name="nivel"]:checked')]
        .map(el => el.value);

    if (!nome) return alert("Insira um nome!");
    if (disciplinas.length === 0) return alert("Informe ao menos uma disciplina!");

    const professores = get("professores");

    // 🔒 Evitar duplicados
    if (professores.some(p => p.nome === nome)) {
        return alert("Professor já cadastrado!");
    }

    professores.push({ nome, disciplinas, disponibilidade, nivel });

    set("professores", professores);

    e.target.reset();
    renderProfessores();
}

function removerProfessor(i) {
    if (!confirm("Deseja remover este professor?")) return;

    const professores = get("professores");
    professores.splice(i, 1);
    set("professores", professores);

    renderProfessores();
}

// ===============================
// 🏫 TURMAS
// ===============================
function carregarTurmasSelect() {
    const select = document.getElementById("turmaCargaSelect");
    if (!select) return;

    const turmas = get("turmas");

    select.innerHTML = '<option value="">Selecione uma turma</option>';

    if (turmas.length === 0) {
        const option = document.createElement("option");
        option.textContent = "Nenhuma turma cadastrada";
        option.disabled = true;
        select.appendChild(option);
        return;
    }

    turmas.forEach(t => {
        const nome = typeof t === "object" ? t.nome : t;

        const option = document.createElement("option");
        option.value = nome;
        option.textContent = nome;

        select.appendChild(option);
    });
}

// ===============================
// 📚 CARGAS HORÁRIAS
// ===============================
function renderCargas() {
    const cargas = get("cargas");
    const lista = document.getElementById("cargasHorariasList");

    if (!lista) return;

    lista.innerHTML = "";

    if (cargas.length === 0) {
        lista.innerHTML = "<p>Nenhuma carga cadastrada.</p>";
        return;
    }

    cargas.forEach((c, i) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>${c.professor} ➔ ${c.turma} (${c.disciplina})</span>
            <span>${c.aulas} aulas/sem | Limite: ${c.limite}</span>
            <button class="btn-delete" data-index="${i}">❌</button>
        `;

        lista.appendChild(li);
    });

    // 🔥 Delegação de evento
    lista.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-delete")) {
            const i = Number(e.target.dataset.index);
            removerCarga(i);
        }
    });
}

function adicionarCarga(e) {
    e.preventDefault();

    const novaCarga = {
        professor: document.getElementById("professorCargaSelect").value,
        turma: document.getElementById("turmaCargaSelect").value,
        disciplina: document.getElementById("disciplinaCarga").value,
        aulas: parseInt(document.getElementById("aulasPorSemana").value),
        limite: parseInt(document.getElementById("limiteAulas").value),
        geminada: document.getElementById("aulasGeminadas").checked
    };

    if (!novaCarga.professor || !novaCarga.turma) {
        return alert("Selecione professor e turma!");
    }

    const cargas = get("cargas");
    cargas.push(novaCarga);
    set("cargas", cargas);

    e.target.reset();
    renderCargas();
}

function removerCarga(i) {
    const cargas = get("cargas");
    cargas.splice(i, 1);
    set("cargas", cargas);

    renderCargas();
}