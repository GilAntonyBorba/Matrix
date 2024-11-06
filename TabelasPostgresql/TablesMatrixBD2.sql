    CREATE TABLE IF NOT EXISTS Entidade (
        id_entidade INT PRIMARY KEY,
        nome_entidade VARCHAR(40) NOT NULL,
        tipo_entidade VARCHAR(255) NOT NULL,
        vida_entidade INT DEFAULT 100,
        data_criacao DATE DEFAULT NOW(),
        status_entidade VARCHAR(50) DEFAULT 'Ativo'
    );
    CREATE SEQUENCE IF NOT EXISTS entidade_seq
        AS INT
        INCREMENT BY 2
        START WITH 100
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Entidade.id_entidade;
    ;
    ALTER TABLE Entidade
    ALTER COLUMN id_entidade SET DEFAULT nextval('entidade_seq');



    CREATE TABLE IF NOT EXISTS Humanos (
        id_humano INT PRIMARY KEY,
        nome_humano VARCHAR(40) NOT NULL,
        -- idade_humano INT,
        data_nascimento TIMESTAMP DEFAULT NOW(),
        status_humano VARCHAR(50) DEFAULT 'online',
        resistencia INT DEFAULT 0 CHECK (resistencia >= 0),
        imagem BYTEA,
        tipo_imagem VARCHAR(10),
        data_upload TIMESTAMP DEFAULT NOW()
    );
    CREATE SEQUENCE IF NOT EXISTS humanos_seq
        AS INT
        INCREMENT BY 1
        START WITH 100
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Humanos.id_humano;
    ;
    ALTER TABLE Humanos
    ALTER COLUMN id_humano SET DEFAULT nextval('humanos_seq');



    CREATE TABLE IF NOT EXISTS Lugar (
        latitude DECIMAL(9,6) NOT NULL,
        longitude DECIMAL(9,6) NOT NULL,
        descricao VARCHAR(255),
        PRIMARY KEY (latitude, longitude)
    );



    CREATE TABLE IF NOT EXISTS Eventos (
        id_evento INT PRIMARY KEY,
        nome_evento VARCHAR(255) NOT NULL,
        tipo_evento VARCHAR(255) NOT NULL
    );
    CREATE SEQUENCE IF NOT EXISTS eventos_seq
        AS INT
        INCREMENT BY 10
        START WITH 100
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Eventos.id_evento;
    ;
    ALTER TABLE Eventos
    ALTER COLUMN id_evento SET DEFAULT nextval('eventos_seq');


    CREATE TABLE IF NOT EXISTS Estruturas (
        id_estrutura INT PRIMARY KEY,
        nome_estrutura VARCHAR(255) NOT NULL,
        tipo_estrutura VARCHAR(255) NOT NULL
    );
    CREATE SEQUENCE IF NOT EXISTS estruturas_seq
        AS INT
        INCREMENT BY 10
        START WITH 100
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Estruturas.id_estrutura;
    ;
    ALTER TABLE Estruturas
    ALTER COLUMN id_estrutura SET DEFAULT nextval('estruturas_seq');



    CREATE TABLE IF NOT EXISTS AI (
        id_AI INT PRIMARY KEY CHECK (id_AI >= 0),
        versao_AI VARCHAR(40) DEFAULT '1.0',
        nome_AI VARCHAR(40) NOT NULL,
        proposito_AI VARCHAR(255) DEFAULT 'Indefinido',
        status_AI VARCHAR(255) DEFAULT 'Ativo'
    );
    -- Não pode haver a SEQUENCE abaixo
    -- Pois: como ele iria inserir Agentes sem antes dar um select?
    -- CREATE SEQUENCE IF NOT EXISTS AI_seq
    -- 	AS INT
    -- 	INCREMENT BY 100
    -- 	START WITH 0
    -- 	MINVALUE 0
    -- 	NO MAXVALUE
    -- 	CACHE 5
    -- 	NO CYCLE
    -- 	OWNED BY AI.id_AI;
    -- ;
    -- ALTER TABLE AI
    -- ALTER COLUMN id_AI SET DEFAULT nextval('AI_seq');



    CREATE TABLE IF NOT EXISTS Agentes (
        nivel_agente INT DEFAULT 1 CHECK (nivel_agente >= 0),
        codigo_agente INT UNIQUE,
        nivel_autonomia INT DEFAULT 1,
        fk_id_AI INT NOT NULL,
        CONSTRAINT to_fk_id_AI_Agentes FOREIGN KEY (fk_id_AI) REFERENCES AI (id_AI),
        CONSTRAINT to_pk_codigo_agente_fk_id_AI PRIMARY KEY (codigo_agente, fk_id_AI)
    );
    CREATE SEQUENCE IF NOT EXISTS agentes_seq
        AS INT
        INCREMENT BY 1
        START WITH 100
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Agentes.codigo_agente;
    ;
    ALTER TABLE Agentes
    ALTER COLUMN codigo_agente SET DEFAULT nextval('agentes_seq');




    CREATE TABLE IF NOT EXISTS Habilidades (
        nome_habilidade VARCHAR(255) PRIMARY KEY,
        nivel_habilidade INT NOT NULL CHECK (nivel_habilidade >= 1)
    );



    CREATE TABLE IF NOT EXISTS Afinidade (
        fk_id_entidade INT REFERENCES Entidade (id_entidade) ON DELETE CASCADE,
        fk_id_humano INT REFERENCES Humanos (id_humano) ON DELETE CASCADE,
        nivel_afinidade INT NOT NULL,
        tipo_afinidade VARCHAR(255) NOT NULL,
        CONSTRAINT to_pk_fk_id_entidade_fk_id_humano PRIMARY KEY (fk_id_entidade, fk_id_humano)
    );



    CREATE TABLE IF NOT EXISTS Relacionam (
        fk_id_humano INT,
        fk_id_AI INT NULL,
        data_interacao DATE DEFAULT NOW(),
        tipo_interacao VARCHAR(255) NOT NULL,
        CONSTRAINT to_fk_id_humano_relacionam FOREIGN KEY (fk_id_humano) REFERENCES Humanos (id_humano) ON DELETE CASCADE,
        CONSTRAINT to_fk_id_AI_relacionam FOREIGN KEY (fk_id_AI) REFERENCES AI (id_AI) ON DELETE SET NULL
    );



    CREATE TABLE IF NOT EXISTS Utiliza (
        fk_id_AI INT,
        fk_nome_habilidade VARCHAR(255),
        CONSTRAINT to_fk_id_AI_Utiliza FOREIGN KEY (fk_id_AI) REFERENCES AI (id_AI) ON DELETE CASCADE,
        CONSTRAINT to_fk_nome_habilidade_Utiliza FOREIGN KEY (fk_nome_habilidade) REFERENCES Habilidades (nome_habilidade) ON DELETE CASCADE
    );



    CREATE TABLE IF NOT EXISTS Presente (
        fk_latitude DECIMAL(9,6),
        fk_longitude DECIMAL(9,6),
        fk_id_humano INT,
        data_fim TIMESTAMP,
        data_inicio TIMESTAMP DEFAULT NOW(),
        CONSTRAINT to_fk_lugar_presente FOREIGN KEY (fk_latitude, fk_longitude) REFERENCES Lugar (latitude, longitude),
        CONSTRAINT to_fk_humanos_presente FOREIGN KEY (fk_id_humano) REFERENCES Humanos (id_humano) ON DELETE CASCADE
    );



    CREATE TABLE IF NOT EXISTS Acontece (
        fk_latitude DECIMAL(9,6),
        fk_longitude DECIMAL(9,6),
        fk_id_evento INT,
        data_inicio_evento DATE DEFAULT NOW(),
        data_fim_evento DATE,
        CONSTRAINT to_fk_lugar_acontece FOREIGN KEY (fk_latitude, fk_longitude) REFERENCES Lugar (latitude, longitude) ON DELETE CASCADE,
        CONSTRAINT to_fk_evento_acontece FOREIGN KEY (fk_id_evento) REFERENCES Eventos (id_evento) ON DELETE CASCADE
    );



    CREATE TABLE IF NOT EXISTS Existe (
        fk_latitude DECIMAL(9,6),
        fk_longitude DECIMAL(9,6),
        fk_id_estrutura INT REFERENCES Estruturas (id_estrutura) ON DELETE CASCADE,
        estado_estrutura VARCHAR(50),
        CONSTRAINT to_fk_lugar_existe FOREIGN KEY (fk_latitude, fk_longitude) REFERENCES Lugar (latitude, longitude)
    );



    CREATE TABLE IF NOT EXISTS ResponsavelPor (
        fk_codigo_agente INT,
        fk_latitude DECIMAL(9,6),
        fk_longitude DECIMAL(9,6),
        CONSTRAINT to_fk_lugar_ResponsavelPor FOREIGN KEY (fk_latitude, fk_longitude) REFERENCES Lugar (latitude, longitude) ON DELETE CASCADE,
        CONSTRAINT to_fk_codigo_agente_ResponsavelPor FOREIGN KEY (fk_codigo_agente) REFERENCES Agentes (codigo_agente) ON DELETE CASCADE
    );

    


    INSERT INTO Entidade (nome_entidade, tipo_entidade, vida_entidade, status_entidade)
    VALUES 
        ('Cães de Guarda', 'Animais Domésticos', 80, 'Vigilantes'),
        ('Gatos de Rua', 'Animais Selvagens', 90, 'Caçadores'),
        ('Pombos Urbanos', 'Aves', 70, 'Observadores'),
        ('Ratos de Esgoto', 'Roedores', 60, 'Exploradores'),
        ('Morcegos Noturnos', 'Mamíferos Voadores', 85, 'Navegadores');

    INSERT INTO Humanos (id_humano, nome_humano, data_nascimento, status_humano, resistencia)
    VALUES 
        (1, 'Neo', '1977-09-13', 'Online', 80),
        (2, 'Trinity', '1980-05-27', 'Online', 85),
        (3, 'Morpheus', '1965-03-17', 'Offline', 70),
        (4, 'Tank', '1972-08-12', 'Offline', 60),
        (5, 'Apoc', '1975-06-30', 'Offline', 65);
        

    INSERT INTO Lugar (latitude, longitude, descricao)
    VALUES 
        (-33.8679, 151.2073, 'Sydney, Austrália'),
        (37.7749, -122.4194, 'San Francisco, EUA'),
        (51.5074, -0.1278, 'Londres, Reino Unido'),
        (48.8566, 2.3522, 'Paris, França'),
        (35.6895, 139.7670, 'Tóquio, Japão');

    INSERT INTO Eventos (id_evento, nome_evento, tipo_evento)
    VALUES 
        (1,'Primeira Consciencialização', 'Despertar'),
        (2,'Encontro com Morpheus', 'Revelação'),
        (3,'Treinamento na Simulação', 'Preparação'),
        (4,'Batalha contra Agent Smith', 'Combate'),
        (5,'Viagem à Cidade das Máquinas', 'Exploração');

    INSERT INTO Estruturas (id_estrutura, nome_estrutura, tipo_estrutura)
    VALUES 
        (1, 'Nebuchadnezzar', 'Navio'),
        (2, 'Zion', 'Cidade Subterrânea'),
        (3, 'Templo do Oráculo', 'Edifício'),
        (4, 'Clube Hel', 'Local de Entretenimento'),
        (5, 'Complexo de Produção Humana', 'Fábrica');

    INSERT INTO AI (id_AI, versao_AI, nome_AI, proposito_AI, status_AI)
    VALUES 
        (1, '1.0', 'Oráculo', 'Assessoria', 'Ativo'),
        (2, '2.0', 'Agente Smith', 'Segurança', 'Ativo'),
        (3, '1.5', 'Merovíngio', 'Controle de Sistemas', 'Dormindo'),
        (4, '2.5', 'Rogue Program', 'Manutenção', 'Ativo'),
        (5, '1.2', 'Trainman', 'Controle de Transporte', 'Ativo');

    INSERT INTO Agentes (nivel_agente, codigo_agente, nivel_autonomia, fk_id_AI)
    VALUES 
        (1, 101, 5, 2),
        (2, 102, 5, 2),
        (3, 103, 5, 2),
        (1, 201, 3, 3),
        (2, 301, 4, 4);


    INSERT INTO Habilidades (nome_habilidade, nivel_habilidade)
    VALUES 
        ('Hackeamento Avançado', 5),
        ('Luta Corporal', 4),
        ('Conhecimento de Sistemas', 3),
        ('Invisibilidade Temporária', 2),
        ('Manipulação de Código', 1),
        ('Hackear o computador da Mirella ', 10);

    -- INSERT INTO Afinidade (fk_id_entidade, fk_id_humano, nivel_afinidade, tipo_afinidade)
    -- VALUES 
    --     (1, 1, 8, 'Empático'),
    --     (2, 2, 6, 'Intelectual'),
    --     (3, 3, 7, 'Emocional'),
    --     (4, 4, 5, 'Prático'),
    --     (5, 5, 9, 'Espiritual');

    INSERT INTO Relacionam (fk_id_humano, fk_id_AI, data_interacao, tipo_interacao)
    VALUES 
        (1, 1, '2023-01-01', 'Confronto'),
        (2, 2, '2023-02-15', 'Negociação'),
        (3, 3, '2023-03-20', 'Cooperação'),
        (4, 4, '2023-04-10', 'Investigação'),
        (5, 5, '2023-05-25', 'Recrutamento');


    INSERT INTO Utiliza (fk_id_AI, fk_nome_habilidade)
    VALUES 
        (1, 'Hackeamento Avançado'),
        (2, 'Manipulação de Código'),
        (3, 'Conhecimento de Sistemas'),
        (4, 'Luta Corporal'),
        (5, 'Invisibilidade Temporária'); -- gil isso aqui é do filme 2 caso esteja se perguntando

    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES 
        (-33.8679, 151.2073, 1, '2023-01-01'),
        (37.7749, -122.4194, 2, '2023-02-15'),
        (51.5074, -0.1278, 3, '2023-03-20'),
        (48.8566, 2.3522, 4, '2023-04-10'),
        (35.6895, 139.7670, 5, '2023-05-25');


    INSERT INTO Acontece (fk_latitude, fk_longitude, fk_id_evento, data_inicio_evento, data_fim_evento)
    VALUES 
        (-33.8679, 151.2073, 1, '2023-01-01', '2023-01-31'),
        (37.7749, -122.4194, 2, '2023-02-15', '2023-03-15'),
        (51.5074, -0.1278, 3, '2023-03-20', '2023-04-20'),
        (48.8566, 2.3522, 4, '2023-04-10', '2023-05-10'),
        (35.6895, 139.7670, 5, '2023-05-25', '2023-06-24');


    INSERT INTO Existe (fk_latitude, fk_longitude, fk_id_estrutura, estado_estrutura)
    VALUES 
        (-33.8679, 151.2073, 1, 'Operacional'),
        (37.7749, -122.4194, 2, 'Em Construção'),
        (51.5074, -0.1278, 3, 'Desativado'),
        (48.8566, 2.3522, 4, 'Manutenção'),
        (35.6895, 139.7670, 5, 'Seguro');


    INSERT INTO ResponsavelPor (fk_codigo_agente, fk_latitude, fk_longitude)
    VALUES 
        (101, -33.8679, 151.2073),
        (102, 37.7749, -122.4194),
        (103, 51.5074, -0.1278),
        (201, 48.8566, 2.3522),
        (301, 35.6895, 139.7670);











    INSERT INTO Humanos (nome_humano, data_nascimento, status_humano, resistencia)
    VALUES 
        ('Gil', '2004-04-04', 'Online', 44),
        ('Ezio', '2003-03-03', 'Online', 33),
        ('Marcelo', '2002-02-02', 'Online', 55),
        ('Akemi', '2005-05-05', 'Offline', 22);
    INSERT INTO Humanos (nome_humano, data_nascimento, status_humano, resistencia)
    VALUES 
        ('Joao Gabriel', '2006-06-06', 'Online', 1),
        ('Julia Veloso', '2008-03-29', 'Online', 26),
        ('Igao', '2009-09-09', 'Offline', 15),
        ('Bahia', '2010-10-10', 'Offline', 16),
		('Matheus', '2011-11-11', 'Online', 17);







    CREATE OR REPLACE VIEW View_Humanos_Interacao_AI AS
    SELECT h.nome_humano, h.id_humano, r.tipo_interacao, r.data_interacao, ai.id_AI, ai.nome_AI
    FROM Humanos h JOIN Relacionam r ON h.id_humano = r.fk_id_humano JOIN AI ai ON r.fk_id_AI = ai.id_AI;

    CREATE OR REPLACE VIEW View_Humanos_Presentes AS
    SELECT h.nome_humano, h.id_humano, p.fk_latitude AS latitude_local, p.fk_longitude AS longitude_local, l.descricao AS descricao_local, p.data_inicio, p.data_fim
    FROM Humanos h JOIN Presente p ON h.id_humano = p.fk_id_humano JOIN Lugar l ON p.fk_latitude = l.latitude AND p.fk_longitude = l.longitude
    ORDER BY h.id_humano, p.data_inicio;


    --Procedure para adicionar um novo evento e associá-lo a um local:
    CREATE OR REPLACE PROCEDURE adicionar_evento_e_local(
        p_nome_evento VARCHAR(255),
        p_tipo_evento VARCHAR(255),
        p_latitude DECIMAL(9,6),
        p_longitude DECIMAL(9,6),
        p_descricao_lugar VARCHAR(255)
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        lugar_id INT;
        evento_id INT;
    BEGIN
        
        INSERT INTO Lugar (latitude, longitude, descricao)
        VALUES (p_latitude, p_longitude, p_descricao_lugar)
        ON CONFLICT (latitude, longitude) DO UPDATE SET descricao = p_descricao_lugar
        RETURNING id INTO lugar_id;

        
        INSERT INTO Eventos (nome_evento, tipo_evento)
        VALUES (p_nome_evento, p_tipo_evento)
        RETURNING id_evento INTO evento_id;

        -- Associa o evento ao local
        INSERT INTO Acontece (fk_latitude, fk_longitude, fk_id_evento, data_inicio_evento)
        VALUES (p_latitude, p_longitude, evento_id, CURRENT_DATE);

        
        RAISE NOTICE 'Evento % adicionado com sucesso.', p_nome_evento;
    END;
    $$;

    --Procedure para atualizar o status de múltiplos agentes:
    -- Sendo utilizado no Update
    CREATE OR REPLACE PROCEDURE atualizar_status_agentes(
        p_ids_ai INT[],
        p_novo_status VARCHAR(255)
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        UPDATE AI
        SET status_AI = p_novo_status
        WHERE id_AI = ANY(p_ids_ai);

        RAISE NOTICE '% agentes atualizados para o status "%".', array_length(p_ids_ai, 1), p_novo_status;
    END;
    $$;

    --TRIGGERS
    
    --Trigger para logar alterações nos status dos agentes:
    CREATE TABLE IF NOT EXISTS Log_Status_Agentes (
        id_log INT PRIMARY KEY,
        id_AI INT,
        antigo_status VARCHAR(255),
        novo_status VARCHAR(255),
        data_alteracao TIMESTAMP
    );
    CREATE SEQUENCE IF NOT EXISTS Log_Status_Agentes_seq
        AS INT
        INCREMENT BY 1
        START WITH 1
        MINVALUE 0
        NO MAXVALUE
        CACHE 5
        NO CYCLE
        OWNED BY Log_Status_Agentes.id_log;
    ;
    ALTER TABLE Log_Status_Agentes
    ALTER COLUMN id_log SET DEFAULT nextval('Log_Status_Agentes_seq');

    CREATE OR REPLACE FUNCTION logar_alteracao_status_agente()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.status_AI <> OLD.status_AI THEN
            INSERT INTO Log_Status_Agentes (id_AI, antigo_status, novo_status, data_alteracao)
            VALUES (OLD.id_AI, OLD.status_AI, NEW.status_AI, CURRENT_TIMESTAMP);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_logar_alteracao_status_agente
    AFTER UPDATE OF status_AI ON AI
    FOR EACH ROW EXECUTE FUNCTION logar_alteracao_status_agente();



    --Trigger para atualizar automaticamente o status de um agente quando seu nível de autonomia aumenta
    CREATE OR REPLACE FUNCTION atualizar_status_autonomia()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.nivel_autonomia > OLD.nivel_autonomia THEN
            IF NEW.nivel_autonomia <= 3 THEN
                UPDATE AI
                SET status_AI = 'Supervisionado'
                WHERE id_AI = NEW.fk_id_AI;
            ELSIF NEW.nivel_autonomia BETWEEN 4 AND 6 THEN
                UPDATE AI
                SET status_AI = 'Autônomo'
                WHERE id_AI = NEW.fk_id_AI;
            ELSE
                UPDATE AI
                SET status_AI = 'Perigosamente Autônomo'
                WHERE id_AI = NEW.fk_id_AI;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE TRIGGER trigger_atualizar_status_autonomia
    AFTER UPDATE OR INSERT ON Agentes
    FOR EACH ROW EXECUTE FUNCTION atualizar_status_autonomia();





    --Trigger para atualizar o campo data_fim do registro anterior do humano na tabela Presente sempre que um novo registro for inserido para o mesmo humano
    CREATE OR REPLACE FUNCTION atualizar_data_fim()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE Presente
        SET data_fim = NEW.data_inicio
        WHERE fk_id_humano = NEW.fk_id_humano AND data_fim IS NULL;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_atualizar_data_fim
    BEFORE INSERT ON Presente
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_fim();

    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES (-33.8679, 151.2073, 1, '2023-01-01 09:30:00');
        
    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES (37.7749, -122.4194, 2, '2023-02-15 10:00:00');


    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES (51.5074, -0.1278, 3, '2023-03-20 12:15:00');

    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES (48.8566, 2.3522, 4, '2023-04-11 07:00:00');

    INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
    VALUES (35.6895, 139.7670, 5, '2023-06-25 11:30:00');


    --Transações  
    DO $$
    DECLARE
        agente_codigo INT;
        humano_id INT;
    BEGIN
        -- Iniciar a transação
        BEGIN
            -- Adicionar novo agente e capturar o código do agente
            INSERT INTO Agentes (nivel_agente, nivel_autonomia, fk_id_AI)
            VALUES (1, 1, 1)
            RETURNING codigo_agente INTO agente_codigo;

            -- Associar o agente a um humano aleatório e capturar o ID do humano
            INSERT INTO Relacionam (fk_id_humano, fk_id_AI, tipo_interacao)
            VALUES (
                (SELECT id_humano FROM Humanos ORDER BY RANDOM() LIMIT 1),
                1,
                'Monitoramento'
            )
            RETURNING fk_id_humano INTO humano_id;

            -- Atualizar o status do agente
            CALL atualizar_status_agentes(ARRAY[agente_codigo], 'Novo Agente');

            -- Commitar a transação
            COMMIT;
        EXCEPTION
            WHEN OTHERS THEN
                -- Em caso de erro, fazer rollback
                ROLLBACK;
                RAISE NOTICE 'Transação falhou: %', SQLERRM;
        END;
    END $$;


    --Transação para mover um grupo de humanos para um novo local:
    BEGIN;
        -- Selecionar humanos aleatórios
        SELECT ARRAY_AGG(id_humano) INTO :humanos_mover
        FROM Humanos
        ORDER BY RANDOM()
        LIMIT 5;

        -- Obter coordenadas aleatórias para o novo local
        SELECT random() * 180 - 90, random() * 360 - 180 INTO :nova_lat, :nova_long;

        -- Adicionar novo local
        INSERT INTO Lugar (latitude, longitude, descricao)
        VALUES (:nova_lat, :nova_long, 'Novo Esconderijo')
        ON CONFLICT (latitude, longitude) DO UPDATE SET descricao = 'Novo Esconderijo';

        -- Mover humanos para o novo local
        INSERT INTO Presente (fk_latitude, fk_longitude, fk_id_humano, data_inicio)
        SELECT :nova_lat, :nova_long, id_humano, CURRENT_TIMESTAMP
        FROM unnest(:humanos_mover) AS id_humano
        ON CONFLICT (fk_latitude, fk_longitude, fk_id_humano) DO UPDATE SET data_inicio = CURRENT_TIMESTAMP;

        -- Criar evento de movimentação
        PERFORM adicionar_evento_e_local('Movimentação de Grupo', 'Estratégico', :nova_lat, :nova_long, 'Novo Esconderijo');

        -- Commitar a transação
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE NOTICE 'Transação falhou: %', SQLERRM;
    END;


    

    

    

    

    
