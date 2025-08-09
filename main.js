document.addEventListener('DOMContentLoaded', () => {
    const professorForm = document.getElementById('professorForm');
    const professoresList = document.getElementById('professoresList');
    const gerarGradeBtn = document.getElementById('gerarGradeBtn');
    const gradeTableBody = document.getElementById('gradeTable').querySelector('tbody');
    const statusMessage = document.getElementById('statusMessage');

    const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const aulasPorDia = 5;
    const turmas = ['6º ano', '7º ano', '8º ano', '9º ano'];
    const aulasPorDisciplina = 4; // Ex: 4 aulas de Matemática por turma por semana

    let professores = JSON.parse(localStorage.getItem('professores')) || [];
    let gradeHoraria = {};

    // Função para renderizar a lista de professores cadastrados
    function renderizarProfessores() {
        professoresList.innerHTML = '';
        professores.forEach((prof, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${prof.nome} (${prof.disciplina}) - Disponível: ${prof.disponibilidade.join(', ')}</span>
                <button class="remove-btn" data-index="${index}">Remover</button>
            `;
            professoresList.appendChild(li);
        });
    }

    // Função para renderizar a grade horária
    function renderizarGrade() {
        gradeTableBody.innerHTML = '';
        diasDaSemana.forEach(dia => {
            for (let i = 1; i <= aulasPorDia; i++) {
                const tr = document.createElement('tr');
                const tdDiaAula = document.createElement('td');
                tdDiaAula.textContent = `${dia} - ${i}ª aula`;
                tr.appendChild(tdDiaAula);

                turmas.forEach(turma => {
                    const tdProfessor = document.createElement('td');
                    const professor = gradeHoraria[dia]?.[i]?.[turma] || '';
                    tdProfessor.textContent = professor;
                    tr.appendChild(tdProfessor);
                });
                gradeTableBody.appendChild(tr);
            }
        });
    }

    // Função principal para o algoritmo de distribuição
    function distribuirAulas() {
        // Reinicia a grade e as contagens
        gradeHoraria = {};
        turmas.forEach(turma => {
            gradeHoraria[turma] = {};
            diasDaSemana.forEach(dia => {
                gradeHoraria[turma][dia] = Array(aulasPorDia).fill('');
            });
        });

        let disciplinasParaDistribuir = {};
        professores.forEach(prof => {
            turmas.forEach(turma => {
                const chave = `${turma}-${prof.disciplina}`;
                if (!disciplinasParaDistribuir[chave]) {
                    disciplinasParaDistribuir[chave] = {
                        professor: prof,
                        aulasRestantes: aulasPorDisciplina
                    };
                }
            });
        });

        // Tentar preencher a grade aula por aula
        for (const dia of diasDaSemana) {
            for (let i = 1; i <= aulasPorDia; i++) {
                for (const turma of turmas) {
                    // Encontrar uma disciplina para alocar
                    let alocado = false;
                    for (const chave in disciplinasParaDistribuir) {
                        const { professor, aulasRestantes } = disciplinasParaDistribuir[chave];
                        const [turmaDisc, disciplina] = chave.split('-');

                        // Verificações das condições
                        const podeAlocar = 
                            aulasRestantes > 0 &&
                            professor.disponibilidade.includes(dia) &&
                            !estaEmOutraTurma(dia, i, professor.nome) &&
                            !aulasConsecutivas(dia, i, turma, professor.nome);
                        
                        if (podeAlocar && turmaDisc === turma) {
                            gradeHoraria[dia] = gradeHoraria[dia] || {};
                            gradeHoraria[dia][i] = gradeHoraria[dia][i] || {};
                            gradeHoraria[dia][i][turma] = professor.nome;
                            disciplinasParaDistribuir[chave].aulasRestantes--;
                            alocado = true;
                            break;
                        }
                    }
                }
            }
        }

        // Verificação final para saber se todas as aulas foram alocadas
        const aulasFaltantes = Object.values(disciplinasParaDistribuir).some(d => d.aulasRestantes > 0);
        if (aulasFaltantes) {
            statusMessage.textContent = 'Não foi possível alocar todas as aulas com as restrições fornecidas.';
            statusMessage.style.color = 'red';
            renderizarGrade();
        } else {
            statusMessage.textContent = 'Grade horária gerada com sucesso!';
            statusMessage.style.color = 'green';
            renderizarGrade();
        }
    }

    // ----- Funções de Verificação de Restrições -----
    function estaEmOutraTurma(dia, aula, professorNome) {
        let emOutra = false;
        turmas.forEach(turma => {
            if (gradeHoraria[dia]?.[aula]?.[turma] === professorNome) {
                emOutra = true;
            }
        });
        return emOutra;
    }

    function aulasConsecutivas(dia, aula, turma, professorNome) {
        if (aula > 1) {
            return gradeHoraria[dia]?.[aula - 1]?.[turma] === professorNome;
        }
        return false;
    }

    // ----- Event Listeners -----
    professorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const disciplina = document.getElementById('disciplina').value;
        const disponibilidade = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            disponibilidade.push(checkbox.value);
        });

        if (nome && disciplina && disponibilidade.length > 0) {
            professores.push({ nome, disciplina, disponibilidade });
            localStorage.setItem('professores', JSON.stringify(professores));
            renderizarProfessores();
            professorForm.reset();
        } else {
            alert('Por favor, preencha todos os campos!');
        }
    });

    professoresList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            professores.splice(index, 1);
            localStorage.setItem('professores', JSON.stringify(professores));
            renderizarProfessores();
        }
    });

    gerarGradeBtn.addEventListener('click', distribuirAulas);

    // Inicialização
    renderizarProfessores();
    renderizarGrade();
});