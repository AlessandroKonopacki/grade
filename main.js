document.addEventListener('DOMContentLoaded', () => {
    const professorForm = document.getElementById('professorForm');
    const professoresList = document.getElementById('professoresList');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const cargaHorariaList = document.getElementById('cargaHorariaList');
    const gerarGradeBtn = document.getElementById('gerarGradeBtn');
    const novaGradeBtn = document.getElementById('novaGradeBtn');
    const trocarBtn = document.getElementById('trocarBtn');
    const gradeTableBody = document.getElementById('gradeTable').querySelector('tbody');
    const statusMessage = document.getElementById('statusMessage');
    const aulasSobrantesDiv = document.getElementById('aulasSobrantes');

    const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const aulasPorDia = 5;
    const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
    const turmasMedio = ['1º EM', '2º EM', '3º EM'];
    const todasTurmas = [...turmasFundamental, ...turmasMedio];

    let professores = JSON.parse(localStorage.getItem('professores')) || [];
    let cargasHorarias = JSON.parse(localStorage.getItem('cargasHorarias')) || [];
    let gradeHoraria = {};
    let swapMode = false;
    let selectedCell = null;

    // Função auxiliar para embaralhar um array (algoritmo de Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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
                    tdProfessor.dataset.dia = dia;
                    tdProfessor.dataset.aula = i;
                    tdProfessor.dataset.turma = turma;
                    const professor = gradeHoraria[dia]?.[i]?.[turma] || '';
                    tdProfessor.textContent = professor;
                    tr.appendChild(tdProfessor);
                });
                gradeTableBody.appendChild(tr);
            }
        });
    }

    // NOVA FUNÇÃO: Renderiza as aulas que não puderam ser alocadas
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
                li.textContent = `${aula.professor.disciplina} na turma ${aula.turma} - ${aula.aulas} aula(s) restante(s).`;
                lista.appendChild(li);
            });
            aulasSobrantesDiv.appendChild(lista);
        } else {
            const mensagem = document.createElement('p');
            mensagem.textContent = 'Todas as aulas foram alocadas com sucesso.';
            aulasSobrantesDiv.appendChild(mensagem);
        }
    }

    // Função principal para o algoritmo de distribuição
    function distribuirAulas(shuffle = false) {
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
                limiteDiario: carga.limiteDiario,
                professor: professor,
                turma: carga.turma // Adiciona a turma para a nova função
            };
        });

        let aulasArray = Object.keys(aulasRestantes).map(key => ({ chave: key, ...aulasRestantes[key] }));
        if (shuffle) {
            shuffleArray(aulasArray);
        }
        
        todasTurmas.forEach(turma => {
            aulasPorDisciplinaDia[turma] = {};
            diasDaSemana.forEach(dia => {
                aulasPorDisciplinaDia[turma][dia] = {};
            });
        });

        for (const dia of diasDaSemana) {
            for (let i = 1; i <= aulasPorDia; i++) {
                for (const turma of todasTurmas) {
                    for (const aula of aulasArray) {
                        const { aulas, limiteDiario, professor, chave } = aula;
                        const [turmaCarga, disciplinaCarga] = chave.split('-');

                        if (turmaCarga !== turma) continue;
                        if (aulas <= 0) continue;

                        const aulasHoje = aulasPorDisciplinaDia[turma][dia][disciplinaCarga] || 0;
                        const podeTerMaisAulasHoje = aulasHoje < limiteDiario;

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
                            break;
                        }
                    }
                }
            }
        }

        const aulasFaltantes = Object.values(aulasRestantes).some(d => d.aulas > 0);
        if (aulasFaltantes) {
            statusMessage.textContent = 'Não foi possível alocar todas as aulas. Verifique as disponibilidades e cargas horárias. Uma lista das aulas restantes foi gerada abaixo.';
            statusMessage.style.color = 'red';
        } else {
            statusMessage.textContent = 'Grade horária gerada com sucesso!';
            statusMessage.style.color = 'green';
        }
        renderizarGrade();
        renderizarAulasSobrantes(aulasRestantes); // Chama a nova função
    }
    
    // Ferramenta de troca de professores
    function handleTableClick(e) {
        if (!swapMode) return;

        const cell = e.target.closest('td[data-turma]');
        if (!cell) return;

        if (!selectedCell) {
            selectedCell = cell;
            cell.classList.add('grade-cell-selected');
        } else {
            if (selectedCell === cell) {
                selectedCell.classList.remove('grade-cell-selected');
                selectedCell = null;
                return;
            }

            const cell1Data = {
                dia: selectedCell.dataset.dia,
                aula: selectedCell.dataset.aula,
                turma: selectedCell.dataset.turma,
                professorDisciplina: selectedCell.textContent
            };

            const cell2Data = {
                dia: cell.dataset.dia,
                aula: cell.dataset.aula,
                turma: cell.dataset.turma,
                professorDisciplina: cell.textContent
            };

            const getProfessorInfo = (text) => {
                if (!text) return { nome: '', disciplina: '' };
                const match = text.match(/(.*)\s\((.*)\)/);
                return match ? { nome: match[1], disciplina: match[2].toLowerCase() } : { nome: text, disciplina: '' };
            };
            
            const prof1 = getProfessorInfo(cell1Data.professorDisciplina);
            const prof2 = getProfessorInfo(cell2Data.professorDisciplina);

            const prof1Obj = professores.find(p => p.nome === prof1.nome);
            const prof2Obj = professores.find(p => p.nome === prof2.nome);

            const validation1 = podeAlocar(prof1Obj, cell2Data);
            const validation2 = podeAlocar(prof2Obj, cell1Data);
            
            if (validation1.isValid && validation2.isValid) {
                gradeHoraria[cell1Data.dia][cell1Data.aula][cell1Data.turma] = cell2Data.professorDisciplina;
                gradeHoraria[cell2Data.dia][cell2Data.aula][cell2Data.turma] = cell1Data.professorDisciplina;
                
                selectedCell.textContent = cell2Data.professorDisciplina;
                cell.textContent = cell1Data.professorDisciplina;
                
                displayFloatingMessage('Troca realizada com sucesso!', 'success', cell);

            } else {
                const errorMessage = !validation1.isValid ? validation1.message : validation2.message;
                displayFloatingMessage(errorMessage, 'error', cell);
            }

            selectedCell.classList.remove('grade-cell-selected');
            selectedCell = null;
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

    function podeAlocar(professorObj, slotData) {
        let message = '';
        const { nome, nivelEnsino, disponibilidade } = professorObj || {};
        const { dia, aula, turma } = slotData;

        if (!nome) return { isValid: true };
        
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
            if (turmaConflito !== turma && gradeHoraria[dia]?.[aula]?.[turmaConflito]?.includes(nome)) {
                message = `Erro: ${nome} já tem aula na ${turmaConflito} na ${dia}, ${aula}ª aula.`;
                return true;
            }
            return false;
        });
        if (conflito) return { isValid: false, message: message };

        const aulaAnterior = gradeHoraria[dia]?.[parseInt(aula) - 1]?.[turma];
        const aulaPosterior = gradeHoraria[dia]?.[parseInt(aula) + 1]?.[turma];
        if ((aulaAnterior && aulaAnterior.includes(nome)) || (aulaPosterior && aulaPosterior.includes(nome))) {
            return { isValid: false, message: `Erro: ${nome} teria aulas consecutivas na ${turma}.` };
        }
        
        return { isValid: true };
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

    gerarGradeBtn.addEventListener('click', () => distribuirAulas(false));
    novaGradeBtn.addEventListener('click', () => distribuirAulas(true));
    trocarBtn.addEventListener('click', () => {
        swapMode = !swapMode;
        if (swapMode) {
            trocarBtn.textContent = 'Desativar Troca';
            statusMessage.textContent = 'Modo de troca ativado. Clique em duas células para trocar os professores.';
            statusMessage.style.color = 'blue';
        } else {
            trocarBtn.textContent = 'Ativar Troca de Professores';
            statusMessage.textContent = '';
            if (selectedCell) {
                selectedCell.classList.remove('grade-cell-selected');
                selectedCell = null;
            }
        }
    });
    
    gradeTableBody.addEventListener('click', handleTableClick);

    // Inicialização
    renderizarProfessores();
    renderizarCargasHorarias();
    renderizarGrade();
});