require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // para processar os dados enviados pelo formulário
const session = require('express-session');
const { Client } = require('pg');
const format = require('pg-format')
const argon2 = require('argon2');
const multer = require('multer'); 
const { redirect } = require('statuses');


const app = express();
app.use(cors());  // Habilita CORS para permitir requisições do front-end

app.use(bodyParser.json());  // Para processar JSON
app.use(bodyParser.urlencoded({ extended: true }));  //permite que o servidor Express processe dados de formulários HTML, enviados via POST

// Serve arquivos estáticos da pasta "src"
app.use(express.static('src'));



// Superuser credentials to create and manage users
const superuserConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};


// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(
    session({
        secret: process.env.SECRET ,
        resave: false,
        saveUninitialized: false,
    })

);

// cria novo postgres user
async function createUser(username, password) {
    const client = new Client(superuserConfig);
    await client.connect();
    try {
        const query = format('CREATE USER %I WITH PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I; GRANT SELECT ON ALL TABLES IN SCHEMA public TO %I;', username, password, username, username, username);
        await client.query(query);
        
        console.log(`User ${username} created successfully.`);
    } catch (error) {
        console.error(`Error creating user ${username}:`, error.message);
        throw new Error("This account could not be created. Username may already be taken.");
    } finally {
        await client.end();
    }
}

// roteia pra pagina login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// lida com login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // tenta conectar como usuario postgres
    const userConfig = {
        user: username,
        host: 'localhost',
        database: 'postgres',
        password: password,
        port: 5432,
    };

    const client = new Client(userConfig);
    try {
        await client.connect();
        req.session.userId = username; // usuario na seccao
        req.session.password = password;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(`Login error for user ${username}:`, error.message);
        res.render('login', { error: 'Invalid username or password' });
    } finally {
        await client.end();
    }
});

// roteia pra signup
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// lida com signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        await createUser(username, password);
        res.redirect('/login');
    } catch (error) {
        res.render('signup', { error: error.message });
    }
});

//  rota Dashboard, requere login
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('dashboard', { user: req.session.userId });
});

// rota Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


// Rota para pegar os dados dos usuários, incluindo imagens
// app.get('/usuarios', async (req, res) => {
//     // const query = `
//     //   SELECT id_user, login, imagem, tipo_imagem
//     //   FROM Usuario
//     //   ORDER BY id_user ASC
//     // `;
//     const query = `
//       SELECT id_user, login, imagem, tipo_imagem, data_upload
//       FROM Usuario
//       ORDER BY data_upload DESC
//       LIMIT 10
//     `;

//     const client = new Client({
//    user: req.session.userId,
//    host: process.env.DB_HOST,
//    database: process.env.DB_NAME,
//    password: req.session.password,
//    port: process.env.DB_PORT,
//  });
//     await client.connect();
  
//     try {
//       const result = await client.query(query);
//       const usuarios = result.rows.map(usuario => {
//         // Converte a imagem de binário para base64(formato que pode ser manipulado) se ela existir
//         //base64 é usada para representar dados binários em uma string de texto, o que facilita o envio de imagens para o front-end.
//         if (usuario.imagem) {
//           usuario.imagem = Buffer.from(usuario.imagem).toString('base64');
//         }
//         return usuario;
//       });
//       res.json(usuarios); // Retorna os dados em formato JSON
//     } catch (error) {
//       console.error('Erro ao buscar usuários e imagens', error.stack);
//       res.status(500).send('Erro ao buscar usuários e imagens');
//     }
//   });

  // Rota para pegar os dados dos usuários, incluindo imagens
  app.get('/humanos', async (req, res) => {
      if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

      const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
      await client.connect();

      // const query = `
      //   SELECT id_humano, nome_humano, data_nascimento, status_humano, resistencia, imagem, tipo_imagem, data_upload
      //   FROM Humanos
      //   ORDER BY data_upload DESC
      //   LIMIT 10
      // `;
      const query = `
        SELECT id_humano, nome_humano, TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, status_humano, resistencia, imagem, tipo_imagem, TO_CHAR(data_upload, 'YYYY-MM-DD HH24:MI:SS') AS data_upload
        FROM Humanos
        ORDER BY data_upload DESC
        LIMIT 10
      `;

      try {
          const result = await client.query(query);
          const humanos = result.rows.map(humano =>  {
            // Converte a imagem de binário para base64(formato que pode ser manipulado) se ela existir
            //base64 é usada para representar dados binários em uma string de texto, o que facilita o envio de imagens para o front-end.
            if (humano.imagem) {
              humano.imagem = Buffer.from(humano.imagem).toString('base64');
            }
            return humano;
          });
          res.json(humanos);
      } catch (error) {
          console.error('Erro ao buscar humanos:', error);
          res.status(500).json({ error: 'Falha ao recuperar humanos' });
      } finally {
          await client.end();
      }
  });


  // Configuração do multer para upload de arquivos
  const storage = multer.memoryStorage(); // Armazena o arquivo na memória do servidor temporariamente
  const upload = multer({
    storage: storage, // Usa o armazenamento configurado acima
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de tamanho do arquivo (1 MB = 1024 KB e 1 KB = 1024 bytes)
    fileFilter: (req, file, cb) => { // Função para limitar tipos de arquivos
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Aceita o arquivo
      } else {
        cb(new Error("Tipo de arquivo inválido! Apenas JPG, PNG, GIF e MP4 são permitidos."), false);
      }
    }
  });
  // Rota para upload de imagem de usuário
app.post('/uploadImage', (req, res) => {
    
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

   

    upload.single('imagem_do_formData')(req, res, async (err) => { // upload.single('imagem_do_formData') significa que a rota espera um arquivo no campo imagem_do_formData, upload.single processa apenas um arquivo por vez
      //(req, res, async (err) => { ... }) chamada após o multer processar o arquivo
  
      if (err instanceof multer.MulterError) {
        return res.status(400).send('O arquivo ultrapassa o tamanho máximo permitido de 10MB!');
      } else if (err) {
        return res.status(400).send(err.message); // Erro de tipo de arquivo
      }
    
      const {id_user} = req.body;
      const imagem = req.file;
  
      if (!id_user || !imagem) {
        return res.status(400).send('ID de usuário e imagem são obrigatórios!');
      }
  
      const client = new Client({
      user: req.session.userId,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: req.session.password,
      port: process.env.DB_PORT,
      });
      await client.connect();

      try {
        const tipoImagem = imagem.mimetype.split('/')[1]; // extrai "jpeg", "png", etc...
  
        const query = `
          UPDATE Humanos 
          SET imagem = $1, tipo_imagem = $2, data_upload = NOW()
          WHERE id_humano = $3
        `;
        
        await client.query(query, [imagem.buffer, tipoImagem, id_user]); //O buffer do arquivo contém os dados binários da imagem
  
        res.status(200).send('Imagem carregada com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar imagem', error);
        res.status(500).send('Erro ao salvar imagem!');
      }
    });
  });





//--------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------DELETE--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------

  

  // app.get('/delete', (req, res) => {
  //   res.render('delete');
  // });

  app.get('/delete', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.render('delete', { user: req.session.userId });
  });

  // DELETE HUMANO

  app.delete('/deleteHumano/:id', async (req, res) => {
    const humanoId = req.params.id;
    const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
    await client.connect();

    try {
        const result = await client.query('DELETE FROM Humanos WHERE id_humano = $1', [humanoId]);

        if (result.rowCount > 0) {
            res.status(200).send('Humano deletado com sucesso');
        } else {
            res.status(404).send('Humano não encontrado');
        }
    } catch (error) {
        console.error('Erro ao deletar humano:', error);
        res.status(500).send('Erro no servidor');
    } finally {
        await client.end();
    }
  });

  // DELETE EVENTO
  app.delete('/deleteEvento/:id', async (req, res) => {
    const eventoId = req.params.id;
    const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
    await client.connect();

    try {
        const result = await client.query('DELETE FROM Eventos WHERE id_evento = $1', [eventoId]);

        if (result.rowCount > 0) {
            res.status(200).send('Evento deletado com sucesso');
        } else {
            res.status(404).send('Evento não encontrado');
        }
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        res.status(500).send('Erro no servidor');
    } finally {
        await client.end();
    }
  });


  // DELETE AI
  app.delete('/deleteAI/:id', async (req, res) => {
    const idAI = req.params.id;
    const client = new Client({
        user: req.session.userId,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: req.session.password,
        port: process.env.DB_PORT,
    });
    await client.connect();

    try {
        const result = await client.query('DELETE FROM AI WHERE id_AI = $1', [idAI]);

        if (result.rowCount > 0) {
            res.status(200).send('AI deletada com sucesso');
        } else {
            res.status(404).send('AI não encontrada');
        }
    } catch (error) {
        console.error('Erro ao deletar AI:', error);
        res.status(500).send('Erro no servidor');
    } finally {
        await client.end();
    }
  });


  // DELETE AGENTE
  app.delete('/deleteAgente/:codigoAgente', async (req, res) => {
    const codigoAgente = req.params.codigoAgente;
    const client = new Client({
        user: req.session.userId,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: req.session.password,
        port: process.env.DB_PORT,
    });
    await client.connect();

    try {
        const result = await client.query('DELETE FROM Agentes WHERE codigo_agente = $1', [codigoAgente]);

        if (result.rowCount > 0) {
            res.status(200).send('Agente deletado com sucesso');
        } else {
            res.status(404).send('Agente não encontrado');
        }
    } catch (error) {
        console.error('Erro ao deletar agente:', error);
        res.status(500).send('Erro no servidor');
    } finally {
        await client.end();
    }
  });

  







//--------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------UPDATE--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------

// update
// Rota para renderizar a página update.ejs
app.get('/update', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login'); 
  res.render('update', { user: req.session.userId }); 
});


// UPDATE HUMANO
app.put('/updateHumano/:id', upload.single('imagem'), async (req, res) => {
  const humanoId = req.params.id;
  const { nomeHumano, humanoDataNasc, humanoStatus, humanoResistencia } = req.body;

  let camposParaAtualizar = [];
  let values = [];
  let index = 1;

  if (nomeHumano !== undefined) {
      camposParaAtualizar.push(`nome_humano = $${index++}`);
      values.push(nomeHumano);
  }
  if (humanoDataNasc !== undefined) {
      camposParaAtualizar.push(`data_nascimento = $${index++}`);
      values.push(humanoDataNasc);
  }
  if (humanoStatus !== undefined) {
      camposParaAtualizar.push(`status_humano = $${index++}`);
      values.push(humanoStatus);
  }
  if (humanoResistencia !== undefined) {
      camposParaAtualizar.push(`resistencia = $${index++}`);
      values.push(humanoResistencia);
  }

  // Verifique se há uma imagem para atualizar
  if (req.file) {
      const tipoImagem = req.file.mimetype.split('/')[1];
      camposParaAtualizar.push(`imagem = $${index++}`);
      camposParaAtualizar.push(`tipo_imagem = $${index++}`);
      values.push(req.file.buffer, tipoImagem);
  }

  // Se nenhum campo foi fornecido para atualizar, retornar erro
  if (camposParaAtualizar.length === 0) {
      return res.status(400).send('Nenhum campo para atualizar foi fornecido.');
  }

  // Adicione o ID como último parâmetro
  values.push(humanoId);

  const client = new Client({
      user: req.session.userId,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: req.session.password,
      port: process.env.DB_PORT,
  });
  await client.connect();

  try {
      const query = `
          UPDATE Humanos
          SET ${camposParaAtualizar.join(', ')}
          WHERE id_humano = $${index}
      `;

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
          res.status(200).send('Humano atualizado com sucesso');
      } else {
          res.status(404).send('Humano não encontrado');
      }
  } catch (error) {
      console.error('Erro ao atualizar humano:', error);
      res.status(500).send('Erro no servidor');
  } finally {
      await client.end();
  }
});

// UPDATE AI
app.put('/updateAI/:id', async (req, res) => {
  const idAI = req.params.id;
  const { versaoAI, nomeAI, propositoAI, statusAI } = req.body;

  let camposParaAtualizar = [];
  let values = [];
  let index = 1;

  if (versaoAI !== undefined && versaoAI !== null) {
    camposParaAtualizar.push(`versao_AI = $${index++}`);
    values.push(versaoAI);
  }
  if (nomeAI !== undefined && nomeAI !== null) {
      camposParaAtualizar.push(`nome_AI = $${index++}`);
      values.push(nomeAI);
  }
  if (propositoAI !== undefined && propositoAI !== null) {
      camposParaAtualizar.push(`proposito_AI = $${index++}`);
      values.push(propositoAI);
  }
  if (statusAI !== undefined && statusAI !== null) {
      camposParaAtualizar.push(`status_AI = $${index++}`);
      values.push(statusAI);
  }

  // Se nenhum campo foi fornecido para atualizar, retornar erro
  if (camposParaAtualizar.length === 0) {
    console.log('Valores recebidos:', { versaoAI, nomeAI, propositoAI, statusAI });
    console.log('camposParaAtualizar:', { camposParaAtualizar });
    return res.status(400).send('Nenhum campo para atualizar foi fornecido.');
  }

  // Adicione o ID como último parâmetro
  values.push(idAI);

  const client = new Client({
      user: req.session.userId,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: req.session.password,
      port: req.session.DB_PORT,
  });
  await client.connect();

  try {
      const query = `
          UPDATE AI
          SET ${camposParaAtualizar.join(', ')}
          WHERE id_AI = $${index}
      `;

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
          res.status(200).send('AI atualizada com sucesso');
      } else {
          res.status(404).send('AI não encontrada');
      }
  } catch (error) {
      console.error('Erro ao atualizar AI:', error);
      res.status(500).send('Erro no servidor');
  } finally {
      await client.end();
  }
});


// UPDATE AGENTE
app.put('/updateAgente/:codigoAgente', async (req, res) => {
  const codigoAgente = req.params.codigoAgente;
  const { nivelAgente, nivelAutonomia } = req.body;

  let camposParaAtualizar = [];
  let values = [];
  let index = 1;

  if (nivelAgente !== undefined && nivelAgente !== null) {
      camposParaAtualizar.push(`nivel_agente = $${index++}`);
      values.push(nivelAgente);
  }
  if (nivelAutonomia !== undefined && nivelAutonomia !== null) {
      camposParaAtualizar.push(`nivel_autonomia = $${index++}`);
      values.push(nivelAutonomia);
  }

  if (camposParaAtualizar.length === 0) {
      return res.status(400).send('Nenhum campo para atualizar foi fornecido.');
  }

  values.push(codigoAgente);

  const client = new Client({
      user: req.session.userId,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: req.session.password,
      port: process.env.DB_PORT,
  });
  await client.connect();

  try {
      const query = `
          UPDATE Agentes
          SET ${camposParaAtualizar.join(', ')}
          WHERE codigo_agente = $${index}
      `;

      const result = await client.query(query, values);

      if (result.rowCount > 0) {
          res.status(200).send('Agente atualizado com sucesso');
      } else {
          res.status(404).send('Agente não encontrado');
      }
  } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      res.status(500).send('Erro no servidor');
  } finally {
      await client.end();
  }
});






app.put('/updateAgentesStatus', async (req, res) => {
    const { ids, status } = req.body;
    const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
    await client.connect();

    try {
        
        await client.query('CALL atualizar_status_agentes($1, $2)', [ids, status]);
        res.status(200).send('Status dos agentes atualizado com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).send('Erro no servidor');
    } finally {
        await client.end();
    }
});















//inserts
app.post('/adicionarEvento', async (req, res) => {
  const { nome, tipo, latitude, longitude, descricao } = req.body;
  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();

  try {
      // Chamando a stored procedure para adicionar o evento e o local
      await client.query('CALL adicionar_evento_e_local($1, $2, $3, $4, $5)', [nome, tipo, latitude, longitude, descricao]);
      res.status(200).send('Evento adicionado com sucesso');
  } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      res.status(500).send('Erro no servidor');
  } finally {
      await client.end();
  }
});

// Rota para renderizar a página select.ejs
app.get('/select', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login'); 
  res.render('select', { user: req.session.userId }); 
});

// Rota para renderizar a página select.ejs
app.get('/selectPageHumanos', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login'); 
  res.render('selectPageHumanos', { user: req.session.userId }); 
});

app.get('/selectAllHumanos', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();

  // const query = `
  //   SELECT id_humano, nome_humano, data_nascimento, status_humano, resistencia, imagem, tipo_imagem, data_upload
  //   FROM Humanos
  //   ORDER BY data_upload DESC
  //   LIMIT 10
  // `;
  const query = `
    SELECT id_humano, nome_humano, TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento, status_humano, resistencia, imagem, tipo_imagem, TO_CHAR(data_upload, 'YYYY-MM-DD HH24:MI:SS') AS data_upload
    FROM Humanos
    ORDER BY id_humano
  `;

  try {
      const result = await client.query(query);
      const humanos = result.rows.map(humano =>  {
        // Converte a imagem de binário para base64(formato que pode ser manipulado) se ela existir
        //base64 é usada para representar dados binários em uma string de texto, o que facilita o envio de imagens para o front-end.
        if (humano.imagem) {
          humano.imagem = Buffer.from(humano.imagem).toString('base64');
        }
        return humano;
      });
      res.json(humanos);
  } catch (error) {
      console.error('Erro ao buscar humanos:', error);
      res.status(500).json({ error: 'Falha ao recuperar humanos' });
  } finally {
      await client.end();
  }
});



app.get('/selectPageAI', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/selectPageAI'); 
  res.render('selectPageAI', { user: req.session.userId }); 
});

app.get('/selectAllAIsAndAgentes', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();

  const query = `
    SELECT AI.id_AI, AI.nome_AI, AI.versao_AI, AI.proposito_AI, AI.status_AI, 
           Agentes.nivel_agente, Agentes.codigo_agente, Agentes.nivel_autonomia
    FROM AI
    LEFT JOIN Agentes ON AI.id_AI = Agentes.fk_id_AI
    ORDER BY AI.id_AI;
  `;

  try {
      const result = await client.query(query);
      const AIs = result.rows;
      res.json(AIs);
  } catch (error) {
      console.error('Erro ao buscar AIs e Agentes:', error);
      res.status(500).json({ error: 'Falha ao recuperar AIs e Agentes' });
  } finally {
      await client.end();
  }
});

// Rota para renderizar a página select.ejs
app.get('/selectPageInteracaoHumanoAI', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login'); 
  res.render('selectPageInteracaoHumanoAI', { user: req.session.userId }); 
});




//--------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------INSERTS--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------

//inserts ( aqui vai utilizar a trigger  trg_atualizar_status_autonomia
// Ao adicionar um agente, a trigger trg_atualizar_status_autonomia pode ser acionada dependendo do nível de autonomia.

app.get('/insert', (req, res) => {
  if (!req.session || !req.session.userId) return res.redirect('/login'); 
  const error = req.session.error;
  req.session.error = null;
    
  res.render('insert', { user: req.session.userId, error: error }); 
});

app.post('/adicionarAgente', async (req, res) => {
  const { nivel_agente, nivel_autonomia, fk_id_AI } = req.body;
  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();

  try {
      // Adiciona um novo agente
      await client.query('INSERT INTO Agentes (nivel_agente, nivel_autonomia, fk_id_AI) VALUES ($1, $2, $3)', [nivel_agente, nivel_autonomia, fk_id_AI]);
      res.status(200).send('Agente adicionado com sucesso');
  } catch (error) {
      console.error('Erro ao adicionar agente:', error);
      res.status(500).send('Erro no servidor');
  } finally {
      await client.end();
  }
});


app.post('/insertHumano', async (req, res) => {
  const { nomeHumano, humanoDataNasc, humanoResistencia, humanoStatus } = req.body;
  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();
  console.log(nomeHumano);



  try {
      const query = format('INSERT INTO Humanos (nome_humano, data_nascimento, status_humano, resistencia) VALUES (%L, %L, %L, %s)', nomeHumano, humanoDataNasc, humanoStatus, parseInt(humanoResistencia));
      await client.query(query);
      res.redirect('/insert');
      
  } catch (error) {
      console.error('Erro ao adicionar humano:', error);
      req.session.error = error.message;
      res.redirect('/insert');
      
  } finally {
    await client.end();
  }
});


app.post('/insertIA', async (req, res) => {
  const { idIA, nomeIA, versaoIA, propositoIA, statusIA } = req.body;
  const client = new Client({
    user: req.session.userId,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: req.session.password,
    port: process.env.DB_PORT,
  });
  await client.connect();

  try {
      const query = format('INSERT INTO AI (id_AI, versao_AI, nome_AI, proposito_AI, status_AI) VALUES (%s, %L, %L, %L, %L)', parseInt(idIA), versaoIA, nomeIA, propositoIA, statusIA);
      await client.query(query);
      res.redirect('/insert');
  } catch (error) {
      console.error('Erro ao adicionar IA:', error);
      req.session.error = error.message;
      res.redirect('/insert');
  } finally {
    await client.end();
  }
});


//--------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------VIEWS--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------

app.get('/selectInteracaoHumanoAI', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Client({
      user: req.session.userId,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: req.session.password,
      port: process.env.DB_PORT,
  });
  await client.connect();

  const query = `
      SELECT nome_humano, id_humano, tipo_interacao, TO_CHAR(data_interacao, 'YYYY-MM-DD') AS data_interacao, id_ai, nome_ai
      FROM View_Humanos_Interacao_AI
      ORDER BY data_interacao DESC;
  `;

  try {
      const result = await client.query(query);
      const interacoes = result.rows;
      res.json(interacoes);
  } catch (error) {
      console.error('Erro ao buscar interações de humanos e AI:', error);
      res.status(500).json({ error: 'Falha ao recuperar as interações' });
  } finally {
      await client.end();
  }
});



app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});


