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
            const nomeTurma = document.getElementById('nomeTurma').value;
            if (nomeTurma) {
                turmas.push({ nome: nomeTurma });
                document.getElementById('nomeTurma').value = '';
                renderizarTurmas();
            }
        });

        turmasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.getAttribute('data-index');
                turmas.splice(index, 1);
                renderizarTurmas();
            }
        });

        renderizarTurmas();

        if (concluirTurmasBtn) {
            concluirTurmasBtn.addEventListener('click', () => {
                alert('Cadastro de turmas concluído!');
                window.location.href = 'professores_cargas.html';
            });
        }
    }

    // Lógica da página professores_cargas.html
    const professorForm = document.getElementById('professorForm');
    const professoresList = document.getElementById('professoresList');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const cargasHorariasList = document.getElementById('cargasHorariasList');
    const professorCargaSelect = document.getElementById('professorCargaSelect');
    const turmaCargaSelect = document.getElementById('turmaCargaSelect');
    const concluirProfessoresBtn = document.getElementById('concluirProfessoresBtn');

    if (professorForm && professoresList && cargaHorariaForm && cargasHorariasList) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');

        const renderizarProfessores = () => {
            professoresList.innerHTML = '';
            if (professores.length === 0) {
                professoresList.innerHTML = '<p>Nenhum professor cadastrado.</p>';
            }
            professores.forEach((prof, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${prof.nome} (${prof.disciplinas.join(', ')})
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
            }
            cargasHorarias.forEach((carga, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <b>${carga.disciplina}</b>, ${carga.aulasPorSemana} aulas, ${carga.aulasGeminadas ? 'Geminadas' : 'Não geminadas'}
                    <br>Professor(a): ${carga.professor} | Turma: ${carga.turma}
                    <button class="remover" data-index="${index}">Remover</button>
                `;
                cargasHorariasList.appendChild(li);
            });
            salvarDados('cargasHorarias', cargasHorarias);
        };

        const popularSelects = () => {
            if (professorCargaSelect && turmaCargaSelect) {
                professorCargaSelect.innerHTML = '<option value="">Selecione um professor</option>';
                professores.forEach(prof => {
                    const option = document.createElement('option');
                    option.value = prof.nome;
                    option.textContent = prof.nome;
                    professorCargaSelect.appendChild(option);
                });

                turmaCargaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.nome;
                    option.textContent = turma.nome;
                    turmaCargaSelect.appendChild(option);
                });
            }
        };

        professorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeProfessor = document.getElementById('nomeProfessor').value;
            const disciplinasStr = document.getElementById('disciplinas').value;
            const disponibilidadeStr = document.getElementById('disponibilidade').value;
            const nivelEnsino = document.querySelector('input[name="nivel"]:checked').value;
            
            if (nomeProfessor && disciplinasStr && disponibilidadeStr && nivelEnsino) {
                const disciplinas = disciplinasStr.split(',').map(d => d.trim());
                const disponibilidade = disponibilidadeStr.split(',').map(d => d.trim());
                professores.push({ nome: nomeProfessor, disciplinas, disponibilidade, nivel: nivelEnsino });
                professorForm.reset();
                renderizarProfessores();
                popularSelects();
            }
        });

        professoresList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.getAttribute('data-index');
                professores.splice(index, 1);
                renderizarProfessores();
                popularSelects();
            }
        });

        cargaHorariaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const professor = professorCargaSelect.value;
            const turma = turmaCargaSelect.value;
            const disciplina = document.getElementById('disciplinaCarga').value;
            const aulasPorSemana = parseInt(document.getElementById('aulasPorSemana').value);
            const limiteAulas = parseInt(document.getElementById('limiteAulas').value);
            const aulasGeminadas = document.getElementById('aulasGeminadas').checked;

            if (professor && turma && disciplina && aulasPorSemana && limiteAulas) {
                cargasHorarias.push({ professor, turma, disciplina, aulasPorSemana, limiteAulas, aulasGeminadas });
                cargaHorariaForm.reset();
                renderizarCargasHorarias();
            }
        });

        cargasHorariasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.getAttribute('data-index');
                cargasHorarias.splice(index, 1);
                renderizarCargasHorarias();
            }
        });

        renderizarProfessores();
        renderizarCargasHorarias();
        popularSelects();
        
        if (concluirProfessoresBtn) {
            concluirProfessoresBtn.addEventListener('click', () => {
                alert('Cadastro de professores e cargas horárias concluído!');
                window.location.href = 'grade.html';
            });
        }
    }

    // Lógica da página grade.html
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    const novaGradeBtn = document.getElementById('novaGradeBtn');
    const gradeTable = document.getElementById('gradeTable');
    const aulasSobrantesList = document.getElementById('aulasSobrantesList');
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');

    if (gerarGradeIABtn) {
        let worker;

        const renderizarGrade = (grade) => {
            const tbody = gradeTable.querySelector('tbody');
            tbody.innerHTML = '';
            const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
            const horariosPorDia = 6;
            
            for (let h = 0; h < horariosPorDia; h++) {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = `Aula ${h + 1}`;
                tr.appendChild(th);
                diasSemana.forEach((dia, d) => {
                    const td = document.createElement('td');
                    const aula = grade[d][h];
                    if (aula) {
                        td.innerHTML = `<b>${aula.turma}</b><br>${aula.disciplina}<br><small>${aula.professor}</small>`;
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            }
        };

        const renderizarAulasSobrantes = (aulasSobrantes) => {
            aulasSobrantesList.innerHTML = '';
            if (aulasSobrantes.length > 0) {
                aulasSobrantes.forEach(aula => {
                    const li = document.createElement('li');
                    li.textContent = `Turma: ${aula.turma}, Disciplina: ${aula.disciplina}, Professor: ${aula.professor}`;
                    aulasSobrantesList.appendChild(li);
                });
            } else {
                aulasSobrantesList.innerHTML = '<p>Nenhuma aula sobrou! Grade perfeitamente gerada.</p>';
            }
        };

        gerarGradeIABtn.addEventListener('click', () => {
            const numGeracoes = parseInt(document.getElementById('numGeracoes').value);
            const tamanhoPopulacao = parseInt(document.getElementById('tamanhoPopulacao').value);
            const taxaMutacao = parseFloat(document.getElementById('taxaMutacao').value);

            const parametros = {
                numGeracoes,
                tamanhoPopulacao,
                taxaMutacao
            };

            const professores = carregarDados('professores');
            const cargasHorarias = carregarDados('cargasHorarias');
            const turmas = carregarDados('turmas');

            if (professores.length === 0 || cargasHorarias.length === 0 || turmas.length === 0) {
                alert('Por favor, cadastre turmas, professores e cargas horárias antes de gerar a grade.');
                return;
            }
            
            gerarGradeIABtn.disabled = true;
            novaGradeBtn.disabled = true;
            progressBarContainer.style.display = 'flex';
            progressBar.style.width = '0%';
            progressText.textContent = 'Gerando...';

            if (window.Worker) {
                if (worker) {
                    worker.terminate();
                }
                worker = new Worker('worker.js');

                // Envia dados para o worker
                worker.postMessage({ professores, cargasHorarias, turmas, parametros });
            } else {
                console.error("Web Workers não são suportados neste navegador.");
            }

            worker.onmessage = (e) => {
                if (e.data.status === 'progresso') {
                    progressBar.style.width = `${e.data.progresso}%`;
                    progressText.textContent = `Gerando... (${e.data.progresso}%)`;
                } else if (e.data.status === 'completo') {
                    progressBar.style.width = '100%';
                    progressText.textContent = 'Completo!';
                    renderizarGrade(e.data.grade);
                    renderizarAulasSobrantes(e.data.aulasSobrantes);

                    salvarDados('gradeAnterior', e.data.grade);
                    salvarDados('aulasSobrantesAnterior', e.data.aulasSobrantes);

                    gerarGradeIABtn.disabled = false;
                    novaGradeBtn.disabled = false;
                    worker.terminate();
                }
            };

            worker.onerror = (e) => {
                console.error("Erro no Worker:", e.message);
                progressText.textContent = 'Erro na Geração.';
                gerarGradeIABtn.disabled = false;
                novaGradeBtn.disabled = false;
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