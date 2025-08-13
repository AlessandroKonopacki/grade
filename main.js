// main.js

document.addEventListener('DOMContentLoaded', () => {
    // Declarações de elementos do DOM
    const professorForm = document.getElementById('professorForm');
    const professoresList = document.getElementById('professoresList');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const cargaHorariaList = document.getElementById('cargaHorariaList');
    const professorCargaSelect = document.getElementById('professorCarga');
    const disciplinaCargaInput = document.getElementById('disciplinaCarga');
    const turmaCargaSelect = document.getElementById('turmaCarga');
    const aulasCargaInput = document.getElementById('aulasCarga');
    const limiteDiarioInput = document.getElementById('limiteDiario');
    const aulaGeminadaCheckbox = document.getElementById('aulaGeminada');
    const ativarAula6FundamentalCheckbox = document.getElementById('ativarAula6Fundamental');
    const ativarAula6MedioCheckbox = document.getElementById('ativarAula6Medio');
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    const novaGradeBtn = document.getElementById('novaGradeBtn');
    const trocarBtn = document.getElementById('trocarBtn');
    const statusMessage = document.getElementById('statusMessage');
    const aulasSobrantesDiv = document.getElementById('aulasSobrantes');
    
    // Elementos da barra de progresso
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const gradeTable = document.getElementById('gradeTable');

    // Estruturas de dados globais
    const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
    const turmasMedio = ['1º EM', '2º EM', '3º EM'];
    const todasTurmas = [...turmasFundamental, ...turmasMedio];
    const aulasPeriodoPadrao = [2, 3, 4, 5];

    let professores = JSON.parse(localStorage.getItem('professores')) || [];
    let cargasHorarias = JSON.parse(localStorage.getItem('cargasHorarias')) || [];
    let gradeHoraria = {};
    let swapMode = false;
    let selectedCell = null;
    
    // --- Funções Auxiliares de Lógica e Renderização ---
    function getAulasPeriodo(turma) {
        if (turmasFundamental.includes(turma) && ativarAula6FundamentalCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        if (turmasMedio.includes(turma) && ativarAula6MedioCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        return aulasPeriodoPadrao;
    }

    function renderizarProfessores() {
        professoresList.innerHTML = '';
        professorCargaSelect.innerHTML = '<option value="">Selecione o professor</option>';
        professores.forEach((prof, index) => {
            const nivelText = prof.nivelEnsino === 'Fundamental' ? 'Ensino Fundamental' :
                                prof.nivelEnsino === 'Medio' ? 'Ensino Médio' : 'Ambos';
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${prof.nome} (${prof.disciplinas.join(', ')}) - Nível: ${nivelText} - Disponível: ${prof.disponibilidade.join(', ')}</span>
                <button class="remove-btn" data-index="${index}" data-type="professor">Remover</button>
            `;
            professoresList.appendChild(li);

            const option = document.createElement('option');
            option.value = prof.nome;
            option.textContent = prof.nome;
            professorCargaSelect.appendChild(option);
        });
    }

    function renderizarCargasHorarias() {
        cargaHorariaList.innerHTML = '';
        cargasHorarias.forEach((carga, index) => {
            const geminadaText = carga.aulaGeminada ? '(Aulas Consecutivas Ativadas)' : '';
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${carga.turma}: ${carga.professorNome} (${carga.disciplina}) - ${carga.aulas} aulas/sem (Max ${carga.limiteDiario}/dia) ${geminadaText}</span>
                <button class="remove-btn" data-index="${index}" data-type="carga">Remover</button>
            `;
            cargaHorariaList.appendChild(li);
        });
    }
    
    function recalcularAulasSobrantes(grade) {
        const aulasOcupadas = {};
        cargasHorarias.forEach(carga => {
            const key = `${carga.professorNome}-${carga.turma}-${carga.disciplina}`;
            aulasOcupadas[key] = {
                professorNome: carga.professorNome,
                turma: carga.turma,
                disciplina: carga.disciplina,
                aulas: carga.aulas,
                alocadas: 0
            };
        });
    
        diasDaSemana.forEach(dia => {
            getAulasPeriodo('6º ano').forEach(aula => { // Assume-se que o número de aulas é consistente entre as turmas
                todasTurmas.forEach(turma => {
                    const professorDisciplina = grade[dia]?.[aula]?.[turma];
                    if (professorDisciplina) {
                        const [nomeProfessor, disciplina] = professorDisciplina.split(' (');
                        const disciplinaFormatada = disciplina.substring(0, disciplina.length - 1);
                        const key = `${nomeProfessor}-${turma}-${disciplinaFormatada}`;
                        if (aulasOcupadas[key]) {
                            aulasOcupadas[key].alocadas++;
                        }
                    }
                });
            });
        });
    
        const aulasSobrantes = Object.values(aulasOcupadas).map(item => ({
            ...item,
            aulas: item.aulas - item.alocadas
        })).filter(item => item.aulas > 0);
    
        return aulasSobrantes;
    }
    
    function renderizarAulasSobrantes(aulasRestantes) {
        aulasSobrantesDiv.innerHTML = '';
        const aulasFaltantes = aulasRestantes.filter(d => d.aulas > 0);
        
        if (aulasFaltantes.length > 0) {
            const titulo = document.createElement('h4');
            titulo.textContent = 'Aulas não alocadas:';
            aulasSobrantesDiv.appendChild(titulo);
            
            const lista = document.createElement('ul');
            aulasFaltantes.forEach(aula => {
                const li = document.createElement('li');
                li.textContent = `${aula.professorNome} (${aula.disciplina}) na turma ${aula.turma} - ${aula.aulas} aula(s) restante(s).`;
                lista.appendChild(li);
            });
            aulasSobrantesDiv.appendChild(lista);
        } else {
            const mensagem = document.createElement('p');
            mensagem.textContent = 'Todas as aulas foram alocadas com sucesso.';
            aulasSobrantesDiv.appendChild(mensagem);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function temAulaConsecutiva(grade, dia, aula, turma, professorNome) {
        const aulasPeriodoFinal = getAulasPeriodo(turma);
        const aulaAnterior = aulasPeriodoFinal.find(a => a === aula - 1);
        const aulaPosterior = aulasPeriodoFinal.find(a => a === aula + 1);
    
        if (aulaAnterior && grade[dia]?.[aulaAnterior]?.[turma]?.startsWith(professorNome)) {
            return true;
        }
        if (aulaPosterior && grade[dia]?.[aulaPosterior]?.[turma]?.startsWith(professorNome)) {
            return true;
        }
        return false;
    }
    
    function estaEmOutraTurma(grade, dia, aula, professorNome, turmaAtual) {
        return todasTurmas.some(turma =>
            turma !== turmaAtual &&
            grade[dia]?.[aula]?.[turma]?.startsWith(professorNome)
        );
    }

    function checarConflito(grade) {
        const conflitos = [];
        
        diasDaSemana.forEach(dia => {
            const aulasPossiveis = [2, 3, 4, 5, 6];
            aulasPossiveis.forEach(aula => {
                const alocacoesPorPeriodo = [];
                todasTurmas.forEach(turma => {
                    const professorDisciplina = grade[dia]?.[aula]?.[turma];
                    if (professorDisciplina) {
                        alocacoesPorPeriodo.push({
                            dia,
                            aula,
                            turma,
                            professorNome: professorDisciplina.split(' (')[0]
                        });
                    }
                });

                const professoresNestePeriodo = alocacoesPorPeriodo.map(a => a.professorNome);
                const professoresComConflito = professoresNestePeriodo.filter((prof, index) => professoresNestePeriodo.indexOf(prof) !== index);
                
                if (professoresComConflito.length > 0) {
                    conflitos.push(...alocacoesPorPeriodo.filter(a => professoresComConflito.includes(a.professorNome)));
                }
            });
        });
        return conflitos;
    }
    
    function gerarGradeInicial() {
        let grade = {};
        const aulasParaDistribuir = JSON.parse(JSON.stringify(cargasHorarias));
        const aulasPorDiaProfessor = {};

        shuffleArray(aulasParaDistribuir);

        diasDaSemana.forEach(dia => {
            grade[dia] = {};
            todasTurmas.forEach(turma => {
                getAulasPeriodo(turma).forEach(aula => {
                    grade[dia][aula] = {};
                });
            });
        });
        
        aulasParaDistribuir.forEach(carga => {
            let aulasRestantes = carga.aulas;
            const professor = professores.find(p => p.nome === carga.professorNome);
            
            while (aulasRestantes > 0) {
                let dia = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
                let turma = carga.turma;
                let aulasPeriodo = getAulasPeriodo(turma);
                shuffleArray(aulasPeriodo);
                let aula = aulasPeriodo[0];
                
                if (!aulasPorDiaProfessor[professor.nome]) aulasPorDiaProfessor[professor.nome] = {};
                if (!aulasPorDiaProfessor[professor.nome][dia]) aulasPorDiaProfessor[professor.nome][dia] = 0;
                
                const podeAlocar = professor &&
                                    professor.disponibilidade.includes(dia) &&
                                    !estaEmOutraTurma(grade, dia, aula, professor.nome, turma) &&
                                    !grade[dia][aula][turma] &&
                                    aulasPorDiaProfessor[professor.nome][dia] < carga.limiteDiario &&
                                    (carga.aulaGeminada || !temAulaConsecutiva(grade, dia, aula, turma, professor.nome));
                                    
                if (podeAlocar) {
                    grade[dia][aula][turma] = `${professor.nome} (${carga.disciplina})`;
                    aulasPorDiaProfessor[professor.nome][dia]++;
                    aulasRestantes--;
                }
            }
        });
        
        return { grade, aulasRestantes: aulasParaDistribuir.filter(a => a.aulas > 0) };
    }

    function iniciarWorkerAlgoritmoGenetico() {
        if (typeof Worker === 'undefined') {
            statusMessage.textContent = 'Seu navegador não suporta Web Workers.';
            statusMessage.style.color = 'red';
            return;
        }

        const myWorker = new Worker('worker.js');
        
        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        myWorker.postMessage({
            tipo: 'iniciar',
            data: {
                professores,
                cargasHorarias,
                params: {
                    ativarFundamental: ativarAula6FundamentalCheckbox.checked,
                    ativarMedio: ativarAula6MedioCheckbox.checked
                }
            }
        });
        
        statusMessage.textContent = 'Gerando grade horária... Por favor, aguarde.';
        statusMessage.style.color = '#1a5cff';

        myWorker.onmessage = (e) => {
            const { type, geracao, numGeracoes, melhorFitness, melhorGrade, aulasRestantes } = e.data;
            if (type === 'progress') {
                const porcentagem = Math.round((geracao / numGeracoes) * 100);
                progressBar.style.width = `${porcentagem}%`;
                progressBar.textContent = `${porcentagem}%`;
                statusMessage.textContent = `Gerando grade... Geração ${geracao}/${numGeracoes}. Melhor fitness: ${melhorFitness}`;
            } else if (type === 'concluido') {
                gradeHoraria = melhorGrade;
                const aulasRestantesFinal = recalcularAulasSobrantes(gradeHoraria);
                
                renderizarGrade();
                renderizarAulasSobrantes(aulasRestantesFinal);

                progressBar.style.width = '100%';
                progressBar.textContent = '100%';

                if (aulasRestantesFinal.length === 0) {
                    statusMessage.textContent = 'Grade horária gerada com sucesso!';
                    statusMessage.style.color = 'green';
                } else {
                    statusMessage.textContent = 'Geração de grade concluída. Não foi possível alocar todas as aulas.';
                    statusMessage.style.color = 'orange';
                }
                
                setTimeout(() => {
                    progressBarContainer.style.display = 'none';
                }, 3000);
            }
        };
    }
    
    function renderizarGrade() {
        gradeTable.innerHTML = '';
        
        const conflitos = checarConflito(gradeHoraria);
        
        // Cabeçalho da tabela
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const thDiaAula = document.createElement('th');
        thDiaAula.textContent = 'Dia/Aula';
        headerRow.appendChild(thDiaAula);

        todasTurmas.forEach(turma => {
            const thTurma = document.createElement('th');
            thTurma.textContent = turma;
            headerRow.appendChild(thTurma);
        });
        
        thead.appendChild(headerRow);
        gradeTable.appendChild(thead);

        // Corpo da tabela
        const tbody = document.createElement('tbody');
        
        diasDaSemana.forEach(dia => {
            const aulasPossiveis = getAulasPeriodo(turmasFundamental[0]);
            
            aulasPossiveis.forEach((aula, index) => {
                const tr = document.createElement('tr');

                if (index === 0) {
                    const tdDia = document.createElement('td');
                    tdDia.textContent = dia;
                    tdDia.rowSpan = aulasPossiveis.length;
                    tdDia.style.verticalAlign = 'top';
                    tr.appendChild(tdDia);
                }

                todasTurmas.forEach(turma => {
                    const tdConteudo = document.createElement('td');
                    tdConteudo.classList.add('grade-cell');
                    tdConteudo.dataset.dia = dia;
                    tdConteudo.dataset.aula = aula;
                    tdConteudo.dataset.turma = turma;
                    
                    const professorDisciplina = gradeHoraria[dia]?.[aula]?.[turma];
                    if (professorDisciplina) {
                        const [nomeProfessor, disciplina] = professorDisciplina.split(' (');
                        const disciplinaFormatada = disciplina.substring(0, disciplina.length - 1);
                        tdConteudo.textContent = `${nomeProfessor} (${disciplinaFormatada})`;
                        
                        const temConflito = conflitos.some(c => c.dia === dia && c.aula === aula && c.turma === turma);
                        if (temConflito) {
                            tdConteudo.classList.add('conflito');
                        }
                    }
                    tr.appendChild(tdConteudo);
                });
                
                tbody.appendChild(tr);
            });
        });
        
        gradeTable.appendChild(tbody);
    }
    
    // --- Event Listeners ---
    professorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const disciplinas = document.getElementById('disciplinas').value.split(',').map(d => d.trim().toLowerCase());
        const nivelEnsino = document.getElementById('nivelEnsino').value;
        const disponibilidade = [];
        document.querySelectorAll('#professorForm input[type="checkbox"]:checked').forEach(checkbox => {
            disponibilidade.push(checkbox.value);
        });

        if (nome && disciplinas.length > 0 && nivelEnsino && disponibilidade.length > 0) {
            professores.push({ nome, disciplinas, nivelEnsino, disponibilidade });
            localStorage.setItem('professores', JSON.stringify(professores));
            renderizarProfessores();
            professorForm.reset();
        } else {
            alert('Por favor, preencha todos os campos do professor!');
        }
    });

    cargaHorariaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const professorNome = professorCargaSelect.value;
        const turma = turmaCargaSelect.value;
        const disciplina = disciplinaCargaInput.value;
        const aulas = parseInt(aulasCargaInput.value, 10);
        const limiteDiario = parseInt(limiteDiarioInput.value, 10);
        const aulaGeminada = aulaGeminadaCheckbox.checked;

        if (professorNome && turma && disciplina && !isNaN(aulas) && aulas > 0 && !isNaN(limiteDiario) && limiteDiario > 0) {
            cargasHorarias.push({ professorNome, turma, disciplina, aulas, limiteDiario, aulaGeminada });
            localStorage.setItem('cargasHorarias', JSON.stringify(cargasHorarias));
            renderizarCargasHorarias();
            cargaHorariaForm.reset();
        } else {
            alert('Por favor, preencha todos os campos da carga horária!');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = e.target.dataset.index;
            const type = e.target.dataset.type;

            if (confirm(`Tem certeza que deseja remover este ${type}?`)) {
                if (type === 'professor') {
                    const profRemovido = professores[index].nome;
                    professores.splice(index, 1);
                    cargasHorarias = cargasHorarias.filter(carga => carga.professorNome !== profRemovido);
                    localStorage.setItem('professores', JSON.stringify(professores));
                    localStorage.setItem('cargasHorarias', JSON.stringify(cargasHorarias));
                    renderizarCargasHorarias();
                    renderizarProfessores();
                } else if (type === 'carga') {
                    cargasHorarias.splice(index, 1);
                    localStorage.setItem('cargasHorarias', JSON.stringify(cargasHorarias));
                    renderizarCargasHorarias();
                }
            }
        }
    });
    
    // Event listeners para a grade
    gerarGradeIABtn.addEventListener('click', iniciarWorkerAlgoritmoGenetico);

    novaGradeBtn.addEventListener('click', () => {
        const resultado = gerarGradeInicial();
        gradeHoraria = resultado.grade;
        renderizarGrade();
        const aulasRestantesFinal = recalcularAulasSobrantes(gradeHoraria);
        renderizarAulasSobrantes(aulasRestantesFinal);
    });
    
    trocarBtn.addEventListener('click', () => {
        swapMode = !swapMode;
        if (swapMode) {
            trocarBtn.textContent = 'Modo Troca Ativado';
            trocarBtn.style.backgroundColor = '#28a745';
        } else {
            trocarBtn.textContent = 'Ativar Troca de Professores';
            trocarBtn.style.backgroundColor = '#007bff';
            selectedCell = null;
        }
    });
    
    gradeTable.addEventListener('click', (e) => {
        if (!swapMode) return;
        
        let cell = e.target.closest('.grade-cell');
        if (!cell) return;
        
        if (!selectedCell) {
            selectedCell = cell;
            selectedCell.style.border = '2px solid blue';
        } else if (selectedCell === cell) {
            selectedCell.style.border = '1px solid #ccc';
            selectedCell = null;
        } else {
            const cell1Data = selectedCell.dataset;
            const cell2Data = cell.dataset;
            
            const cell1Content = gradeHoraria[cell1Data.dia]?.[cell1Data.aula]?.[cell1Data.turma];
            const cell2Content = gradeHoraria[cell2Data.dia]?.[cell2Data.aula]?.[cell2Data.turma];
            
            // Troca o conteúdo na gradeHoraria
            gradeHoraria[cell1Data.dia][cell1Data.aula][cell1Data.turma] = cell2Content;
            gradeHoraria[cell2Data.dia][cell2Data.aula][cell2Data.turma] = cell1Content;
            
            // Limpa as células selecionadas e re-renderiza
            renderizarGrade();
            selectedCell = null;
            swapMode = false;
            trocarBtn.textContent = 'Ativar Troca de Professores';
            trocarBtn.style.backgroundColor = '#007bff';
        }
    });
    
    // Inicialização
    renderizarProfessores();
    renderizarCargasHorarias();
});