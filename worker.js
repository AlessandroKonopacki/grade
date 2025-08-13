// worker.js
self.onmessage = function(e) {
    const { professores, cargasHorarias, turmas, parametros } = e.data;

    // Funções do Algoritmo Genético
    function criarIndividuo(professores, cargasHorarias, turmas) {
        // ... (código existente) ...
        // Funções do Algoritmo Genético
        function criarIndividuo(professores, cargasHorarias, turmas) {
            const grade = {};
            const aulasRestantes = [...cargasHorarias];

            // Inicializa a grade com horários vazios
            turmas.forEach(turma => {
                grade[turma.nome] = {};
                for (let dia = 1; dia <= 5; dia++) {
                    for (let hora = 1; hora <= 6; hora++) {
                        grade[turma.nome][`${dia}-${hora}`] = null;
                    }
                }
            });

            // Preenche a grade com aulas
            let tentativas = 0;
            while (aulasRestantes.length > 0 && tentativas < 1000) {
                const aula = aulasRestantes.shift();
                let alocada = false;

                // Tenta alocar a aula em horários aleatórios
                for (let i = 0; i < 50; i++) {
                    const turmaNome = aula.turma;
                    const dia = Math.floor(Math.random() * 5) + 1;
                    const hora = Math.floor(Math.random() * 6) + 1;

                    // Verifica se o horário está disponível
                    if (!grade[turmaNome][`${dia}-${hora}`]) {
                        // Verifica o limite de aulas por dia para a disciplina
                        const aulasNoDia = Object.values(grade[turmaNome]).filter(
                            a => a && a.disciplina === aula.disciplina && a.dia === dia
                        ).length;

                        if (aulasNoDia < aula.limiteAulas) {
                            // Aloca a aula e marca como alocada
                            grade[turmaNome][`${dia}-${hora}`] = {
                                professor: aula.professorNome,
                                disciplina: aula.disciplina,
                                dia,
                                hora
                            };
                            alocada = true;
                            break;
                        }
                    }
                }

                if (!alocada) {
                    aulasRestantes.push(aula);
                }
                tentativas++;
            }

            return {
                grade,
                aulasSobrantes: aulasRestantes
            };
        }
    }

    function avaliarIndividuo(individuo, professores) {
        let fitness = 1000;
        const grade = individuo.grade;

        // Penalidade para aulas não alocadas
        fitness -= individuo.aulasSobrantes.length * 100;

        // Penalidade por conflitos
        const professoresOcupados = {};
        for (const turma in grade) {
            for (const horario in grade[turma]) {
                const aula = grade[turma][horario];
                if (aula) {
                    const { professor, dia, hora } = aula;
                    if (!professoresOcupados[professor]) {
                        professoresOcupados[professor] = {};
                    }
                    if (professoresOcupados[professor][`${dia}-${hora}`]) {
                        fitness -= 100; // Conflito de professor
                    }
                    professoresOcupados[professor][`${dia}-${hora}`] = true;

                    // Penalidade se professor não tem disponibilidade
                    const professorData = professores.find(p => p.nome === professor);
                    if (professorData && !professorData.disponibilidade.includes(horario.split('-')[0])) {
                         fitness -= 100;
                    }

                    // Bônus para aulas geminadas (adicionado)
                    const [aulaDia, aulaHora] = horario.split('-').map(Number);
                    if (aulaHora < 6) {
                        const proximaAula = grade[turma][`${aulaDia}-${aulaHora + 1}`];
                        if (proximaAula && proximaAula.disciplina === aula.disciplina) {
                            fitness += 20; // Recompensa por aula geminada
                        }
                    }
                }
            }
        }
        return fitness;
    }

    function selecao(populacao) {
        // Torneio: selecione 2, pegue o melhor
        const competidores = [];
        for (let i = 0; i < 2; i++) {
            const indiceAleatorio = Math.floor(Math.random() * populacao.length);
            competidores.push(populacao[indiceAleatorio]);
        }
        return competidores[0].fitness > competidores[1].fitness ? competidores[0] : competidores[1];
    }

    function cruzamento(pai1, pai2) {
        const filho = JSON.parse(JSON.stringify(pai1));
        const pontoCorte = Math.floor(Math.random() * Object.keys(pai1.grade).length);
        const chavesTurmas = Object.keys(pai1.grade);

        for (let i = pontoCorte; i < chavesTurmas.length; i++) {
            const turma = chavesTurmas[i];
            filho.grade[turma] = pai2.grade[turma];
        }
        return filho;
    }

    // A função de mutação foi corrigida
    function mutacao(individuo) {
        if (Math.random() < parametros.taxaMutacao) {
            const turmas = Object.keys(individuo.grade);
            const turma = turmas[Math.floor(Math.random() * turmas.length)];
            
            const horarios = Object.keys(individuo.grade[turma]);
            const horario1 = horarios[Math.floor(Math.random() * horarios.length)];
            const horario2 = horarios[Math.floor(Math.random() * horarios.length)];

            const temp = individuo.grade[turma][horario1];
            individuo.grade[turma][horario1] = individuo.grade[turma][horario2];
            individuo.grade[turma][horario2] = temp;
        }
        return individuo;
    }

    // Algoritmo Genético Principal
    let populacao = [];
    for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
        const individuo = criarIndividuo(professores, cargasHorarias, turmas);
        individuo.fitness = avaliarIndividuo(individuo, professores);
        populacao.push(individuo);
    }

    for (let geracao = 0; geracao < parametros.numGeracoes; geracao++) {
        const novaPopulacao = [];
        for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
            const pai1 = selecao(populacao);
            const pai2 = selecao(populacao);
            const filho = cruzamento(pai1, pai2);
            mutacao(filho);
            filho.fitness = avaliarIndividuo(filho, professores);
            novaPopulacao.push(filho);
        }
        populacao = novaPopulacao;

        // Relatar progresso
        self.postMessage({ status: 'progresso', progresso: (geracao / parametros.numGeracoes) * 100 });
    }

    // Encontra o melhor indivíduo da última geração
    let melhorIndividuo = populacao.reduce((melhor, atual) => {
        return atual.fitness > melhor.fitness ? atual : melhor;
    });

    self.postMessage({ status: 'completo', grade: melhorIndividuo.grade, aulasSobrantes: melhorIndividuo.aulasSobrantes });
};