// ===== UTIL =====
const get = (key) => JSON.parse(localStorage.getItem(key)) || [];
const set = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ===== ELEMENTOS =====
const profForm = document.getElementById("professorForm");
const listaProf = document.getElementById("professoresList");

const cargaForm = document.getElementById("cargaHorariaForm");
const listaCargas = document.getElementById("cargasHorariasList");

const selectProf = document.getElementById("professorCargaSelect");
const selectTurma = document.getElementById("turmaCargaSelect");

// ===== PROFESSORES =====
const renderProfessores = () => {
    const professores = get("professores");
    listaProf.innerHTML = "";

    professores.forEach((p, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${p.nome} (${p.disciplinas.join(", ")})
            <button onclick="removerProfessor(${i})">❌</button>
        `;
        listaProf.appendChild(li);
    });

    // atualizar select
    selectProf.innerHTML = "";
    professores.forEach(p => {
        selectProf.innerHTML += `<option>${p.nome}</option>`;
    });
};

// adicionar professor
profForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeProfessor").value.trim();
    const disciplinas = document.getElementById("disciplinas")
        .value.split(",")
        .map(d => d.trim());

    const disponibilidade = [...document.querySelectorAll("input[name='disponibilidade']:checked")]
        .map(el => el.value);

    const nivel = [...document.querySelectorAll("input[name='nivel']:checked")]
        .map(el => el.value);

    const professores = get("professores");

    professores.push({ nome, disciplinas, disponibilidade, nivel });
    set("professores", professores);

    profForm.reset();
    renderProfessores();
});

// remover
window.removerProfessor = (i) => {
    const professores = get("professores");
    professores.splice(i, 1);
    set("professores", professores);
    renderProfessores();
};

// ===== TURMAS NO SELECT =====
const carregarTurmasSelect = () => {
    const turmas = get("turmas");
    selectTurma.innerHTML = "";

    turmas.forEach(t => {
        selectTurma.innerHTML += `<option>${t}</option>`;
    });
};

// ===== CARGAS =====
const renderCargas = () => {
    const cargas = get("cargas");
    listaCargas.innerHTML = "";

    cargas.forEach((c, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${c.professor} - ${c.turma} (${c.disciplina}) ${c.aulas} aulas
            <button onclick="removerCarga(${i})">❌</button>
        `;
        listaCargas.appendChild(li);
    });
};

// adicionar carga
cargaForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const carga = {
        professor: selectProf.value,
        turma: selectTurma.value,
        disciplina: document.getElementById("disciplinaCarga").value,
        aulas: parseInt(document.getElementById("aulasPorSemana").value),
        limite: parseInt(document.getElementById("limiteAulas").value),
        geminada: document.getElementById("aulasGeminadas").checked
    };

    const cargas = get("cargas");
    cargas.push(carga);
    set("cargas", cargas);

    cargaForm.reset();
    renderCargas();
};

// remover carga
window.removerCarga = (i) => {
    const cargas = get("cargas");
    cargas.splice(i, 1);
    set("cargas", cargas);
    renderCargas();
};

// botão concluir
document.getElementById("concluirProfessoresBtn")
.addEventListener("click", () => {
    window.location.href = "grade2.html";
});

// ===== INIT =====
renderProfessores();
renderCargas();
carregarTurmasSelect();