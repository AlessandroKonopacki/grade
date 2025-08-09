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

    const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const aulasPorDia = 5;
    const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
    const turmasMedio = ['1º EM', '2º EM', '3º EM'];
    const todasTurmas = [...turmasFundamental, ...turmasMedio];

  // ATENÇÃO: Substitua as suas variáveis 'professores' e 'cargasHorarias' por este código para realizar o teste.
// Estes dados foram extraídos da imagem fornecida, com base nas restrições e regras do programa.
// Nível de Ensino: Inferido a partir das turmas que cada professor leciona.
// Disponibilidade: Dias com "X" na imagem foram considerados indisponíveis.
// Limite de Aulas/Dia: Definido em 2 para disciplinas com mais de 2 aulas semanais e 1 para as demais, por padrão pedagógico.

let professores = [
    { nome: "Prof. de Arte", disciplina: "arte", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Biologia 1", disciplina: "biologia 1", nivelEnsino: "Medio", disponibilidade: ["Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Biologia 2", disciplina: "biologia 2", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Biologia", disciplina: "biologia", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Ciências", disciplina: "ciencias", nivelEnsino: "Fundamental", disponibilidade: ["Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Ed. Física", disciplina: "educacao fisica", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Ensino Religioso", disciplina: "ensino religioso", nivelEnsino: "Fundamental", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Filosofia", disciplina: "filosofia", nivelEnsino: "Medio", disponibilidade: ["Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Física 1", disciplina: "fisica 1", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Física 2", disciplina: "fisica 2", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Geografia", disciplina: "geografia", nivelEnsino: "Ambos", disponibilidade: ["Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de História", disciplina: "historia", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta"] },
    { nome: "Prof. de Espanhol", disciplina: "espanhol", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Inglês", disciplina: "ingles", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Português", disciplina: "portugues", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Matemática", disciplina: "matematica", nivelEnsino: "Ambos", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Matemática 1", disciplina: "matematica 1", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Matemática 2", disciplina: "matematica 2", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Química 1", disciplina: "quimica 1", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Química 2", disciplina: "quimica 2", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] },
    { nome: "Prof. de Sociologia", disciplina: "sociologia", nivelEnsino: "Medio", disponibilidade: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] }
];

let cargasHorarias = [
    { turma: "6º ano", disciplina: "arte", aulas: 2, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "ciencias", aulas: 3, limiteDiario: 2 },
    { turma: "6º ano", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "ensino religioso", aulas: 1, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "geografia", aulas: 2, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "6º ano", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "6º ano", disciplina: "matematica", aulas: 5, limiteDiario: 2 },

    { turma: "7º ano", disciplina: "arte", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "ciencias", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "ensino religioso", aulas: 1, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "geografia", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "7º ano", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "7º ano", disciplina: "matematica", aulas: 5, limiteDiario: 2 },

    { turma: "8º ano", disciplina: "ciencias", aulas: 2, limiteDiario: 1 },
    { turma: "8º ano", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "8º ano", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "8º ano", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "8º ano", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "8º ano", disciplina: "matematica", aulas: 5, limiteDiario: 2 },

    { turma: "9º ano", disciplina: "ciencias", aulas: 2, limiteDiario: 1 },
    { turma: "9º ano", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "9º ano", disciplina: "geografia", aulas: 2, limiteDiario: 1 },
    { turma: "9º ano", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "9º ano", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "9º ano", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "9º ano", disciplina: "matematica", aulas: 5, limiteDiario: 2 },

    { turma: "1º EM", disciplina: "biologia", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "espanhol", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "filosofia", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "fisica 1", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "geografia", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "1º EM", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "1º EM", disciplina: "matematica", aulas: 5, limiteDiario: 2 },

    { turma: "2º EM", disciplina: "arte", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "biologia 1", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "espanhol", aulas: 1, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "filosofia", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "fisica 1", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "geografia", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "2º EM", disciplina: "matematica 1", aulas: 2, limiteDiario: 1 },
    { turma: "2º EM", disciplina: "matematica 2", aulas: 3, limiteDiario: 2 },
    { turma: "2º EM", disciplina: "quimica 1", aulas: 2, limiteDiario: 1 },

    { turma: "3º EM", disciplina: "arte", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "biologia 2", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "educacao fisica", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "fisica 2", aulas: 3, limiteDiario: 2 },
    { turma: "3º EM", disciplina: "historia", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "ingles", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "portugues", aulas: 3, limiteDiario: 2 },
    { turma: "3º EM", disciplina: "quimica 2", aulas: 2, limiteDiario: 1 },
    { turma: "3º EM", disciplina: "sociologia", aulas: 2, limiteDiario: 1 },
];
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
                professor: professor
            };
        });

        // Converte o objeto aulasRestantes para um array para poder embaralhar
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
                            break; // Sai do loop de aulas e tenta preencher o próximo slot
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

            // Extrai nome do professor e disciplina
            const getProfessorInfo = (text) => {
                if (!text) return { nome: '', disciplina: '' };
                const match = text.match(/(.*)\s\((.*)\)/);
                return match ? { nome: match[1], disciplina: match[2].toLowerCase() } : { nome: text, disciplina: '' };
            };
            
            const prof1 = getProfessorInfo(cell1Data.professorDisciplina);
            const prof2 = getProfessorInfo(cell2Data.professorDisciplina);

            const prof1Obj = professores.find(p => p.nome === prof1.nome);
            const prof2Obj = professores.find(p => p.nome === prof2.nome);
            
            // Lógica de validação da troca
            const isValidSwap = (prof1ToMove, prof2ToMove) => {
                // Checa se o prof1 pode ir para o lugar do prof2
                if (prof1ToMove.nome && !podeAlocar(prof1ToMove, cell2Data)) return false;
                // Checa se o prof2 pode ir para o lugar do prof1
                if (prof2ToMove.nome && !podeAlocar(prof2ToMove, cell1Data)) return false;

                return true;
            };

            const podeAlocar = (professorObj, slotData) => {
                // Se não há professor para alocar, é sempre válido
                if (!professorObj || !professorObj.nome) return true;
                
                // Verifica a disponibilidade
                if (!professorObj.disponibilidade.includes(slotData.dia)) {
                    statusMessage.textContent = `Erro: ${professorObj.nome} não está disponível na ${slotData.dia}.`;
                    statusMessage.style.color = 'red';
                    return false;
                }
                
                // Verifica o nível de ensino
                const nivelValido = 
                    (professorObj.nivelEnsino === 'Fundamental' && turmasFundamental.includes(slotData.turma)) ||
                    (professorObj.nivelEnsino === 'Medio' && turmasMedio.includes(slotData.turma)) ||
                    (professorObj.nivelEnsino === 'Ambos');
                if (!nivelValido) {
                    statusMessage.textContent = `Erro: ${professorObj.nome} não pode lecionar na turma ${slotData.turma}.`;
                    statusMessage.style.color = 'red';
                    return false;
                }

                // Verifica conflito de horário
                const conflito = todasTurmas.some(turma => {
                    if (turma !== slotData.turma && gradeHoraria[slotData.dia]?.[slotData.aula]?.[turma]?.includes(professorObj.nome)) {
                        statusMessage.textContent = `Erro: ${professorObj.nome} já tem aula na ${turma} na ${slotData.dia}, ${slotData.aula}ª aula.`;
                        statusMessage.style.color = 'red';
                        return true;
                    }
                    return false;
                });
                if (conflito) return false;

                // Verifica aulas consecutivas
                const aulaAnterior = gradeHoraria[slotData.dia]?.[parseInt(slotData.aula) - 1]?.[slotData.turma];
                const aulaPosterior = gradeHoraria[slotData.dia]?.[parseInt(slotData.aula) + 1]?.[slotData.turma];
                if ((aulaAnterior && aulaAnterior.includes(professorObj.nome)) || (aulaPosterior && aulaPosterior.includes(professorObj.nome))) {
                    statusMessage.textContent = `Erro: ${professorObj.nome} teria aulas consecutivas na ${slotData.turma}.`;
                    statusMessage.style.color = 'red';
                    return false;
                }
                
                return true;
            };

            // Tenta a troca
            if (isValidSwap(prof1Obj, prof2Obj)) {
                // Atualiza o objeto gradeHoraria
                gradeHoraria[cell1Data.dia][cell1Data.aula][cell1Data.turma] = cell2Data.professorDisciplina;
                gradeHoraria[cell2Data.dia][cell2Data.aula][cell2Data.turma] = cell1Data.professorDisciplina;
                
                // Atualiza a interface
                selectedCell.textContent = cell2Data.professorDisciplina;
                cell.textContent = cell1Data.professorDisciplina;
                
                statusMessage.textContent = 'Troca realizada com sucesso!';
                statusMessage.style.color = 'green';
            }

            // Limpa a seleção
            selectedCell.classList.remove('grade-cell-selected');
            selectedCell = null;
        }
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

    // Novos event listeners para os botões de ação
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