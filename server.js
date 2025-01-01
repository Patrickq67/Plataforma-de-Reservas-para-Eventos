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
    password: '', // senha do MySQL (padrão no XAMPP)
    database: 'plataforma_eventos'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL!');
});

// Habilite o CORS
app.use(cors());

// Configuração para lidar com JSON no body
app.use(bodyParser.json());

// Rota para cadastrar funcionário
app.post('/cadastrar', (req, res) => {
    const { nome, cpf, telefone, email, funcao } = req.body;

    const query = 'INSERT INTO funcionarios (nome, cpf, telefone, email, funcao) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nome, cpf, telefone, email, funcao], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }
        res.status(200).json({ success: true });
    });
});

// Rota para cadastrar cliente
app.post('/cadastrarCliente', (req, res) => {
    const { cpf, nome, telefone, email } = req.body;

    const query = 'INSERT INTO Cliente (cpf, nome, telefone, email) VALUES (?, ?, ?, ?)';
    db.query(query, [cpf, nome, telefone, email], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            res.status(500).json({ success: false });
            return;
        }
        res.status(200).json({ success: true });
    });
});

// Rota para cadastrar local
app.post('/cadastrarLocal', (req, res) => {
    const { nome, endereco, capacidade, preco_por_hora, descricao, equipamentos } = req.body;

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


// Rota para cadastrar reserva
app.post('/cadastrarReserva', (req, res) => {
    const { cliente_cpf, local_id, data, horario_inicio, horario_fim, numero_participantes, status } = req.body;

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


// Rota para registrar pagamentos
app.post('/registrarPagamento', (req, res) => {
    const { reserva_id, metodo_pagamento, valor, status, data_pagamento } = req.body;

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

app.post('/adicionarServico', (req, res) => {
    const { descricao, preco, disponibilidade } = req.body;
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

// Rota para adicionar um serviço à reserva
app.post('/adicionarServicoReserva', (req, res) => {
    const { reserva_id, servico_id, quantidade } = req.body;

    if (!reserva_id || !servico_id || !quantidade) {
        return res.status(400).json({ success: false, error: 'Dados incompletos!' });
    }

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

// Rota para listar os serviços de uma reserva
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






// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
