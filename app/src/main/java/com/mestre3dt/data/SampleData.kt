package com.mestre3dt.data

val sampleCampaigns = listOf(
    Campaign(
        title = "A Cidade em Perigo",
        synopsis = "Os heróis precisam descobrir quem está drenando a energia mágica do distrito central.",
        genre = "Fantasia Urbana",
        arcs = listOf(
            Arc(
                title = "Sinais Estranhos",
                scenes = listOf(
                    Scene(
                        name = "Chegada à Cidade",
                        objective = "Apresentar o cenário e os NPCs principais",
                        mood = "leve",
                        opening = "As luzes da cidade oscilam enquanto vocês atravessam o portão principal.",
                        hooks = listOf("Guardas comentam sobre apagões", "Um informante oferece pistas por moedas"),
                        triggers = listOf(
                            RollTrigger(
                                situation = "Interrogar o taverneiro sobre os apagões",
                                testType = "Persuasão",
                                attribute = "Habilidade",
                                difficulty = "12",
                                onSuccess = "Ele revela que a Guilda dos Tecnomantes foi vista perto das docas.",
                                onFailure = "Ele desconversa e muda de assunto para fofocas locais."
                            )
                        )
                    ),
                    Scene(
                        name = "Patrulha Noturna",
                        objective = "Mostrar a gravidade das perdas de energia",
                        mood = "tenso",
                        opening = "As ruas estão quase vazias e os postes de luz falham a cada rajada de vento.",
                        hooks = listOf("Um grupo de bandidos tenta assaltar o grupo", "Sons metálicos ecoam próximos"),
                        triggers = listOf(
                            RollTrigger(
                                situation = "Perceber drones de vigilância desligados",
                                testType = "Percepção",
                                attribute = "Habilidade",
                                difficulty = "Teste oposto 10",
                                onSuccess = "Você nota marcas de ferrugem e um símbolo da Guilda.",
                                onFailure = "Os drones passam despercebidos, e vocês são seguidos."
                            )
                        )
                    )
                )
            ),
            Arc(
                title = "Confronto Final",
                scenes = listOf(
                    Scene(
                        name = "Laboratório Subterrâneo",
                        objective = "Interromper o ritual de drenagem",
                        mood = "clímax",
                        opening = "Runas brilham no chão enquanto cabos pulsantes levam energia ao centro da sala.",
                        hooks = listOf("Encontrar uma alavanca de emergência", "Sabotar geradores laterais"),
                        triggers = listOf(
                            RollTrigger(
                                situation = "Convencer um tecnomante a desistir",
                                testType = "Intimidação",
                                attribute = "Habilidade",
                                difficulty = "14",
                                onSuccess = "O tecnomante foge, enfraquecendo o ritual.",
                                onFailure = "Ele ativa defensas automáticas para ganhar tempo."
                            )
                        )
                    )
                )
            )
        )
    )
)

val sampleNpcs = listOf(
    Npc(
        name = "Mestre Haru",
        role = "Mentor e informante",
        personality = listOf("sereno", "pragmático", "atento"),
        speechStyle = "fala pausada e respeitosa",
        mannerisms = listOf("ajusta os óculos", "observa em silêncio antes de responder"),
        goal = "Manter a cidade segura e treinar novos guardiões",
        secrets = mapOf(
            0 to "Sempre aceita chá como presente.",
            1 to "Tem um mapa parcial dos túneis.",
            2 to "Conhece um traidor dentro da guilda.",
            3 to "Guardou um artefato proibido para estudar."
        ),
        quickPhrases = listOf(
            "Pensem antes de agir, mas não hesitem quando decidirem.",
            "Conhecimento é a lâmina mais afiada.",
            "Nem tudo é o que parece sob estas luzes."
        ),
        triggers = listOf(
            RollTrigger(
                situation = "Pedir detalhes sobre a guilda",
                testType = "Persuasão",
                attribute = "Habilidade",
                difficulty = "12",
                onSuccess = "Ele revela o símbolo usado pelos iniciados.",
                onFailure = "Ele apenas comenta que são perigosos e fecha o assunto."
            )
        )
    ),
    Npc(
        name = "Rina das Docas",
        role = "Informante de rua",
        personality = listOf("astuta", "desconfiada", "leal"),
        speechStyle = "cheia de gírias e risadinhas",
        mannerisms = listOf("mastiga chiclete", "fica de olho em rotas de fuga"),
        goal = "Proteger sua gangue e ganhar alguns trocados",
        secrets = mapOf(
            0 to "Vende mapas simples dos canais.",
            1 to "Sabe quem subornou guardas recentemente.",
            2 to "Tem acesso a um esconderijo da Guilda.",
            3 to "Está sendo chantageada por um tecnomante."
        ),
        quickPhrases = listOf(
            "Fica esperto, grandão.",
            "Tenho algo que pode te interessar... por um preço.",
            "Não me mete em confusão, tá?"
        ),
        triggers = listOf(
            RollTrigger(
                situation = "Convencer a revelar o esconderijo",
                testType = "Persuasão",
                attribute = "Habilidade",
                difficulty = "13",
                onSuccess = "Ela marca o local exato num papel amassado.",
                onFailure = "Ela diz que esqueceu e some na multidão."
            )
        )
    )
)

val sampleEnemies = listOf(
    Enemy(
        name = "Tecnomante Chefe",
        tags = listOf("chefe", "humano"),
        attributes = EnemyAttributes(strength = 1, skill = 4, resistance = 3, armor = 1, firepower = 3),
        maxHp = 20,
        currentHp = 18,
        maxMp = 15,
        currentMp = 12,
        powers = listOf(
            Power(
                name = "Pulso Elétrico",
                description = "Dano em área e possível atordoamento.",
                mpCost = 4,
                target = "Alvos múltiplos",
                testReminder = "Resistência para evitar atordoamento",
                onSuccess = "Inimigos perdem a próxima ação.",
                onFailure = "Os inimigos resistem, sofrendo apenas o dano."
            ),
            Power(
                name = "Campo Defletor",
                description = "Aumenta Armadura temporariamente.",
                mpCost = 3,
                target = "Próprio",
                testReminder = null,
                onSuccess = "+2 Armadura por 2 rodadas.",
                onFailure = null
            )
        )
    ),
    Enemy(
        name = "Capanga Blindado",
        tags = listOf("capanga", "ciborgue"),
        attributes = EnemyAttributes(strength = 3, skill = 2, resistance = 4, armor = 2, firepower = 1),
        maxHp = 15,
        currentHp = 15,
        maxMp = null,
        currentMp = null,
        powers = listOf(
            Power(
                name = "Socar e Derrubar",
                description = "Empurra e tenta derrubar o alvo.",
                mpCost = null,
                target = "Único",
                testReminder = "Habilidade oposta para evitar queda",
                onSuccess = "Alvo derrubado, perde metade do movimento.",
                onFailure = "Alvo mantém posição."
            )
        )
    )
)

val sampleSoundScenes = listOf(
    SoundScene(
        name = "Taverna Viva",
        backgroundFile = "taverna_fundo.mp3",
        effects = listOf(
            SoundEffect("Copos", "copos.mp3"),
            SoundEffect("Porta Rangendo", "porta.mp3"),
            SoundEffect("Risos", "risos.mp3")
        )
    ),
    SoundScene(
        name = "Floresta Noturna",
        backgroundFile = "floresta_noite.mp3",
        effects = listOf(
            SoundEffect("Coruja", "coruja.mp3"),
            SoundEffect("Passos na folha", "folhas.mp3")
        )
    )
)

val sampleNotes = listOf(
    SessionNote(text = "Grupo fez acordo rápido com Rina.", important = true),
    SessionNote(text = "Anotaram símbolos estranhos nos drones.", important = false)
)
