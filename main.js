document.addEventListener("DOMContentLoaded", () => {
    const professoresTable = document.querySelector("#professoresTable tbody");
    const gradeTable = document.querySelector("#gradeTable tbody");

    const professores = [
        {
            nome: "Português",
            carga: [6, 6, 6, 6, 5, 6, 4],
            disponibilidade: [
                "X","X","","","","","", // Segunda
                "","","","","","","",   // Terça
                "","","","","","","",   // Quarta
                "","","","","","","",   // Quinta
                "","","","","","",""    // Sexta
            ]
        },
        {
            nome: "Matemática",
            carga: [6, 4, 6, 4, 6, 4, 6],
            disponibilidade: Array(30).fill("")
        }
    ];

    const dias = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
    const aulas = ["1ª aula", "2ª aula", "3ª aula", "4ª aula", "5ª aula", "6ª aula"];
    const turmas = ["6º ano", "7º ano", "8º ano", "9º ano", "1º EM", "2º EM", "3º EM"];

    // Monta tabela de professores
    professores.forEach(prof => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${prof.nome}</td>
            ${prof.carga.map(c => `<td>${c}</td>`).join("")}
            ${prof.disponibilidade.map(d => `<td>${d}</td>`).join("")}
        `;
        professoresTable.appendChild(tr);
    });

    // Monta grade de horários
    dias.forEach(dia => {
        aulas.forEach(aula => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${dia}</td>
                <td>${aula}</td>
                ${turmas.map(() => `<td></td>`).join("")}
            `;
            gradeTable.appendChild(tr);
        });
    });

    // Função de distribuição inteligente
    document.querySelector("#distribuirBtn").addEventListener("click", () => {
        const rows = gradeTable.querySelectorAll("tr");

        // Reinicia cargas para evitar múltiplas distribuições erradas
        const cargasRestantes = professores.map(p => [...p.carga]);

        rows.forEach((row, rowIndex) => {
            const diaIndex = Math.floor(rowIndex / aulas.length);
            const aulaIndex = rowIndex % aulas.length;

            // Armazena professores já ocupados nesse horário
            let ocupados = new Set();

            turmas.forEach((_, turmaIndex) => {
                let professorDisponivel = professores.find((p, idx) => {
                    return (
                        cargasRestantes[idx][turmaIndex] > 0 &&
                        p.disponibilidade[diaIndex * aulas.length + aulaIndex] !== "X" &&
                        !ocupados.has(idx) // professor não está dando aula em outra turma nesse horário
                    );
                });

                if (professorDisponivel) {
                    let pIndex = professores.indexOf(professorDisponivel);
                    row.cells[2 + turmaIndex].textContent = professorDisponivel.nome;
                    cargasRestantes[pIndex][turmaIndex]--;
                    ocupados.add(pIndex);
                } else {
                    row.cells[2 + turmaIndex].textContent = "Vago";
                }
            });
        });

        alert("Distribuição concluída com lógica otimizada!");
    });
});
