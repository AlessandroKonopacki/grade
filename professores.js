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
    
    if (listaProf) {
        listaProf.innerHTML = "";
        professores.forEach((p, i) => {
            const li = document.createElement("li");
            li.innerHTML = `
                ${p.nome} (${p.disciplinas.join(", ")})
                <button onclick="removerProfessor(${i})">❌</button>
            `;
            listaProf.appendChild(li);
        });
    }

    // Atualizar select de professores (apenas se ele existir na página atual)
    if (selectProf) {
        selectProf.innerHTML = '<option value="">Selecione um professor</option>';
        professores.forEach(p => {
            const option = document.createElement("option");
            option.value = p.nome;
            option.textContent = p.nome;
            selectProf.appendChild(option);
        });
    }
};

// Adicionar professor
if (profForm) {
    profForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const nomeInput = document.getElementById("nomeProfessor");
        const disciplinasInput = document.getElementById("disciplinas");

        const nome = nomeInput.value.trim();
        const disciplinas = disciplinasInput.value.split(",").map(d => d.trim()).filter(d => d !== "");

        const disponibilidade = [...document.querySelectorAll("input[name='disponibilidade']:checked")]
            .map(el => el.value);

        const nivel = [...document.querySelectorAll("input[name='nivel']:checked")]
            .map(el => el.value);

        if (nome === "") {
            alert("Por favor, preencha o nome do professor.");
            return;
        }

        const professores = get("professores");
        professores.push({ nome, disciplinas, disponibilidade, nivel });
        set("professores", professores);

        profForm.reset();
        renderProfessores();
    });
}

window.removerProfessor = (i) => {
    const professores = get("professores");
    professores.splice(i, 1);
    set("professores", professores);
    renderProfessores();
};

// ===== TURMAS NO SELECT =====
const carregarTurmasSelect = () => {
    if (selectTurma) {
        const turmas = get("turmas");
        selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        turmas.forEach(t => {
            const option = document.createElement("option");
            option.value = t; // Supondo que 't' seja o nome da turma ou objeto. Ajuste se necessário.
            option.textContent = t.nome || t; 
            selectTurma.appendChild(option);
        });
    }
};

// ===== CARGAS =====
const renderCargas = () => {
    if (listaCargas) {
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
    }
};

if (cargaForm) {
    cargaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const cargas = get("cargas");
        const novaCarga = {
            professor: selectProf.value,
            turma: selectTurma.value,
            disciplina: document.getElementById("disciplinaCarga").value,
            aulas: parseInt(document.getElementById("aulasPorSemana").value),
            limite: parseInt(document.getElementById("limiteAulas").value),
            geminada: document.getElementById("aulasGeminadas").checked
        };
        cargas.push(novaCarga);
        set("cargas", cargas);
        cargaForm.reset();
        renderCargas();
    });
}

window.removerCarga = (i) => {
    const cargas = get("cargas");
    cargas.splice(i, 1);
    set("cargas", cargas);
    renderCargas();
};

// Botão concluir
const btnConcluir = document.getElementById("concluirProfessoresBtn");
if (btnConcluir) {
    btnConcluir.addEventListener("click", () => {
        window.location.href = "grade2.html";
    });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    renderProfessores();
    renderCargas();
    carregarTurmasSelect();
});