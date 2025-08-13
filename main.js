// main.js - Código reestruturado para a nova arquitetura de 3 páginas

document.addEventListener('DOMContentLoaded', () => {

    // --- Variáveis Globais (compartilhadas) ---
    // Funções para carregar e salvar dados do localStorage
    const carregarDados = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const salvarDados = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Lógica para a página de Cadastro de Turmas (turmas.html) ---
    const turmaForm = document.getElementById('turmaForm');
    const turmasList = document.getElementById('turmasList');
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
    }

    // --- Lógica para a página de Cadastro de Professores e Cargas (professores_cargas.html) ---
    const professorForm = document.getElementById('professorForm');
    const cargaHorariaForm = document.getElementById('cargaHorariaForm');
    const professoresList = document.getElementById('professoresList');
    const cargasHorariasList = document.getElementById('cargasHorariasList');
    const professorCargaSelect = document.getElementById('professorCargaSelect');
    const turmaCargaSelect = document.getElementById('turmaCargaSelect');

    if (professorForm && cargaHorariaForm) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');

        // Renderiza as listas de professores
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

        // Renderiza as listas de cargas horárias
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
        
        // Popula os selects para professor e turma
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

        // Event Listeners para os formulários
        professorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Lógica para adicionar professor...
            renderizarProfessores();
            popularSelects();
        });

        professoresList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                // Lógica para remover professor...
                renderizarProfessores();
                popularSelects();
            }
        });

        cargaHorariaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Lógica para adicionar carga horária...
            renderizarCargasHorarias();
        });

        cargasHorariasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover')) {
                // Lógica para remover carga horária...
                renderizarCargasHorarias();
            }
        });

        // Inicialização
        renderizarProfessores();
        renderizarCargasHorarias();
        popularSelects();
    }

    // --- Lógica para a página da Grade Horária (grade.html) ---
    const gerarGradeIABtn = document.getElementById('gerarGradeIABtn');
    if (gerarGradeIABtn) {
        let professores = carregarDados('professores');
        let cargasHorarias = carregarDados('cargasHorarias');
        let turmas = carregarDados('turmas');
        
        let gradeHoraria = []; // ou carregar do localStorage
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
            // Lógica para iniciar o worker...
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