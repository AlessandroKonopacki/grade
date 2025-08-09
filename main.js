// Dados fictícios só para teste
const dias = [
    { dia: "Segunda", aulas: ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula"] },
    { dia: "Terça", aulas: ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula"] },
    { dia: "Quarta", aulas: ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula"] },
    { dia: "Quinta", aulas: ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula"] },
    { dia: "Sexta", aulas: ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula"] }
];

// Função para criar a tabela com células mescladas
function montarTabela() {
    const tbody = document.querySelector("#gradeHoraria tbody");
    tbody.innerHTML = "";

    dias.forEach(({ dia, aulas }) => {
        aulas.forEach((aula, index) => {
            const tr = document.createElement("tr");

            // Apenas na primeira aula do dia, cria a célula do dia com rowspan
            if (index === 0) {
                const tdDia = document.createElement("td");
                tdDia.textContent = dia;
                tdDia.rowSpan = aulas.length;
                tr.appendChild(tdDia);
            }

            // Coluna da aula
            const tdAula = document.createElement("td");
            tdAula.textContent = aula;
            tr.appendChild(tdAula);

            // Colunas das turmas (por enquanto, deixei em branco)
            for (let i = 0; i < 7; i++) {
                const tdTurma = document.createElement("td");
                tdTurma.textContent = ""; // Aqui depois entra o professor atribuído
                tr.appendChild(tdTurma);
            }

            tbody.appendChild(tr);
        });
    });
}

// Executa ao carregar
montarTabela();
