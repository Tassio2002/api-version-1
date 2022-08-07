CREATE DATABASE api_version_1_bd;

CREATE TABLE users (
    user_id serial PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    session_expiration VARCHAR(50)
);

CREATE TABLE authors (
    id serial,
    author_id serial PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    picture VARCHAR,
    user_id INT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE papers (
    paper_id serial PRIMARY KEY,
    paper_title VARCHAR(500) NOT NULL,
    paper_summary TEXT NOT NULL,
    author_id INT NOT NULL,
    first_paragraph VARCHAR,
    body VARCHAR,
    user_id INT NOT NULL,
    FOREIGN KEY(author_id) REFERENCES authors (author_id),
    FOREIGN KEY(user_id) REFERENCES users (user_id)
);