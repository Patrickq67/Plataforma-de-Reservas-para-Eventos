const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');  // Adicione esta linha
const app = express();
const port = 3000;



// Configuração do MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // usuário do MySQL
    password: '867002', // senha do MySQL (padrão no XAMPP)
    database: 'plataforma_eventos'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL!');
    console.log('Iniciando o servidor...');
});

// Habilite o CORS
app.use(cors());

// Configuração para lidar com JSON no body
app.use(bodyParser.json());

// Rota para cadastrar funcionário
app.post('/cadastrar', (req, res) => {
    const { nome, cpf, telefone, email, funcao } = req.body;

    // Verificar duplicidade de CPF ou e-mail
    const verificaDuplicidade = `
        SELECT * FROM funcionarios 
        WHERE cpf = ? OR email = ?
    `;

    db.query(verificaDuplicidade, [cpf, email], (err, results) => {
        if (err) {
            console.error('Erro ao verificar duplicidade:', err);
            res.status(500).json({ success: false, message: 'Erro no servidor.' });
            return;
        }

        if (results.length > 0) {
            // Já existe um funcionário com o mesmo CPF ou e-mail
            res.status(400).json({
                success: false,
                message: 'Cadastro existente'
            });
            return;
        }

        // Inserir novo funcionário, já que não há duplicidade
        const query = `
            INSERT INTO funcionarios (nome, cpf, telefone, email, funcao) 
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(query, [nome, cpf, telefone, email, funcao], (err, result) => {
            if (err) {
                console.error('Erro ao inserir no banco de dados:', err);
                res.status(500).json({ success: false, message: 'Erro ao inserir no banco de dados.' });
                return;
            }
            res.status(200).json({ success: true, message: 'Funcionário cadastrado com sucesso!' });
        });
    });
});



// Rota para cadastrar cliente
app.post('/cadastrarCliente', (req, res) => {
    const { cpf, nome, telefone, email } = req.body;

    // Verificar duplicidade de CPF ou e-mail
    const verificaDuplicidade = `
        SELECT * FROM Cliente 
        WHERE cpf = ? OR email = ?
    `;

    db.query(verificaDuplicidade, [cpf, email], (err, results) => {
        if (err) {
            console.error('Erro ao verificar duplicidade:', err);
            res.status(500).json({ success: false, message: 'Erro no servidor.' });
            return;
        }

        if (results.length > 0) {
            // Já existe um cliente com o mesmo CPF ou e-mail
            res.status(400).json({
                success: false,
                message: 'Cadastro existente'
            });
            return;
        }

        // Inserir novo cliente, já que não há duplicidade
        const query = `
            INSERT INTO Cliente (cpf, nome, telefone, email) 
            VALUES (?, ?, ?, ?)
        `;
        db.query(query, [cpf, nome, telefone, email], (err, result) => {
            if (err) {
                console.error('Erro ao inserir no banco de dados:', err);
                res.status(500).json({ success: false, message: 'Erro ao inserir no banco de dados.' });
                return;
            }
            res.status(200).json({ success: true, message: 'Cliente cadastrado com sucesso!' });
        });
    });
});


app.post('/cadastrarLocal', (req, res) => {
    const { nome, endereco, capacidade, preco_por_hora, descricao, equipamentos } = req.body;

    // Verificar se o nome ou o endereço já existe no banco
    const checkQuery = `
        SELECT * FROM locais WHERE nome = ? OR endereco = ?
    `;

    db.query(checkQuery, [nome, endereco], (err, result) => {
        if (err) {
            console.error('Erro ao verificar duplicidade no banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }

        // Se encontrar um local com nome ou endereço igual, retornar erro
        if (result.length > 0) {
            res.status(400).json({ success: false, message: 'Nome ou endereço já cadastrados.' });
            return;
        }

        // Caso contrário, inserir o novo local
        const query = `
            INSERT INTO locais (nome, endereco, capacidade, preco_por_hora, descricao, equipamentos)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.query(
            query,
            [nome, endereco, capacidade, preco_por_hora, descricao, equipamentos],
            (err, result) => {
                if (err) {
                    console.error('Erro ao inserir no banco de dados:', err);
                    res.status(500).json({ success: false });
                    return;
                }
                res.status(200).json({ success: true });
            }
        );
    });
});



app.post('/cadastrarReserva', (req, res) => {
    const { cliente_cpf, local_id, data, horario_inicio, horario_fim, numero_participantes, status } = req.body;

    // Verificar se o CPF do cliente existe na tabela Cliente
    const checkClienteQuery = `
        SELECT * FROM Cliente WHERE cpf = ?
    `;

    db.query(checkClienteQuery, [cliente_cpf], (err, result) => {
        if (err) {
            console.error('Erro ao verificar cliente no banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }

        // Se não encontrar o CPF do cliente, retornar erro
        if (result.length === 0) {
            res.status(400).json({ success: false, message: 'Cliente não encontrado.' });
            return;
        }

        // Verificar se já existe uma reserva com o mesmo cliente, local, data e horário
        const checkReservaQuery = `
            SELECT * FROM reservas
            WHERE cliente_cpf = ? AND local_id = ? AND data = ? AND (
                (horario_inicio <= ? AND horario_fim > ?) OR
                (horario_inicio < ? AND horario_fim >= ?)
            )
        `;

        db.query(checkReservaQuery, [cliente_cpf, local_id, data, horario_inicio, horario_inicio, horario_fim, horario_fim], (err, result) => {
            if (err) {
                console.error('Erro ao verificar duplicidade de reserva no banco de dados:', err);
                res.status(500).json({ success: false });
                return;
            }

            // Se já houver uma reserva com esses parâmetros, retornar erro
            if (result.length > 0) {
                res.status(400).json({ success: false, message: 'Já existe uma reserva para este cliente, local e horário.' });
                return;
            }

            // Caso contrário, inserir a nova reserva
            const query = `
                INSERT INTO reservas (cliente_cpf, local_id, data, horario_inicio, horario_fim, numero_participantes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                query,
                [cliente_cpf, local_id, data, horario_inicio, horario_fim, numero_participantes, status],
                (err, result) => {
                    if (err) {
                        console.error('Erro ao inserir no banco de dados:', err);
                        res.status(500).json({ success: false });
                        return;
                    }
                    res.status(200).json({ success: true });
                }
            );
        });
    });
});


// Rota para buscar histórico de reservas
app.get('/historicoReservas', (req, res) => {
    const query = `
        SELECT r.id, r.data, r.horario_inicio, r.horario_fim, r.numero_participantes, r.status,
               c.nome AS cliente_nome, l.nome AS local_nome
        FROM reservas r
        JOIN Cliente c ON r.cliente_cpf = c.cpf
        JOIN locais l ON r.local_id = l.id
        ORDER BY r.data DESC, r.horario_inicio DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }
        res.status(200).json({ success: true, reservas: results });
    });
});


app.get('/listarReservas', (req, res) => {
    const query = `
        SELECT 
            reservas.id, 
            reservas.cliente_cpf, 
            reservas.local_id, 
            reservas.data, 
            reservas.horario_inicio, 
            reservas.horario_fim, 
            reservas.numero_participantes, 
            reservas.status AS status_reserva,
            pagamentos.status AS status_pagamento
        FROM 
            reservas
        LEFT JOIN 
            pagamentos 
        ON 
            reservas.id = pagamentos.reserva_id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar reservas:', err);
            res.status(500).json({ success: false, error: 'Erro ao buscar reservas.' });
            return;
        }
        res.status(200).json(results);
    });
});


app.post('/registrarPagamento', (req, res) => {
    const { reserva_id, metodo_pagamento, valor, status, data_pagamento } = req.body;

    // Verificar se já existe um pagamento registrado para esta reserva
    const checkQuery = `
        SELECT * FROM pagamentos WHERE reserva_id = ? AND status = 'pago'
    `;

    db.query(checkQuery, [reserva_id], (err, result) => {
        if (err) {
            console.error('Erro ao verificar duplicidade no banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }

        // Se já houver um pagamento registrado com status 'pago', retornar erro
        if (result.length > 0) {
            res.status(400).json({ success: false, message: 'Esta reserva já foi paga.' });
            return;
        }

        // Caso contrário, registrar o pagamento
        const query = `
            INSERT INTO pagamentos (reserva_id, metodo_pagamento, valor, status, data_pagamento)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            query,
            [reserva_id, metodo_pagamento, valor, status, data_pagamento],
            (err, result) => {
                if (err) {
                    console.error('Erro ao inserir no banco de dados:', err);
                    res.status(500).json({ success: false });
                    return;
                }
                res.status(200).json({ success: true });
            }
        );
    });
});


// Rota para listar pagamentos
app.get('/listarPagamentos', (req, res) => {
    const query = 'SELECT * FROM pagamentos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pagamentos no banco de dados:', err);
            res.status(500).json({ success: false, error: 'Erro ao buscar pagamentos.' });
            return;
        }
        res.status(200).json(results);
    });
});


app.post('/adicionarServico', (req, res) => {
    const { descricao, preco, disponibilidade } = req.body;

    // Verificar se já existe um serviço com a mesma descrição
    const checkQuery = 'SELECT * FROM servicos WHERE descricao = ?';

    db.query(checkQuery, [descricao], (err, result) => {
        if (err) {
            console.error('Erro ao verificar duplicidade no banco de dados:', err);
            res.status(500).json({ success: false, error: 'Erro ao verificar duplicidade.' });
            return;
        }

        // Se já houver um serviço com a mesma descrição, retornar erro
        if (result.length > 0) {
            res.status(400).json({ success: false, message: 'Este serviço já foi cadastrado.' });
            return;
        }

        // Caso contrário, inserir o novo serviço
        const query = 'INSERT INTO servicos (descricao, preco, disponibilidade) VALUES (?, ?, ?)';
        
        db.query(query, [descricao, preco, disponibilidade], (err) => {
            if (err) {
                console.error('Erro ao adicionar serviço:', err);
                res.status(500).json({ success: false, error: 'Erro ao adicionar serviço.' });
                return;
            }
            res.status(200).json({ success: true, message: 'Serviço adicionado com sucesso!' });
        });
    });
});


// Rota para listar os serviços cadastrados
app.get('/listarServicos', (req, res) => {
    const query = 'SELECT * FROM servicos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar serviços:', err);
            res.status(500).json({ success: false, error: 'Erro ao buscar serviços.' });
            return;
        }
        res.status(200).json(results);
    });
});

app.post('/adicionarServicoReserva', (req, res) => {
    const { reserva_id, servico_id, quantidade } = req.body;

    if (!reserva_id || !servico_id || !quantidade) {
        return res.status(400).json({ success: false, error: 'Dados incompletos!' });
    }

    // Verificar se o serviço já foi adicionado à reserva
    const checkQuery = `
        SELECT * FROM reserva_servicos WHERE reserva_id = ? AND servico_id = ?
    `;

    db.query(checkQuery, [reserva_id, servico_id], (err, result) => {
        if (err) {
            console.error('Erro ao verificar duplicidade no banco de dados:', err);
            return res.status(500).json({ success: false, error: 'Erro ao verificar duplicidade.' });
        }

        // Se já houver um serviço adicionado à reserva, retornar erro
        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'Este serviço já foi adicionado à reserva.' });
        }

        // Caso contrário, adicionar o serviço à reserva
        const query = `
            INSERT INTO reserva_servicos (reserva_id, servico_id, quantidade)
            VALUES (?, ?, ?);
        `;

        db.query(query, [reserva_id, servico_id, quantidade], (err, result) => {
            if (err) {
                console.error('Erro ao adicionar serviço à reserva:', err);
                return res.status(500).json({ success: false, error: 'Erro ao adicionar serviço à reserva.' });
            }

            res.status(200).json({ success: true, message: 'Serviço adicionado à reserva com sucesso!' });
        });
    });
});


// Rota para listar os serviços de uma reserva @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
app.get('/listarServicosReserva/:reserva_id', (req, res) => {
    const reservaId = req.params.reserva_id;

    const query = `
        SELECT 
            rs.id, 
            s.descricao, 
            rs.quantidade, 
            s.preco, 
            (rs.quantidade * s.preco) AS total
        FROM 
            reserva_servicos rs
        JOIN 
            servicos s ON rs.servico_id = s.id
        WHERE 
            rs.reserva_id = ?;
    `;

    db.query(query, [reservaId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar serviços da reserva:', err);
            return res.status(500).json({ success: false, error: 'Erro ao buscar serviços da reserva.' });
        }

        res.status(200).json(results);
    });
});

// Rota para adicionar um serviço
app.post('/adicionarServico', (req, res) => {
    const { descricao, preco, disponibilidade } = req.body;
    const query = 'INSERT INTO servicos (descricao, preco, disponibilidade) VALUES (?, ?, ?)';
    db.query(query, [descricao, preco, disponibilidade], (err) => {
        if (err) {
            console.error('Erro ao adicionar serviço:', err);
            res.status(500).json({ success: false, error: 'Erro ao adicionar serviço.' });
            return;
        }
        res.status(200).json({ success: true });
    });
});

app.post('/adicionarTerceirizado', (req, res) => {
    const { nome, telefone, email, especialidade } = req.body;

    if (!nome || !telefone || !email || !especialidade) {
        return res.status(400).json({ success: false, error: 'Dados incompletos!' });
    }

    // Verificar se já existe um terceirizado com o mesmo nome, telefone ou email
    const checkQuery = `
        SELECT * FROM Terceirizados WHERE nome = ? OR telefone = ? OR email = ?
    `;

    db.query(checkQuery, [nome, telefone, email], (err, result) => {
        if (err) {
            console.error('Erro ao verificar duplicidade no banco de dados:', err);
            return res.status(500).json({ success: false, error: 'Erro ao verificar duplicidade.' });
        }

        // Se já houver um terceirizado com os mesmos dados, retornar erro
        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'Já existe um terceirizado com este nome, telefone ou email.' });
        }

        // Caso contrário, inserir o novo terceirizado
        const query = 'INSERT INTO Terceirizados (nome, telefone, email, especialidade) VALUES (?, ?, ?, ?)';

        db.query(query, [nome, telefone, email, especialidade], (err) => {
            if (err) {
                console.error('Erro ao adicionar terceirizado:', err);
                return res.status(500).json({ success: false, error: 'Erro ao adicionar terceirizado.' });
            }
            res.status(200).json({ success: true, message: 'Terceirizado adicionado com sucesso!' });
        });
    });
});


// Rota para listar os terceirizados cadastrados
app.get('/listarTerceirizados', (req, res) => {
    const query = 'SELECT * FROM Terceirizados';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar terceirizados:', err);
            res.status(500).json({ success: false, error: 'Erro ao buscar terceirizados.' });
            return;
        }
        res.status(200).json(results);
    });
});






// Rota para cadastrar contrato
app.post('/cadastrarContrato', (req, res) => {
    const { cliente_cpf, terceirizado_id, servico_id, data_inicio, data_fim, status } = req.body;

    if (!cliente_cpf || !terceirizado_id || !servico_id || !data_inicio || !status) {
        return res.status(400).json({ success: false, error: 'Dados incompletos!' });
    }

    const query = `
        INSERT INTO Contratos (cliente_cpf, terceirizado_id, servico_id, data_inicio, data_fim, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [cliente_cpf, terceirizado_id, servico_id, data_inicio, data_fim, status], (err, result) => {
        if (err) {
            console.error('Erro ao inserir contrato no banco de dados:', err);
            return res.status(500).json({ success: false, error: 'Erro ao cadastrar contrato.' });
        }
        res.status(200).json({ success: true, message: 'Contrato cadastrado com sucesso!' });
    });
});

// Rota para listar contratos
app.get('/listarContratos', (req, res) => {
    const query = `
        SELECT 
            c.id AS contrato_id,
            cl.nome AS cliente_nome,
            t.nome AS terceirizado_nome,
            s.descricao AS servico_descricao,
            c.data_inicio, 
            c.data_fim, 
            c.status
        FROM 
            Contratos c
        JOIN 
            Cliente cl ON c.cliente_cpf = cl.cpf
        JOIN 
            Terceirizados t ON c.terceirizado_id = t.id
        JOIN 
            Servicos s ON c.servico_id = s.id
        ORDER BY 
            c.data_inicio DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar contratos no banco de dados:', err);
            return res.status(500).json({ success: false, error: 'Erro ao buscar contratos.' });
        }
        res.status(200).json({ success: true, contratos: results });
    });
});


// Rota para cadastrar avaliação
app.post('/cadastrarAvaliacao', (req, res) => {
    const { contrato_id, cliente_cpf, terceirizado_id, nota, comentario } = req.body;

    if (!contrato_id || !cliente_cpf || !terceirizado_id || !nota) {
        return res.status(400).json({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos!' });
    }

    const query = `
        INSERT INTO avaliacoes (contrato_id, cliente_cpf, terceirizado_id, nota, comentario)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [contrato_id, cliente_cpf, terceirizado_id, nota, comentario], (err) => {
        if (err) {
            console.error('Erro ao cadastrar avaliação:', err);
            return res.status(500).json({ success: false, error: 'Erro ao cadastrar avaliação.' });
        }

        res.status(200).json({ success: true, message: 'Avaliação cadastrada com sucesso!' });
    });
});




// Rota para cadastrar avaliação de reserva
app.post('/cadastrarAvaliacaoReserva', (req, res) => {
    const { reserva_id, cliente_cpf, nota, comentario } = req.body;

    if (!reserva_id || !cliente_cpf || !nota) {
        return res.json({ success: false, message: 'Campos obrigatórios faltando.' });
    }

    const query = 'INSERT INTO avaliacoes_reservas (reserva_id, cliente_cpf, nota, comentario) VALUES (?, ?, ?, ?)';
    db.query(query, [reserva_id, cliente_cpf, nota, comentario], (err, result) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Erro ao cadastrar avaliação.' });
        }
        res.json({ success: true });
    });
});


app.get('/listarReservasComAvaliacoes', (req, res) => {
    const query = `
        SELECT 
            r.id, r.cliente_cpf, r.local_id, r.data, r.horario_inicio, r.horario_fim, 
            r.numero_participantes, r.status AS status_reserva, p.status AS status_pagamento, 
            ar.nota, ar.comentario
        FROM 
            reservas r
        LEFT JOIN 
            pagamentos p ON r.id = p.reserva_id
        LEFT JOIN 
            avaliacoes_reservas ar ON r.id = ar.reserva_id
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Erro ao listar reservas com avaliações:', error);
            res.status(500).send('Erro ao listar reservas com avaliações');
        } else {
            res.json(results);
        }
    });
});





// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
