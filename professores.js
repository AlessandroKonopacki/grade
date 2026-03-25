// ===== INICIALIZAÇÃO =====
// Aguarda o DOM carregar para evitar erros de "null" ao buscar elementos
document.addEventListener("DOMContentLoaded", () => {
    renderProfessores();
    renderCargas();
    carregarTurmasSelect();
    
    // Vincula os eventos de formulário
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
});

// ===== PROFESSORES =====

const renderProfessores = () => {
    const professores = get("professores");
    const listaProf = document.getElementById("professoresList");
    const selectProf = document.getElementById("professorCargaSelect");

    if (listaProf) {
        listaProf.innerHTML = "";
        professores.forEach((p, i) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${p.nome}</strong> - ${p.disciplinas.join(", ")}
                <button onclick="removerProfessor(${i})" class="btn-delete">❌</button>
            `;
            listaProf.appendChild(li);
        });
    }

    // Atualiza o dropdown de professores no formulário de carga horária
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

function adicionarProfessor(e) {
    e.preventDefault();

    const nome = document.getElementById("nomeProfessor").value.trim();
    const disciplinasRaw = document.getElementById("disciplinas").value;
    const disciplinas = disciplinasRaw.split(",").map(d => d.trim()).filter(d => d !== "");

    const disponibilidade = [...document.querySelectorAll("input[name='disponibilidade']:checked")]
        .map(el => el.value);

    const nivel = [...document.querySelectorAll("input[name='nivel']:checked")]
        .map(el => el.value);

    if (nome === "" || disciplinas.length === 0) {
        alert("Preencha o nome e ao menos uma disciplina.");
        return;
    }

    const professores = get("professores");
    professores.push({ nome, disciplinas, disponibilidade, nivel });
    set("professores", professores);

    e.target.reset(); // Limpa o formulário
    renderProfessores();
}

window.removerProfessor = (i) => {
    if (confirm("Deseja remover este professor?")) {
        const professores = get("professores");
        professores.splice(i, 1);
        set("professores", professores);
        renderProfessores();
    }
};

// ===== TURMAS =====

const carregarTurmasSelect = () => {
    const selectTurma = document.getElementById("turmaCargaSelect");
    if (selectTurma) {
        const turmas = get("turmas"); // Busca as turmas cadastradas na outra página
        selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        
        if (turmas.length === 0) {
            const option = document.createElement("option");
            option.textContent = "Nenhuma turma cadastrada";
            option.disabled = true;
            selectTurma.appendChild(option);
        } else {
            turmas.forEach(t => {
                const option = document.createElement("option");
                // Verifica se t é objeto ou string (depende de como você salvou em turmas.html)
                const nomeTurma = typeof t === 'object' ? t.nome : t;
                option.value = nomeTurma;
                option.textContent = nomeTurma;
                selectTurma.appendChild(option);
            });
        }
    }
};

// ===== CARGAS HORÁRIAS =====

const renderCargas = () => {
    const cargas = get("cargas");
    const listaCargas = document.getElementById("cargasHorariasList");

    if (listaCargas) {
        listaCargas.innerHTML = "";
        cargas.forEach((c, i) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${c.professor} ➔ ${c.turma} (${c.disciplina})</span>
                <span>${c.aulas} aulas/sem | Limite: ${c.limite}</span>
                <button onclick="removerCarga(${i})" class="btn-delete">❌</button>
            `;
            listaCargas.appendChild(li);
        });
    }
};

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
        alert("Selecione um professor e uma turma.");
        return;
    }

    const cargas = get("cargas");
    cargas.push(novaCarga);
    set("cargas", cargas);

    e.target.reset();
    renderCargas();
}

window.removerCarga = (i) => {
    const cargas = get("cargas");
    cargas.splice(i, 1);
    set("cargas", cargas);
    renderCargas();
};