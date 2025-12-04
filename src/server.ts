import express from 'express'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env") })
const app = express()
const port = 3000


//parser
app.use(express.json())
//DB
const pool = new Pool({
	connectionString: `${process.env.CONNECTION_STR}`
})

const initDB = async () => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS users(
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(150) UNIQUE NOT NULL,
		age INT,
		phone VARCHAR(15),
		address TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
		)
		`)

	await pool.query(`
			
			CREATE TABLE IF NOT EXISTS todos(
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id) ON DELETE CASCADE,
			title VARCHAR(200) NOT NULL,
			description TEXT,
			completed BOOLEAN DEFAULT false,
			due_date DATE,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
			)`)
}

initDB()


app.get("/", (req: Request, res: Response) => {
	res.send("Hello Next level developers")
})

//all users api
app.get('/users', async (req: Request, res: Response) => {
	try {
		const result = await pool.query(`SELECT * FROM users`);
		res.status(200).send({
			success: true,
			message: "users retrived successfully",
			data: result.rows
		})

	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message,
			details: err
		})
	}
})

//insert users api

app.post('/users', async (req: Request, res: Response) => {
	const { name, email } = req.body
	try {
		const result = await pool.query(`INSERT INTO users(name,email) VALUES($1,$2) RETURNING *`, [name, email])
		res.status(201).json({
			success: true,
			message: "data inserted",
			data: result.rows[0]
		})


	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message
		})

	}
	// console.log(req.body)
	// res.status(201).json({
	// 	success: true,
	// 	message: "API is working"
	// })
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})