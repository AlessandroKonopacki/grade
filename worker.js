// worker.js

// Fisher–Yates shuffle (mais rápido que sort aleatório)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}

// Mapas pré-computados para acessos rápidos
function prepararMapas(professores, turmas) {
    const mapaProfessores = {};
    const mapaTurmas = {};

    professores.forEach(p => {
        mapaProfessores[p.nome] = {
            ...p,
            disponibilidadeSet: new Set(
                p.disponibilidade.map(dia => diasSemana.indexOf(dia))
            )
        };
    });

    turmas.forEach(t => {
        mapaTurmas[t.nome] = { ...t };
    });

    return { mapaProfessores, mapaTurmas };
}

// Criação de indivíduo otimizada
function criarIndividuo(turmas, diasSemana, horariosPorDia, mapaProfessores, mapaTurmas) {
    const grade = Array.from({ length: diasSemana.length }, () =>
        Array.from({ length: horariosPorDia }, () => null)
    );

    // Estruturas de ocupação para evitar conflitos
    const ocupacaoTurma = {};
    const ocupacaoProfessor = {};

    turmas.forEach(t => ocupacaoTurma[t.nome] = Array(diasSemana.length).fill(null).map(() => Array(horariosPorDia).fill(false)));
    Object.keys(mapaProfessores).forEach(p => ocupacaoProfessor[p] = Array(diasSemana.length).fill(null).map(() => Array(horariosPorDia).fill(false)));

    // Distribuir aulas
    for (const turma of turmas) {
        for (const disciplina of turma.disciplinas) {
            for (let a = 0; a < disciplina.quantidade; a++) {
                let colocado = false;
                let tentativas = 0;

                while (!colocado && tentativas < 50) {
                    const dia = Math.floor(Math.random() * diasSemana.length);
                    const hora = Math.floor(Math.random() * horariosPorDia);
                    tentativas++;

                    const profsValidos = disciplina.professores
                        .map(nome => mapaProfessores[nome])
                        .filter(p => p && p.disponibilidadeSet.has(dia) && !ocupacaoProfessor[p.nome][dia][hora]);

                    if (!ocupacaoTurma[turma.nome][dia][hora] && profsValidos.length > 0) {
                        const professorEscolhido = profsValidos[Math.floor(Math.random() * profsValidos.length)];
                        grade[dia][hora] = {
                            turma: turma.nome,
                            disciplina: disciplina.nome,
                            professor: professorEscolhido.nome
                        };
                        ocupacaoTurma[turma.nome][dia][hora] = true;
                        ocupacaoProfessor[professorEscolhido.nome][dia][hora] = true;
                        colocado = true;
                    }
                }
            }
        }
    }
    return grade;
}

// Mutação otimizada
function mutacao(individuo, parametros, mapas) {
    const { mapaProfessores, mapaTurmas } = mapas;

    for (let dia = 0; dia < individuo.length; dia++) {
        for (let hora = 0; hora < individuo[dia].length; hora++) {
            if (Math.random() < parametros.taxaMutacao) {
                const { turma, professor } = individuo[dia][hora] || {};
                if (turma && professor) {
                    const turmaObj = mapaTurmas[turma];
                    const novaDisciplina = turmaObj.disciplinas[Math.floor(Math.random() * turmaObj.disciplinas.length)];
                    const profsValidos = novaDisciplina.professores
                        .map(nome => mapaProfessores[nome])
                        .filter(p => p && p.disponibilidadeSet.has(dia));

                    if (profsValidos.length > 0) {
                        const novoProfessorObj = profsValidos[Math.floor(Math.random() * profsValidos.length)];
                        individuo[dia][hora] = {
                            turma: turmaObj.nome,
                            disciplina: novaDisciplina.nome,
                            professor: novoProfessorObj.nome
                        };
                    }
                }
            }
        }
    }
    return individuo;
}

// --- Lógica principal do worker ---
onmessage = function(e) {
    const { turmas, professores, parametros, diasSemana, horariosPorDia } = e.data;

    const mapas = prepararMapas(professores, turmas);

    // Criar população inicial otimizada
    let populacao = [];
    for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
        populacao.push(criarIndividuo(turmas, diasSemana, horariosPorDia, mapas.mapaProfessores, mapas.mapaTurmas));
    }

    // Aqui continua seu algoritmo genético normal...
    // Exemplo simplificado:
    for (let geracao = 0; geracao < parametros.maxGeracoes; geracao++) {
        // Avaliar, cruzar, mutar, etc...
        populacao = populacao.map(ind => mutacao(ind, parametros, mapas));
        // Ordenar por aptidão (avaliarIndividuo otimizado pode ser chamado aqui)
    }

    postMessage({ status: 'concluido', populacao });
};
