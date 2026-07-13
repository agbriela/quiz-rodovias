import {
    db
} from "./firebase-config.js";

import {
    collection,
    addDoc
} from
"https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

document
.getElementById("entrar")
.addEventListener("click", async () => {

    const nome =
        document.getElementById("nome").value;

    const equipe =
        document.getElementById("equipe").value;

    const doc = await addDoc(
        collection(db, "participantes"),
        {
            nome,
            equipe,
            pontos: 0
        }
    );

    localStorage.setItem(
        "participante",
        doc.id
    );

    location.href =
        "participante.html";
});
