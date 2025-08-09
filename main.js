document.addEventListener('DOMContentLoaded', () => {
    const professorForm = document.getElementById('professorForm');
    const professoresList = document.getElementById('professoresList');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const cargaHorariaList = document.getElementById('cargaHorariaList');
    const gerarGradeBtn = document.getElementById('gerarGradeBtn');
    const gradeTableBody = document.getElementById('gradeTable').querySelector('tbody');
    const statusMessage = document.getElementById('statusMessage');

    const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const aulasPorDia = 5;
    const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
    const turmasMedio = ['1º EM', '2º EM', '3º EM'];
    const todasTurmas = [...turmasFundamental, ...turmasMedio];

    let professores = JSON.parse(localStorage.getItem('professores')) || [];
    let cargasHorarias = JSON.parse(localStorage.getItem('cargasHorarias')) || [];
    let gradeHoraria = {};

    // Função para renderizar a lista de professores cadastrados
    function renderizarProfessores() {
        professoresList.innerHTML = '';
        professores.forEach((prof, index) => {
            const nivelText = prof.nivelEnsino === 'Fundamental' ? 'Ensino Fundamental' :
                              prof.nivelEnsino === 'Medio' ? 'Ensino Médio' : 'Ambos';
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${prof.nome} (${prof.disciplina}) - Nível: ${nivelText} - Disponível: ${prof.disponibilidade.join(', ')}</span>
                <button class="remove-btn" data-index="${index}" data-type="professor">Remover</button>
            `;
            professoresList.appendChild(li);
        });
    }

    // Função para renderizar a lista de cargas horárias
    function renderizarCargasHorarias() {
        cargaHorariaList.innerHTML = '';
        cargasHorarias.forEach((carga, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${carga.turma}: ${carga.disciplina} - ${carga.aulas} aulas/sem (Max ${carga.limiteDiario}/dia)</span>
                <button class="remove-btn" data-index="${index}" data-type="carga">Remover</button>
            `;
            cargaHorariaList.appendChild(li);
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

                todasTurmas.forEach(turma => {
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
        if (professores.length === 0 || cargasHorarias.length === 0) {
            statusMessage.textContent = 'Por favor, cadastre professores e cargas horárias antes de gerar a grade.';
            statusMessage.style.color = 'orange';
            return;
        }
        
        gradeHoraria = {};
        let aulasRestantes = {};
        let aulasPorDisciplinaDia = {};

        cargasHorarias.forEach(carga => {
            const professor = professores.find(p => p.disciplina.toLowerCase() === carga.disciplina.toLowerCase());
            if (!professor) {
                statusMessage.textContent = `Erro: Nenhum professor encontrado para a disciplina "${carga.disciplina}".`;
                statusMessage.style.color = 'red';
                return;
            }
            aulasRestantes[`${carga.turma}-${carga.disciplina}`] = {
                aulas: carga.aulas,
                limiteDiario: carga.limiteDiario, // Adiciona o limite diário
                professor: professor
            };
        });
        
        // Inicializa o rastreamento de aulas por disciplina e dia
        todasTurmas.forEach(turma => {
            aulasPorDisciplinaDia[turma] = {};
            diasDaSemana.forEach(dia => {
                aulasPorDisciplinaDia[turma][dia] = {};
            });
        });

        // Tentar preencher a grade aula por aula
        for (const dia of diasDaSemana) {
            for (let i = 1; i <= aulasPorDia; i++) {
                for (const turma of todasTurmas) {
                    let alocado = false;
                    for (const chave in aulasRestantes) {
                        const { aulas, limiteDiario, professor } = aulasRestantes[chave];
                        const [turmaCarga, disciplinaCarga] = chave.split('-');

                        if (turmaCarga !== turma) continue;
                        if (aulas <= 0) continue;

                        const aulasHoje = aulasPorDisciplinaDia[turma][dia][disciplinaCarga] || 0;
                        const podeTerMaisAulasHoje = aulasHoje < limiteDiario; // Usa o limite definido

                        // Verificações das condições
                        const podeAlocar = 
                            professor &&
                            professor.disponibilidade.includes(dia) &&
                            (
                                (professor.nivelEnsino === 'Fundamental' && turmasFundamental.includes(turma)) ||
                                (professor.nivelEnsino === 'Medio' && turmasMedio.includes(turma)) ||
                                (professor.nivelEnsino === 'Ambos')
                            ) &&
                            !estaEmOutraTurma(dia, i, professor.nome) &&
                            !aulasConsecutivas(dia, i, turma, professor.nome) &&
                            podeTerMaisAulasHoje;
                        
                        if (podeAlocar) {
                            gradeHoraria[dia] = gradeHoraria[dia] || {};
                            gradeHoraria[dia][i] = gradeHoraria[dia][i] || {};
                            gradeHoraria[dia][i][turma] = `${professor.nome} (${disciplinaCarga})`;
                            aulasRestantes[chave].aulas--;
                            aulasPorDisciplinaDia[turma][dia][disciplinaCarga] = aulasHoje + 1;
                            alocado = true;
                            break;
                        }
                    }
                }
            }
        }

        const aulasFaltantes = Object.values(aulasRestantes).some(d => d.aulas > 0);
        if (aulasFaltantes) {
            statusMessage.textContent = 'Não foi possível alocar todas as aulas. Verifique as disponibilidades e cargas horárias. É possível que o limite de aulas por dia esteja muito restrito.';
            statusMessage.style.color = 'red';
            console.log('Aulas restantes:', aulasRestantes);
        } else {
            statusMessage.textContent = 'Grade horária gerada com sucesso!';
            statusMessage.style.color = 'green';
        }
        renderizarGrade();
    }

    // ----- Funções de Verificação de Restrições -----
    function estaEmOutraTurma(dia, aula, professorNome) {
        let emOutra = false;
        todasTurmas.forEach(turma => {
            if (gradeHoraria[dia]?.[aula]?.[turma]?.includes(professorNome)) {
                emOutra = true;
            }
        });
        return emOutra;
    }

    function aulasConsecutivas(dia, aula, turma, professorNome) {
        if (aula > 1) {
            return gradeHoraria[dia]?.[aula - 1]?.[turma]?.includes(professorNome);
        }
        return false;
    }

    // ----- Event Listeners -----
    professorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const disciplina = document.getElementById('disciplina').value;
        const nivelEnsino = document.getElementById('nivelEnsino').value;
        const disponibilidade = [];
        document.querySelectorAll('#professorForm input[type="checkbox"]:checked').forEach(checkbox => {
            disponibilidade.push(checkbox.value);
        });

        if (nome && disciplina && nivelEnsino && disponibilidade.length > 0) {
            professores.push({ nome, disciplina: disciplina.toLowerCase(), nivelEnsino, disponibilidade });
            localStorage.setItem('professores', JSON.stringify(professores));
            renderizarProfessores();
            professorForm.reset();
        } else {
            alert('Por favor, preencha todos os campos do professor!');
        }
    });

    cargaHorariaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const turma = document.getElementById('turmaCarga').value;
        const disciplina = document.getElementById('disciplinaCarga').value;
        const aulas = parseInt(document.getElementById('aulasCarga').value);
        const limiteDiario = parseInt(document.getElementById('limiteDiario').value);

        if (turma && disciplina && !isNaN(aulas) && aulas >= 0 && !isNaN(limiteDiario) && limiteDiario > 0) {
            const index = cargasHorarias.findIndex(c => c.turma === turma && c.disciplina === disciplina);
            if (index !== -1) {
                cargasHorarias[index].aulas = aulas;
                cargasHorarias[index].limiteDiario = limiteDiario;
            } else {
                cargasHorarias.push({ turma, disciplina: disciplina.toLowerCase(), aulas, limiteDiario });
            }
            localStorage.setItem('cargasHorarias', JSON.stringify(cargasHorarias));
            renderizarCargasHorarias();
            cargaHorariaForm.reset();
        } else {
            alert('Por favor, preencha todos os campos da carga horária!');
        }
    });

    // Evento para remover itens de ambas as listas
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            const type = e.target.dataset.type;
            if (type === 'professor') {
                professores.splice(index, 1);
                localStorage.setItem('professores', JSON.stringify(professores));
                renderizarProfessores();
            } else if (type === 'carga') {
                cargasHorarias.splice(index, 1);
                localStorage.setItem('cargasHorarias', JSON.stringify(cargasHorarias));
                renderizarCargasHorarias();
            }
        }
    });

    gerarGradeBtn.addEventListener('click', distribuirAulas);

    // Inicialização
    renderizarProfessores();
    renderizarCargasHorarias();
    renderizarGrade();
});