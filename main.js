// main.js - Código reestruturado e corrigido para a nova arquitetura
document.addEventListener('DOMContentLoaded', () => {

    const carregarDados = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const salvarDados = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // Lógica da página de turmas.html
    const turmaForm = document.getElementById('turmaForm');
    const turmasList = document.getElementById('turmasList');
    const concluirTurmasBtn = document.getElementById('concluirTurmasBtn');

    if (turmaForm && turmasList) {
        let turmas = carregarDados('turmas');

        const renderizarTurmas = () => {
            turmasList.innerHTML = '';
            if (turmas.length === 0) {
                turmasList.innerHTML = '<p>Nenhuma turma cadastrada.</p>';
                return;
            }
            turmas.forEach((turma, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${turma.nome}
                    <button class="remover" data-index="${index}">Remover</button>
                `;
                turmasList.appendChild(li);
            });
            salvarDados('turmas', turmas);
        };

        turmaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeTurma = document.getElementById('nomeTurma').value.trim();
            if (nomeTurma) {
                if (turmas.some(t => t.nome === nomeTurma)) {
                    alert('Esta turma já existe.');
                    return;
                }
                turmas.push({ nome: nomeTurma });
                turmaForm.reset();
                renderizarTurmas();
            }
        });

        turmasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.dataset.index;
                turmas.splice(index, 1);
                renderizarTurmas();
            }
        });

        renderizarTurmas();

        if (concluirTurmasBtn) {
            concluirTurmasBtn.addEventListener('click', () => {
                window.location.href = 'professores_cargas.html';
            });
        }
    }

    // Lógica da página de professores_cargas.html
    const professorForm = document.getElementById('professorForm');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const professoresList = document.getElementById('professoresList');
    const cargasHorariasList = document.getElementById('cargasHorariasList');
    const professorCargaSelect = document.getElementById('professorCargaSelect');
    const turmaCargaSelect = document.getElementById('turmaCargaSelect');
    const disciplinasInput = document.getElementById('disciplinas');
    const concluirProfessoresBtn = document.getElementById('concluirProfessoresBtn');

    if (professorForm && cargaHorariaForm) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');

        const renderizarProfessores = () => {
            professoresList.innerHTML = '';
            if (professores.length === 0) {
                professoresList.innerHTML = '<p>Nenhum professor cadastrado.</p>';
                return;
            }
            professores.forEach((professor, index) => {
                // CORREÇÃO: Adicionando a exibição da disponibilidade
                const disponibilidade = professor.disponibilidade.length > 0
                    ? `Disponibilidade: ${professor.disponibilidade.join(', ')}`
                    : 'Disponibilidade: Nenhuma selecionada';

                const li = document.createElement('li');
                li.innerHTML = `
            ${professor.nome} - Disciplinas: ${professor.disciplinas} (${professor.nivel}) <br>
            <span>${disponibilidade}</span>
            <button class="remover" data-index="${index}">Remover</button>
        `;
                professoresList.appendChild(li);
            });
            salvarDados('professores', professores);
        };

        const renderizarCargasHorarias = () => {
            cargasHorariasList.innerHTML = '';
            if (cargasHorarias.length === 0) {
                cargasHorariasList.innerHTML = '<p>Nenhuma carga horária cadastrada.</p>';
                return;
            }
            cargasHorarias.forEach((carga, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${carga.professorNome} - ${carga.disciplina} em ${carga.turma} (${carga.aulasPorSemana} aulas)
                    <button class="remover" data-index="${index}">Remover</button>
                `;
                cargasHorariasList.appendChild(li);
            });
            salvarDados('cargasHorarias', cargasHorarias);
        };

        const popularSelects = () => {
            professorCargaSelect.innerHTML = '<option value="">Selecione um professor</option>';
            professores.forEach(p => {
                const option = document.createElement('option');
                option.value = p.nome;
                option.textContent = p.nome;
                professorCargaSelect.appendChild(option);
            });

            turmaCargaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
            turmas.forEach(t => {
                const option = document.createElement('option');
                option.value = t.nome;
                option.textContent = t.nome;
                turmaCargaSelect.appendChild(option);
            });
        };

        professorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeProfessor = document.getElementById('nomeProfessor').value.trim();
            const disciplinas = document.getElementById('disciplinas').value.trim();
            const nivelElement = document.querySelector('input[name="nivel"]:checked');
            const disponibilidade = Array.from(document.querySelectorAll('#disponibilidade input:checked')).map(cb => cb.value);

            if (nomeProfessor && disciplinas && nivelElement) {
                const nivel = nivelElement.value;
                professores.push({ nome: nomeProfessor, disciplinas, nivel, disponibilidade });
                professorForm.reset();
                renderizarProfessores();
                popularSelects();
            } else {
                alert('Por favor, preencha todos os campos e selecione o nível de ensino.');
            }
        });

        professoresList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.dataset.index;
                professores.splice(index, 1);
                renderizarProfessores();
                popularSelects();
            }
        });

        cargaHorariaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const professorNome = professorCargaSelect.value;
            const turma = turmaCargaSelect.value;
            const disciplina = document.getElementById('disciplinaCarga').value;
            const aulasPorSemana = parseInt(document.getElementById('aulasPorSemana').value, 10);
            const limiteAulas = parseInt(document.getElementById('limiteAulas').value, 10);
            const aulasGeminadas = document.getElementById('aulasGeminadas').checked;

            if (professorNome && turma && disciplina && aulasPorSemana > 0 && limiteAulas > 0) {
                cargasHorarias.push({
                    professorNome,
                    turma,
                    disciplina,
                    aulasPorSemana,
                    limiteAulas,
                    aulasGeminadas
                });
                cargaHorariaForm.reset();
                renderizarCargasHorarias();
            }
        });

        cargasHorariasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.dataset.index;
                cargasHorarias.splice(index, 1);
                renderizarCargasHorarias();
            }
        });

        renderizarProfessores();
        renderizarCargasHorarias();
        popularSelects();

        if (concluirProfessoresBtn) {
            concluirProfessoresBtn.addEventListener('click', () => {
                window.location.href = 'grade.html';
            });
        }
    }

    // Lógica da página da grade.html
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    const gradeTable = document.getElementById('gradeTable');
    const aulasSobrantesList = document.getElementById('aulasSobrantesList');
    const novaGradeBtn = document.getElementById('novaGradeBtn');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (gerarGradeIABtn) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');

        const renderizarGrade = (grade) => {
            gradeTable.querySelector('tbody').innerHTML = '';
            turmas.forEach(turma => {
                const row = gradeTable.querySelector('tbody').insertRow();
                row.insertCell(0).textContent = turma.nome;
                for (let dia = 1; dia <= 5; dia++) {
                    const cell = row.insertCell(dia);
                    for (let hora = 1; hora <= 6; hora++) {
                        const aula = grade[turma.nome][`${dia}-${hora}`];
                        if (aula) {
                            const aulaDiv = document.createElement('div');
                            aulaDiv.className = 'aula';
                            aulaDiv.innerHTML = `
                                <b>${aula.disciplina}</b><br>
                                <span>${aula.professor}</span>
                            `;
                            cell.appendChild(aulaDiv);
                        }
                    }
                }
            });
        };

        const renderizarAulasSobrantes = (aulas) => {
            aulasSobrantesList.innerHTML = '';
            if (aulas.length === 0) {
                aulasSobrantesList.innerHTML = '<p>Nenhuma aula sobrante.</p>';
                return;
            }
            aulas.forEach(aula => {
                const li = document.createElement('li');
                li.textContent = `${aula.disciplina} - Professor: ${aula.professorNome} - Turma: ${aula.turma}`;
                aulasSobrantesList.appendChild(li);
            });
        };

        gerarGradeIABtn.addEventListener('click', () => {
            gerarGradeIABtn.disabled = true;
            novaGradeBtn.disabled = true;

            progressBarContainer.style.display = 'flex';
            progressBar.style.width = '0%';
            progressText.textContent = 'Gerando...';

            // ATENÇÃO: Valores reduzidos para melhorar a performance.
            // Ajuste conforme sua necessidade, sabendo que valores menores
            // geram resultados mais rápido, mas podem ser menos otimizados.
            const parametros = {
                numGeracoes: 50, // Valor original era 1000, reduzido para 50
                tamanhoPopulacao: 10, // Valor original era 100, reduzido para 10
                taxaMutacao: parseFloat(document.getElementById('taxaMutacao').value),
            };

            const worker = new Worker('worker.js');

            const gradeAnterior = carregarDados('gradeAnterior');
            if (gradeAnterior) {
                const usarGradeAnterior = confirm('Encontrada uma grade anterior. Deseja usar ela como base para a nova grade?');
                if (usarGradeAnterior) {
                    worker.postMessage({ professores, cargasHorarias, turmas, parametros, gradeAnterior });
                } else {
                    worker.postMessage({ professores, cargasHorarias, turmas, parametros });
                }
            } else {
                worker.postMessage({ professores, cargasHorarias, turmas, parametros });
            }


            worker.onmessage = (e) => {
                if (e.data.status === 'progresso') {
                    progressBar.style.width = `${e.data.progresso}%`;
                } else if (e.data.status === 'completo') {
                    progressBar.style.width = '100%';
                    progressText.textContent = 'Completo!';
                    renderizarGrade(e.data.grade);
                    renderizarAulasSobrantes(e.data.aulasSobrantes);

                    salvarDados('gradeAnterior', e.data.grade);
                    salvarDados('aulasSobrantesAnterior', e.data.aulasSobrantes);

                    gerarGradeIABtn.disabled = false;
                    novaGradeBtn.disabled = false;
                }
            };
        });

        novaGradeBtn.addEventListener('click', () => {
            gradeTable.querySelector('tbody').innerHTML = '';
            aulasSobrantesList.innerHTML = '';
            progressBarContainer.style.display = 'none';
        });

        const gradeSalva = carregarDados('gradeAnterior');
        const aulasSalvas = carregarDados('aulasSobrantesAnterior');
        if (gradeSalva && aulasSalvas) {
            renderizarGrade(gradeSalva);
            renderizarAulasSobrantes(aulasSalvas);
        }
    }
});