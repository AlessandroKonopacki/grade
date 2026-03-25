document.addEventListener('DOMContentLoaded', () => {

    // ===============================
    // 📦 STORAGE
    // ===============================
    const carregarDados = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    };

    const salvarDados = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // ===============================
    // 🏫 TURMAS
    // ===============================
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

            const nomeTurmaInput = document.getElementById('nomeTurma');
            const nomeTurma = nomeTurmaInput.value.trim();

            if (!nomeTurma) return;

            // evitar duplicados
            if (turmas.some(t => t.nome === nomeTurma)) {
                alert("Turma já cadastrada!");
                return;
            }

            turmas.push({ nome: nomeTurma });
            nomeTurmaInput.value = '';

            renderizarTurmas();
        });

        turmasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = Number(e.target.dataset.index);
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

    // ===============================
    // 👨‍🏫 PROFESSORES + CARGAS
    // ===============================
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
                return;
            }

            professores.forEach((prof, index) => {
                const li = document.createElement('li');

                li.innerHTML = `
                    <b>${prof.nome}</b>
                    <br>Disciplinas: ${prof.disciplinas.join(', ')}
                    <br>Disponibilidade: ${prof.disponibilidade.join(', ')}
                    <br>Nível: ${prof.nivel.join(', ')}
                    <button class="remover" data-index="${index}">Remover</button>
                `;

                professoresList.appendChild(li);
            });

            salvarDados('professores', professores);
        };

        const renderizarCargas = () => {
            cargasHorariasList.innerHTML = '';

            if (cargasHorarias.length === 0) {
                cargasHorariasList.innerHTML = '<p>Nenhuma carga cadastrada.</p>';
                return;
            }

            cargasHorarias.forEach((carga, index) => {
                const li = document.createElement('li');

                li.innerHTML = `
                    <b>${carga.disciplina}</b> (${carga.aulasPorSemana} aulas)
                    <br>${carga.professor} - ${carga.turma}
                    <button class="remover" data-index="${index}">Remover</button>
                `;

                cargasHorariasList.appendChild(li);
            });

            salvarDados('cargasHorarias', cargasHorarias);
        };

        const popularSelects = () => {

            if (!professorCargaSelect || !turmaCargaSelect) return;

            professorCargaSelect.innerHTML = '<option value="">Selecione</option>';
            turmaCargaSelect.innerHTML = '<option value="">Selecione</option>';

            professores.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.nome;
                opt.textContent = p.nome;
                professorCargaSelect.appendChild(opt);
            });

            turmas.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.nome;
                opt.textContent = t.nome;
                turmaCargaSelect.appendChild(opt);
            });
        };

        professorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nome = document.getElementById('nomeProfessor').value.trim();
            const disciplinasStr = document.getElementById('disciplinas').value;

            const disponibilidade = [...document.querySelectorAll('input[name="disponibilidade"]:checked')]
                .map(cb => cb.value);

            const niveis = [...document.querySelectorAll('input[name="nivel"]:checked')]
                .map(cb => cb.value);

            if (!nome || !disciplinasStr || disponibilidade.length === 0 || niveis.length === 0) {
                alert("Preencha todos os campos!");
                return;
            }

            if (professores.some(p => p.nome === nome)) {
                alert("Professor já existe!");
                return;
            }

            const disciplinas = disciplinasStr.split(',').map(d => d.trim());

            professores.push({
                nome,
                disciplinas,
                disponibilidade,
                nivel: niveis
            });

            professorForm.reset();

            renderizarProfessores();
            popularSelects();
        });

        professoresList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = Number(e.target.dataset.index);
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
            const aulas = parseInt(document.getElementById('aulasPorSemana').value);
            const limite = parseInt(document.getElementById('limiteAulas').value);
            const geminadas = document.getElementById('aulasGeminadas').checked;

            if (!professor || !turma || !disciplina || isNaN(aulas) || isNaN(limite)) {
                alert("Preencha corretamente!");
                return;
            }

            cargasHorarias.push({
                professor,
                turma,
                disciplina,
                aulasPorSemana: aulas,
                limiteAulas: limite,
                aulasGeminadas: geminadas
            });

            cargaHorariaForm.reset();
            renderizarCargas();
        });

        cargasHorariasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = Number(e.target.dataset.index);
                cargasHorarias.splice(index, 1);
                renderizarCargas();
            }
        });

        renderizarProfessores();
        renderizarCargas();
        popularSelects();

        if (concluirProfessoresBtn) {
            concluirProfessoresBtn.addEventListener('click', () => {
                alert('Cadastro concluído!');
                window.location.href = 'grade.html';
            });
        }
    }

    // ===============================
    // 📊 GRADE (IA)
    // ===============================
    const gerarBtn = document.getElementById('gerarGradeIABtn');
    const novaBtn = document.getElementById('novaGradeBtn');
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.querySelector('.progress-text');
    const progressContainer = document.querySelector('.progress-bar-container');

    if (gerarBtn) {

        let worker;

        gerarBtn.addEventListener('click', () => {

            const professores = carregarDados('professores');
            const cargas = carregarDados('cargasHorarias');
            const turmas = carregarDados('turmas');

            if (!professores.length || !cargas.length || !turmas.length) {
                alert("Cadastre tudo antes!");
                return;
            }

            gerarBtn.disabled = true;
            if (novaBtn) novaBtn.disabled = true;

            progressContainer.style.display = 'flex';
            progressBar.style.width = '0%';
            progressText.textContent = 'Inicializando...';

            worker = new Worker('./js/worker.js');

            worker.postMessage({ professores, cargas, turmas });

            worker.onmessage = (e) => {

                if (e.data.status === 'progresso') {
                    progressBar.style.width = e.data.valor + "%";
                    progressText.textContent = `Gerando... ${e.data.valor}%`;
                }

                if (e.data.status === 'fim') {
                    progressText.textContent = 'Finalizado!';
                    gerarBtn.disabled = false;
                    if (novaBtn) novaBtn.disabled = false;
                }
            };

            worker.onerror = () => {
                alert("Erro na geração!");
                gerarBtn.disabled = false;
            };
        });

        if (novaBtn) {
            novaBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    }

});