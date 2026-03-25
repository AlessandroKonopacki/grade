<script>
const turmas = JSON.parse(localStorage.getItem("turmas")) || [];

const tabela = document.getElementById("grade");

// CRIA CABEÇALHO
let html = `
<thead>
<tr class="topo-geral">
<th colspan="${turmas.length + 1}">
GRADE HORÁRIA - 2026
</th>
</tr>

<tr class="turmas-header">
<th></th>
${turmas.map(t => `<th>${t}</th>`).join("")}
</tr>
</thead>
<tbody>
`;

// DIAS DA SEMANA
const dias = ["2ª", "3ª", "4ª", "5ª", "6ª"];

// MONTA LINHAS
dias.forEach(dia => {
    for (let i = 0; i < 5; i++) {
        html += "<tr>";

        // primeira linha do dia
        if (i === 0) {
            html += `<td rowspan="5" class="dia-col">${dia}</td>`;
        }

        // cria colunas baseado nas turmas
        turmas.forEach(() => {
            html += "<td></td>";
        });

        html += "</tr>";
    }

    // spacer
    html += `<tr class="spacer"><td colspan="${turmas.length + 1}"></td></tr>`;
});

html += "</tbody>";

tabela.innerHTML = html;
</script>