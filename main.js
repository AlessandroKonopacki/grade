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
    const ativarAula6FundamentalCheckbox = document.getElementById('ativarAula6Fundamental');
    const ativarAula6MedioCheckbox = document.getElementById('ativarAula6Medio');
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    const novaGradeBtn = document.getElementById('novaGradeBtn');
    const trocarBtn = document.getElementById('trocarBtn');
    const gradeTableBody = document.getElementById('gradeTable').querySelector('tbody');
    const statusMessage = document.getElementById('statusMessage');
    const aulasSobrantesDiv = document.getElementById('aulasSobrantes');

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
    let selectedAula = null;

    // Função para obter o período de aulas com base nas checkboxes
    function getAulasPeriodo(turma) {
        if (turmasFundamental.includes(turma) && ativarAula6FundamentalCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        if (turmasMedio.includes(turma) && ativarAula6MedioCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        return aulasPeriodoPadrao;
    }

    // --- Funções Auxiliares de Renderização e Lógica do UI ---
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

    function renderizarGrade() {
        gradeTableBody.innerHTML = '';

        diasDaSemana.forEach(dia => {
            const tr = document.createElement('tr');
            const tdDia = document.createElement('td');
            tdDia.textContent = dia;
            tr.appendChild(tdDia);

            todasTurmas.forEach(turma => {
                const tdTurma = document.createElement('td');
                tdTurma.dataset.dia = dia;
                tdTurma.dataset.turma = turma;
                tdTurma.classList.add('grade-cell');

                const aulasPeriodo = getAulasPeriodo(turma);
                
                aulasPeriodo.forEach(aula => {
                    const professorDisciplina = gradeHoraria[dia]?.[aula]?.[turma];
                    if (professorDisciplina) {
                        const [nomeProfessor, disciplina] = professorDisciplina.split(' (');
                        const disciplinaFormatada = disciplina.slice(0, 3);
                        const p = document.createElement('p');
                        p.dataset.aula = aula;
                        p.textContent = `${aula}ª: ${nomeProfessor} (${disciplinaFormatada})`;
                        tdTurma.appendChild(p);
                    }
                });
                
                tr.appendChild(tdTurma);
            });
            gradeTableBody.appendChild(tr);
        });
    }

    function renderizarAulasSobrantes(aulasRestantes) {
        aulasSobrantesDiv.innerHTML = '';
        const aulasFaltantes = Object.values(aulasRestantes).filter(d => d.aulas > 0);
        
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
    
    // ... (o resto das suas funções auxiliares como handleTableClick, podeAlocar, etc.)
    // ... (que não foram alteradas e precisam estar aqui no main.js)
    
    // --- Lógica do Web Worker para o Algoritmo Genético ---
    function iniciarWorkerAlgoritmoGenetico() {
        if (typeof Worker === 'undefined') {
            statusMessage.textContent = 'Seu navegador não suporta Web Workers.';
            statusMessage.style.color = 'red';
            return;
        }

        const myWorker = new Worker('worker.js');
        const NUM_GERACOES = 200;
        const TAMANHO_POPULACAO = 50;
        const POPULACAO_ELITE = 10;
        
        // Envia os dados e parâmetros iniciais para o worker
        myWorker.postMessage({
            tipo: 'iniciar',
            data: {
                professores,
                cargasHorarias,
                params: {
                    NUM_GERACOES,
                    TAMANHO_POPULACAO,
                    POPULACAO_ELITE,
                    ativarFundamental: ativarAula6FundamentalCheckbox.checked,
                    ativarMedio: ativarAula6MedioCheckbox.checked
                }
            }
        });
        
        statusMessage.textContent = 'Gerando grade horária... Por favor, aguarde.';
        statusMessage.style.color = '#1a5cff';

        myWorker.onmessage = (e) => {
            const { type, geracao, melhorFitness, melhorGrade, aulasRestantes } = e.data;
            if (type === 'progress') {
                statusMessage.textContent = `Gerando grade... Geração ${geracao}/${NUM_GERACOES}. Melhor fitness: ${melhorFitness}`;
            } else if (type === 'concluido') {
                gradeHoraria = melhorGrade;
                renderizarGrade();
                renderizarAulasSobrantes(aulasRestantes);
                if (aulasRestantes.length === 0) {
                    statusMessage.textContent = 'Grade horária gerada com sucesso!';
                    statusMessage.style.color = 'green';
                } else {
                    statusMessage.textContent = 'Geração de grade concluída. Não foi possível alocar todas as aulas.';
                    statusMessage.style.color = 'orange';
                }
            }
        };
    }
    
    // As funções que não são do worker, como a de gerar grade aleatória, permanecem aqui
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

        if (aulaAnterior && grade[dia]?.[aulaAnterior]?.[turma]?.includes(professorNome)) {
            return true;
        }
        if (aulaPosterior && grade[dia]?.[aulaPosterior]?.[turma]?.includes(professorNome)) {
            return true;
        }
        return false;
    }
    
    function estaEmOutraTurma(grade, dia, aula, professorNome) {
        return todasTurmas.some(turma => grade[dia]?.[aula]?.[turma]?.includes(professorNome));
    }
    
    function gerarGradeInicial() {
        let grade = {};
        const aulasParaDistribuir = JSON.parse(JSON.stringify(cargasHorarias)); // Clonar para não alterar o original
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
                                    !estaEmOutraTurma(grade, dia, aula, professor.nome) &&
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

    // --- Event Listeners ---
    // ... (Seus event listeners de formulário, botões, etc. não precisam ser alterados)
    professorForm.addEventListener('submit', (e) => {
        // ... (código que você já tinha)
    });
    
    cargaHorariaForm.addEventListener('submit', (e) => {
        // ... (código que você já tinha)
    });

    document.addEventListener('click', (e) => {
        // ... (código que você já tinha)
    });
    
    // Event listeners para a grade
    gerarGradeIABtn.addEventListener('click', iniciarWorkerAlgoritmoGenetico); // <-- Inicia o Web Worker aqui
    novaGradeBtn.addEventListener('click', () => {
        const resultado = gerarGradeInicial();
        gradeHoraria = resultado.grade;
        renderizarGrade();
        renderizarAulasSobrantes(resultado.aulasRestantes);
    });
    
    trocarBtn.addEventListener('click', () => {
        // ... (código que você já tinha)
    });
    
    gradeTableBody.addEventListener('click', handleTableClick);

    // Inicialização
    renderizarProfessores();
    renderizarCargasHorarias();
    
    // ... (o resto das suas funções que não foram alteradas e precisam estar aqui no main.js)
    function handleTableClick(e) {
        // ... (coloque o código da sua função handleTableClick aqui)
    }

    function podeAlocar(professorObj, slotData) {
        // ... (coloque o código da sua função podeAlocar aqui)
    }

    function displayFloatingMessage(message, type, targetElement) {
        // ... (coloque o código da sua função displayFloatingMessage aqui)
    }
});