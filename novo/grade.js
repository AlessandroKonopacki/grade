// pegar turmas do localStorage
const turmas = JSON.parse(localStorage.getItem("turmas")) || [];

const tabela = document.getElementById("grade");

// dias da semana
const dias = ["2ª", "3ª", "4ª", "5ª", "6ª"];

let html = "";

// ===== CABEÇALHO =====
html += "<thead>";

html += `
<tr>
<th colspan="${turmas.length + 1}">
GRADE HORÁRIA
</th>
</tr>
`;

html += "<tr><th></th>";

turmas.forEach(t => {
    html += `<th>${t}</th>`;
});

html += "</tr></thead><tbody>";

// ===== CORPO =====
dias.forEach(dia => {

    for (let i = 0; i < 5; i++) {

        html += "<tr>";

        // primeira linha do dia
        if (i === 0) {
            html += `<td rowspan="5">${dia}</td>`;
        }

        turmas.forEach(() => {
            html += "<td></td>";
        });

        html += "</tr>";
    }

});

// fechar tabela
html += "</tbody>";

tabela.innerHTML = html;