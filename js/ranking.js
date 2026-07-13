onSnapshot(
    collection(db,
    "participantes"),
    (snapshot)=>{

        let ranking = [];

        snapshot.forEach(doc=>{
            ranking.push(doc.data());
        });

        ranking.sort(
            (a,b)=>
            b.pontos-a.pontos
        );

        renderizar(ranking);
    }
);
