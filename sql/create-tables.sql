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

create view time_available as

    with
    time_intervals as (
            select (interval '30' minute * ti) as start_time
              from generate_series(0, 47) ti
    ),
    all_times as (
            select (di + ti.start_time) as start_ts, ti.start_time
              from generate_series(current_date, current_date + interval '1' day, interval '1' day) as di
        cross join time_intervals as ti
    ),
    work_times as (
            select start_ts, start_time
              from all_times
             where start_ts > current_timestamp
               and start_time >= '09:00'
               and start_time < '18:00'
               and extract(dow from start_ts) != 0
    ),
    available_times as (
            select w.worker_id, wt.start_ts
              from worker as w
        cross join work_times as wt
    ),
    busy_times as (
            select worker_id, start_time
              from appointment
    )

        select at.worker_id, at.start_ts as start_time
          from available_times as at
     left join busy_times bt on (bt.worker_id = at.worker_id and bt.start_time = at.start_ts)
         where bt.worker_id is null
         order by worker_id, start_ts

    ;
