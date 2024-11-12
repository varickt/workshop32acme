const pg = require("pg");
const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/acme_flavors_32");

const express = require("express");
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

//READ
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM flavors`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
});

// READ a single flavor by ID
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const flavorId = req.params.id;
        const SQL = `SELECT * FROM flavors WHERE id = $1`;
        const response = await client.query(SQL, [flavorId]);
        if (response.rows.length === 0) {
            res.status(404).send('Flavor not found');
        } else {
            res.send(response.rows[0]);
        }
    } catch (error) {
        next(error);
    }
});


//CREATE
app.post('/api/flavors', async (req, res, next) => {
    try {

        const SQL = /* sql */`
       INSERT INTO flavors(name, is_favorite)
       VALUES($1, $2)
       RETURNING *
       `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});
//UPDATE
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at=now()
        WHERE id=$3
        RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.is_favorite,
            req.params.id,
        ]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
});

//DELETE
app.delete('api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from flavors
        WHERE id=$1
        `;
        await client.query(SQL, [req.params.id])
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }

});
const init = async () => {
    await client.connect();
    console.log('connected to database');
    let SQL =/* sql */ `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        is_favorite INTEGER DEFAULT 3 NOT NULL,
        name VARCHAR(255)
    )
    `;
    await client.query(SQL);
    console.log("tables created");

    SQL = /* sql */`
    INSERT INTO flavors(name) VALUES('Chocolate Mint Icecream Mountain');
    INSERT INTO flavors(name, is_favorite) VALUES('Dulce De Leche Suprise', 5);
    INSERT INTO flavors(name) VALUES ('Guava Passion Gelato');
    `;

    await client.query(SQL);
    console.log("data seeded");


    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();