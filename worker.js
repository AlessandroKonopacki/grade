// worker.js
self.onmessage = function(e) {
    const { professores, cargasHorarias, turmas, parametros, gradeAnterior } = e.data;
    
    // Mapeamento de dias da semana para a correção da disponibilidade
    const diasSemana = ['nulo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta'];

    // FUNÇÕES DO ALGORITMO GENÉTICO
    // Cria um indivíduo (uma grade horária) aleatoriamente
    function criarIndividuo(professores, cargasHorarias, turmas) {
        const grade = {};
        const aulasRestantes = [];

        turmas.forEach(turma => {
            grade[turma.nome] = {};
            for (let dia = 1; dia <= 5; dia++) {
                for (let hora = 1; hora <= 6; hora++) {
                    grade[turma.nome][`${dia}-${hora}`] = null;
                }
            }
        });

        const aulasParaAlocar = [...cargasHorarias];
        const maxTentativasAula = 1000;

        aulasParaAlocar.forEach(aula => {
            let alocadaComSucesso = false;
            let tentativasPorAula = 0;
            const professorNome = aula.professorNome;
            const professor = professores.find(p => p.nome === professorNome);

            if (!professor) {
                console.error(`Professor não encontrado: ${professorNome}`);
                aulasRestantes.push(aula);
                return;
            }

            while (!alocadaComSucesso && tentativasPorAula < maxTentativasAula) {
                const dia = Math.floor(Math.random() * 5) + 1; // 1-5
                const hora = Math.floor(Math.random() * 6) + 1; // 1-6
                const turmaNome = aula.turma;

                // 1. VERIFICAÇÃO DE DISPONIBILIDADE DO PROFESSOR
                if (!professor.disponibilidade.includes(diasSemana[dia])) {
                    tentativasPorAula++;
                    continue; 
                }

                // 2. VERIFICAÇÃO DE CONFLITO NA TURMA
                if (grade[turmaNome][`${dia}-${hora}`] !== null) {
                    tentativasPorAula++;
                    continue;
                }
                
                // 3. VERIFICAÇÃO DE CONFLITO DE PROFESSOR
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
                
                // 4. VERIFICAÇÃO DE AULAS GEMINADAS
                if (aula.aulasGeminadas) {
                    if (hora === 6) { // Última aula, não pode ser geminada
                        tentativasPorAula++;
                        continue;
                    }
                    const proximaAula = grade[turmaNome][`${dia}-${hora + 1}`];
                    if (proximaAula !== null) { // Próxima aula já ocupada
                        tentativasPorAula++;
                        continue;
                    }
                }

                // 5. VERIFICAÇÃO DE LIMITE DE AULAS POR DIA (turma)
                const aulasNoDiaTurma = Object.values(grade[turmaNome]).filter(
                    a => a && a.disciplina === aula.disciplina && parseInt(a.dia) === dia
                ).length;
                if (aulasNoDiaTurma >= aula.limiteAulas) {
                    tentativasPorAula++;
                    continue;
                }

                // Se passou em todas as verificações, aloca a aula
                if (aula.aulasPorSemana > 0) {
                    grade[turmaNome][`${dia}-${hora}`] = { 
                        disciplina: aula.disciplina, 
                        professor: professorNome,
                        dia: dia,
                        hora: hora
                    };
                    aula.aulasPorSemana--;

                    if (aula.aulasGeminadas && aula.aulasPorSemana > 0) {
                        grade[turmaNome][`${dia}-${hora + 1}`] = { 
                            disciplina: aula.disciplina, 
                            professor: professorNome,
                            dia: dia,
                            hora: hora + 1
                        };
                        aula.aulasPorSemana--;
                    }
                    alocadaComSucesso = true;
                }
            }

            if (!alocadaComSucesso) {
                aulasRestantes.push(aula);
            }
        });

        return { grade, aulasRestantes };
    }

    // Avalia o quão boa a grade é (quanto maior, melhor)
    function avaliarIndividuo(individuo, professores) {
        let fitness = 10000; // Aumentei o fitness inicial para melhor escalabilidade
        const grade = individuo.grade;
        const aulasRestantes = individuo.aulasRestantes;
        const ocupacaoProfessor = {};

        fitness -= aulasRestantes.length * 1000; // Penalidade alta para aulas não alocadas

        for (const turma in grade) {
            for (let dia = 1; dia <= 5; dia++) {
                let aulasDiaTurma = 0;
                for (let hora = 1; hora <= 6; hora++) {
                    const aula = grade[turma][`${dia}-${hora}`];
                    if (aula) {
                        aulasDiaTurma++;
                        const { professor, disciplina } = aula;
                        const professorObj = professores.find(p => p.nome === professor);

                        if (!ocupacaoProfessor[professor]) {
                            ocupacaoProfessor[professor] = {};
                        }
                        if (!ocupacaoProfessor[professor][`${dia}-${hora}`]) {
                            ocupacaoProfessor[professor][`${dia}-${hora}`] = turma;
                        } else {
                            fitness -= 500; // Penalidade severa para conflito de professor
                        }
                        
                        // Penalidade para aulas em dias indisponíveis (duplo check)
                        if (professorObj && !professorObj.disponibilidade.includes(diasSemana[dia])) {
                            fitness -= 1000; // Penalidade altíssima
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
                    const [dia, hora] = horario.split('-').map(Number);
                    if(!dias[dia]){
                        dias[dia] = 0;
                    }
                    dias[dia]++;
                }
                for(const dia in dias){
                    if(dias[dia] > limiteAulas){
                        fitness -= (dias[dia] - limiteAulas) * 100;
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