-- Tabela de Funcionários
CREATE TABLE Funcionario (
    cpf BIGINT PRIMARY KEY,
    nome VARCHAR(100),
    telefone VARCHAR(15),
    email VARCHAR(100),
    funcao VARCHAR(50)
);

-- Tabela de Clientes
CREATE TABLE Cliente (
    cpf BIGINT PRIMARY KEY,
    nome VARCHAR(100),
    telefone VARCHAR(15),
    email VARCHAR(100)
);

-- Tabela de Locais
CREATE TABLE Local (
    id_local SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    endereco VARCHAR(200),
    capacidade INT,
    preco_hora NUMERIC(10, 2)
);

-- Tabela de Eventos
CREATE TABLE Evento (
    id_evento SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    tipo VARCHAR(50),
    id_local INT REFERENCES Local(id_local),
    data_evento DATE,
    hora_inicio TIME,
    hora_fim TIME
);

-- Tabela de Reservas
CREATE TABLE Reserva (
    id_reserva SERIAL PRIMARY KEY,
    id_evento INT REFERENCES Evento(id_evento),
    cpf_cliente BIGINT REFERENCES Cliente(cpf),
    status VARCHAR(20) -- Confirmada, Pendente, Cancelada
);

-- Tabela de Serviços Adicionais
CREATE TABLE Servico (
    id_servico SERIAL PRIMARY KEY,
    descricao VARCHAR(200),
    preco NUMERIC(10, 2)
);

-- Tabela de Pagamentos
CREATE TABLE Pagamento (
    id_pagamento SERIAL PRIMARY KEY,
    id_reserva INT REFERENCES Reserva(id_reserva),
    metodo VARCHAR(50), -- Cartão, Transferência, etc.
    valor NUMERIC(10, 2),
    status VARCHAR(20) -- Pago, Pendente, Reembolsado
);


-- Informações de Reservas com Clientes e Locais
CREATE VIEW ReservaDetalhada AS 
SELECT 
    Reserva.id_reserva,
    Cliente.nome AS cliente,
    Cliente.telefone,
    Local.nome AS local,
    Evento.nome AS evento,
    Evento.data_evento,
    Reserva.status
FROM Reserva
JOIN Cliente ON Reserva.cpf_cliente = Cliente.cpf
JOIN Evento ON Reserva.id_evento = Evento.id_evento
JOIN Local ON Evento.id_local = Local.id_local;





-- Locais disponíveis para uma data e horário específicos
SELECT * 
FROM Local 
WHERE id_local NOT IN (
    SELECT id_local 
    FROM Evento 
    WHERE data_evento = '2024-12-31' AND 
          hora_inicio < '18:00:00' AND 
          hora_fim > '16:00:00'
);



-- Total gasto por um cliente
SELECT 
    Cliente.nome AS cliente,
    SUM(Pagamento.valor) AS total_gasto
FROM Pagamento
JOIN Reserva ON Pagamento.id_reserva = Reserva.id_reserva
JOIN Cliente ON Reserva.cpf_cliente = Cliente.cpf
GROUP BY Cliente.nome;



-- Feedback dos eventos realizados
CREATE TABLE Feedback (
    id_feedback SERIAL PRIMARY KEY,
    id_reserva INT REFERENCES Reserva(id_reserva),
    comentario TEXT,
    avaliacao INT -- 1 a 5 estrelas
);

SELECT 
    Evento.nome AS evento,
    AVG(Feedback.avaliacao) AS avaliacao_media
FROM Feedback
JOIN Reserva ON Feedback.id_reserva = Reserva.id_reserva
JOIN Evento ON Reserva.id_evento = Evento.id_evento
GROUP BY Evento.nome;




