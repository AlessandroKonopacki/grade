// worker.js
self.onmessage = function(e) {
    const { professores, cargasHorarias, turmas, parametros, gradeAnterior } = e.data;
    
    // Mapeamento de dias da semana para a correção da disponibilidade
    const diasSemana = ['nulo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'];

    // FUNÇÕES DO ALGORITMO GENÉTICO
    // Cria um indivíduo (uma grade horária) aleatoriamente
    function criarIndividuo(professores, cargasHorarias, turmas) {
        const grade = {};
        const aulasRestantes = [...cargasHorarias];

        turmas.forEach(turma => {
            grade[turma.nome] = {};
            for (let dia = 1; dia <= 5; dia++) {
                for (let hora = 1; hora <= 6; hora++) {
                    grade[turma.nome][`${dia}-${hora}`] = null;
                }
            }
        });

        let aulasParaAlocar = [...cargasHorarias];
        let alocadas = [];
        let tentativasGlobais = 0;
        const maxTentativasAula = 100;

        while (aulasParaAlocar.length > 0 && tentativasGlobais < 5000) {
            const aula = aulasParaAlocar.shift();
            let alocadaComSucesso = false;
            let tentativasPorAula = 0;

            while (!alocadaComSucesso && tentativasPorAula < maxTentativasAula) {
                const dia = Math.floor(Math.random() * 5) + 1; // 1-5
                const hora = Math.floor(Math.random() * 6) + 1; // 1-6
                const turmaNome = aula.turma;
                const professorNome = aula.professorNome;

                // Encontrar o objeto do professor
                const professor = professores.find(p => p.nome === professorNome);
                if (!professor) {
                    console.error(`Professor não encontrado: ${professorNome}`);
                    break; 
                }

                // VERIFICAÇÃO DE DISPONIBILIDADE DO PROFESSOR (CORREÇÃO)
                if (!professor.disponibilidade.includes(diasSemana[dia])) {
                    tentativasPorAula++;
                    continue; // Pula para a próxima tentativa se o professor não estiver disponível
                }

                // Verificação de conflitos (professor já tem aula)
                let conflitoProfessor = false;
                for (const t in grade) {
                    if (grade[t][`${dia}-${hora}`] && grade[t][`${dia}-${hora}`].professor === professorNome) {
                        conflitoProfessor = true;
                        break;
                    }
                }
                if (conflitoProfessor) {
                    tentativasPorAula++;
                    continue;
                }

                // Verificação de aulas geminadas
                if (aula.aulasGeminadas) {
                    if (hora === 6) { // Não pode ser a última aula
                        tentativasPorAula++;
                        continue;
                    }
                    const proximaAula = grade[turmaNome][`${dia}-${hora + 1}`];
                    if (proximaAula !== null) { // Próxima aula já ocupada
                        tentativasPorAula++;
                        continue;
                    }
                    if (professor.limiteAulas < 2) {
                        tentativasPorAula++;
                        continue;
                    }
                }

                // Se passou em todas as verificações, aloca a aula
                if (aula.aulasPorSemana > 0) {
                    grade[turmaNome][`${dia}-${hora}`] = { 
                        disciplina: aula.disciplina, 
                        professor: professorNome 
                    };
                    aula.aulasPorSemana--;

                    if (aula.aulasGeminadas && aula.aulasPorSemana > 0) {
                        grade[turmaNome][`${dia}-${hora + 1}`] = { 
                            disciplina: aula.disciplina, 
                            professor: professorNome 
                        };
                        aula.aulasPorSemana--;
                    }
                    alocadaComSucesso = true;
                }
            }

            if (alocadaComSucesso) {
                alocadas.push(aula);
            } else {
                aulasParaAlocar.push(aula);
            }
            tentativasGlobais++;
        }

        return { grade, aulasRestantes: aulasParaAlocar };
    }

    // Avalia o quão boa a grade é (quanto maior, melhor)
    function avaliarIndividuo(individuo, professores) {
        let fitness = 0;
        const grade = individuo.grade;
        const aulasRestantes = individuo.aulasRestantes;

        // Diminui o fitness para cada aula que não foi alocada
        let aulasNaoAlocadas = 0;
        aulasRestantes.forEach(aula => aulasNaoAlocadas += aula.aulasPorSemana);
        fitness -= aulasNaoAlocadas * 10;

        // Outras verificações de fitness
        for (const turma in grade) {
            const diasOcupadosProfessor = {};

            for (let dia = 1; dia <= 5; dia++) {
                let aulasNoDia = 0;
                for (let hora = 1; hora <= 6; hora++) {
                    const aula = grade[turma][`${dia}-${hora}`];
                    if (aula) {
                        aulasNoDia++;
                        const professorNome = aula.professor;
                        
                        if (!diasOcupadosProfessor[professorNome]) {
                            diasOcupadosProfessor[professorNome] = {};
                        }
                        if (!diasOcupadosProfessor[professorNome][dia]) {
                            diasOcupadosProfessor[professorNome][dia] = 0;
                        }
                        diasOcupadosProfessor[professorNome][dia]++;

                        // Penalidade por aulas em dias indisponíveis (duplo check)
                        const professorObj = professores.find(p => p.nome === professorNome);
                        if (professorObj && !professorObj.disponibilidade.includes(diasSemana[dia])) {
                            fitness -= 50;
                        }
                    }
                }
                
                // Penalidade por muitas aulas no mesmo dia
                const turmaCarga = cargasHorarias.find(c => c.turma === turma);
                if (turmaCarga && aulasNoDia > turmaCarga.limiteAulas) {
                    fitness -= (aulasNoDia - turmaCarga.limiteAulas) * 5;
                }
            }
            
            // Verifica limites de aulas por dia para cada professor
            for (const professorNome in diasOcupadosProfessor) {
                const professorCargas = cargasHorarias.filter(c => c.professorNome === professorNome);
                if (professorCargas.length > 0) {
                    const limiteAulas = professorCargas[0].limiteAulas; // Supondo que o limite é o mesmo para todas as cargas do professor
                    for (const dia in diasOcupadosProfessor[professorNome]) {
                        if (diasOcupadosProfessor[professorNome][dia] > limiteAulas) {
                            fitness -= (diasOcupadosProfessor[professorNome][dia] - limiteAulas) * 5;
                        }
                    }
                }
            }
        }
        
        return fitness;
    }

    // Seleção de indivíduos para cruzamento (Torneio)
    function selecao(populacao) {
        const indice1 = Math.floor(Math.random() * populacao.length);
        const indice2 = Math.floor(Math.random() * populacao.length);
        return populacao[indice1].fitness > populacao[indice2].fitness ? populacao[indice1] : populacao[indice2];
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
            mutacao(filho); // A função de mutação já aplica a mutação internamente
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