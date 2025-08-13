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
    
    // NOVOS ELEMENTOS DA BARRA DE PROGRESSO
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');

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
    
    // ... (restante do seu código sem alteração até a função iniciarWorkerAlgoritmoGenetico)

    function getAulasPeriodo(turma) {
        if (turmasFundamental.includes(turma) && ativarAula6FundamentalCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        if (turmasMedio.includes(turma) && ativarAula6MedioCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        return aulasPeriodoPadrao;
    }
    
    // ... (funções de renderização, lógica de swap, etc.)
    // ... (coloque o restante do seu código aqui, sem as funções do worker)

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

        // Envia os dados e parâmetros iniciais para o worker
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
                renderizarGrade();
                renderizarAulasSobrantes(aulasRestantes);

                progressBar.style.width = '100%';
                progressBar.textContent = '100%';

                if (aulasRestantes.length === 0) {
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
    
    // ... (resto do código, incluindo event listeners e inicialização)
    
    // Event listeners para a grade
    gerarGradeIABtn.addEventListener('click', iniciarWorkerAlgoritmoGenetico);
    novaGradeBtn.addEventListener('click', () => {
        const resultado = gerarGradeInicial();
        gradeHoraria = resultado.grade;
        renderizarGrade();
        renderizarAulasSobrantes(resultado.aulasRestantes);
    });
    
    // ... (coloque o restante do seu código aqui)
    
    function handleTableClick(e) {
        // ... (coloque o código da sua função handleTableClick aqui)
    }

    function podeAlocar(professorObj, slotData) {
        // ... (coloque o código da sua função podeAlocar aqui)
    }

    function displayFloatingMessage(message, type, targetElement) {
        // ... (coloque o código da sua função displayFloatingMessage aqui)
    }

    renderizarProfessores();
    renderizarCargasHorarias();
});