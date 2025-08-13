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

        turmas.forEach(turma => {
            grade[turma.nome] = {};
            for (let dia = 1; dia <= 5; dia++) {
                for (let hora = 1; hora <= 6; hora++) {
                    grade[turma.nome][`${dia}-${hora}`] = null;
                }
            }
        });

        // Duplica as aulas para ter um item para cada aula individual
        const aulasIndividuais = [];
        cargasHorarias.forEach(aula => {
            for (let i = 0; i < aula.aulasPorSemana; i++) {
                aulasIndividuais.push({ ...aula, idUnico: `${aula.professorNome}-${aula.disciplina}-${aula.turma}-${i}` });
            }
        });

        const aulasParaAlocar = [...aulasIndividuais].sort(() => Math.random() - 0.5);
        const maxTentativasAula = 50;
        
        while (aulasParaAlocar.length > 0) {
            const aula = aulasParaAlocar.shift();
            const professorNome = aula.professorNome;
            const professor = professores.find(p => p.nome === professorNome);
            
            if (!professor) {
                aulasRestantes.push(aula);
                continue;
            }

            const diasDisponiveis = professor.disponibilidade.map(diaStr => diasSemana.indexOf(diaStr)).filter(d => d > 0);
            
            if (diasDisponiveis.length === 0) {
                 aulasRestantes.push(aula);
                 continue;
            }

            let alocadaComSucesso = false;
            let tentativas = 0;

            while (!alocadaComSucesso && tentativas < maxTentativasAula) {
                const dia = diasDisponiveis[Math.floor(Math.random() * diasDisponiveis.length)];
                const hora = Math.floor(Math.random() * 6) + 1; // 1-6
                const turmaNome = aula.turma;

                // 1. VERIFICAÇÃO DE CONFLITO NA TURMA
                if (grade[turmaNome][`${dia}-${hora}`] !== null) {
                    tentativas++;
                    continue;
                }
                
                // 2. VERIFICAÇÃO DE CONFLITO DE PROFESSOR
                let conflitoProfessor = false;
                for (const t in grade) {
                    if (grade[t][`${dia}-${hora}`] && grade[t][`${dia}-${hora}`].professor === professorNome) {
                        conflitoProfessor = true;
                        break;
                    }
                }
                if (conflitoProfessor) {
                    tentativas++;
                    continue;
                }
                
                // 3. VERIFICAÇÃO DE AULAS GEMINADAS (se for a primeira aula de um par)
                if (aula.aulasGeminadas && (aula.idUnico.endsWith('-0') || aula.idUnico.endsWith('-2') || aula.idUnico.endsWith('-4'))) {
                    if (hora === 6) { 
                        tentativas++;
                        continue;
                    }
                    const proximaAula = grade[turmaNome][`${dia}-${hora + 1}`];
                    if (proximaAula !== null) { 
                        tentativas++;
                        continue;
                    }
                }

                // 4. VERIFICAÇÃO DE LIMITE DE AULAS POR DIA (turma)
                let aulasNoDiaTurma = 0;
                for (let h = 1; h <= 6; h++) {
                    if (grade[turmaNome][`${dia}-${h}`] && grade[turmaNome][`${dia}-${h}`].disciplina === aula.disciplina) {
                        aulasNoDiaTurma++;
                    }
                }
                if (aulasNoDiaTurma >= aula.limiteAulas) {
                    tentativas++;
                    continue;
                }
                
                // Se passou em todas as verificações, aloca a aula
                grade[turmaNome][`${dia}-${hora}`] = { 
                    disciplina: aula.disciplina, 
                    professor: professorNome,
                    dia: dia,
                    hora: hora
                };
                alocadaComSucesso = true;

                // Aloca a aula geminada, se aplicável
                if (aula.aulasGeminadas && (aula.idUnico.endsWith('-0') || aula.idUnico.endsWith('-2') || aula.idUnico.endsWith('-4'))) {
                    const aulaGeminada = aulasParaAlocar.find(a => a.idUnico === `${aula.professorNome}-${aula.disciplina}-${aula.turma}-${parseInt(aula.idUnico.split('-').pop()) + 1}`);
                    if (aulaGeminada) {
                         grade[turmaNome][`${dia}-${hora + 1}`] = { 
                            disciplina: aulaGeminada.disciplina, 
                            professor: aulaGeminada.professorNome,
                            dia: dia,
                            hora: hora + 1
                        };
                        const index = aulasParaAlocar.indexOf(aulaGeminada);
                        if (index > -1) {
                            aulasParaAlocar.splice(index, 1);
                        }
                    }
                }
            }

            if (!alocadaComSucesso) {
                aulasRestantes.push(aula);
            }
        }
        
        return { grade, aulasRestantes };
    }

    // Avalia o quão boa a grade é (quanto maior, melhor)
    function avaliarIndividuo(individuo, professores) {
        let fitness = 100000; 
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

            // Troca apenas se não houver conflito de professor
            const professor1 = aula1 ? aula1.professor : null;
            const professor2 = aula2 ? aula2.professor : null;

            if (professor1 !== professor2) {
                // Se houver aula1, verifica se o professor1 tem disponibilidade na nova turma e dia
                const professorObj1 = professor1 ? professores.find(p => p.nome === professor1) : null;
                const podeTrocar1 = !professorObj1 || professorObj1.disponibilidade.includes(diasSemana[parseInt(dia)]);

                // Se houver aula2, verifica se o professor2 tem disponibilidade na nova turma e dia
                const professorObj2 = professor2 ? professores.find(p => p.nome === professor2) : null;
                const podeTrocar2 = !professorObj2 || professorObj2.disponibilidade.includes(diasSemana[parseInt(dia)]);

                if (podeTrocar1 && podeTrocar2) {
                    individuo.grade[turma1][`${dia}-${hora}`] = aula2;
                    individuo.grade[turma2][`${dia}-${hora}`] = aula1;
                }
            }
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