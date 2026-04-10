# EquineClinic API - Sistema de Gestão de Clínicas Equinas

## Integrantes da Dupla
- **Gabriel Ferreira de Oliveira**
- **Marcelo Henrique da Silva Gomes**

---

## Sobre o Projeto
A **EquineClinic API** é uma API robusta para a gestão de clínicas veterinárias especializadas em cavalos. O sistema permite o controle detalhado de animais, prontuários e sessões de fisioterapia, utilizando uma arquitetura moderna e escalável.

O tema principal é a **Gestão de Saúde Equina**, focando na rastreabilidade de tratamentos e na organização de dados clínicos.

---

## Como Configurar e Rodar o Projeto

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **NPM**

### Passos para Instalação

1. Clone o repositório e acesse a pasta do projeto:
```bash
git clone https://github.com/MarceloGmzdev/EquineClinic.git
cd EquineClinic
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie a aplicação em modo de desenvolvimento:
```bash
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## Principais Endpoints da API

### Cavalos (`/cavalos`)
- **POST `/cavalos`**: Cadastra um novo animal.
- **GET `/cavalos`**: Lista animais com suporte a paginação e filtros complexos (nome, tratamento, valor).
- **GET `/cavalos/:id`**: Retorna os detalhes de um cavalo.
- **GET `/cavalos/:id/sessoes`**: Retorna os detalhes de um cavalo junto com seu histórico completo de sessões.
- **PUT `/cavalos/:id`**: Atualizar os dados de um cavalo
- **DELETE `/cavalos/:id`**: Desativa o cavalo (soft delete).
- 
### Sessões de Fisioterapia (`/sessoes-fisio`)
- **POST `/sessoes-fisio`**: Registra um novo atendimento.
- **GET `/sessoes-fisio`**: Lista sessões realizadas, permitindo filtrar por cavalo ou período.
- **GET `/sessoes-fisio/:id`**: Lista exibe informações sobre uma sessão específica.
- **PUT `/sessoes-fisio/:id`**: Altera as informações sobre uma sessão específica.
- **DELETE `/sessoes-fisio/:id`**: Desativa uma sessão específica (soft delete).

> **Dica:** A documentação completa e interativa (Swagger) pode ser acessada em `http://localhost:3000/swagger-ui` após iniciar o projeto.

---

## Divisão de Tarefas
Para garantir a qualidade técnica e arquitetural, a dupla dividiu as responsabilidades da seguinte forma:

- **Gabriel Oliveira**: Desenvolvimento da **Camada de Domínio** (Entidades, Exceptions) e **Logística de Negócio** (Services e Portas de Aplicação). Ficou responsável pelas 7+ validações críticas de negócio.
- **Marcelo da Silva**: Implementação da **Camada de Infraestrutura** (Adapters TypeORM, Banco de Dados SQLite) e **Camada de Apresentação** (Controllers e DTOs).
- ***A documentação via Swagger, testes unitários, validações e correções foram realizadas em conjunto a partir do diálogo e troca de idéias entre os participantes chegando na versão atual do projeto.***
- ***Considerando que a Disciplina é de fundamental importância na formação dos envolvidos, todo o desenvolvimento foi realizado em conjunto onde debatiamos referente à solução implementada e pesquisavamos referente à melhores práticas e soluções para determinados problemas, realizando as alterações e adaptações sempre que necessário.***


---

## Arquitetura
O projeto segue os princípios da **Arquitetura Hexagonal (Ports & Adapters)**, garantindo que a lógica de negócio seja independente de frameworks e bancos de dados.

---

## Licença
Este projeto foi desenvolvido para fins acadêmicos.
