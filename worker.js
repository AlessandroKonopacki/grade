// worker.js
self.onmessage = function(e) {
    const { professores, cargasHorarias, turmas, parametros, gradeAnterior } = e.data;
    
    // Mapeamento de dias da semana para a correção da disponibilidade
    const diasSemana = ['nulo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta'];

    // FUNÇÕES DO ALGORITMO GENÉTICO
    // Cria um indivíduo (uma grade horária) de forma mais inteligente
    function criarIndividuo(professores, cargasHorarias, turmas) {
        const grade = {};
        const aulasRestantes = [];
        const ocupacaoProfessor = {};

        turmas.forEach(turma => {
            grade[turma.nome] = {};
            for (let dia = 1; dia <= 5; dia++) {
                for (let hora = 1; hora <= 6; hora++) {
                    grade[turma.nome][`${dia}-${hora}`] = null;
                }
            }
        });

        const aulasParaAlocar = [...cargasHorarias];
        const aulasParaAlocarPorProfessor = {};
        
        professores.forEach(p => aulasParaAlocarPorProfessor[p.nome] = []);
        aulasParaAlocar.forEach(aula => aulasParaAlocarPorProfessor[aula.professorNome].push(aula));
        
        const professoresAleatorios = [...professores].sort(() => Math.random() - 0.5);

        for (const professor of professoresAleatorios) {
            const aulasDoProfessor = aulasParaAlocarPorProfessor[professor.nome];

            for (const aula of aulasDoProfessor) {
                let alocadaComSucesso = false;
                const vagasDisponiveis = [];

                const diasDisponiveis = professor.disponibilidade.map(diaStr => diasSemana.indexOf(diaStr));
                
                for (const dia of diasDisponiveis) {
                    if (dia === 0) continue; // Pula o dia 'nulo'

                    for (let hora = 1; hora <= 6; hora++) {
                        const turmaNome = aula.turma;

                        // Verifica se o slot está disponível na grade
                        if (grade[turmaNome][`${dia}-${hora}`] !== null) continue;
                        
                        // Verifica conflito de professor
                        let conflitoProfessor = false;
                        for (const t in grade) {
                            if (grade[t][`${dia}-${hora}`] && grade[t][`${dia}-${hora}`].professor === professor.nome) {
                                conflitoProfessor = true;
                                break;
                            }
                        }
                        if (conflitoProfessor) continue;
                        
                        // Verifica aulas geminadas
                        if (aula.aulasGeminadas) {
                            if (hora === 6) continue;
                            const proximaAula = grade[turmaNome][`${dia}-${hora + 1}`];
                            if (proximaAula !== null) continue;
                        }

                        // Verifica limite de aulas por dia (turma)
                        const aulasNoDiaTurma = Object.values(grade[turmaNome]).filter(
                            a => a && a.disciplina === aula.disciplina && a.dia === dia
                        ).length;
                        if (aulasNoDiaTurma >= aula.limiteAulas) continue;

                        vagasDisponiveis.push({ dia, hora });
                    }
                }
                
                if (vagasDisponiveis.length > 0) {
                    const vagaAleatoria = vagasDisponiveis[Math.floor(Math.random() * vagasDisponiveis.length)];
                    const { dia, hora } = vagaAleatoria;

                    grade[aula.turma][`${dia}-${hora}`] = { 
                        disciplina: aula.disciplina, 
                        professor: professor.nome,
                        dia: dia,
                        hora: hora
                    };
                    aula.aulasPorSemana--;

                    if (aula.aulasGeminadas && aula.aulasPorSemana > 0) {
                        if (grade[aula.turma][`${dia}-${hora + 1}`] === null) {
                             grade[aula.turma][`${dia}-${hora + 1}`] = { 
                                disciplina: aula.disciplina, 
                                professor: professor.nome,
                                dia: dia,
                                hora: hora + 1
                            };
                            aula.aulasPorSemana--;
                        }
                    }
                    alocadaComSucesso = true;
                }

                if (!alocadaComSucesso) {
                    aulasRestantes.push(aula);
                }
            }
        }
        
        return { grade, aulasRestantes };
    }


    // Avalia o quão boa a grade é (quanto maior, melhor)
    function avaliarIndividuo(individuo, professores) {
        let fitness = 10000;
        const grade = individuo.grade;
        const aulasRestantes = individuo.aulasRestantes;
        const ocupacaoProfessor = {};

        // Penalidade para aulas não alocadas (prioridade máxima)
        fitness -= aulasRestantes.length * 10000;

        for (const turma in grade) {
            for (let dia = 1; dia <= 5; dia++) {
                for (let hora = 1; hora <= 6; hora++) {
                    const aula = grade[turma][`${dia}-${hora}`];
                    if (aula) {
                        const { professor } = aula;

                        // Conflito de professor
                        if (!ocupacaoProfessor[professor]) {
                            ocupacaoProfessor[professor] = {};
                        }
                        if (ocupacaoProfessor[professor][`${dia}-${hora}`]) {
                            fitness -= 5000;
                        } else {
                            ocupacaoProfessor[professor][`${dia}-${hora}`] = turma;
                        }
                        
                        // Penalidade para aulas em dias indisponíveis (duplo check)
                        const professorObj = professores.find(p => p.nome === professor);
                        if (professorObj && !professorObj.disponibilidade.includes(diasSemana[dia])) {
                            fitness -= 5000;
                        }
                    }
                }
            }
        }
        
        // Penalidade por aulas em excesso por dia para um professor
        for(const professor in ocupacaoProfessor){
            const professorCargas = cargasHorarias.filter(c => c.professorNome === professor);
            if (professorCargas.length > 0) {
                const limiteAulas = professorCargas[0].limiteAulas;
                const dias = {};
                for(const horario in ocupacaoProfessor[professor]){
                    const [dia] = horario.split('-').map(Number);
                    if(!dias[dia]){
                        dias[dia] = 0;
                    }
                    dias[dia]++;
                }
                for(const dia in dias){
                    if(dias[dia] > limiteAulas){
                        fitness -= (dias[dia] - limiteAulas) * 200;
                    }
                }
            }
        }
        
        return fitness;
    }

    // Seleção de indivíduos para cruzamento (Torneio)
    function selecao(populacao) {
        const competidores = [];
        for (let i = 0; i < 2; i++) {
            const indiceAleatorio = Math.floor(Math.random() * populacao.length);
            competidores.push(populacao[indiceAleatorio]);
        }
        return competidores[0].fitness > competidores[1].fitness ? competidores[0] : competidores[1];
    }

    // Cruzamento (Crossover de um ponto)
    function cruzamento(pai1, pai2) {
        const filhoGrade = {};
        const turmas = Object.keys(pai1.grade);
        const pontoCorte = Math.floor(Math.random() * turmas.length);

        for (let i = 0; i < turmas.length; i++) {
            const turma = turmas[i];
            if (i < pontoCorte) {
                filhoGrade[turma] = { ...pai1.grade[turma] };
            } else {
                filhoGrade[turma] = { ...pai2.grade[turma] };
            }
        }

        return { grade: filhoGrade, aulasRestantes: [] };
    }

    // Mutação (troca aleatória de 2 aulas)
    function mutacao(individuo) {
        if (Math.random() < parametros.taxaMutacao) {
            const turmas = Object.keys(individuo.grade);
            if (turmas.length < 2) return;

            const turma1 = turmas[Math.floor(Math.random() * turmas.length)];
            const turma2 = turmas[Math.floor(Math.random() * turmas.length)];

            const dias = ['1', '2', '3', '4', '5'];
            const dia = dias[Math.floor(Math.random() * dias.length)];
            const horas = ['1', '2', '3', '4', '5', '6'];
            const hora = horas[Math.floor(Math.random() * horas.length)];

            const aula1 = individuo.grade[turma1][`${dia}-${hora}`];
            const aula2 = individuo.grade[turma2][`${dia}-${hora}`];

            individuo.grade[turma1][`${dia}-${hora}`] = aula2;
            individuo.grade[turma2][`${dia}-${hora}`] = aula1;
        }
    }

    // Inicia o processo de geração da grade
    let populacao = [];
    
    if (gradeAnterior) {
        const individuoAnterior = {
            grade: gradeAnterior,
            aulasSobrantes: [], 
        };
        individuoAnterior.fitness = avaliarIndividuo(individuoAnterior, professores);
        populacao.push(individuoAnterior);
    }
    
    while (populacao.length < parametros.tamanhoPopulacao) {
        const individuo = criarIndividuo(professores, cargasHorarias, turmas);
        individuo.fitness = avaliarIndividuo(individuo, professores);
        populacao.push(individuo);
    }
    

    for (let geracao = 0; geracao < parametros.numGeracoes; geracao++) {
        populacao.sort((a, b) => b.fitness - a.fitness);
        const novaPopulacao = populacao.slice(0, 2); // Elitismo: mantém os 2 melhores

        while (novaPopulacao.length < parametros.tamanhoPopulacao) {
            const pai1 = selecao(populacao);
            const pai2 = selecao(populacao);
            const filho = cruzamento(pai1, pai2);
            mutacao(filho);
            filho.fitness = avaliarIndividuo(filho, professores);
            novaPopulacao.push(filho);
        }
        populacao = novaPopulacao;
        
        self.postMessage({ status: 'progresso', progresso: (geracao / parametros.numGeracoes) * 100 });
    }
    
    populacao.sort((a, b) => b.fitness - a.fitness);
    const melhorIndividuo = populacao[0];
    
    self.postMessage({
        status: 'completo',
        grade: melhorIndividuo.grade,
        aulasSobrantes: melhorIndividuo.aulasRestantes
    });
}