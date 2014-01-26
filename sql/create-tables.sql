create type worker_role as enum ('basic', 'admin');

create table service (
    service_id SERIAL PRIMARY KEY,
    name varchar(200) not null,
    price numeric(10, 2) not null check (price >= 0),
    duration interval minute not null default 'PT30M' check (duration >= 'PT1M')
);

create table account (
    username varchar(100) not null unique,
    password varchar(100) not null
);

create table worker (
    worker_id serial primary key,
    username varchar(100) not null unique
        references account (username) on update cascade on delete restrict,
    name varchar(200) not null,
    role worker_role not null default 'basic'
);

create table worker_ability (
    worker_id integer not null
        references worker (worker_id) on update cascade on delete cascade,
    service_id integer not null
        references service (service_id) on update cascade on delete cascade,
    primary key (worker_id, service_id)
);

create table client (
    client_id serial primary key,
    username varchar(100) not null unique
        references account (username) on update cascade on delete restrict,
    name varchar(200) not null,
    phone varchar(50) not null
);

create table appointment (
    appointment_id serial primary key,
    worker_id integer not null
        references worker (worker_id) on update cascade on delete restrict,
    client_id integer
        references client (client_id) on update cascade on delete restrict,
    client_name varchar(200),
    client_phone varchar(50),
    start_time timestamp(0) not null,
    end_time timestamp(0) not null check (end_time > start_time),
    note text
);

create table appointment_service (
    appointment_id integer not null
        references appointment (appointment_id) on update cascade on delete cascade,
    service_id integer not null
        references service (service_id) on update cascade on delete restrict,
    price numeric(10,2) not null check (price >= 0),
    primary key (appointment_id, service_id)
);
