// ===== CONSTANTES =====
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const HORARIOS_POR_DIA = 6;

// ===== SHUFFLE =====
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] =
            [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// ===== EXPANDIR AULAS =====
function expandirAulas(cargas) {
    const lista = [];

    cargas.forEach(c => {
        for (let i = 0; i < c.aulas; i++) {
            lista.push({ ...c });
        }
    });

    return lista;
}

// ===== MAPAS =====
function prepararMapas(professores) {
    const mapa = {};

    professores.forEach(p => {
        mapa[p.nome] = {
            ...p,
            disponibilidadeSet: new Set(
                p.disponibilidade.map(d => DIAS_SEMANA.indexOf(d))
            )
        };
    });

    return mapa;
}

// ===== CRIAR GRADE =====
function criarGradeBase(cargas) {
    const grade = {};

    cargas.forEach(c => {
        if (!grade[c.turma]) {
            grade[c.turma] = Array.from({ length: DIAS_SEMANA.length }, () =>
                Array.from({ length: HORARIOS_POR_DIA }, () => null)
            );
        }
    });

    return grade;
}

// ===== CONFLITO GLOBAL PROFESSOR =====
function conflitoProfessor(grade, dia, hora, professor) {
    for (const turma in grade) {
        const aula = grade[turma][dia][hora];
        if (aula && aula.professor === professor) return true;
    }
    return false;
}

// ===== CONFLITO LOCAL =====
function conflitoLocal(grade, turma, dia, aula) {
    const aulasNoDia = grade[turma][dia].filter(a => a && a.professor === aula.professor).length;
    return aulasNoDia >= aula.limite;
}

// ===== CRIAR INDIVIDUO =====
function criarIndividuo(cargas, mapaProfessores) {
    const grade = criarGradeBase(cargas);
    const aulasNaoAlocadas = [];

    const aulasDisponiveis = shuffle(expandirAulas(cargas));

    for (const aula of aulasDisponiveis) {
        const professor = mapaProfessores[aula.professor];
        if (!professor) {
            aulasNaoAlocadas.push(aula);
            continue;
        }

        let alocada = false;

        const dias = shuffle([...professor.disponibilidadeSet]);

        for (const dia of dias) {
            const horarios = shuffle([...Array(HORARIOS_POR_DIA).keys()]);

            for (const hora of horarios) {
                if (grade[aula.turma][dia][hora] !== null) continue;

                if (conflitoProfessor(grade, dia, hora, aula.professor)) continue;

                if (conflitoLocal(grade, aula.turma, dia, aula)) continue;

                grade[aula.turma][dia][hora] = aula;
                alocada = true;
                break;
            }

            if (alocada) break;
        }

        if (!alocada) aulasNaoAlocadas.push(aula);
    }

    return { grade, aulasNaoAlocadas };
}

// ===== FITNESS =====
function calcularFitness(ind) {
    let fitness = 0;
    const { grade, aulasNaoAlocadas } = ind;

    // penaliza aulas não alocadas
    fitness -= aulasNaoAlocadas.length * 50;

    // bônus aulas alocadas
    for (const turma in grade) {
        for (let d = 0; d < DIAS_SEMANA.length; d++) {
            const aulas = grade[turma][d].filter(a => a !== null).length;

            fitness += aulas * 5;

            // penaliza se não tiver 5 aulas no dia
            if (aulas < 5) {
                fitness -= (5 - aulas) * 20;
            }
        }
    }

    ind.fitness = fitness;
    return ind;
}

// ===== CROSSOVER =====
function crossover(p1, p2) {
    const c1 = JSON.parse(JSON.stringify(p1));
    const c2 = JSON.parse(JSON.stringify(p2));

    for (const turma in c1.grade) {
        for (let d = 0; d < DIAS_SEMANA.length; d++) {
            for (let h = 0; h < HORARIOS_POR_DIA; h++) {
                if (Math.random() < 0.5) {
                    [c1.grade[turma][d][h], c2.grade[turma][d][h]] =
                        [c2.grade[turma][d][h], c1.grade[turma][d][h]];
                }
            }
        }
    }

    return [c1, c2];
}

// ===== MUTAÇÃO =====
function mutacao(ind, taxa) {
    if (Math.random() < taxa) {
        const turmas = Object.keys(ind.grade);
        const turma = turmas[Math.floor(Math.random() * turmas.length)];

        const d1 = Math.floor(Math.random() * DIAS_SEMANA.length);
        const h1 = Math.floor(Math.random() * HORARIOS_POR_DIA);
        const d2 = Math.floor(Math.random() * DIAS_SEMANA.length);
        const h2 = Math.floor(Math.random() * HORARIOS_POR_DIA);

        const temp = ind.grade[turma][d1][h1];
        ind.grade[turma][d1][h1] = ind.grade[turma][d2][h2];
        ind.grade[turma][d2][h2] = temp;
    }

    return ind;
}

// ===== WORKER =====
onmessage = function (e) {
    const { professores, cargasHorarias, parametros } = e.data;

    const mapaProf = prepararMapas(professores);

    let populacao = [];

    for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
        populacao.push(criarIndividuo(cargasHorarias, mapaProf));
    }

    let melhor = null;

    for (let g = 0; g < parametros.numGeracoes; g++) {

        populacao = populacao.map(calcularFitness);

        populacao.sort((a, b) => b.fitness - a.fitness);

        if (!melhor || populacao[0].fitness > melhor.fitness) {
            melhor = populacao[0];
        }

        const nova = [];

        for (let i = 0; i < populacao.length; i += 2) {
            const p1 = populacao[i];
            const p2 = populacao[i + 1];

            if (p2) {
                const [c1, c2] = crossover(p1, p2);
                nova.push(c1, c2);
            }
        }

        populacao = nova.map(ind => mutacao(ind, parametros.taxaMutacao));

        postMessage({
            status: "progresso",
            progresso: Math.round((g / parametros.numGeracoes) * 100)
        });
    }

    populacao = populacao.map(calcularFitness);

    const melhorFinal = populacao.reduce((a, b) =>
        a.fitness > b.fitness ? a : b
    );

    postMessage({
        status: "completo",
        grade: melhorFinal.grade,
        aulasSobrantes: melhorFinal.aulasNaoAlocadas
    });
};