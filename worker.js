// worker.js
self.onmessage = function(e) {
    const { professores, cargasHorarias, turmas, parametros, gradeAnterior } = e.data;
    
    // Mapeamento de dias da semana para a correção da disponibilidade
    const diasSemana = ['nulo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta'];

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

        let tentativas = 0;
        while (aulasRestantes.length > 0 && tentativas < 1000) {
            const aula = aulasRestantes.shift();
            let alocada = false;

            for (let i = 0; i < 50; i++) {
                const turmaNome = aula.turma;
                const dia = Math.floor(Math.random() * 5) + 1;
                const hora = Math.floor(Math.random() * 6) + 1;

                if (!grade[turmaNome][`${dia}-${hora}`]) {
                    const aulasNoDia = Object.values(grade[turmaNome]).filter(
                        a => a && a.disciplina === aula.disciplina && a.dia === dia
                    ).length;

                    if (aulasNoDia < aula.limiteAulas) {
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

    function avaliarIndividuo(individuo, professores) {
        let fitness = 1000;
        const grade = individuo.grade;

        fitness -= individuo.aulasSobrantes.length * 100;

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
                        fitness -= 100;
                    }
                    professoresOcupados[professor][`${dia}-${hora}`] = true;

                    const professorData = professores.find(p => p.nome === professor);
                    
                    // CORREÇÃO: Usando o array de mapeamento para checar a disponibilidade
                    const diaDaSemana = diasSemana[dia];
                    if (professorData && !professorData.disponibilidade.includes(diaDaSemana)) {
                         fitness -= 100;
                    }

                    const [aulaDia, aulaHora] = horario.split('-').map(Number);
                    if (aulaHora < 6) {
                        const proximaAula = grade[turma][`${aulaDia}-${aulaHora + 1}`];
                        if (proximaAula && proximaAula.disciplina === aula.disciplina) {
                            fitness += 20;
                        }
                    }
                }
            }
        }
        return fitness;
    }

    function selecao(populacao) {
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

        self.postMessage({ status: 'progresso', progresso: (geracao / parametros.numGeracoes) * 100 });
    }

    let melhorIndividuo = populacao.reduce((melhor, atual) => {
        return atual.fitness > melhor.fitness ? atual : melhor;
    });

    self.postMessage({ status: 'completo', grade: melhorIndividuo.grade, aulasSobrantes: melhorIndividuo.aulasSobrantes });
};