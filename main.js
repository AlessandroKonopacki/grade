// main.js - Código reestruturado para a nova arquitetura de 3 páginas
document.addEventListener('DOMContentLoaded', () => {

    // Funções auxiliares para carregar e salvar dados do localStorage
    const carregarDados = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const salvarDados = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Lógica para a página de Cadastro de Turmas (turmas.html) ---
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

        // Lógica do botão "Concluir Cadastro de Turmas"
        if (concluirTurmasBtn) {
            concluirTurmasBtn.addEventListener('click', () => {
                window.location.href = 'professores_cargas.html';
            });
        }
    }

    // --- Lógica para a página de Cadastro de Professores e Cargas (professores_cargas.html) ---
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
                const li = document.createElement('li');
                li.innerHTML = `
                    ${professor.nome} - Disciplinas: ${professor.disciplinas} (${professor.nivel})
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

        // Lógica de adicionar professor (re-implementada)
        professorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nomeProfessor = document.getElementById('nomeProfessor').value.trim();
            const disciplinas = document.getElementById('disciplinas').value.trim();
            const nivel = document.querySelector('input[name="nivel"]:checked').value;
            const disponibilidade = Array.from(document.querySelectorAll('#disponibilidade input:checked')).map(cb => cb.value);

            if (nomeProfessor && disciplinas) {
                professores.push({ nome: nomeProfessor, disciplinas, nivel, disponibilidade });
                professorForm.reset();
                renderizarProfessores();
                popularSelects();
            }
        });

        // Lógica de remover professor
        professoresList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.dataset.index;
                professores.splice(index, 1);
                renderizarProfessores();
                popularSelects();
            }
        });

        // Lógica de adicionar carga horária (re-implementada)
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

        // Lógica de remover carga horária
        cargasHorariasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                const index = e.target.dataset.index;
                cargasHorarias.splice(index, 1);
                renderizarCargasHorarias();
            }
        });

        // Inicialização
        renderizarProfessores();
        renderizarCargasHorarias();
        popularSelects();

        // Lógica do botão "Concluir Cadastro de Professores"
        if (concluirProfessoresBtn) {
            concluirProfessoresBtn.addEventListener('click', () => {
                window.location.href = 'grade.html';
            });
        }
    }

    // --- Lógica para a página da Grade Horária (grade.html) ---
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    if (gerarGradeIABtn) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');
        
        let gradeHoraria = []; 
        let aulasSobrantes = [];
        
        // As funções de renderização da grade, troca de professores, etc.
        // continuam as mesmas, mas agora só são chamadas nesta página.
        const renderizarGrade = (grade) => {
            // Lógica para renderizar a tabela
        };
        
        const renderizarAulasSobrantes = (aulas) => {
            // Lógica para exibir aulas sobrantes
        };
        
        // A lógica do Web Worker também fica aqui
        gerarGradeIABtn.addEventListener('click', () => {
            const worker = new Worker('worker.js');
            worker.postMessage({ professores, cargasHorarias, turmas });
            // ...e receber mensagens de progresso e resultado
        });
        
        // Lógica para o botão "Nova Grade" e para o modo de troca
        // ...

        // Inicialização
        renderizarGrade(gradeHoraria);
        renderizarAulasSobrantes(aulasSobrantes);
    }
});