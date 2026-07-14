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

onSnapshot(
    collection(db, "participantes"),

    snapshot => {
        const participantes = [];

        snapshot.forEach(documento => {
            participantes.push({
                id: documento.id,
                ...documento.data()
            });
        });

        const equipes =
            agruparPorEquipe(participantes);

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

        if (mensagemRankingElemento) {
            mensagemRankingElemento.textContent =
                "Não foi possível carregar o ranking.";

            mensagemRankingElemento.classList.add(
                "mensagem-erro"
            );
        }
    }
);

function agruparPorEquipe(participantes) {
    const mapaEquipes = new Map();

    participantes.forEach(participante => {
        const equipeOriginal =
            String(
                participante.equipe ??
                "Sem equipe"
            ).trim();

        const chaveEquipe =
            normalizarEquipe(equipeOriginal);

        if (!mapaEquipes.has(chaveEquipe)) {
            mapaEquipes.set(
                chaveEquipe,
                {
                    nome:
                        equipeOriginal ||
                        "Sem equipe",

                    pontos: 0,

                    participantes: 0,

                    integrantes: []
                }
            );
        }

        const equipe =
            mapaEquipes.get(chaveEquipe);

        const pontos =
            Number(participante.pontos) || 0;

        equipe.pontos += pontos;
        equipe.participantes += 1;

        equipe.integrantes.push({
            nome:
                participante.nome ??
                "Participante",

            pontos
        });
    });

    return Array
        .from(mapaEquipes.values())
        .sort((equipeA, equipeB) => {
            if (
                equipeB.pontos !==
                equipeA.pontos
            ) {
                return (
                    equipeB.pontos -
                    equipeA.pontos
                );
            }

            return equipeA.nome.localeCompare(
                equipeB.nome,
                "pt-BR"
            );
        });
}

function normalizarEquipe(nome) {
    return String(nome)
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
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
                    (Number(
                        participante.pontos
                    ) || 0)
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

    if (mensagemRankingElemento) {
        mensagemRankingElemento.textContent = "";

        mensagemRankingElemento.classList.remove(
            "mensagem-erro"
        );
    }

    if (equipes.length === 0) {
        rankingElemento.innerHTML = `
            <div class="ranking-vazio">
                <span>🚧</span>
                <p>Nenhuma equipe conectada.</p>
            </div>
        `;

        return;
    }

    equipes.forEach(
        (equipe, indice) => {
            const posicao =
                indice + 1;

            const media =
                equipe.participantes > 0
                    ? equipe.pontos /
                        equipe.participantes
                    : 0;

            const item =
                document.createElement(
                    "article"
                );

            item.classList.add(
                "ranking-equipe-item"
            );

            if (posicao <= 3) {
                item.classList.add(
                    `ranking-posicao-${posicao}`
                );
            }

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterPosicao(posicao)}
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

function obterPosicao(posicao) {
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

    elemento.textContent =
        String(texto);

    return elemento.innerHTML;
}
