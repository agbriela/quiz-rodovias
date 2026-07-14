import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const rankingElemento =
    document.getElementById("ranking");

const quantidadeEquipesElemento =
    document.getElementById("quantidadeEquipes");

const quantidadeParticipantesElemento =
    document.getElementById("quantidadeParticipantes");

const totalPontosElemento =
    document.getElementById("totalPontos");

const mensagemRankingElemento =
    document.getElementById("mensagemRanking");

const participantesRef =
    collection(db, "participantes");

onSnapshot(
    participantesRef,

    snapshot => {
        const participantes = [];

        snapshot.forEach(
            documento => {
                participantes.push({
                    id: documento.id,
                    ...documento.data()
                });
            }
        );

        const equipes =
            agruparParticipantesPorEquipe(
                participantes
            );

        atualizarResumo(
            participantes,
            equipes
        );

        renderizarRanking(equipes);
    },

    erro => {
        console.error(
            "Erro ao carregar ranking:",
            erro
        );

        rankingElemento.innerHTML = "";

        mensagemRankingElemento.textContent =
            "Não foi possível carregar o ranking.";

        mensagemRankingElemento.classList.add(
            "mensagem-erro"
        );
    }
);

function agruparParticipantesPorEquipe(
    participantes
) {
    const equipesAgrupadas = {};

    participantes.forEach(
        participante => {
            const nomeEquipe =
                normalizarNomeEquipe(
                    participante.equipe
                );

            if (!equipesAgrupadas[nomeEquipe]) {
                equipesAgrupadas[nomeEquipe] = {
                    nome: nomeEquipe,
                    pontos: 0,
                    participantes: 0,
                    integrantes: []
                };
            }

            const pontosParticipante =
                Number(
                    participante.pontos ?? 0
                );

            equipesAgrupadas[nomeEquipe].pontos +=
                pontosParticipante;

            equipesAgrupadas[nomeEquipe].participantes++;

            equipesAgrupadas[nomeEquipe].integrantes.push({
                nome:
                    participante.nome ??
                    "Participante",
                pontos:
                    pontosParticipante
            });
        }
    );

    return Object.values(
        equipesAgrupadas
    ).sort(
        (equipeA, equipeB) => {
            /*
             * Primeiro critério:
             * maior pontuação total.
             */
            if (
                equipeB.pontos !==
                equipeA.pontos
            ) {
                return (
                    equipeB.pontos -
                    equipeA.pontos
                );
            }

            /*
             * Desempate:
             * equipe com menos participantes.
             */
            if (
                equipeA.participantes !==
                equipeB.participantes
            ) {
                return (
                    equipeA.participantes -
                    equipeB.participantes
                );
            }

            return equipeA.nome.localeCompare(
                equipeB.nome,
                "pt-BR"
            );
        }
    );
}

function normalizarNomeEquipe(equipe) {
    const nome =
        String(equipe ?? "").trim();

    return nome || "Sem equipe";
}

function atualizarResumo(
    participantes,
    equipes
) {
    const totalPontos =
        participantes.reduce(
            (total, participante) => {
                return (
                    total +
                    Number(
                        participante.pontos ?? 0
                    )
                );
            },
            0
        );

    quantidadeEquipesElemento.textContent =
        equipes.length;

    quantidadeParticipantesElemento.textContent =
        participantes.length;

    totalPontosElemento.textContent =
        formatarNumero(totalPontos);
}

function renderizarRanking(equipes) {
    rankingElemento.innerHTML = "";

    mensagemRankingElemento.textContent = "";

    mensagemRankingElemento.classList.remove(
        "mensagem-erro"
    );

    if (equipes.length === 0) {
        rankingElemento.innerHTML = `
            <div class="ranking-vazio">
                <span>🚧</span>

                <p>
                    Nenhuma equipe conectada.
                </p>
            </div>
        `;

        return;
    }

    equipes.forEach(
        (equipe, indice) => {
            const posicao =
                indice + 1;

            const item =
                document.createElement("article");

            item.classList.add(
                "ranking-equipe-item"
            );

            if (posicao <= 3) {
                item.classList.add(
                    `ranking-posicao-${posicao}`
                );
            }

            const media =
                equipe.participantes > 0
                    ? equipe.pontos /
                        equipe.participantes
                    : 0;

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterMedalha(posicao)}
                </div>

                <div class="ranking-equipe-dados">
                    <strong>
                        ${escaparHTML(equipe.nome)}
                    </strong>

                    <span>
                        ${equipe.participantes}
                        ${
                            equipe.participantes === 1
                                ? "participante"
                                : "participantes"
                        }
                    </span>

                    <small>
                        Média:
                        ${formatarNumero(media)}
                        pontos por participante
                    </small>
                </div>

                <div class="ranking-equipe-pontos">
                    <strong>
                        ${formatarNumero(equipe.pontos)}
                    </strong>

                    <span>pontos</span>
                </div>
            `;

            rankingElemento.appendChild(
                item
            );
        }
    );
}

function obterMedalha(posicao) {
    const medalhas = {
        1: "🥇",
        2: "🥈",
        3: "🥉"
    };

    return (
        medalhas[posicao] ??
        `${posicao}º`
    );
}

function formatarNumero(valor) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    ).format(valor);
}

function escaparHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent = texto;

    return elemento.innerHTML;
}
