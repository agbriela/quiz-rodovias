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
   ESTADO
========================= */

let participantes = [];
let visualizacaoAtual = "equipes";

/* =========================
   ELEMENTOS
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

const botaoEquipes =
    document.getElementById("botaoEquipes");

const botaoPessoas =
    document.getElementById("botaoPessoas");

const rankingDescricao =
    document.getElementById("rankingDescricao");

const rotuloQuantidade =
    document.getElementById("rotuloQuantidade");

/* =========================
   EVENTOS DAS ABAS
========================= */

botaoEquipes.addEventListener(
    "click",
    () => {
        visualizacaoAtual = "equipes";
        atualizarVisualizacao();
    }
);

botaoPessoas.addEventListener(
    "click",
    () => {
        visualizacaoAtual = "pessoas";
        atualizarVisualizacao();
    }
);

/* =========================
   FIRESTORE
========================= */

onSnapshot(
    collection(db, "participantes"),

    snapshot => {
        participantes = [];

        snapshot.forEach(documento => {
            participantes.push({
                id: documento.id,
                ...documento.data()
            });
        });

        atualizarResumoGeral();
        atualizarVisualizacao();
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
   ATUALIZAR VISUALIZAÇÃO
========================= */

function atualizarVisualizacao() {
    limparMensagemErro();

    if (visualizacaoAtual === "equipes") {
        mostrarRankingEquipes();
    } else {
        mostrarRankingPessoas();
    }

    atualizarEstadoDasAbas();
}

/* =========================
   RANKING POR EQUIPES
========================= */

function mostrarRankingEquipes() {
    const equipes =
        calcularPontuacaoDasEquipes(
            participantes
        );

    rankingDescricao.textContent =
        "A pontuação representa a soma dos pontos de todos os integrantes.";

    rotuloQuantidade.textContent =
        "Equipes";

    quantidadeEquipesElemento.textContent =
        NOMES_EQUIPES.length;

    rankingElemento.className =
        "ranking-equipes";

    rankingElemento.innerHTML = "";

    equipes.forEach(
        (equipe, indice) => {
            const posicao =
                indice + 1;

            const item =
                document.createElement(
                    "article"
                );

            item.classList.add(
                "ranking-equipe-item",
                `ranking-posicao-${posicao}`
            );

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterPosicao(posicao)}
                </div>

                <div class="ranking-equipe-dados">
                    <strong>
                        ${escaparHTML(equipe.nome)}
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

function calcularPontuacaoDasEquipes(
    listaParticipantes
) {
    const equipes =
        NOMES_EQUIPES.map(
            nome => ({
                nome,
                pontos: 0
            })
        );

    listaParticipantes.forEach(
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
   RANKING INDIVIDUAL
========================= */

function mostrarRankingPessoas() {
    const pessoas =
        [...participantes].sort(
            (pessoaA, pessoaB) => {
                const pontosA =
                    Number(
                        pessoaA.pontos ?? 0
                    );

                const pontosB =
                    Number(
                        pessoaB.pontos ?? 0
                    );

                if (pontosB !== pontosA) {
                    return pontosB - pontosA;
                }

                return String(
                    pessoaA.nome ?? ""
                ).localeCompare(
                    String(
                        pessoaB.nome ?? ""
                    ),
                    "pt-BR"
                );
            }
        );

    rankingDescricao.textContent =
        "A classificação individual considera a pontuação total de cada participante.";

    rotuloQuantidade.textContent =
        "Pessoas";

    quantidadeEquipesElemento.textContent =
        pessoas.length;

    rankingElemento.className =
        "ranking-pessoas";

    rankingElemento.innerHTML = "";

    if (pessoas.length === 0) {
        rankingElemento.innerHTML = `
            <div class="ranking-vazio">
                <span>🚧</span>
                <p>Nenhum participante conectado.</p>
            </div>
        `;

        return;
    }

    pessoas.forEach(
        (pessoa, indice) => {
            const posicao =
                indice + 1;

            const item =
                document.createElement(
                    "article"
                );

            item.classList.add(
                "ranking-pessoa-item"
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

                <div class="ranking-pessoa-dados">
                    <strong>
                        ${escaparHTML(
                            pessoa.nome ??
                            "Participante"
                        )}
                    </strong>

                    <span>
                        ${escaparHTML(
                            pessoa.equipe ??
                            "Sem equipe"
                        )}
                    </span>
                </div>

                <div class="ranking-pessoa-pontos">
                    <strong>
                        ${formatarNumero(
                            Number(
                                pessoa.pontos ?? 0
                            )
                        )}
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
   RESUMO
========================= */

function atualizarResumoGeral() {
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

    quantidadeParticipantesElemento.textContent =
        participantes.length;

    totalPontosElemento.textContent =
        formatarNumero(totalPontos);
}

/* =========================
   ABAS
========================= */

function atualizarEstadoDasAbas() {
    const equipesAtivo =
        visualizacaoAtual === "equipes";

    botaoEquipes.classList.toggle(
        "ativa",
        equipesAtivo
    );

    botaoPessoas.classList.toggle(
        "ativa",
        !equipesAtivo
    );
}

/* =========================
   AUXILIARES
========================= */

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

function limparMensagemErro() {
    mensagemRankingElemento.textContent = "";

    mensagemRankingElemento.classList.remove(
        "mensagem-erro"
    );
}
