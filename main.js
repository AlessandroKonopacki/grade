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
    const gerarGradeBtn = document.getElementById('gerarGradeBtn');
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

    // --- Funções Auxiliares ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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

    function getAulasPeriodo(turma) {
        if (turmasFundamental.includes(turma) && ativarAula6FundamentalCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        if (turmasMedio.includes(turma) && ativarAula6MedioCheckbox.checked) {
            return [2, 3, 4, 5, 6];
        }
        return aulasPeriodoPadrao;
    }

    function handleTableClick(e) {
        if (!swapMode) return;
        
        const targetElement = e.target.closest('p[data-aula]');
        if (!targetElement) return;

        const cell = targetElement.closest('td');
        const getProfessorInfoFromElement = (element) => {
            const text = element.textContent.split(': ')[1];
            const nome = text.split(' (')[0];
            const disciplinaAbreviada = text.split('(')[1].replace(')', '');
            
            const professorObj = professores.find(p => p.nome === nome && p.disciplinas.some(d => d.toLowerCase().startsWith(disciplinaAbreviada.toLowerCase())));

            return {
                nome: professorObj ? professorObj.nome : null,
                disciplina: disciplinaAbreviada
            };
        };

        if (!selectedCell) {
            selectedCell = cell;
            selectedAula = targetElement;
            selectedAula.classList.add('aula-selected');
        } else {
            if (selectedAula === targetElement) {
                selectedAula.classList.remove('aula-selected');
                selectedCell = null;
                selectedAula = null;
                return;
            }

            const prof1 = getProfessorInfoFromElement(selectedAula);
            const prof2 = getProfessorInfoFromElement(targetElement);
            
            const prof1Obj = professores.find(p => p.nome === prof1.nome);
            const prof2Obj = professores.find(p => p.nome === prof2.nome);

            const cell1Data = {
                dia: selectedCell.dataset.dia,
                aula: parseInt(selectedAula.dataset.aula),
                turma: selectedCell.dataset.turma,
                disciplina: prof1.disciplina,
                professorNome: prof1.nome
            };
            const cell2Data = {
                dia: cell.dataset.dia,
                aula: parseInt(targetElement.dataset.aula),
                turma: cell.dataset.turma,
                disciplina: prof2.disciplina,
                professorNome: prof2.nome
            };
            
            const validation1 = podeAlocar(prof1Obj, cell2Data);
            const validation2 = podeAlocar(prof2Obj, cell1Data);

            if (validation1.isValid && validation2.isValid) {
                const professorDisciplina1 = prof1Obj ? `${prof1.nome} (${prof1.disciplina})` : '';
                const professorDisciplina2 = prof2Obj ? `${prof2.nome} (${prof2.disciplina})` : '';

                if (gradeHoraria[cell1Data.dia]?.[cell1Data.aula]) {
                    gradeHoraria[cell1Data.dia][cell1Data.aula][cell1Data.turma] = professorDisciplina2;
                }
                if (gradeHoraria[cell2Data.dia]?.[cell2Data.aula]) {
                    gradeHoraria[cell2Data.dia][cell2Data.aula][cell2Data.turma] = professorDisciplina1;
                }

                renderizarGrade();
                displayFloatingMessage('Troca realizada com sucesso!', 'success', cell);
            } else {
                const errorMessage = !validation1.isValid ? validation1.message : validation2.message;
                displayFloatingMessage(errorMessage, 'error', cell);
            }

            selectedAula.classList.remove('aula-selected');
            selectedCell = null;
            selectedAula = null;
        }
    }

    function displayFloatingMessage(message, type, targetElement) {
        const floatingMessage = document.createElement('div');
        floatingMessage.textContent = message;
        floatingMessage.classList.add('floating-message', `floating-message-${type}`);
        const rect = targetElement.getBoundingClientRect();
        floatingMessage.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        floatingMessage.style.top = `${rect.top + window.scrollY}px`;
        document.body.appendChild(floatingMessage);
        setTimeout(() => {
            floatingMessage.remove();
        }, 3000);
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
    
    function aulasPorDia(grade, dia, professorNome) {
        let count = 0;
        todasTurmas.forEach(turma => {
            getAulasPeriodo(turma).forEach(aula => {
                if (grade[dia]?.[aula]?.[turma]?.includes(professorNome)) {
                    count++;
                }
            });
        });
        return count;
    }

    function estaEmOutraTurma(grade, dia, aula, professorNome) {
        return todasTurmas.some(turma => grade[dia]?.[aula]?.[turma]?.includes(professorNome));
    }

    function podeAlocar(professorObj, slotData) {
        const { nome, nivelEnsino, disponibilidade } = professorObj || {};
        const { dia, aula, turma, disciplina, professorNome } = slotData;
        const grade = gradeHoraria;
        
        if (!nome) return { isValid: true };
        
        const aulasParaTurma = getAulasPeriodo(turma);
        if (!aulasParaTurma.includes(aula)) {
            return { isValid: false, message: `Erro: A 6ª aula não está ativada para a turma ${turma}.` };
        }
        
        if (!disponibilidade.includes(dia)) {
            return { isValid: false, message: `Erro: ${nome} não está disponível na ${dia}.` };
        }
        
        const nivelValido = 
            (nivelEnsino === 'Fundamental' && turmasFundamental.includes(turma)) ||
            (nivelEnsino === 'Medio' && turmasMedio.includes(turma)) ||
            (nivelEnsino === 'Ambos');
        if (!nivelValido) {
            return { isValid: false, message: `Erro: ${nome} não pode lecionar na turma ${turma}.` };
        }

        const conflito = todasTurmas.some(turmaConflito => {
            if (turmaConflito !== turma && grade[dia]?.[aula]?.[turmaConflito]?.includes(nome)) {
                return true;
            }
            return false;
        });
        if (conflito) return { isValid: false, message: `Erro: ${nome} já tem aula em outra turma na ${dia}, ${aula}ª aula.` };
        
        const carga = cargasHorarias.find(c => c.turma === turma && c.disciplina.toLowerCase() === disciplina.toLowerCase() && c.professorNome === professorNome);
        
        if (carga && !carga.aulaGeminada && temAulaConsecutiva(grade, dia, aula, turma, nome)) {
            return { isValid: false, message: `Erro: ${nome} teria aulas consecutivas na ${turma}.` };
        }
        
        return { isValid: true };
    }

    // --- Lógica do Algoritmo Genético ---
    function gerarGradeInicial() {
        let grade = {};
        const aulasParaDistribuir = [...cargasHorarias];
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

    function calcularFitness(grade) {
        let score = 0;
        let aulasAlocadas = 0;
        const aulasTotais = cargasHorarias.reduce((acc, curr) => acc + curr.aulas, 0);

        // Pontuação base: Aulas alocadas
        diasDaSemana.forEach(dia => {
            if (grade[dia]) {
                Object.values(grade[dia]).forEach(aulasPorTurma => {
                    aulasAlocadas += Object.keys(aulasPorTurma).length;
                });
            }
        });
        score += aulasAlocadas * 100;
        
        const aulasRestantes = aulasTotais - aulasAlocadas;
        score -= aulasRestantes * 50;

        // Bônus: Aulas geminadas
        cargasHorarias.filter(c => c.aulaGeminada).forEach(carga => {
            diasDaSemana.forEach(dia => {
                const aulasDoDia = getAulasPeriodo(carga.turma);
                for (let i = 0; i < aulasDoDia.length - 1; i++) {
                    const aulaAtual = aulasDoDia[i];
                    const aulaSeguinte = aulasDoDia[i + 1];
                    const professorDisciplina1 = grade[dia]?.[aulaAtual]?.[carga.turma];
                    const professorDisciplina2 = grade[dia]?.[aulaSeguinte]?.[carga.turma];
                    
                    if (professorDisciplina1 && professorDisciplina2 && professorDisciplina1 === professorDisciplina2) {
                        score += 20;
                    }
                }
            });
        });

        // Bônus: Consolidação de horário
        professores.forEach(prof => {
            diasDaSemana.forEach(dia => {
                const aulasDoProfessorNoDia = [];
                todasTurmas.forEach(turma => {
                    const aulasPeriodo = getAulasPeriodo(turma);
                    aulasPeriodo.forEach(aula => {
                        if (grade[dia]?.[aula]?.[turma]?.includes(prof.nome)) {
                            aulasDoProfessorNoDia.push(aula);
                        }
                    });
                });

                if (aulasDoProfessorNoDia.length > 1) {
                    const minAula = Math.min(...aulasDoProfessorNoDia);
                    const maxAula = Math.max(...aulasDoProfessorNoDia);
                    const totalPeriodo = maxAula - minAula + 1;
                    const aulasReal = aulasDoProfessorNoDia.length;
                    
                    if (totalPeriodo === aulasReal) {
                        score += 10;
                    }
                }
            });
        });

        return score;
    }
    
   async function executarAlgoritmoGenetico() {
    const TAMANHO_POPULACAO = 50;
    const NUM_GERACOES = 200; // Aumentamos as gerações para uma melhor solução
    const POPULACAO_ELITE = 10;
    let populacao = [];

    // Função auxiliar para pausar o script e permitir que o navegador "respire"
    function pausar() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    console.log('%c[IA] Iniciando o Algoritmo Genético...', 'color: green;');
    statusMessage.textContent = 'Gerando grade horária... Por favor, aguarde.';
    statusMessage.style.color = '#1a5cff';

    // Geração da população inicial
    for (let i = 0; i < TAMANHO_POPULACAO; i++) {
        populacao.push(gerarGradeInicial());
    }

    for (let geracao = 0; geracao < NUM_GERACOES; geracao++) {
        // Pausa para o navegador
        await pausar();
        
        // Calcula a aptidão de cada grade
        populacao.forEach(individuo => {
            individuo.fitness = calcularFitness(individuo.grade);
        });
        
        // Ordena a população pelas melhores notas
        populacao.sort((a, b) => b.fitness - a.fitness);

        // Atualiza a interface com o progresso
        statusMessage.textContent = `Gerando grade... Geração ${geracao + 1}/${NUM_GERACOES}. Melhor fitness: ${populacao[0].fitness}`;
        
        // Se a melhor grade já é perfeita (todas as aulas alocadas), para o algoritmo
        if (populacao[0].aulasRestantes.length === 0) {
            console.log(`%c[IA] Solução perfeita encontrada na geração ${geracao + 1}!`, 'color: green;');
            gradeHoraria = populacao[0].grade;
            renderizarGrade();
            renderizarAulasSobrantes(populacao[0].aulasRestantes);
            statusMessage.textContent = 'Grade horária gerada com sucesso!';
            statusMessage.style.color = 'green';
            return;
        }

        // Geração da próxima população
        const novaPopulacao = populacao.slice(0, POPULACAO_ELITE); // Mantém os melhores indivíduos
        while (novaPopulacao.length < TAMANHO_POPULACAO) {
            // Seleciona 2 pais da população atual (os melhores)
            const pai1 = populacao[Math.floor(Math.random() * POPULACAO_ELITE)];
            const pai2 = populacao[Math.floor(Math.random() * POPULACAO_ELITE)];
            
            // Crossover: Cria um novo indivíduo combinando os pais
            const filho = cruzar(pai1.grade, pai2.grade);
            
            // Mutação: Aplica uma pequena mudança aleatória
            const filhoMutado = mutar(filho);
            
            novaPopulacao.push({ grade: filhoMutado, aulasRestantes: {} });
        }
        populacao = novaPopulacao;
    }

    // Após todas as gerações, usa a melhor grade encontrada
    populacao.sort((a, b) => b.fitness - a.fitness);
    gradeHoraria = populacao[0].grade;
    renderizarGrade();
    renderizarAulasSobrantes(populacao[0].aulasRestantes);
    console.log(`%c[IA] Melhor solução encontrada com fitness: ${populacao[0].fitness}`, 'color: #1a5cff;');
    statusMessage.textContent = 'Geração de grade concluída.';
    statusMessage.style.color = '#1a5cff';
}

    function cruzar(grade1, grade2) {
        let novaGrade = {};
        diasDaSemana.forEach((dia, index) => {
            if (index < 3) {
                novaGrade[dia] = grade1[dia];
            } else {
                novaGrade[dia] = grade2[dia];
            }
        });
        return novaGrade;
    }

    function mutar(grade) {
        const dia1 = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
        const turma1 = todasTurmas[Math.floor(Math.random() * todasTurmas.length)];
        const aulasTurma1 = getAulasPeriodo(turma1);
        const aula1 = aulasTurma1[Math.floor(Math.random() * aulasTurma1.length)];
        
        const dia2 = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
        const turma2 = todasTurmas[Math.floor(Math.random() * todasTurmas.length)];
        const aulasTurma2 = getAulasPeriodo(turma2);
        const aula2 = aulasTurma2[Math.floor(Math.random() * aulasTurma2.length)];
        
        if (grade[dia1]?.[aula1]?.[turma1] && grade[dia2]?.[aula2]?.[turma2]) {
            const temp = grade[dia1][aula1][turma1];
            grade[dia1][aula1][turma1] = grade[dia2][aula2][turma2];
            grade[dia2][aula2][turma2] = temp;
        }
        return grade;
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
        const turma = document.getElementById('turmaCarga').value;
        const professorNome = document.getElementById('professorCarga').value;
        const disciplina = document.getElementById('disciplinaCarga').value;
        const aulas = parseInt(document.getElementById('aulasCarga').value);
        const limiteDiario = parseInt(document.getElementById('limiteDiario').value);
        const aulaGeminada = document.getElementById('aulaGeminada').checked;
        
        if (turma && professorNome && disciplina && !isNaN(aulas) && aulas > 0 && !isNaN(limiteDiario) && limiteDiario > 0) {
            const professor = professores.find(p => p.nome === professorNome);
            if (!professor || !professor.disciplinas.includes(disciplina.toLowerCase())) {
                alert(`Erro: O professor ${professorNome} não está cadastrado para a disciplina ${disciplina}.`);
                return;
            }

            const index = cargasHorarias.findIndex(c => c.turma === turma && c.disciplina === disciplina && c.professorNome === professorNome);
            if (index !== -1) {
                cargasHorarias[index].aulas = aulas;
                cargasHorarias[index].limiteDiario = limiteDiario;
                cargasHorarias[index].aulaGeminada = aulaGeminada;
            } else {
                cargasHorarias.push({ turma, professorNome, disciplina: disciplina.toLowerCase(), aulas, limiteDiario, aulaGeminada });
            }
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

    professorCargaSelect.addEventListener('change', () => {
        const nomeProfessor = professorCargaSelect.value;
        if (nomeProfessor) {
            const professor = professores.find(p => p.nome === nomeProfessor);
            disciplinaCargaInput.value = professor.disciplinas.join(', ');
        } else {
            disciplinaCargaInput.value = '';
        }
    });

    ativarAula6FundamentalCheckbox.addEventListener('change', renderizarGrade);
    ativarAula6MedioCheckbox.addEventListener('change', renderizarGrade);

    gerarGradeBtn.addEventListener('click', executarAlgoritmoGenetico);
    novaGradeBtn.addEventListener('click', () => {
        const resultado = gerarGradeInicial();
        gradeHoraria = resultado.grade;
        renderizarGrade();
        renderizarAulasSobrantes(resultado.aulasRestantes);
    });
    
    trocarBtn.addEventListener('click', () => {
        swapMode = !swapMode;
        if (swapMode) {
            trocarBtn.textContent = 'Desativar Troca';
            statusMessage.textContent = 'Modo de troca ativado. Clique em duas AULAS para trocar os professores.';
            statusMessage.style.color = 'blue';
        } else {
            trocarBtn.textContent = 'Ativar Troca de Professores';
            statusMessage.textContent = '';
            if (selectedAula) {
                selectedAula.classList.remove('aula-selected');
                selectedCell = null;
                selectedAula = null;
            }
        }
    });
    
    gradeTableBody.addEventListener('click', handleTableClick);

    // Inicialização
    renderizarProfessores();
    renderizarCargasHorarias();
});