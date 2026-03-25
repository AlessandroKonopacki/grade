// ===== DADOS =====
const turmas = JSON.parse(localStorage.getItem("turmas")) || [];
const tabela = document.getElementById("grade");

const dias = ["2ª", "3ª", "4ª", "5ª", "6ª"];
const aulasPorDia = 5;

// ===== VALIDAÇÃO =====
if (!tabela) {
    console.error("Tabela não encontrada!");
}

if (turmas.length === 0) {
    tabela.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
    return;
}

// ===== FUNÇÕES =====

function criarCabecalho() {
    const thead = document.createElement("thead");

    // título
    const trTitulo = document.createElement("tr");
    const thTitulo = document.createElement("th");

    thTitulo.colSpan = turmas.length + 1;
    thTitulo.textContent = "GRADE HORÁRIA";

    trTitulo.appendChild(thTitulo);
    thead.appendChild(trTitulo);

    // linha das turmas
    const trTurmas = document.createElement("tr");
    trTurmas.appendChild(document.createElement("th"));

    turmas.forEach(turma => {
        const th = document.createElement("th");
        th.textContent = turma;
        trTurmas.appendChild(th);
    });

    thead.appendChild(trTurmas);

    return thead;
}

function criarCorpo() {
    const tbody = document.createElement("tbody");

    dias.forEach(dia => {
        for (let i = 0; i < aulasPorDia; i++) {

            const tr = document.createElement("tr");

            if (i === 0) {
                const tdDia = document.createElement("td");
                tdDia.rowSpan = aulasPorDia;
                tdDia.textContent = dia;
                tr.appendChild(tdDia);
            }

            turmas.forEach(() => {
                const td = document.createElement("td");
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        }
    });

    return tbody;
}

// ===== RENDER =====

tabela.innerHTML = ""; // limpa antes

tabela.appendChild(criarCabecalho());
tabela.appendChild(criarCorpo());