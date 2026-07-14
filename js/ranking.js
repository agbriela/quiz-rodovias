import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* =========================
   EQUIPES FIXAS
========================= */

const NOMES_EQUIPES = [
    "Segurança Viária",
    "Pista Dupla",
    "Faixa Expressa"
];

/* =========================
   ELEMENTOS DA PÁGINA
========================= */

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

/* =========================
   FIRESTORE EM TEMPO REAL
========================= */

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
            calcularPontuacaoDasEquipes(
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

/* =========================
   SOMA DOS PONTOS POR EQUIPE
========================= */

function calcularPontuacaoDasEquipes(
    participantes
) {
    const equipes = NOMES_EQUIPES.map(
        nome => ({
            nome,
            pontos: 0
        })
    );

    participantes.forEach(
        participante => {
            const equipe =
                equipes.find(
                    item =>
                        item.nome ===
                        participante.equipe
                );

            if (!equipe) {
                return;
            }

            equipe.pontos +=
                Number(
                    participante.pontos ?? 0
                );
        }
    );

    return equipes.sort(
        (equipeA, equipeB) => {
            if (
                equipeB.pontos !==
                equipeA.pontos
            ) {
                return (
                    equipeB.pontos -
                    equipeA.pontos
                );
            }

            return (
                NOMES_EQUIPES.indexOf(
                    equipeA.nome
                ) -
                NOMES_EQUIPES.indexOf(
                    equipeB.nome
                )
            );
        }
    );
}

/* =========================
   RESUMO
========================= */

function atualizarResumo(
    participantes,
    equipes
) {
    const totalPontos =
        equipes.reduce(
            (total, equipe) =>
                total + equipe.pontos,
            0
        );

    quantidadeEquipesElemento.textContent =
        NOMES_EQUIPES.length;

    quantidadeParticipantesElemento.textContent =
        participantes.length;

    totalPontosElemento.textContent =
        formatarNumero(totalPontos);
}

/* =========================
   RENDERIZAR PÓDIO
========================= */

function renderizarRanking(equipes) {
    rankingElemento.innerHTML = "";

    mensagemRankingElemento.textContent = "";

    mensagemRankingElemento.classList.remove(
        "mensagem-erro"
    );

    equipes.forEach(
        (equipe, indice) => {
            const posicao =
                indice + 1;

            const item =
                document.createElement(
                    "article"
                );

            item.classList.add(
                "ranking-equipe-item"
            );

            item.classList.add(
                `ranking-posicao-${posicao}`
            );

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterPosicao(posicao)}
                </div>

                <div class="ranking-equipe-dados">
                    <strong>
                        ${equipe.nome}
                    </strong>
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

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function obterPosicao(posicao) {
    const medalhas = {
        1: "🥇",
        2: "🥈",
        3: "🥉"
    };

    return medalhas[posicao];
}

function formatarNumero(valor) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    ).format(valor);
}
